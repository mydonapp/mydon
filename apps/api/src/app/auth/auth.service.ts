import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as argon2 from 'argon2';
import { randomBytes } from 'crypto';
import { Raw, Repository } from 'typeorm';
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
    private refreshTokenRepository: Repository<RefreshToken>
  ) {}

  async accountById(id: string): Promise<User | null> {
    return await this.userRepository.findOneBy({ id });
  }

  async accountByEmail(email: string): Promise<User | null> {
    return await this.userRepository.findOneBy({ email });
  }

  async accountByRefreshToken(refreshToken: string): Promise<User | null> {
    return await this.userRepository.findOneBy({
      refreshToken: { token: refreshToken },
    });
  }

  async accountByAccessToken(accessToken: string): Promise<User | null> {
    return await this.userRepository.findOneBy({
      accessToken: { token: accessToken },
    });
  }

  async createAccount(data: {
    email: string;
    password: string;
    name: string;
  }): Promise<void> {
    data.password = await argon2.hash(data.password);

    const user = new User();
    user.email = data.email;
    user.name = data.name;
    user.password = data.password;

    await this.userRepository.save(user);
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
    const account = await this.accountByEmail(email);

    if (!account) {
      const error = new WrongCredentialsError();
      throw new BadRequestException(error.message, { cause: error });
    }
    if (!(await argon2.verify(account.password, password))) {
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
    refreshTokenEntity.user = account;
    refreshTokenEntity.expiresAt = new Date(refreshTokenExpiry);
    refreshTokenEntity.userAgent = userAgent;
    refreshTokenEntity.ip = ip;

    refreshTokenEntity = await this.refreshTokenRepository.save(
      refreshTokenEntity
    );

    const accessTokenEntity = new AccessToken();
    accessTokenEntity.token = accessToken;
    accessTokenEntity.user = account;
    accessTokenEntity.refreshToken = refreshTokenEntity;
    accessTokenEntity.expiresAt = new Date(accessTokenExpiry);

    await this.accessTokenRepository.save(accessTokenEntity);

    return { accessToken, refreshToken, accessTokenExpiry, refreshTokenExpiry };
  }

  async getNewAccessTokenFromRefreshToken(refreshToken: string) {
    const account = await this.accountByRefreshToken(refreshToken);

    const refreshTokenResponse = await this.refreshTokenRepository.findOneBy({
      token: refreshToken,
      expiresAt: Raw((alias) => `${alias} > NOW()`),
    });

    if (!account || !refreshTokenResponse) {
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
    accessTokenEntity.user = account;
    accessTokenEntity.refreshToken = refreshTokenResponse;
    accessTokenEntity.expiresAt = new Date(accessTokenExpiry);

    await this.accessTokenRepository.save(accessTokenEntity);

    return { accessToken, expiry: accessTokenExpiry };
  }

  async getAccountFromAccessToken(accessToken: string) {
    const account = await this.accountByAccessToken(accessToken);
    if (!account) {
      const error = new WrongCredentialsError();
      throw new BadRequestException(error.message, { cause: error });
    }

    return account;
  }

  async deleteExpiredAccessTokens(): Promise<void> {
    await this.accessTokenRepository.delete({
      expiresAt: Raw((alias) => `${alias} <= NOW()`),
    });
  }
}
