// apps/api/src/auth/auth.service.ts

// Handles login (verify credentials + sign JWT) and "me" lookup.

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

import { UsersService } from '../users/users.service';
import type { JwtUser } from '../common/decorators/current-user.decorator';
import type { User } from '@inventory/types';

export interface LoginResult {
  token: string;
  user: User;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  async login(email: string, password: string): Promise<LoginResult> {
    // 1) Find user (with password)
    const user = await this.usersService.findByEmailWithPassword(email);

    // Use a generic message to avoid leaking whether the email exists.
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is disabled');
    }

    // 2) Verify password
    const ok = await this.usersService.verifyPassword(password, user.passwordHash);
    if (!ok) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // 3) Sign JWT
    const payload: JwtUser = {
      userId: user._id.toString(),
      email: user.email,
      name: user.name,
    };
    const token = await this.jwtService.signAsync(payload);

    // 4) Update last login (fire-and-forget is fine here)
    await this.usersService.touchLastLogin(user._id.toString());

    return {
      token,
      user: this.toPublicUser(user),
    };
  }

  // Fetch the current user's public profile.
  async me(userId: string): Promise<User> {
    const user = await this.usersService.getOrThrow(userId);
    return this.toPublicUser(user);
  }

  // Convert a User document into the shared public shape.
  private toPublicUser(user: {
    _id: unknown;
    name: string;
    email: string;
    isActive: boolean;
    lastLoginAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }): User {
    return {
      _id: String(user._id),
      name: user.name,
      email: user.email,
      isActive: user.isActive,
      lastLoginAt: user.lastLoginAt ? user.lastLoginAt.toISOString() : null,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
  }

  // Optional helper: read JWT settings from config.
  getJwtExpiry(): string {
    return this.config.get<string>('jwt.expiresIn') ?? '7d';
  }
}
