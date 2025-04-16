import {
  BadRequestException,
  Body,
  Controller,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { SignupDto } from './dto/signup.dto';

@Controller('v1/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  async signup(@Body() signupDto: SignupDto): Promise<void> {
    if (!signupDto.password) {
      throw new BadRequestException('invalid password');
    }
    await this.authService.createAccount(signupDto);
  }

  @Post('logout')
  async logout(@Res() res: Response, @Req() req: Request) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const refreshToken = req.cookies['refreshToken'] as string | undefined;

    if (!refreshToken) {
      return res.status(401).send({ message: 'Unauthorized' });
    }

    await this.authService.logout(refreshToken);
    res.clearCookie('refreshToken', { path: '/' });

    return res.status(200).send();
  }

  @Post('login/password')
  async login(
    @Body() loginDto: LoginDto,
    @Res() res: Response,
    @Req() req: Request
  ) {
    try {
      const {
        refreshToken,
        accessToken,
        accessTokenExpiry,
        refreshTokenExpiry,
      } = await this.authService.login({
        ...loginDto,
        userAgent: req.get('user-agent') || '',
        ip: req.get('x-forwarded-for') || '',
      });

      res.cookie('refreshToken', refreshToken, {
        secure: process.env.NODE_ENV !== 'development',
        httpOnly: true,
        maxAge: refreshTokenExpiry,
      });

      return res.status(200).json({
        accessToken,
        type: 'Bearer',
        expiry: Math.abs(accessTokenExpiry / 1000),
      });
    } catch (error) {
      console.error(error);
      return res.status(401).send({ message: 'Unauthorized' });
    }
  }

  @Post('/refresh')
  async refresh(@Res() res: Response, @Req() req: Request) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      const refreshToken = req.cookies['refreshToken'] as string | undefined;

      if (!refreshToken) {
        return res.status(401).send({ message: 'Unauthorized' });
      }

      const { accessToken, expiry } =
        await this.authService.getNewAccessTokenFromRefreshToken(refreshToken);

      return res
        .status(200)
        .json({ accessToken, type: 'Bearer', expiry: Math.abs(expiry / 1000) });
    } catch (error) {
      // console.error(error);
      return res.status(401).send({ message: 'Unauthorized' });
    }
  }
}
