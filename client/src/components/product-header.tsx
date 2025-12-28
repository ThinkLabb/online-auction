import { Heart, Star, ThumbsUp, User } from 'lucide-react';
import { Product } from '../lib/type';
import { calculateTimeRemaining, calculateTimeRemainingForPosted, formatCurrency } from './product';

export const ProductHeaderInfo = ({ product }: { product: Product }) => (
  <>
    <h1 className="text-xl font-bold text-gray-900 mb-1">{product.title}</h1>
    <div className="flex justify-between text-xs text-gray-500 mb-6">
      <div>
        Posted: <br />
        <span className="text-gray-900 font-medium">
          {calculateTimeRemainingForPosted(product.postedDate)}
        </span>
      </div>
      <div className="text-right">
        Ends in: <br />
        <span className="text-gray-900 font-medium">{calculateTimeRemaining(product.endsIn)}</span>
      </div>
    </div>

    <div className="mb-6">
      <p className="text-sm text-gray-500">Current bid:</p>
      <div className="flex items-baseline gap-2 justify-between">
        <span className="text-3xl font-bold text-gray-900">
          {formatCurrency(product.currentBid.toString())}
        </span>
        <span className="text-sm text-gray-500">{product.bidsPlaced} bids placed</span>
      </div>
    </div>
  </>
);

export const UserCard = ({
  title,
  user,
  actionLabel,
}: {
  title: string;
  user: any;
  actionLabel?: string;
}) => (
  <div className="mb-4 last:mb-0">
    <h3 className="text-sm font-bold text-gray-900 mb-3">{title}</h3>
    <div className="flex items-center gap-3 mb-3">
      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-500">
        <User size={20} />
      </div>
      <div>
        <p className="text-sm font-bold text-gray-900">{user.name}</p>
        <div className="flex items-center text-xs text-yellow-500">
          <ThumbsUp size={12} fill="currentColor" className="mr-1" />
          <span className="font-medium text-gray-700 mr-1">{user.rating}</span>
          <span className="text-gray-400">({user.reviews} reviews)</span>
        </div>
      </div>
    </div>
    {actionLabel && (
      <button className="w-full border border-black text-black font-medium py-2 rounded-full hover:bg-gray-50 transition duration-200">
        {actionLabel}
      </button>
    )}
  </div>
);
