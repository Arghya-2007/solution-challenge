/**
 * Interface defining the response payload for a presigned URL request.
 */
export interface PresignResponse {
  /**
   * The generated signed URL for GCS upload.
   */
  signedUrl: string;

  /**
   * The generated object path (key) in the GCS bucket.
   */
  objectPath: string;

  /**
   * ISO timestamp of when the signed URL will expire.
   */
  expiresAt: string;
}
