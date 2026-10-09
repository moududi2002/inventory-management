// apps/api/src/scripts/seed-admin.ts

// CLI script — creates (or updates) the single admin user from .env values.
// Run with:  pnpm --filter @inventory/api seed:admin
// Safe to run multiple times; it will update the password if the user exists.

import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';

import { AppModule } from '../app.module';
import { UsersService } from '../users/users.service';

async function run() {
  const logger = new Logger('SeedAdmin');

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  const config = app.get(ConfigService);
  const usersService = app.get(UsersService);

  const name = config.get<string>('adminSeed.name') ?? 'Admin';
  const email = (config.get<string>('adminSeed.email') ?? '').toLowerCase().trim();
  const password = config.get<string>('adminSeed.password') ?? '';

  if (!email || !password) {
    logger.error(
      'ADMIN_EMAIL and ADMIN_PASSWORD must be set in apps/api/.env before seeding.',
    );
    await app.close();
    process.exit(1);
  }

  const existing = await usersService.findByEmail(email);

  if (existing) {
    // Update password + name to match .env
    const passwordHash = await usersService.hashPassword(password);
    await existing
      .set({ name, passwordHash, isActive: true })
      .save();
    logger.log(`♻️  Admin updated: ${email}`);
  } else {
    await usersService.createUser({ name, email, password });
    logger.log(`✅ Admin created: ${email}`);
  }

  await app.close();
  process.exit(0);
}

run().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
