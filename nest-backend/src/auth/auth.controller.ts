import { Controller, Get, Post, Body, Res, UseGuards, UnauthorizedException } from '@nestjs/common';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Response } from 'express';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('sessionLogin')
  async sessionLogin(@Body('idToken') idToken: string, @Res() res: Response) {
    if (!idToken) {
      throw new UnauthorizedException('ID token is required');
    }

    try {
      // Set session expiration to 5 days
      const expiresIn = 1000 * 60 * 60 * 24 * 5;
      
      const auth = this.authService.getAuth();
      const sessionCookie = await auth.createSessionCookie(idToken, { expiresIn });
      
      res.cookie('session', sessionCookie, {
        maxAge: expiresIn,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
      });
      
      return res.send({ success: true });
    } catch (error) {
      throw new UnauthorizedException('Invalid ID token');
    }
  }

  @Post('sessionLogout')
  async sessionLogout(@Res() res: Response) {
    res.clearCookie('session');
    return res.send({ success: true });
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  getMe(@CurrentUser() user: any) {
    // The user object here is the decoded Firebase token
    return user;
  }
}
