import { useState } from 'react';
import { ProductHeaderInfo, UserCard } from './product-header';
import { Product } from '../lib/type';
import { formatCurrency } from './product';

export const BidderSidebar = ({
  product,
  onBidSuccess,
}: {
  product: Product;
  onBidSuccess: () => void;
}) => {
  const [bidAmount, setBidAmount] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentBid = Number(product.currentBid);
  const minBidStep = Number(product.minBidStep);
  const minNextBid = currentBid + minBidStep;

  const buyNowPrice = Number(product.buyNowPrice);
  const canBuyNow = buyNowPrice > 0;

  const handleBid = async () => {
    const bidValue = parseFloat(bidAmount);
    if (isNaN(bidValue)) {
      alert('Please enter a valid number.');
      return;
    }
    if (bidValue < minNextBid) {
      alert(`Bid too low! You must bid at least ${formatCurrency(minNextBid.toString())}`);
      return;
    }
    if (bidValue >= buyNowPrice) {
      alert(`Bid is higher than buy now price, please click buy now!!`);
      return;
    }
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/bid/${product.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: bidValue }),
        credentials: 'include',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to place bid');
      }
      alert('Bid placed successfully!');
      setBidAmount('');
      onBidSuccess();
    } catch (error: any) {
      alert(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBuyNow = () => {
    alert('Proceeding to buy now checkout...');
  };

  return (
    <div className="space-y-6">
      {/* Product Info Card */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <ProductHeaderInfo product={product} />

        {/* Bid Form */}
        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-xs text-gray-500">Your Bid amount</label>
            <div className="flex gap-2">
              <input
                type="number"
                disabled={isSubmitting}
                className="flex-1 border border-gray-300 rounded px-3 py-2 text-gray-900 focus:outline-none focus:border-red-500 disabled:bg-gray-100"
                placeholder={`Min ${formatCurrency(minNextBid.toString())}`}
                value={bidAmount}
                onChange={(e) => setBidAmount(e.target.value)}
              />
              <div className="bg-gray-200 text-gray-600 px-3 py-2 rounded font-medium text-sm flex items-center">
                VND
              </div>
            </div>
            <p className="text-[10px] text-gray-400">
              Min step: + {formatCurrency(minNextBid.toString())}
            </p>
          </div>

          {/* Place Bid Button */}
          <button
            onClick={handleBid}
            disabled={isSubmitting}
            className={`w-full font-bold py-3 rounded shadow transition duration-200 
              ${
                isSubmitting
                  ? 'bg-red-900 opacity-70 cursor-wait text-white'
                  : 'bg-red-800 hover:bg-red-900 text-white cursor-pointer'
              }`}
          >
            {isSubmitting ? 'Placing Bid...' : 'Place bid'}
          </button>

          {canBuyNow && (
            <button
              onClick={handleBuyNow}
              disabled={isSubmitting}
              className="w-full bg-white border border-red-800 text-red-800 font-bold py-3 rounded shadow-sm hover:bg-red-50 transition duration-200 cursor-pointer disabled:opacity-50"
            >
              Buy now for {formatCurrency(buyNowPrice.toString())}
            </button>
          )}

          <p className="text-[10px] text-center text-gray-400 mt-2">
            By bidding, you agree to our terms
          </p>
        </div>
      </div>

      {/* Profiles Card */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 divide-y divide-gray-100">
        <div className="">
          <UserCard title="Top Bidder" user={product.topBidder} />
        </div>
      </div>
    </div>
  );
};
