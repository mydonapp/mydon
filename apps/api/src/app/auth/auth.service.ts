import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as argon2 from 'argon2';
import { randomBytes } from 'crypto';
import { Raw, Repository } from 'typeorm';
import { ChartSeederService } from '../ledgers/chart-seeder.service';
import { LedgersService } from '../ledgers/ledgers.service';
import { OrganizationKind } from '../organizations/organization.entity';
import { OrganizationsService } from '../organizations/organizations.service';
import { AccessToken } from './accessToken.entity';
import { WrongCredentialsError } from './auth.errors';
import { RefreshToken } from './refreshToken.entity';
import { User } from './user.entity';

const generateOpaqueToken = (length = 32): string => {
  return randomBytes(length).toString('base64url');
};

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(AccessToken)
    private accessTokenRepository: Repository<AccessToken>,
    @InjectRepository(RefreshToken)
    private refreshTokenRepository: Repository<RefreshToken>,
    private organizationsService: OrganizationsService,
    private ledgersService: LedgersService,
    private chartSeederService: ChartSeederService,
  ) {}

  async userById(id: string): Promise<User | null> {
    return await this.userRepository.findOneBy({ id });
  }

  async userByEmail(email: string): Promise<User | null> {
    return await this.userRepository.findOneBy({ email });
  }

  async userByRefreshToken(refreshToken: string): Promise<User | null> {
    return await this.userRepository.findOneBy({
      refreshToken: { token: refreshToken },
    });
  }

  async userByAccessToken(accessToken: string): Promise<User | null> {
    return await this.userRepository.findOneBy({
      accessToken: { token: accessToken },
    });
  }

  async createUser(data: {
    email: string;
    password: string;
    name: string;
    language?: string;
    kind?: OrganizationKind;
    organizationName?: string;
  }): Promise<void> {
    data.password = await argon2.hash(data.password);

    const language = data.language ?? 'en';
    const user = new User();
    user.email = data.email;
    user.name = data.name;
    user.password = data.password;
    user.language = language;

    await this.userRepository.save(user);

    // One org per signup: PERSONAL signups get a personal org named after the user; BUSINESS signups get
    // a single business org with the given name (no personal org). Each gets a "Main" ledger seeded with
    // the matching chart in the user's language, and becomes the user's active ledger.
    const kind = data.kind === OrganizationKind.BUSINESS ? OrganizationKind.BUSINESS : OrganizationKind.PERSONAL;
    const orgName = kind === OrganizationKind.BUSINESS ? (data.organizationName ?? data.name) : data.name;
    const organization = await this.organizationsService.createOrganization(user, kind, orgName);
    const ledger = await this.ledgersService.createDefaultLedger(organization.id, { kind });
    await this.chartSeederService.seedChart(ledger, kind, language);
    await this.userRepository.update({ id: user.id }, { activeLedgerId: ledger.id });
  }

  async logout(refreshToken: string): Promise<void> {
    await this.refreshTokenRepository.delete({ token: refreshToken });
  }

  async login({
    email,
    password,
    userAgent,
    ip,
  }: {
    email: string;
    password: string;
    userAgent: string;
    ip: string;
  }): Promise<{
    accessToken: string;
    refreshToken: string;
    accessTokenExpiry: number;
    refreshTokenExpiry: number;
  }> {
    const user = await this.userByEmail(email);

    if (!user) {
      const error = new WrongCredentialsError();
      throw new BadRequestException(error.message, { cause: error });
    }
    if (!(await argon2.verify(user.password, password))) {
      const error = new WrongCredentialsError();
      throw new BadRequestException(error.message, { cause: error });
    }

    const now = new Date().getTime();
    const refreshTokenExpiry = now + 24 * 60 * 60 * 1000;
    const accessTokenExpiry = now + 10 * 60 * 1000;

    const refreshToken = generateOpaqueToken(128);
    const accessToken = generateOpaqueToken(32);

    let refreshTokenEntity = new RefreshToken();
    refreshTokenEntity.token = refreshToken;
    refreshTokenEntity.user = user;
    refreshTokenEntity.expiresAt = new Date(refreshTokenExpiry);
    refreshTokenEntity.userAgent = userAgent;
    refreshTokenEntity.ip = ip;

    refreshTokenEntity = await this.refreshTokenRepository.save(refreshTokenEntity);

    const accessTokenEntity = new AccessToken();
    accessTokenEntity.token = accessToken;
    accessTokenEntity.user = user;
    accessTokenEntity.refreshToken = refreshTokenEntity;
    accessTokenEntity.expiresAt = new Date(accessTokenExpiry);

    await this.accessTokenRepository.save(accessTokenEntity);

    return { accessToken, refreshToken, accessTokenExpiry, refreshTokenExpiry };
  }

  async getNewAccessTokenFromRefreshToken(refreshToken: string) {
    const user = await this.userByRefreshToken(refreshToken);

    const refreshTokenResponse = await this.refreshTokenRepository.findOneBy({
      token: refreshToken,
      expiresAt: Raw((alias) => `${alias} > NOW()`),
    });

    if (!user || !refreshTokenResponse) {
      const error = new WrongCredentialsError();
      throw new BadRequestException(error.message, { cause: error });
    }

    const now = new Date().getTime();
    const accessTokenExpiry = now + 10 * 60 * 1000;
    const accessToken = generateOpaqueToken(32);

    await this.accessTokenRepository.delete({
      refreshToken: { id: refreshTokenResponse.id },
    });

    const accessTokenEntity = new AccessToken();
    accessTokenEntity.token = accessToken;
    accessTokenEntity.user = user;
    accessTokenEntity.refreshToken = refreshTokenResponse;
    accessTokenEntity.expiresAt = new Date(accessTokenExpiry);

    await this.accessTokenRepository.save(accessTokenEntity);

    return { accessToken, expiry: accessTokenExpiry };
  }

  async getUserFromAccessToken(accessToken: string) {
    const user = await this.userByAccessToken(accessToken);
    if (!user) {
      const error = new WrongCredentialsError();
      throw new BadRequestException(error.message, { cause: error });
    }

    return user;
  }

  async updateUser(
    userId: string,
    data: {
      name?: string;
      email?: string;
      language?: string;
      theme?: string;
      listStyle?: string;
      privacyMode?: boolean;
      showAccountCodes?: boolean;
      activeLedgerId?: string;
    },
  ): Promise<User> {
    const user = await this.userRepository.findOneOrFail({ where: { id: userId } });
    if (data.activeLedgerId !== undefined) {
      // Switch active books — only to a ledger in an org the user belongs to.
      if (!(await this.ledgersService.userCanUseLedger(userId, data.activeLedgerId))) {
        throw new BadRequestException('Ledger not found in your organizations');
      }
      user.activeLedgerId = data.activeLedgerId;
    }
    if (data.name) {
      user.name = data.name;
    }
    if (data.email) {
      user.email = data.email;
    }
    if (data.language) {
      user.language = data.language;
    }
    if (data.theme) {
      user.theme = data.theme;
    }
    if (data.listStyle) {
      user.listStyle = data.listStyle;
    }
    if (data.privacyMode !== undefined) {
      user.privacyMode = data.privacyMode;
    }
    if (data.showAccountCodes !== undefined) {
      user.showAccountCodes = data.showAccountCodes;
    }
    return this.userRepository.save(user);
  }

  async deleteExpiredAccessTokens(): Promise<void> {
    await this.accessTokenRepository.delete({
      expiresAt: Raw((alias) => `${alias} <= NOW()`),
    });
  }
}
