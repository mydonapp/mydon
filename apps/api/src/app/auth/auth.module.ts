import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccessToken } from './accessToken.entity';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { RefreshToken } from './refreshToken.entity';
import { User } from './user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([AccessToken, RefreshToken, User])],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
