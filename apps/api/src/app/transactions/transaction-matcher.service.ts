import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, IsNull, Repository } from 'typeorm';
import { LedgersService } from '../ledgers/ledgers.service';
import { Transaction } from './transactions.entity';

export interface TransactionMatch {
  transaction: Transaction;
  similarity: number;
}

@Injectable()
export class TransactionMatcherService {
  constructor(
    @InjectRepository(Transaction)
    private transactionRepository: Repository<Transaction>,
    private ledgersService: LedgersService,
  ) {}

  /**
   * Find similar transactions based on description text matching. Searches only posted
   * transactions in the user's default ledger.
   */
  async findSimilarTransactions(userId: string, description: string, minSimilarity = 0.7): Promise<TransactionMatch[]> {
    if (!description || description.trim().length === 0) {
      return [];
    }

    const ledger = await this.ledgersService.getDefaultLedgerForUser(userId);
    const candidates = await this.transactionRepository.find({
      where: { ledgerId: ledger.id, postedAt: Not(IsNull()) },
      relations: ['entries', 'entries.account'],
      order: { transactionDate: 'DESC' },
      take: 500,
    });

    const validCandidates = candidates.filter((t) => t.entries.length >= 2 && t.description);

    const matches: TransactionMatch[] = [];
    const normalizedDescription = this.normalizeText(description);

    for (const candidate of validCandidates) {
      const normalizedCandidate = this.normalizeText(candidate.description);
      const similarity = this.calculateSimilarity(normalizedDescription, normalizedCandidate);

      if (similarity >= minSimilarity) {
        matches.push({
          transaction: candidate,
          similarity,
        });
      }
    }

    matches.sort((a, b) => b.similarity - a.similarity);

    return matches;
  }

  private normalizeText(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/[^\w\s]/g, '');
  }

  private calculateSimilarity(text1: string, text2: string): number {
    if (text1 === text2) {
      return 1.0;
    }

    if (text1.includes(text2) || text2.includes(text1)) {
      const shorter = text1.length < text2.length ? text1 : text2;
      const longer = text1.length >= text2.length ? text1 : text2;
      return shorter.length / longer.length;
    }

    const words1 = text1.split(' ').filter((w) => w.length > 2);
    const words2 = text2.split(' ').filter((w) => w.length > 2);

    if (words1.length === 0 || words2.length === 0) {
      return 0;
    }

    let matchingWords = 0;
    for (const word1 of words1) {
      for (const word2 of words2) {
        if (word1 === word2 || word1.includes(word2) || word2.includes(word1)) {
          matchingWords++;
          break;
        }
      }
    }

    const uniqueWords = new Set([...words1, ...words2]);
    const jaccardSimilarity = matchingWords / uniqueWords.size;
    const minWords = Math.min(words1.length, words2.length);
    const overlapCoefficient = matchingWords / minWords;

    return jaccardSimilarity * 0.4 + overlapCoefficient * 0.6;
  }

  async getBestMatch(userId: string, description: string, minSimilarity = 0.7): Promise<Transaction | null> {
    const matches = await this.findSimilarTransactions(userId, description, minSimilarity);
    if (matches.length > 0) {
      return matches[0].transaction;
    }
    return null;
  }
}
