import { Module } from '@nestjs/common';
import { HealthController } from './health/health.controller';
import { ConfigModule } from '@nestjs/config';
import { UploadModule } from './upload/upload.module';
import { AuthModule } from './auth/auth.module';
import { ProfileModule } from './profile/profile.module';
import { RecommendationModule } from './recommendation/recommendation.module';
import { HistoryModule } from './history/history.module';
import { gcsConfigSchema } from './config/gcs.config';
import gcsConfig from './config/gcs.config';

/**
 * Root application module.
 */
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [gcsConfig],
      validationSchema: gcsConfigSchema,
      validationOptions: {
        allowUnknown: true,
        abortEarly: true,
      },
    }),
    AuthModule,
    UploadModule,
    ProfileModule,
    RecommendationModule,
    HistoryModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
