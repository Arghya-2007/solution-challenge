import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { UploadController } from './upload.controller';
import { UploadService } from './upload.service';
import { AuthModule } from '../auth/auth.module';

/**
 * Module responsible for handling file uploads.
 */
@Module({
  imports: [AuthModule, HttpModule],
  controllers: [UploadController],
  providers: [UploadService],
})
export class UploadModule {}

