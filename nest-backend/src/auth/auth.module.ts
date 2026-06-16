import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtStrategy } from './jwt.strategy';
import { FirebaseStrategy } from './strategies/firebase.strategy';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';

/**
 * Module responsible for authentication.
 */
@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '1h' },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [JwtStrategy, FirebaseStrategy, AuthService],
  exports: [JwtStrategy, FirebaseStrategy, PassportModule, AuthService],
})
export class AuthModule {}
