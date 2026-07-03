import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class FirebaseAuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Authorization token is missing or invalid');
    }

    const token = authHeader.split(' ')[1];

    try {
      const decoded = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_SECRET || 'momentum-secure-access-token-secret-key-12345',
      });
      
      // Fetch details from PostgreSQL using Prisma (or local mock fallback)
      let user: any;
      if (this.prisma.isFallbackMode) {
        const users = this.prisma.getMockUsers();
        user = users.find((u) => u.id === decoded.sub);
      } else {
        user = await this.prisma.user.findUnique({
          where: { id: decoded.sub },
          include: { profile: true },
        });
      }

      if (!user || user.deletedAt) {
        throw new UnauthorizedException('User account has been deactivated or not found');
      }

      request.user = {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        displayName: user.profile?.displayName || user.username,
        timezone: user.profile?.timezone || 'UTC',
      };

      return true;
    } catch (e: any) {
      throw new UnauthorizedException(`Unauthorized: ${e.message}`);
    }
  }
}
