import {
  Controller,
  Post,
  Get,
  Body,
  Res,
  Req,
  HttpCode,
  HttpStatus,
  Ip,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { Public } from './decorators/roles.decorator';
import { CurrentUser } from './decorators/current-user.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
    @Ip() ip: string,
  ) {
    const { token, user } = await this.authService.validateLogin(dto.username, dto.password, ip);

    const isSecure = process.env.COOKIE_SECURE === 'true' || process.env.NODE_ENV === 'production';

    res.cookie('bengkelos_session', token, {
      httpOnly: true,
      secure: isSecure,
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return {
      success: true,
      message: 'Login berhasil',
      data: {
        token,
        user,
      },
    };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('bengkelos_session', {
      httpOnly: true,
      path: '/',
    });
    return {
      success: true,
      message: 'Logout berhasil',
    };
  }

  @Get('me')
  async me(@CurrentUser() user: any) {
    return {
      success: true,
      data: user,
    };
  }
}
