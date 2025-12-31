import { Clock, Loader2, Info } from 'lucide-react';
import { useEffect, useState } from 'react';
import { BidHistoryItem } from '../lib/type';
import { formatCurrency, formatDate } from './product';

export const formatDateTime = (dateString: Date | string) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
};

const maskBidderName = (name: string) => {
  if (!name) return '****User';
  const parts = name.trim().split(' ');
  const lastName = parts[parts.length - 1];
  return `****${lastName}`;
};

export default function GeneralBidHistory({ id }: { id: string }) {
  const [bidHistory, setBidHistory] = useState<BidHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/products/${id}/bids`);
        if (!res.ok) throw new Error('Failed to fetch bids');
        const jsonRes = await res.json();
        const data: BidHistoryItem[] = jsonRes.data;
        setBidHistory(data);
      } catch (error) {
        console.error('Error fetching bid history:', error);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [id]);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* header Section */}
      <div className="px-6 py-5 border-b border-gray-100 bg-white">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-lg font-bold text-gray-900">Bid History</h3>
          <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-semibold">
            Live
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Info size={16} />
          <p>Bidder information is partially masked for privacy.</p>
        </div>
      </div>

      {/* table Section */}
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
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                <th className="px-6 py-3 text-sm font-semibold text-gray-600 border-b border-gray-200">
                  Time
                </th>
                <th className="px-6 py-3 text-sm font-semibold text-gray-600 border-b border-gray-200">
                  Bidder
                </th>
                <th className="px-6 py-3 text-sm font-semibold text-gray-600 border-b border-gray-200">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {bidHistory.map((bid, index) => {
                const isTopBid = index === 0;
                return (
                  <tr
                    key={bid.id}
                    className={`hover:bg-gray-50 transition-colors ${
                      isTopBid ? 'bg-amber-50/30' : ''
                    }`}
                  >
                    <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">
                      {formatDateTime(bid.time)}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-700 whitespace-nowrap">
                      {maskBidderName(bid.bidderName)}
                    </td>
                    <td
                      className={`px-6 py-4 text-sm font-bold whitespace-nowrap ${
                        isTopBid ? 'text-amber-600' : 'text-gray-900'
                      }`}
                    >
                      {formatCurrency(bid.amount.toString())}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
