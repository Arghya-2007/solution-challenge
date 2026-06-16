import { Controller, Post, Get, Param, Body, UseGuards, Request, Logger, Res } from '@nestjs/common';
import { UploadService } from './upload.service';
import { PresignRequestDto } from './dto/presign-request.dto';
import { PresignResponse } from './interfaces/presign-response.interface';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

/**
 * Controller handling file upload endpoints.
 */
@Controller('upload')
export class UploadController {
  private readonly logger = new Logger(UploadController.name);

  /**
   * Constructs the UploadController.
   * @param uploadService Service injected to handle upload business logic
   */
  constructor(private readonly uploadService: UploadService) {}

  /**
   * Endpoint to generate a presigned URL for direct GCS uploads.
   * @param req The HTTP request object (containing authenticated user)
   * @param presignRequestDto File metadata from the client
   * @returns The signed URL details
   */
  @UseGuards(JwtAuthGuard)
  @Post('presign')
  async presign(
    @Request() req: any,
    @Body() presignRequestDto: PresignRequestDto,
  ): Promise<PresignResponse> {
    const userId = req.user.uid;
    this.logger.log(`Presign request received for user: ${userId}`);
    return this.uploadService.generatePresignedUrl(userId, presignRequestDto);
  }

  /**
   * Endpoint to upload a Google Sheet link.
   */
  @UseGuards(JwtAuthGuard)
  @Post('sheet')
  async uploadSheet(
    @Request() req: any,
    @Body() body: { sheet_url: string },
  ) {
    this.logger.log(`Sheet upload request received for user: ${req.user.uid}`);
    return this.uploadService.uploadGoogleSheet(req.user.uid, body.sheet_url);
  }

  /**
   * Endpoint to start dataset processing in the Python backend.
   */
  @UseGuards(JwtAuthGuard)
  @Post('process')
  async process(
    @Request() req: any,
    @Body() body: { objectPath: string; targetColumn?: string },
  ) {
    this.logger.log(`Process request received for user: ${req.user.uid}, path: ${body.objectPath}`);
    return this.uploadService.processDataset(req.user.uid, body.objectPath, body.targetColumn);
  }

  /**
   * Endpoint to get the status of a processing job.
   */
  @UseGuards(JwtAuthGuard)
  @Get('status/:jobId')
  async getStatus(
    @Request() req: any,
    @Param('jobId') jobId: string,
  ) {
    return this.uploadService.getProcessingStatus(jobId);
  }

  /**
   * Endpoint to export the generated Bias Report PDF.
   */
  @UseGuards(JwtAuthGuard)
  @Get('export/:jobId')
  async exportReport(
    @Request() req: any,
    @Param('jobId') jobId: string,
    @Res() res: any,
  ) {
    const buffer = await this.uploadService.exportReport(jobId);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=bias_report_${jobId}.pdf`,
    });
    res.send(buffer);
  }
  /**
   * Endpoint to start dataset mitigation in the Python backend.
   */
  @UseGuards(JwtAuthGuard)
  @Post('mitigate')
  async mitigate(
    @Request() req: any,
    @Body() body: { objectPath: string; targetColumn: string; protectedColumns: string[]; modelName?: string },
  ) {
    this.logger.log(`Mitigate request received for user: ${req.user.uid}, path: ${body.objectPath}, model: ${body.modelName || 'default'}`);
    return this.uploadService.mitigateDataset(req.user.uid, body.objectPath, body.targetColumn, body.protectedColumns, body.modelName);
  }

  /**
   * Endpoint to get the status of a mitigation job.
   */
  @UseGuards(JwtAuthGuard)
  @Get('mitigate/status/:jobId')
  async getMitigationStatus(
    @Request() req: any,
    @Param('jobId') jobId: string,
  ) {
    return this.uploadService.getMitigationStatus(jobId);
  }

  /**
   * Endpoint to get a download URL for a mitigated dataset.
   */
  @UseGuards(JwtAuthGuard)
  @Post('mitigated/download')
  async downloadMitigated(
    @Request() req: any,
    @Body() body: { objectPath: string },
  ) {
    return this.uploadService.getDownloadUrl(body.objectPath);
  }

  /**
   * Endpoint to directly download a mitigated dataset bypassing signed URLs.
   */
  @UseGuards(JwtAuthGuard)
  @Post('mitigated/download-direct')
  async downloadDirect(
    @Request() req: any,
    @Body() body: { objectPath: string },
    @Res() res: any,
  ) {
    const stream = await this.uploadService.getFileStream(body.objectPath);
    res.set({
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment; filename="fixed_dataset.csv"',
    });
    stream.pipe(res);
  }
}
