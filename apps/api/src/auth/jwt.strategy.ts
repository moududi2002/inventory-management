// apps/api/src/auth/jwt.strategy.ts

// Passport JWT strategy — validates incoming Bearer tokens
// and attaches a `JwtUser` object to `req.user`.

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

import type { JwtUser } from '../common/decorators/current-user.decorator';
import { UsersService } from '../users/users.service';

export interface JwtPayload {
  userId: string;
  email: string;
  name: string;
  iat?: number;
  exp?: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    config: ConfigService,
    private readonly usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('jwt.secret') ?? 'change-me',
    });
  }

  // Called after signature verification.
  // Return value becomes `req.user`.
  async validate(payload: JwtPayload): Promise<JwtUser> {
    // Optionally re-check the user still exists & is active.
    const user = await this.usersService.findById(payload.userId);
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid token');
    }
    return {
      userId: user._id.toString(),
      email: user.email,
      name: user.name,
    };
  }
}
