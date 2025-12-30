import { Ban, Clock, Trophy, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { BidHistoryItem } from '../lib/type';
import { formatCurrency } from './product';

export const formatTimeAgo = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return date.toLocaleDateString('vi-VN', { month: 'short', day: 'numeric' });
};

export default function BidHistory({ id, onBidSuccess }: { id: string; onBidSuccess: () => void }) {
  const [bidHistory, setBidHistory] = useState<BidHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/product/${id}/bids`);
        if (!res.ok) throw new Error('Failed to fetch bids');
        const data: BidHistoryItem[] = await res.json();
        setBidHistory(data);
      } catch (error) {
        console.error('Error fetching bid history:', error);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [id]);

  const handleBanUser = async (bidderId: string) => {
    const isConfirmed = window.confirm('Are you sure you want to ban this user from bidding?');
    if (!isConfirmed) return;
    try {
      const response = await fetch(`/api/ban/${id}/${bidderId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to ban user');
      }
      setBidHistory((prev) => {
        return prev.filter((bid) => bid.bidderId !== bidderId);
      });
      alert('User has been banned.');
      onBidSuccess();
    } catch (error) {
      console.error('Error banning user:', error);
      alert('Something went wrong while banning the user.');
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-white">
        <div>
          <h3 className="text-lg font-bold text-gray-900">Bid History</h3>
          {!isLoading && (
            <p className="text-xs text-gray-500 mt-1">{bidHistory.length} total bids placed</p>
          )}
        </div>
        <div className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs font-semibold">
          Live
        </div>
      </div>

      <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
        {isLoading ? (
          <div className="p-12 flex flex-col items-center justify-center text-gray-400">
            <Loader2 className="animate-spin mb-2 text-amber-500" size={32} />
            <p className="text-sm font-medium">Loading history...</p>
          </div>
        ) : bidHistory.length === 0 ? (
          <div className="p-12 text-center text-gray-400 flex flex-col items-center">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-3">
              <Clock size={24} className="opacity-40" />
            </div>
            <p className="text-gray-900 font-medium">No bids yet</p>
            <p className="text-xs mt-1">Be the first to place a bid!</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {bidHistory.map((bid, index) => {
              const isTopBid = index === 0;
              return (
                <div
                  key={bid.id}
                  className={`group flex items-center justify-between p-4 hover:bg-gray-50 transition-all duration-200 ${
                    isTopBid ? 'bg-amber-50/40' : ''
                  }`}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="relative shrink-0">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shadow-sm ${
                          isTopBid
                            ? 'bg-linear-to-br from-amber-100 to-yellow-200 text-amber-700'
                            : 'bg-linear-to-br from-gray-100 to-gray-200 text-gray-600'
                        }`}
                      >
                        {bid.bidderName.charAt(0).toUpperCase()}
                      </div>

                      {isTopBid && (
                        <div className="absolute -top-1 -right-1 bg-yellow-400 text-white p-0.5 rounded-full border-2 border-white shadow-sm">
                          <Trophy size={10} fill="currentColor" />
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-gray-900 truncate">{bid.bidderName}</p>

                        {isTopBid && (
                          <span className="shrink-0 text-[10px] bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded border border-yellow-200 font-medium">
                            Highest
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
                        <Clock size={10} />
                        {formatTimeAgo(bid.time)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p
                        className={`font-mono font-bold ${
                          isTopBid ? 'text-amber-600 text-base' : 'text-gray-900 text-sm'
                        }`}
                      >
                        {formatCurrency(bid.amount.toString())}
                      </p>
                    </div>

                    <button
                      onClick={() => handleBanUser(bid.bidderId)}
                      className="p-2 rounded-full text-gray-300 hover:bg-red-50 hover:text-red-600 transition-all duration-200 opacity-0 group-hover:opacity-100 focus:opacity-100"
                      title="Ban this user"
                    >
                      <Ban size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
