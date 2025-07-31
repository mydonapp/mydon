import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { Request, Response } from 'express';
import { AuthGuard } from './auth.guard';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { SignupDto } from './dto/signup.dto';

@ApiTags('auth')
@Controller('v1/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('me')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user information' })
  @ApiResponse({ status: 200, description: 'User information retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getCurrentUser(@Req() req: Request) {
    const user = req['context']?.user;
    if (!user) {
      throw new BadRequestException('User not found in request context');
    }
    return {
      id: user.id,
      name: user.name,
      email: user.email,
    };
  }

  @Post('signup')
  @ApiOperation({ summary: 'Create a new user account' })
  @ApiBody({ type: SignupDto })
  @ApiResponse({ status: 201, description: 'User account created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  async signup(@Body() signupDto: SignupDto): Promise<void> {
    if (!signupDto.password) {
      throw new BadRequestException('invalid password');
    }
    await this.authService.createUser(signupDto);
  }

  @Post('logout')
  @ApiOperation({ summary: 'Logout user and invalidate refresh token' })
  @ApiResponse({ status: 200, description: 'Logout successful' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async logout(@Res() res: Response, @Req() req: Request) {
    const refreshToken = req.cookies['refreshToken'] as string | undefined;

    if (!refreshToken) {
      return res.status(401).send({ message: 'Unauthorized' });
    }

    await this.authService.logout(refreshToken);
    res.clearCookie('refreshToken', { path: '/' });

    return res.status(200).send();
  }

  @Post('login/password')
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(
    @Body() loginDto: LoginDto,
    @Res() res: Response,
    @Req() req: Request,
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
  @ApiOperation({ summary: 'Refresh access token using refresh token' })
  @ApiResponse({ status: 200, description: 'New access token generated' })
  @ApiResponse({ status: 401, description: 'Invalid refresh token' })
  async refresh(@Res() res: Response, @Req() req: Request) {
    try {
      const refreshToken = req.cookies['refreshToken'] as string | undefined;

      if (!refreshToken) {
        return res.status(401).send({ message: 'Unauthorized' });
      }

      const { accessToken, expiry } =
        await this.authService.getNewAccessTokenFromRefreshToken(refreshToken);

      return res
        .status(200)
        .json({ accessToken, type: 'Bearer', expiry: Math.abs(expiry / 1000) });
    } catch {
      // console.error(error);
      return res.status(401).send({ message: 'Unauthorized' });
    }
  }
}
