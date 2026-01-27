export interface PricingTier {
  name: string;
  credits: number;
  price: number;
  description: string;
}

export const PRICING_TIERS: PricingTier[] = [
  {
    name: 'Basic',
    credits: 10,
    price: 9,
    description: 'Perfect for occasional use',
  },
  {
    name: 'Pro',
    credits: 50,
    price: 39,
    description: 'Best value for regular users',
  },
  {
    name: 'Enterprise',
    credits: 200,
    price: 99,
    description: 'For power users and teams',
  },
];
