import { useEffect, useState } from 'react';
import { ProductHeaderInfo, UserCard } from './product-header';
import { Product } from '../lib/type';
import { formatCurrency } from './product';
import GeneralBidHistory from './bid-history';

export const BidderSidebar = ({
  product,
  onBidSuccess,
}: {
  product: Product;
  onBidSuccess: () => void;
}) => {
  const [bidAmount, setBidAmount] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [inWatchList, setInWatchList] = useState(!!product.isWatchlisted);
  const [isWatchLoading, setIsWatchLoading] = useState(false);

  useEffect(() => {
    setInWatchList(!!product.isWatchlisted);
  }, [product.isWatchlisted]);

  const currentBid = Number(product.currentBid);
  const minBidStep = Number(product.minBidStep);
  const minNextBid = currentBid + minBidStep;
  const buyNowPrice = Number(product.buyNowPrice);
  const canBuyNow = buyNowPrice > 0;

  const handleBid = async () => {
    const bidValue = parseFloat(bidAmount);

    if (isNaN(bidValue)) return alert('Please enter a valid number.');
    if (bidValue < minNextBid)
      return alert(`Bid too low! Min: ${formatCurrency(minNextBid.toString())}`);

    if (confirm(`Place bid of ${formatCurrency(bidValue.toString())}?`)) {
      setIsSubmitting(true);
      try {
        const response = await fetch(`/api/bid/${product.id}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount: bidValue }),
        });
        if (!response.ok) throw new Error('Failed to place bid');

        const data = await response.json();

        await onBidSuccess();

        alert('Bid placed successfully!');
        setBidAmount('');
      } catch (error: any) {
        alert(error.message);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleBuyNow = async () => {
    if (confirm(`Buy now for ${formatCurrency(buyNowPrice.toString())}?`)) {
      setIsSubmitting(true);
      try {
        const response = await fetch(`/api/products/${product.id}/buy-now`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });
        if (!response.ok) throw new Error('Purchase failed');
        onBidSuccess();
        window.location.reload();
      } catch (error: any) {
        alert(error.message);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleToggleWatchList = async () => {
    if (isWatchLoading) return;
    setIsWatchLoading(true);

    const endpoint = inWatchList ? `/api/watch-list/${product.id}` : '/api/watch-list/add';

    const method = inWatchList ? 'DELETE' : 'POST';

    try {
      const response = await fetch(endpoint, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: product.id }),
      });

      if (!response.ok) throw new Error('Failed to update watch list');

      setInWatchList(!inWatchList);
    } catch (error: any) {
      console.error(error);
      alert('Could not update watchlist. Please try again.');
    } finally {
      setIsWatchLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <ProductHeaderInfo product={product} />

        <div className="space-y-3">
          {/* Bid Input Section */}
          <div className="space-y-1">
            <label className="text-xs text-gray-500">Your Bid amount</label>
            <div className="flex gap-2">
              <input
                type="number"
                disabled={isSubmitting}
                className="flex-1 border border-gray-300 rounded px-3 py-2 focus:border-red-500 outline-none"
                placeholder={`Min ${formatCurrency(minNextBid.toString())}`}
                value={bidAmount}
                onChange={(e) => setBidAmount(e.target.value)}
              />
              <div className="bg-gray-100 text-gray-600 px-3 py-2 rounded text-sm flex items-center">
                VND
              </div>
            </div>
          </div>

          <button
            onClick={handleBid}
            disabled={isSubmitting}
            className="w-full bg-red-800 hover:bg-red-900 text-white font-bold py-3 rounded shadow transition disabled:opacity-50"
          >
            {isSubmitting ? 'Processing...' : 'Place Bid'}
          </button>

          {canBuyNow && (
            <button
              onClick={handleBuyNow}
              disabled={isSubmitting}
              className="w-full bg-white border border-red-800 text-red-800 font-bold py-3 rounded hover:bg-red-50 transition"
            >
              Buy Now ({formatCurrency(buyNowPrice.toString())})
            </button>
          )}

          {/* 4. Watch List Button with Conditional Rendering */}
          <button
            onClick={handleToggleWatchList}
            disabled={isWatchLoading}
            className={`w-full flex items-center justify-center gap-2 font-medium py-3 rounded border transition-colors duration-200
              ${
                inWatchList
                  ? 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100' // Active Styles (Remove)
                  : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100' // Inactive Styles (Add)
              }`}
          >
            {isWatchLoading ? (
              <span className="text-sm">Updating...</span>
            ) : (
              <>
                {inWatchList ? (
                  // Filled Heart (Remove)
                  <>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 fill-current"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span>Remove from Watchlist</span>
                  </>
                ) : (
                  // Outline Heart (Add)
                  <>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                      />
                    </svg>
                    <span>Add to Watchlist</span>
                  </>
                )}
              </>
            )}
          </button>
        </div>
      </div>

      {/* User Info Cards (Seller & Top Bidder) */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 divide-y divide-gray-100">
        {/* Seller Info */}
        <div className="pb-4">
          <UserCard title="Seller" user={product.seller} />
        </div>

        {/* Top Bidder Info */}
        <div className="pt-4">
          <UserCard title="Top Bidder" user={product.topBidder} />
        </div>
      </div>

      {/* Bid history table */}
      <GeneralBidHistory id={product.id} />
    </div>
  );
};
