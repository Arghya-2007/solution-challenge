import { Injectable, Logger, InternalServerErrorException, BadRequestException, Inject } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { Storage, Bucket } from '@google-cloud/storage';
import gcsConfig from '../config/gcs.config';
import { PresignRequestDto } from './dto/presign-request.dto';
import { PresignResponse } from './interfaces/presign-response.interface';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

/**
 * Service handling Google Cloud Storage operations.
 */
@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);
  private readonly storage: Storage;
  private readonly bucket: Bucket;

  constructor(
    @Inject(gcsConfig.KEY)
    private readonly gcsConfigParams: ConfigType<typeof gcsConfig>,
    private readonly httpService: HttpService,
  ) {
    const { GoogleAuth } = require('google-auth-library');

    // Use local Google Authorization (Application Default Credentials)
    const sourceClient = new GoogleAuth({
      scopes: ['https://www.googleapis.com/auth/cloud-platform']
    });

    this.storage = new Storage({
      projectId: 'project-68c64ea9-e771-4bee-9f1',
    });

    const targetPrincipal = 'csv-upload-signer@project-68c64ea9-e771-4bee-9f1.iam.gserviceaccount.com';

    // Override the internal auth methods to use our ADC logic for IAM signing
    (this.storage as any).authClient.getCredentials = async () => {
      return { client_email: targetPrincipal };
    };

    (this.storage as any).authClient.sign = async (blobToSign: string) => {
      const res = await sourceClient.request({
        url: `https://iamcredentials.googleapis.com/v1/projects/-/serviceAccounts/${targetPrincipal}:signBlob`,
        method: 'POST',
        data: {
          payload: Buffer.from(blobToSign).toString('base64'),
        }
      });
      return res.data.signedBlob;
    };

    this.bucket = this.storage.bucket('equilens--csv-uploads-prod');
  }

  /**
   * Generates a signed URL for direct browser-to-GCS upload.
   * @param userId The ID of the authenticated user
   * @param dto The file metadata for the upload
   * @returns A promise resolving to the signed URL and related metadata
   */
  async generatePresignedUrl(userId: string, dto: PresignRequestDto): Promise<PresignResponse> {
    try {
      const maxFileSizeBytes = this.gcsConfigParams.maxFileSizeBytes;
      
      if (dto.fileSize > maxFileSizeBytes) {
        throw new BadRequestException(`File size exceeds maximum allowed size of ${maxFileSizeBytes} bytes`);
      }

      // Sanitize the filename by replacing spaces and unsafe characters
      const sanitizedFileName = dto.fileName.replace(/[^a-zA-Z0-9.\-_]/g, '_');
      const objectPath = `uploads/completed/${sanitizedFileName}`;

      const file = this.bucket.file(objectPath);
      const expires = Date.now() + 30 * 60 * 1000; // 30 minutes from now

      const [signedUrl] = await file.getSignedUrl({
        version: 'v4',
        action: 'write',
        expires,
        contentType: dto.contentType,
      });

      this.logger.log(`Generated signed URL for object: ${objectPath} by user: ${userId}`);

      return {
        signedUrl,
        objectPath,
        expiresAt: new Date(expires).toISOString(),
      };
    } catch (error) {
      this.logger.error(`Failed to generate signed URL: ${error instanceof Error ? error.message : String(error)}`, error instanceof Error ? error.stack : undefined);
      
      if (error instanceof BadRequestException) {
        throw error;
      }
      
      throw new InternalServerErrorException('Failed to generate secure upload URL');
    }
  }

  /**
   * Uploads a Google Sheet as a CSV to GCS.
   * @param userId The ID of the authenticated user
   * @param sheetUrl The Google Sheet URL
   */
  async uploadGoogleSheet(userId: string, sheetUrl: string) {
    try {
      // Extract sheet ID from URL: https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit
      const match = sheetUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
      if (!match) {
        throw new BadRequestException('Invalid Google Sheet URL');
      }
      const sheetId = match[1];
      
      // Extract gid if present
      let gid = '0';
      const gidMatch = sheetUrl.match(/[#&]gid=([0-9]+)/);
      if (gidMatch) {
        gid = gidMatch[1];
      }

      const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;
      
      const response = await firstValueFrom(
        this.httpService.get(csvUrl, { responseType: 'arraybuffer', proxy: false })
      );
      
      const buffer = Buffer.from(response.data);
      const fileName = `sheet_${sheetId}_${gid}_${Date.now()}.csv`;
      const objectPath = `uploads/completed/${fileName}`;
      
      const file = this.bucket.file(objectPath);
      await file.save(buffer, {
        contentType: 'text/csv',
      });
      
      this.logger.log(`Uploaded Google Sheet to GCS: ${objectPath} for user: ${userId}`);
      
      return {
        file_name: fileName,
        objectPath: objectPath,
        success: true
      };
    } catch (error: any) {
      this.logger.error(`Failed to upload Google Sheet: ${error.message}`);
      if (error.response?.status === 401 || error.response?.status === 403 || error.response?.status === 404) {
        throw new BadRequestException('Cannot access Google Sheet. Make sure it is set to "Anyone with the link can view".');
      }
      throw new InternalServerErrorException('Failed to process Google Sheet');
    }
  }

  /**
   * Starts the dataset processing job in the Python backend.
   * @param userId The ID of the authenticated user
   * @param objectPath The GCS path of the uploaded file
   * @param targetColumn Optional target column name
   */
  async processDataset(userId: string, objectPath: string, targetColumn?: string) {
    const bucketName = this.bucket.name;
    const pythonApiUrl = `${process.env.PYTHON_URL}/process`;

    try {
      const response = await firstValueFrom(
        this.httpService.post(pythonApiUrl, {
          bucket_name: bucketName,
          object_path: objectPath,
          user_id: userId,
          target_column: targetColumn || null,
        }, { 
          headers: { 'X-API-Key': process.env.INTERNAL_API_KEY },
          proxy: false 
        }),
      );
      return response.data; // { job_id: '...', status: 'pending' }
    } catch (error: any) {
      this.logger.error(`Failed to start processing: ${error.message}`);
      throw new InternalServerErrorException('Failed to start dataset processing');
    }
  }

  /**
   * Gets the current status of a dataset processing job.
   * @param jobId The job ID returned by processDataset
   */
  async getProcessingStatus(jobId: string) {
    const pythonApiUrl = `${process.env.PYTHON_URL}/status/${jobId}`;

    try {
      const response = await firstValueFrom(this.httpService.get(pythonApiUrl, { proxy: false }));
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        throw new BadRequestException('Job not found');
      }
      this.logger.error(`Failed to get job status: ${error.message}`);
      throw new InternalServerErrorException('Failed to retrieve processing status');
    }
  }

  /**
   * Exports the PDF bias report from Python backend.
   */
  async exportReport(jobId: string): Promise<Buffer> {
    const pythonApiUrl = `${process.env.PYTHON_URL}/export/${jobId}`;

    try {
      const response = await firstValueFrom(
        this.httpService.get(pythonApiUrl, { responseType: 'arraybuffer', proxy: false })
      );
      return Buffer.from(response.data);
    } catch (error: any) {
      if (error.response?.status === 404) {
        throw new BadRequestException('Job not found');
      }
      this.logger.error(`Failed to export report: ${error.message}`);
      throw new InternalServerErrorException('Failed to export report');
    }
  }
  /**
   * Starts the dataset mitigation job in the Python backend.
   * @param userId The ID of the authenticated user
   * @param objectPath The GCS path of the uploaded file
   * @param targetColumn Target column name
   * @param protectedColumns List of protected columns
   * @param modelName Optional model architecture to use for mitigation
   */
  async mitigateDataset(userId: string, objectPath: string, targetColumn: string, protectedColumns: string[], modelName?: string) {
    const bucketName = this.bucket.name;
    const pythonApiUrl = `${process.env.PYTHON_URL}/mitigate`;

    try {
      const response = await firstValueFrom(
        this.httpService.post(pythonApiUrl, {
          bucket_name: bucketName,
          object_path: objectPath,
          user_id: userId,
          target_column: targetColumn,
          protected_columns: protectedColumns,
          model_name: modelName || null,
        }, { 
          headers: { 'X-API-Key': process.env.INTERNAL_API_KEY },
          proxy: false 
        }),
      );
      return response.data; // { job_id: '...', status: 'pending' }
    } catch (error: any) {
      this.logger.error(`Failed to start mitigation: ${error.message}`);
      throw new InternalServerErrorException('Failed to start dataset mitigation');
    }
  }

  /**
   * Gets the current status of a dataset mitigation job.
   * @param jobId The job ID returned by mitigateDataset
   */
  async getMitigationStatus(jobId: string) {
    const pythonApiUrl = `${process.env.PYTHON_URL}/status/${jobId}`;

    try {
      const response = await firstValueFrom(this.httpService.get(pythonApiUrl, { proxy: false }));
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        throw new BadRequestException('Job not found');
      }
      this.logger.error(`Failed to get job status: ${error.message}`);
      throw new InternalServerErrorException('Failed to retrieve mitigation status');
    }
  }

  /**
   * Gets a signed URL for downloading the mitigated dataset.
   */
  async getDownloadUrl(objectPath: string): Promise<{ url: string }> {
    try {
      const file = this.bucket.file(objectPath);
      const expires = Date.now() + 60 * 60 * 1000; // 1 hour

      const [signedUrl] = await file.getSignedUrl({
        version: 'v4',
        action: 'read',
        expires,
        responseDisposition: 'attachment; filename="fixed_dataset.csv"',
      });

      return { url: signedUrl };
    } catch (error: any) {
      this.logger.error(`Failed to generate download URL: ${error.message}`);
      throw new InternalServerErrorException('Failed to generate download URL');
    }
  }

  /**
   * Returns a read stream for the file, allowing direct proxying to the client.
   * This bypasses the need for the upload-signer to have read permissions.
   */
  async getFileStream(objectPath: string) {
    try {
      const file = this.bucket.file(objectPath);
      return file.createReadStream();
    } catch (error: any) {
      this.logger.error(`Failed to get file stream: ${error.message}`);
      throw new InternalServerErrorException('Failed to read file from storage');
    }
  }
}
