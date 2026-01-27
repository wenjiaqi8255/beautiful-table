import { describe, it, expect } from 'vitest';
import {
  getCreditsForAmount,
  calculatePrice,
  PRICING_TIERS
} from './stripe';

describe('Stripe Helpers', () => {
  describe('PRICING_TIERS', () => {
    it('should have three pricing tiers defined', () => {
      expect(PRICING_TIERS).toHaveLength(3);
    });

    it('should have correct tier structure', () => {
      PRICING_TIERS.forEach((tier) => {
        expect(tier).toHaveProperty('name');
        expect(tier).toHaveProperty('credits');
        expect(tier).toHaveProperty('price');
        expect(tier).toHaveProperty('description');
      });
    });

    it('should have Basic tier with 10 credits', () => {
      const basic = PRICING_TIERS.find((t) => t.name === 'Basic');
      expect(basic?.credits).toBe(10);
      expect(basic?.price).toBe(9);
    });

    it('should have Pro tier with 50 credits', () => {
      const pro = PRICING_TIERS.find((t) => t.name === 'Pro');
      expect(pro?.credits).toBe(50);
      expect(pro?.price).toBe(39);
    });

    it('should have Enterprise tier with 200 credits', () => {
      const enterprise = PRICING_TIERS.find((t) => t.name === 'Enterprise');
      expect(enterprise?.credits).toBe(200);
      expect(enterprise?.price).toBe(99);
    });
  });

  describe('getCreditsForAmount', () => {
    it('should return 10 credits for $9', () => {
      expect(getCreditsForAmount(900)).toBe(10); // Amount in cents
    });

    it('should return 50 credits for $39', () => {
      expect(getCreditsForAmount(3900)).toBe(50);
    });

    it('should return 200 credits for $99', () => {
      expect(getCreditsForAmount(9900)).toBe(200);
    });

    it('should return 0 for unknown amount', () => {
      expect(getCreditsForAmount(1000)).toBe(0);
    });
  });

  describe('calculatePrice', () => {
    it('should return price in cents for given credits', () => {
      expect(calculatePrice(10)).toBe(900); // $9
      expect(calculatePrice(50)).toBe(3900); // $39
      expect(calculatePrice(200)).toBe(9900); // $99
    });

    it('should return 0 for unknown credit amount', () => {
      expect(calculatePrice(15)).toBe(0);
    });
  });
});
