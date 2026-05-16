import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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
  ) {}

  /**
   * Find similar transactions based on description text matching
   * @param userId - The user ID to search within
   * @param description - The description to match against
   * @param minSimilarity - Minimum similarity threshold (0-1)
   * @returns Array of matched transactions with similarity scores
   */
  async findSimilarTransactions(userId: string, description: string, minSimilarity = 0.7): Promise<TransactionMatch[]> {
    if (!description || description.trim().length === 0) {
      return [];
    }

    const candidates = await this.transactionRepository.find({
      where: {
        user: { id: userId },
        draft: false,
      },
      relations: ['creditAccount', 'debitAccount'],
      order: { transactionDate: 'DESC' },
      take: 500, // Limit to recent transactions for performance
    });

    const validCandidates = candidates.filter((t) => t.creditAccount && t.debitAccount && t.description);

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

  /**
   * Normalize text for comparison by removing extra whitespace,
   * converting to lowercase, and removing special characters
   */
  private normalizeText(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .replace(/[^\w\s]/g, ''); // Remove special characters
  }

  /**
   * Calculate similarity between two strings using a combination of
   * exact match, substring match, and word overlap
   */
  private calculateSimilarity(text1: string, text2: string): number {
    if (text1 === text2) {
      return 1.0;
    }

    // Check if one is substring of another
    if (text1.includes(text2) || text2.includes(text1)) {
      const shorter = text1.length < text2.length ? text1 : text2;
      const longer = text1.length >= text2.length ? text1 : text2;
      return shorter.length / longer.length;
    }

    // Calculate word-based similarity
    const words1 = text1.split(' ').filter((w) => w.length > 2); // Ignore short words
    const words2 = text2.split(' ').filter((w) => w.length > 2);

    if (words1.length === 0 || words2.length === 0) {
      return 0;
    }

    // Count matching words
    let matchingWords = 0;
    for (const word1 of words1) {
      for (const word2 of words2) {
        if (word1 === word2 || word1.includes(word2) || word2.includes(word1)) {
          matchingWords++;
          break;
        }
      }
    }

    // Calculate Jaccard similarity for words
    const uniqueWords = new Set([...words1, ...words2]);
    const jaccardSimilarity = matchingWords / uniqueWords.size;

    // Calculate overlap coefficient
    const minWords = Math.min(words1.length, words2.length);
    const overlapCoefficient = matchingWords / minWords;

    // Return weighted average
    return jaccardSimilarity * 0.4 + overlapCoefficient * 0.6;
  }

  /**
   * Get the best match for a transaction description
   * Returns the most similar transaction if similarity is above threshold
   */
  async getBestMatch(userId: string, description: string, minSimilarity = 0.7): Promise<Transaction | null> {
    const matches = await this.findSimilarTransactions(userId, description, minSimilarity);

    if (matches.length > 0) {
      return matches[0].transaction;
    }

    return null;
  }
}
