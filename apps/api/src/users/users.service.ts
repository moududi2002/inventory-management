// apps/api/src/users/users.service.ts

// Encapsulates all User CRUD + password operations.
// Other modules (auth) should only use methods here — never query User model directly.

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';

import { User, UserDocument } from './user.schema';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  // Find by email — used by login. Includes passwordHash.
  async findByEmailWithPassword(email: string): Promise<UserDocument | null> {
    return this.userModel
      .findOne({ email: email.toLowerCase().trim(), isActive: true })
      .select('+passwordHash')
      .exec();
  }

  // Find by id (safe — no password).
  async findById(id: string): Promise<UserDocument | null> {
    return this.userModel.findById(id).exec();
  }

  // Find by email (safe — no password).
  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email: email.toLowerCase().trim() }).exec();
  }

  async existsByEmail(email: string): Promise<boolean> {
    const count = await this.userModel.countDocuments({
      email: email.toLowerCase().trim(),
    });
    return count > 0;
  }

  // Create a new user with a hashed password.
  async createUser(input: {
    name: string;
    email: string;
    password: string;
  }): Promise<UserDocument> {
    const passwordHash = await this.hashPassword(input.password);
    const user = new this.userModel({
      name: input.name.trim(),
      email: input.email.toLowerCase().trim(),
      passwordHash,
      isActive: true,
    });
    return user.save();
  }

  // Update the last login timestamp.
  async touchLastLogin(userId: string): Promise<void> {
    await this.userModel
      .updateOne({ _id: userId }, { $set: { lastLoginAt: new Date() } })
      .exec();
  }

  // Hash a plaintext password with bcrypt (10 rounds is plenty for this app).
  async hashPassword(plain: string): Promise<string> {
    return bcrypt.hash(plain, 10);
  }

  // Compare a plaintext password to a stored hash.
  async verifyPassword(plain: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plain, hash);
  }

  // Sanity helper (throws if user missing).
  async getOrThrow(id: string): Promise<UserDocument> {
    const user = await this.findById(id);
    if (!user) throw new NotFoundException('User not found');
    return user;
  }
}
