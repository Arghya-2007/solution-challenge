import { IsString, IsNotEmpty, IsNumber, IsPositive, IsIn, MaxLength, Matches } from 'class-validator';

/**
 * DTO for the presigned URL request.
 */
export class PresignRequestDto {
  /**
   * The original file name. Must not contain path traversal characters.
   */
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  @Matches(/^[^\\/:\*\?"<>\|]+$/, {
    message: 'fileName contains invalid characters or path traversal attempts',
  })
  fileName: string;

  /**
   * The file size in bytes.
   */
  @IsNumber()
  @IsPositive()
  fileSize: number;

  /**
   * The MIME type of the file. Restricted to specific document types.
   */
  @IsString()
  @IsNotEmpty()
  @IsIn([
    'text/csv',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ])
  contentType: string;
}
