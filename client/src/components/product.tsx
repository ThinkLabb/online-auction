import { memo, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

export const formatCurrency = (priceStr: string | null | undefined): string => {
  if (!priceStr) return '';
  const price = Number(priceStr);
  return new Intl.NumberFormat('de-DE').format(price) + ' USD';
};

export const formatDate = (dateStr: string | null | undefined): string => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

export const calculateTimeRemaining = (endTimeStr: string | null | undefined): string => {
  if (!endTimeStr) return 'N/A';

  const endDate = new Date(endTimeStr);
  const now = new Date();
  const diffMs = endDate.getTime() - now.getTime();

  if (diffMs <= 0) return 'Auction ended';

  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (days >= 3) {
    return endDate.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  if (days > 0) return `${days} day${days > 1 ? 's' : ''} left`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} left`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} left`;

  return 'Ending soon';
};

export type Product = {
  id?: string | number;
  name: string;
  bid_count: number;
  current_price: string;
  buy_now_price: string | null;
  end_time: string;
  created_at: string;
  highest_bidder_name: string | null;
  image_url: string | null;
};

export const MemoProductCard = memo(({ product }: { product: Product }) => {
  const {
    name,
    bid_count,
    current_price,
    buy_now_price,
    end_time,
    created_at,
    highest_bidder_name,
    image_url,
  } = product;

  const [timeLeft, setTimeLeft] = useState(() => calculateTimeRemaining(end_time));

  useEffect(() => {
    const updateTimer = () => {
      const newTimeLeft = calculateTimeRemaining(end_time);
      setTimeLeft(newTimeLeft);
    };

    updateTimer();
    const intervalId = setInterval(updateTimer, 1000);

    return () => clearInterval(intervalId);
  }, [end_time]);

  return (
    <Link to={`/product/${product.id}`}>
      <div className="border border-gray-200 rounded-md overflow-hidden shadow-sm flex flex-col transition-shadow hover:shadow-md h-full bg-white">
        <div className="relative w-full aspect-4/3 bg-gray-100 shrink-0">
          <img
            src={
              image_url ? `/api/assets/${image_url}` : 'https://placehold.co/600x400?text=No+Image'
            }
            alt={name}
            className="absolute inset-0 w-full h-full object-cover"
          />
          <p className="text-gray-500 text-[10px] absolute bottom-2 left-2 bg-white/90 rounded-md px-2 py-1 shadow-sm font-medium z-10">
            Bids: {bid_count}
          </p>
        </div>

        <div className="p-3 flex flex-col grow">
          <div className="h-10 mb-2">
            <h3 className="font-semibold text-gray-800 text-sm leading-5 line-clamp-2" title={name}>
              {name}
            </h3>
          </div>

          <div className="h-[52px] mb-3 flex flex-col justify-between">
            <div className="flex justify-between items-end">
              <span className="text-gray-600 text-xs">Current Price</span>
              <p className="font-bold text-[#8D0000] text-lg leading-none">
                {formatCurrency(current_price)}
              </p>
            </div>
            <p className="text-gray-400 text-xs">Posted: {formatDate(created_at)}</p>
          </div>

          <div className="h-[50px] bg-gray-50 p-2 rounded-md mb-2 flex flex-col justify-center">
            <span className="text-gray-500 text-xs block mb-1">Highest Bidder</span>
            <p className="font-medium text-gray-800 text-sm truncate">
              {highest_bidder_name || 'No bids yet'}
            </p>
          </div>

          <div className="mt-auto">
            <p className="text-red-600 font-semibold text-xs text-end mb-2 h-4">{timeLeft}</p>

            <button
              className="w-full bg-[#8D0000] text-white font-bold py-2 rounded text-sm hover:bg-red-900 transition-colors
                       disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed shadow-sm"
              disabled={!buy_now_price}
            >
              {buy_now_price ? `Buy Now: ${formatCurrency(buy_now_price)}` : 'Auction Only'}
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
});
