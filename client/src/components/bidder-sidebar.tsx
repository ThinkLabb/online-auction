import { useState } from "react";
import { ProductHeaderInfo, UserCard } from "./product-header";
import { Product } from "../lib/type";

export const BidderSidebar = ({ product, onBidSuccess }: { product: Product; onBidSuccess: () => void }) => {
  const [bidAmount, setBidAmount] = useState<string>('');

  const handleBid = async () => {
    const bidValue = parseFloat(bidAmount);
    if (isNaN(bidValue)) {
      alert('Please enter a valid number.');
      return;
    }
    
    const minRequiredBid = product.currentBid + product.minBidStep;
    
    if (bidValue < minRequiredBid) {
      alert(`Bid too low! Minimum: ${minRequiredBid}`);
      return;
    }
    if ((bidValue - minRequiredBid) % product.minBidStep !== 0) {
      alert(`Bid must be a multiple of ${product.minBidStep}.`);
      return;
    }

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
    }
  };

  const minNextBid = product.currentBid + product.minBidStep;

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
                className="flex-1 border border-gray-300 rounded px-3 py-2 text-gray-900 focus:outline-none focus:border-red-500"
                placeholder={`Min ${minNextBid} VND`}
                value={bidAmount}
                onChange={(e) => setBidAmount(e.target.value)}
              />
              <div className="bg-gray-200 text-gray-600 px-3 py-2 rounded font-medium text-sm flex items-center">
                VND
              </div>
            </div>
            <p className="text-[10px] text-gray-400">Min step: + {product.minBidStep} VND</p>
          </div>

          <button
            onClick={handleBid}
            className="w-full bg-red-800 text-white font-bold py-3 rounded shadow hover:bg-red-900 transition duration-200 cursor-pointer"
          >
            Place bid
          </button>
          <button className="w-full bg-white border border-red-800 text-red-800 font-bold py-3 rounded shadow-sm hover:bg-red-50 transition duration-200 cursor-pointer">
            Buy now for {product.buyNowPrice.toLocaleString()} VND
          </button>
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