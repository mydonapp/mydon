import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AccountsService } from './accounts.service';
import { Account, AccountType, Currency } from './accounts.entity';
import { ForexService } from '../shared/forex/forex.service';

describe('AccountsService', () => {
  let service: AccountsService;

  const mockRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockForexService = {
    convertCurrency: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AccountsService,
        {
          provide: getRepositoryToken(Account),
          useValue: mockRepository,
        },
        {
          provide: ForexService,
          useValue: mockForexService,
        },
      ],
    }).compile();

    service = module.get<AccountsService>(AccountsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return all accounts with calculated balances', async () => {
      const mockAccounts: Partial<Account>[] = [
        {
          id: '1',
          name: 'Test Account 1',
          type: AccountType.ASSETS,
          creditBalance: 1000,
          debitBalance: 200,
          balance: 800,
          openingBalance: 100,
          currency: Currency.CHF,
        },
        {
          id: '2',
          name: 'Test Account 2',
          type: AccountType.LIABILITIES,
          creditBalance: 500,
          debitBalance: 300,
          balance: 200,
          openingBalance: 50,
          currency: Currency.EUR,
        },
      ];

      mockRepository.find.mockResolvedValue(mockAccounts);

      const result = await service.findAll();

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: '1',
        name: 'Test Account 1',
        type: AccountType.ASSETS,
        creditBalance: 1100, // creditBalance + openingBalance
        debitBalance: 200,
        balance: 800,
        currency: 'CHF',
      });
      expect(result[1]).toEqual({
        id: '2',
        name: 'Test Account 2',
        type: AccountType.LIABILITIES,
        creditBalance: 550, // creditBalance + openingBalance
        debitBalance: 300,
        balance: 200,
        currency: 'EUR',
      });
    });

    it('should handle empty accounts array', async () => {
      mockRepository.find.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
      expect(mockRepository.find).toHaveBeenCalledTimes(1);
    });

    it('should handle accounts with zero balances', async () => {
      const mockAccounts: Partial<Account>[] = [
        {
          id: '1',
          name: 'Zero Account',
          type: AccountType.ASSETS,
          creditBalance: 0,
          debitBalance: 0,
          balance: 0,
          openingBalance: 0,
          currency: Currency.CHF,
        },
      ];

      mockRepository.find.mockResolvedValue(mockAccounts);

      const result = await service.findAll();

      expect(result).toHaveLength(1);
      expect(result[0].creditBalance).toBe(0);
      expect(result[0].debitBalance).toBe(0);
      expect(result[0].balance).toBe(0);
    });
  });

  describe('mapAccountsToGrouped', () => {
    it('should filter and map accounts by type with currency conversion', async () => {
      const mockAccounts: Partial<Account>[] = [
        {
          id: '1',
          name: 'Asset Account',
          type: AccountType.ASSETS,
          creditBalance: 1000,
          debitBalance: 200,
          balance: 800,
          openingBalance: 100,
          currency: Currency.EUR,
        },
        {
          id: '2',
          name: 'Liability Account',
          type: AccountType.LIABILITIES,
          creditBalance: 500,
          debitBalance: 300,
          balance: 200,
          openingBalance: 50,
          currency: Currency.USD,
        },
      ];

      mockForexService.convertCurrency.mockResolvedValue(850); // Mock converted amount

      const result = await service.mapAccountsToGrouped(
        mockAccounts as Account[],
        AccountType.ASSETS,
      );

      expect(result.accounts).toHaveLength(1);
      expect(result.accounts[0]).toEqual({
        id: '1',
        name: 'Asset Account',
        type: AccountType.ASSETS,
        creditBalance: 1100,
        debitBalance: 200,
        balance: 800,
        currency: 'EUR',
        balanceMainCurrency: 850,
        retirementAccount: undefined,
      });
      expect(result.total).toBe(850);
      expect(result.totalWithoutRetirement).toBe(850);

      expect(mockForexService.convertCurrency).toHaveBeenCalledWith(
        800,
        'EUR',
        'CHF',
        expect.any(Date),
      );
    });

    it('should return empty array when no accounts match the type', async () => {
      const mockAccounts: Partial<Account>[] = [
        {
          id: '1',
          name: 'Asset Account',
          type: AccountType.ASSETS,
          creditBalance: 1000,
          debitBalance: 200,
          balance: 800,
          openingBalance: 100,
          currency: Currency.CHF,
        },
      ];

      const result = await service.mapAccountsToGrouped(
        mockAccounts as Account[],
        AccountType.INCOME,
      );

      expect(result).toEqual({
        accounts: [],
        total: 0,
        totalWithoutRetirement: 0,
      });
      expect(mockForexService.convertCurrency).not.toHaveBeenCalled();
    });

    it('should handle multiple accounts of the same type', async () => {
      const mockAccounts: Partial<Account>[] = [
        {
          id: '1',
          name: 'Asset Account 1',
          type: AccountType.ASSETS,
          creditBalance: 1000,
          debitBalance: 200,
          balance: 800,
          openingBalance: 100,
          currency: Currency.CHF,
        },
        {
          id: '2',
          name: 'Asset Account 2',
          type: AccountType.ASSETS,
          creditBalance: 2000,
          debitBalance: 500,
          balance: 1500,
          openingBalance: 200,
          currency: Currency.EUR,
        },
      ];

      mockForexService.convertCurrency
        .mockResolvedValueOnce(800) // First account
        .mockResolvedValueOnce(1600); // Second account

      const result = await service.mapAccountsToGrouped(
        mockAccounts as Account[],
        AccountType.ASSETS,
      );

      expect(result.accounts).toHaveLength(2);
      expect(result.accounts[0].name).toBe('Asset Account 2'); // Higher balance first due to sorting
      expect(result.accounts[1].name).toBe('Asset Account 1');
      expect(result.total).toBe(2400); // 800 + 1600
      expect(result.totalWithoutRetirement).toBe(2400); // Both are not retirement accounts
      expect(mockForexService.convertCurrency).toHaveBeenCalledTimes(2);
    });
  });

  describe('error handling', () => {
    it('should handle repository errors gracefully', async () => {
      mockRepository.find.mockRejectedValue(new Error('Database error'));

      await expect(service.findAll()).rejects.toThrow('Database error');
    });

    it('should handle forex service errors gracefully', async () => {
      const mockAccounts: Partial<Account>[] = [
        {
          id: '1',
          name: 'Test Account',
          type: AccountType.ASSETS,
          creditBalance: 1000,
          debitBalance: 200,
          balance: 800,
          openingBalance: 100,
          currency: Currency.EUR,
        },
      ];

      mockForexService.convertCurrency.mockRejectedValue(
        new Error('Forex API error'),
      );

      await expect(
        service.mapAccountsToGrouped(
          mockAccounts as Account[],
          AccountType.ASSETS,
        ),
      ).rejects.toThrow('Forex API error');
    });
  });
});
