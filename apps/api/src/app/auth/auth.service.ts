import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as argon2 from 'argon2';
import { randomBytes } from 'crypto';
import { Raw, Repository } from 'typeorm';
import { Account, AccountType } from '../accounts/accounts.entity';
import { Category } from '../categories/categories.entity';
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
    @InjectRepository(Account)
    private accountRepository: Repository<Account>,
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
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

  async createUser(data: { email: string; password: string; name: string }): Promise<void> {
    data.password = await argon2.hash(data.password);

    const user = new User();
    user.email = data.email;
    user.name = data.name;
    user.password = data.password;

    await this.userRepository.save(user);

    // Create default categories
    const categoryNames = ['Banking', 'Income', 'Food', 'Housing'];
    const categories: Record<string, Category> = {};
    for (const name of categoryNames) {
      const cat = new Category();
      cat.name = name;
      cat.user = user;
      categories[name] = await this.categoryRepository.save(cat);
    }

    // Create default accounts
    const defaultAccounts = [
      { name: 'Bank', type: AccountType.ASSETS, category: categories['Banking'] },
      { name: 'Income', type: AccountType.INCOME, category: categories['Income'] },
      { name: 'Food', type: AccountType.EXPENSE, category: categories['Food'] },
      { name: 'Rent', type: AccountType.EXPENSE, category: categories['Housing'] },
    ];

    for (const accountData of defaultAccounts) {
      const account = new Account();
      account.name = accountData.name;
      account.type = accountData.type;
      account.openingBalance = 0;
      account.category = accountData.category;
      account.user = user;
      await this.accountRepository.save(account);
    }
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
      showAccountNumbers?: boolean;
    },
  ): Promise<User> {
    const user = await this.userRepository.findOneOrFail({ where: { id: userId } });
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
    if (data.showAccountNumbers !== undefined) {
      user.showAccountNumbers = data.showAccountNumbers;
    }
    return this.userRepository.save(user);
  }

  async deleteExpiredAccessTokens(): Promise<void> {
    await this.accessTokenRepository.delete({
      expiresAt: Raw((alias) => `${alias} <= NOW()`),
    });
  }
}
