import { Product } from '../lib/type';
import { formatCurrency } from './product';
import { ProductHeaderInfo, UserCard } from './product-header';
import BidHistory from './seller-bid-history';

export const SellerSidebar = ({
  product,
  onBidSuccess,
}: {
  product: Product;
  onBidSuccess: () => void;
}) => {
  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <ProductHeaderInfo product={product} />

        {/* Buy Now Price Section */}
        {product.buyNowPrice ? (
          <div className="mt-6 mb-4">
            <div className="flex justify-between items-baseline border-b border-gray-100 pb-2 mb-2">
              <span className="text-sm text-gray-500 font-medium">Buy Now Price</span>
              <span className="text-xl font-bold text-[#8D0000]">
                {formatCurrency(product.buyNowPrice.toString())}
              </span>
            </div>
          </div>
        ) : (
          /* Optional: Show if no Buy Now price was set */
          <div className="mt-6 mb-4 text-sm text-gray-400 italic text-center">
            No "Buy Now" price set
          </div>
        )}

        <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-2 rounded-md text-sm font-medium text-center">
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
