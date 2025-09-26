import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const adminUser = await this.prisma.adminUser.findUnique({
      where: { email },
    });

    if (adminUser && await bcrypt.compare(password, adminUser.password)) {
      const { password, ...result } = adminUser;
      return result;
    }
    return null;
  }

  async login(user: any) {
    const payload = { email: user.email, sub: user.id };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    };
  }

  async register(email: string, password: string, name: string) {
    const hashedPassword = await bcrypt.hash(password, 10);
    
    try {
      const adminUser = await this.prisma.adminUser.create({
        data: {
          email,
          password: hashedPassword,
          name,
        },
      });
      
      const { password: _, ...result } = adminUser;
      return result;
    } catch (error) {
      if (error.code === 'P2002') {
        throw new UnauthorizedException('Email already exists');
      }
      throw error;
    }
  }
}
