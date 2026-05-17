import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccountGroup } from '../account-groups/account-group.entity';
import { Account } from '../accounts/accounts.entity';
import { LedgersModule } from '../ledgers/ledgers.module';
import { OrganizationsModule } from '../organizations/organizations.module';
import { AccessToken } from './accessToken.entity';
import { AuthController } from './auth.controller';
import { AuthGuard } from './auth.guard';
import { AuthService } from './auth.service';
import { RefreshToken } from './refreshToken.entity';
import { User } from './user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([AccessToken, RefreshToken, User, Account, AccountGroup]),
    OrganizationsModule,
    forwardRef(() => LedgersModule),
  ],
  controllers: [AuthController],
  providers: [AuthService, AuthGuard],
  exports: [AuthService, AuthGuard],
})
export class AuthModule {}
