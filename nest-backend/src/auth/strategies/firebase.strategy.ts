import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-custom';
import { Request } from 'express';
import { AuthService } from '../auth.service';

@Injectable()
export class FirebaseStrategy extends PassportStrategy(Strategy, 'firebase') {
  constructor(private readonly authService: AuthService) {
    super();
  }

  async validate(req: Request): Promise<any> {
    const sessionCookie = req.cookies?.session || '';
    const authHeader = req.headers.authorization;
    let token = null;
    let isSession = false;

    if (sessionCookie) {
      token = sessionCookie;
      isSession = true;
    } else if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }

    if (!token) {
      throw new UnauthorizedException('Missing or invalid authentication token');
    }

    try {
      const auth = this.authService.getAuth();
      let decodedToken;
      if (isSession) {
        decodedToken = await auth.verifySessionCookie(token, true);
      } else {
        decodedToken = await auth.verifyIdToken(token);
      }
      return decodedToken; // Returned object gets attached to req.user
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired Firebase token');
    }
  }
}
