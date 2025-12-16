import { useEffect, useState } from 'react';
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

  // Initialize state from prop
  const [inWatchList, setInWatchList] = useState(!!product.isWatchlisted);
  const [isWatchLoading, setIsWatchLoading] = useState(false);

  // Sync state if product prop changes (e.g. user navigates to another product)
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

    if (isNaN(bidValue)) {
      return alert('Please enter a valid number.');
    }
    if (bidValue < minNextBid) {
      return alert(`Bid too low! Min: ${formatCurrency(minNextBid.toString())}`);
    }
    if (canBuyNow && bidValue >= buyNowPrice) {
      return alert(`Please use Buy Now.`);
    }

    const isConfirmed = window.confirm(
      `Are you sure you want to place a bid of ${formatCurrency(bidValue.toString())}?`
    );

    if (!isConfirmed) return;

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

  const handleBuyNow = async () => {
    if (!window.confirm(`Buy now for ${formatCurrency(buyNowPrice.toString())}?`)) return;
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/products/${product.id}/buy-now`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      alert('Purchased successfully.');
      onBidSuccess();
      if (data.order?.order_id) window.location.href = `/orders/${data.order.order_id}`;
    } catch (error: any) {
      alert(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // COMBINED HANDLER: Add or Remove based on current state
  const handleToggleWatchList = async () => {
    if (isWatchLoading) return;
    setIsWatchLoading(true);

    // Determine Action
    const endpoint = inWatchList ? `/api/watch-list/${product.id}` : '/api/watch-list/add';
    const method = inWatchList ? 'DELETE' : 'POST'; // Using POST for both as per controller setup

    try {
      const response = await fetch(endpoint, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: product.id }),
        credentials: 'include',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to update watch list');
      }

      // Toggle local state on success
      setInWatchList(!inWatchList);

      // Optional: Toast notification instead of alert
      // alert(inWatchList ? 'Removed from watch list' : 'Added to watch list');
    } catch (error: any) {
      console.error('Watch list error:', error);
      alert(error.message || 'Error updating watch list');
    } finally {
      setIsWatchLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <ProductHeaderInfo product={product} />

        <div className="space-y-3">
          {/* Bid Inputs */}
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
              Min step: + {formatCurrency(minBidStep.toString())}
            </p>
          </div>

          {/* Place Bid Button */}
          <button
            onClick={handleBid}
            disabled={isSubmitting}
            className={`w-full font-bold py-3 rounded shadow transition duration-200 
              ${isSubmitting ? 'bg-red-900 opacity-70 cursor-wait text-white' : 'bg-red-800 hover:bg-red-900 text-white cursor-pointer'}`}
          >
            {isSubmitting ? 'Placing Bid...' : 'Place bid'}
          </button>

          {/* Buy Now Button */}
          {canBuyNow && (
            <button
              onClick={handleBuyNow}
              disabled={isSubmitting}
              className="w-full bg-white border border-red-800 text-red-800 font-bold py-3 rounded shadow-sm hover:bg-red-50 transition duration-200 cursor-pointer disabled:opacity-50"
            >
              Buy now for {formatCurrency(buyNowPrice.toString())}
            </button>
          )}

          {/* Watchlist Button */}
          <button
            onClick={handleToggleWatchList}
            disabled={isWatchLoading || isSubmitting}
            className={`w-full flex items-center justify-center gap-2 font-medium py-3 rounded transition duration-200 cursor-pointer disabled:opacity-60
              ${
                inWatchList
                  ? 'bg-red-50 text-red-900 hover:bg-red-100 border border-red-200' // Style when Active (In Watchlist)
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700' // Style when Inactive
              }`}
          >
            {isWatchLoading ? (
              <span className="text-sm">Processing...</span>
            ) : (
              <>
                {inWatchList ? (
                  /* Filled Heart Icon */
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 fill-current"
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
                ) : (
                  /* Outline Heart Icon */
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
                )}
                <span>{inWatchList ? 'Remove from Watch List' : 'Add to Watch List'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 divide-y divide-gray-100">
        <div className="">
          <UserCard title="Top Bidder" user={product.topBidder} />
        </div>
      </div>

      {/* Seller */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 divide-y divide-gray-100">
        <div className="">
          <UserCard title="Seller" user={product.seller} />
        </div>
      </div>
    </div>
  );
};
