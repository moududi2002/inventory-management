// apps/api/src/auth/auth.controller.ts

// Auth HTTP endpoints:
//   POST /api/auth/login   → public
//   GET  /api/auth/me      → requires Bearer token

import { Body, Controller, Get, HttpCode, Post } from '@nestjs/common';

import { AuthService } from './auth.service';
import { loginSchema, type LoginInput } from './dto/login.dto';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser, type JwtUser } from '../common/decorators/current-user.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // POST /api/auth/login
  @Public()
  @Post('login')
  @HttpCode(200)
  async login(@Body(new ZodValidationPipe(loginSchema)) dto: LoginInput) {
    return this.authService.login(dto.email, dto.password);
  }

  // GET /api/auth/me
  @Get('me')
  async me(@CurrentUser() user: JwtUser) {
    const profile = await this.authService.me(user.userId);
    return { user: profile };
  }
}
