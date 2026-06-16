import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard as PassportAuthGuard } from '@nestjs/passport';

/**
 * Guard for JWT authentication.
 */
@Injectable()
export class AuthGuard extends PassportAuthGuard('jwt') {
  /**
   * Determines if the current request is authorized.
   * @param context Execution context
   * @returns boolean indicating if request is allowed, or a Promise/Observable
   */
  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }
}
