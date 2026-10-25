import { Injectable, UnauthorizedException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { Role } from '@prisma/client';

export interface SessionData {
  userId: string;
  username: string;
  name: string;
  roles: Role[];
  issuedAt: number;
}

@Injectable()
export class AuthService {
  private readonly secretKey: string;
  // Simple in-memory rate limiting map for login attempts: username -> { count, lockUntil }
  private readonly loginAttempts = new Map<string, { count: number; lockUntil: number }>();

  constructor(private readonly prisma: PrismaService) {
    this.secretKey = process.env.SESSION_SECRET || 'fallback_secret_key_bengkelos_secure_32char';
  }

  createSessionToken(user: { id: string; username: string; name: string; roles: Role[] }): string {
    const payload: SessionData = {
      userId: user.id,
      username: user.username,
      name: user.name,
      roles: user.roles,
      issuedAt: Date.now(),
    };
    const jsonStr = JSON.stringify(payload);
    const b64Payload = Buffer.from(jsonStr).toString('base64url');
    const signature = crypto.createHmac('sha256', this.secretKey).update(b64Payload).digest('base64url');
    return `${b64Payload}.${signature}`;
  }

  verifySessionToken(token: string): SessionData | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 2) return null;
      const [b64Payload, signature] = parts;
      const expectedSignature = crypto.createHmac('sha256', this.secretKey).update(b64Payload).digest('base64url');
      if (crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature)) === false) {
        return null;
      }
      const jsonStr = Buffer.from(b64Payload, 'base64url').toString('utf-8');
      const payload: SessionData = JSON.parse(jsonStr);

      // Session expires after 7 days
      const maxAgeMs = 7 * 24 * 60 * 60 * 1000;
      if (Date.now() - payload.issuedAt > maxAgeMs) {
        return null;
      }

      return payload;
    } catch {
      return null;
    }
  }

  async validateLogin(username: string, passwordPlain: string, ip?: string) {
    const now = Date.now();
    const rateLimit = this.loginAttempts.get(username);
    if (rateLimit && rateLimit.lockUntil > now) {
      const remainingSeconds = Math.ceil((rateLimit.lockUntil - now) / 1000);
      throw new UnauthorizedException(`Terlalu banyak percobaan gagal. Silakan tunggu ${remainingSeconds} detik.`);
    }

    const user = await this.prisma.user.findUnique({
      where: { username },
    });

    if (!user || !user.isActive) {
      this.recordFailedAttempt(username);
      // Generic message to satisfy AC-02 without leaking sensitive details
      throw new UnauthorizedException('Username atau password tidak valid');
    }

    const passwordMatch = await bcrypt.compare(passwordPlain, user.passwordHash);
    if (!passwordMatch) {
      this.recordFailedAttempt(username);
      throw new UnauthorizedException('Username atau password tidak valid');
    }

    // Success: clear rate limit attempts
    this.loginAttempts.delete(username);

    // Audit log
    await this.prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'LOGIN',
        entityType: 'USER',
        entityId: user.id,
        details: { username: user.username, ipAddress: ip },
        ipAddress: ip,
      },
    });

    const token = this.createSessionToken(user);

    return {
      token,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        roles: user.roles,
      },
    };
  }

  private recordFailedAttempt(username: string) {
    const record = this.loginAttempts.get(username) || { count: 0, lockUntil: 0 };
    record.count += 1;
    if (record.count >= 5) {
      record.lockUntil = Date.now() + 60 * 1000; // Lock for 60 seconds after 5 failed attempts
      record.count = 0;
    }
    this.loginAttempts.set(username, record);
  }

  async getCurrentUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        name: true,
        roles: true,
        isActive: true,
        createdAt: true,
      },
    });
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Pengguna tidak aktif atau tidak ditemukan');
    }
    return user;
  }
}
