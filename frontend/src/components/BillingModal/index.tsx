import { useState } from 'react';
import { PRICING_TIERS } from './pricing';

interface BillingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPurchase: (credits: number, price: number) => void;
}

export default function BillingModal({ isOpen, onClose, onPurchase }: BillingModalProps) {
  const [selectedTier, setSelectedTier] = useState<number | null>(null);

  if (!isOpen) return null;

  const handlePurchase = (tier: typeof PRICING_TIERS[0]) => {
    setSelectedTier(tier.credits);
    onPurchase(tier.credits, tier.price);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 p-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Purchase Credits</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {PRICING_TIERS.map((tier) => (
            <div
              key={tier.name}
              className={`border-2 rounded-lg p-6 ${
                selectedTier === tier.credits
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {tier.name}
              </h3>
              <div className="mb-4">
                <span className="text-4xl font-bold text-gray-900">
                  ${tier.price}
                </span>
              </div>
              <p className="text-gray-600 mb-4">{tier.description}</p>
              <div className="mb-6">
                <span className="text-3xl font-bold text-blue-600">
                  {tier.credits}
                </span>
                <span className="text-gray-600"> credits</span>
              </div>
              <button
                onClick={() => handlePurchase(tier)}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Purchase
              </button>
            </div>
          ))}
        </div>

        <div className="mt-6 text-center text-sm text-gray-500">
          Secure payment processed by Stripe
        </div>
      </div>
    </div>
  );
}
