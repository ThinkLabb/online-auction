import { Product } from '../lib/type';
import { ProductHeaderInfo, UserCard } from './product-header';
import BidHistory from './seller-bid-history';

export const SellerSidebar = ({ product, onBidSuccess }: { product: Product; onBidSuccess: () => void }) => {
  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <ProductHeaderInfo product={product} />
        <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-2 rounded-md text-sm font-medium mb-4 text-center">
          You are the seller of this item
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <UserCard title="Current Top Bidder" user={product.topBidder} />
      </div>

      <BidHistory id={product.id} onBidSuccess={onBidSuccess} />
    </div>
  );
};
