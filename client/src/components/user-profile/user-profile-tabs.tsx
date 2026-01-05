import { useEffect, useState, useMemo } from 'react';
import {
  Profile,
  BiddingProduct,
  WonProduct,
  FollowingProduct,
  Review,
  SellingProduct,
  SoldProduct,
} from './interfaces';
import { Loader2, ThumbsDown, ThumbsUp, Trash } from 'lucide-react';
import { calculateTimeRemaining, formatCurrency, formatDate } from '../product';
import { Link } from 'react-router-dom';
import { ClipLoader } from 'react-spinners';
import ReviewBox from './review';
import { OrderStatus, UserRole } from '@prisma/client';

function ImageContainer({
  product_id,
  product_name,
  url,
}: {
  product_id: string;
  product_name: string;
  url?: string;
}) {
  return (
    <Link
      to={`/product/${product_id}`}
      className="self-center hover:text-[#8D0000] cursor-pointer lg:w-50 w-full h-full"
    >
      <img
        src={product_name ? `/api/assets/${url}` : 'https://placehold.co/600x400?text=No+Image'}
        className="rounded-sm w-auto h-full object-contain"
      />
    </Link>
  );
}

function UserContainer({
  user_id,
  user_name,
  isLarge,
}: {
  user_id?: string;
  user_name: string;
  isLarge: boolean;
}) {
  if (!user_id)
    return <h2 className={`w-fit text-${isLarge ? 'lg' : 'base'} font-bold`}>No bidder yet</h2>;
  return (
    <div
      className={`w-fit text-${isLarge ? 'lg' : 'base'} font-bold`}
    >
      {user_name}
    </div>
  );
}

function ProductContainer({
  product_id,
  product_name,
  category,
}: {
  product_id: string;
  product_name: string;
  category: any;
}) {
  return (
    <div className="flex flex-col">
      <Link
        to={`/product/${product_id}`}
        className="w-fit hover:text-[#8D0000] cursor-pointer text-lg font-bold"
      >
        {product_name}
      </Link>
      <Link
        to={`/products/${category.category_name_level_1}/${category.category_name_level_2}`}
        className="text-md text-gray-400"
      >
        {`${category.category_name_level_1} > ${category.category_name_level_2}`}
      </Link>
    </div>
  );
}

function BiddingTab({ profile }: { profile: Profile }) {
  const [products, setProducts] = useState<BiddingProduct[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchBiddingProducts = async () => {
    try {
      setLoading(true);

      const res = await fetch('/api/profile/biddings', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await res.json();
      if (res.ok) setProducts(result.data);
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBiddingProducts();
  }, []);

  const leadingCount = useMemo(() => {
    return products.filter((p) => p.current_highest_bidder?.name === profile.name).length;
  }, [products, profile.name]);

  const totalCommitted = useMemo(() => {
    return products.reduce((acc, p) => {
      const isWinning = p.current_highest_bidder?.name === profile.name;
      if (isWinning) {
        return acc + (p.current_price || 0);
      }
      return acc;
    }, 0);
  }, [products, profile.name]);

  return loading ? (
    <div className="min-h-[50vh] w-full flex flex-col justify-center items-center">
      <ClipLoader size={50} color="#8D0000" />
    </div>
  ) : (
    <div className="flex flex-col gap-2 h-full">
      <p className="text-gray-500 font-medium ml-1 shrink-0">
        Bidding {products.length} product{products.length > 1 ? 's' : ''}
      </p>

      {products.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-2">
          <div className="bg-white p-3 rounded border border-gray-200 shadow-sm flex flex-col">
            <span className="text-xs text-gray-500 uppercase font-semibold">Active Bids</span>
            <span className="text-2xl font-bold text-gray-800">{products.length}</span>
          </div>

          <div className="bg-green-50 p-3 rounded border border-green-200 shadow-sm flex flex-col">
            <span className="text-xs text-green-700 uppercase font-semibold">Leading</span>
            <div className="flex items-end gap-2">
              <span className="text-2xl font-bold text-green-700">{leadingCount}</span>
              <span className="text-sm text-green-600 mb-1">
                ({((leadingCount / products.length) * 100).toFixed(2)}%)
              </span>
            </div>
          </div>

          <div className="bg-red-50 p-3 rounded border border-red-200 shadow-sm flex flex-col">
            <span className="text-xs text-red-700 uppercase font-semibold">Outbidded</span>
            <span className="text-2xl font-bold text-red-700">
              {products.length - leadingCount}
            </span>
          </div>

          <div className="bg-white p-3 rounded border border-gray-200 shadow-sm flex flex-col">
            <span className="text-xs text-gray-500 uppercase font-semibold">Total Committed</span>
            <span
              className="text-lg font-bold text-[#8D0000] truncate"
              title={formatCurrency(totalCommitted.toString())}
            >
              {formatCurrency(totalCommitted.toString())}
            </span>
          </div>
        </div>
      )}

      {products.length > 0 && (
        <div
          className="
          border rounded-md
          flex flex-col gap-4 max-h-[80vh] overflow-y-auto p-2
          scrollbar-custom
        "
        >
          {products.map((product, index) => {
            const isHighestBidder = product.current_highest_bidder?.user_id === profile.user_id;
            return (
              <div
                key={index}
                className={`
                  relative flex flex-col sm:flex-row p-4 gap-4 bg-white
                  rounded-md border shadow-sm transition-all duration-200
                  shrink-0
                  hover:shadow-md hover:border-black
                  ${isHighestBidder ? 'border-[#8D0000] border-2 bg-red-50/30' : 'border-gray-200'}
                `}
              >
                <div className="flex sm:hidden justify-between items-center pb-2 border-b border-gray-100 mb-2">
                  <UserContainer
                    user_id={product.seller.user_id}
                    user_name={product.seller.name}
                    isLarge={false}
                  />
                  <span className="text-xs font-bold px-2 py-1 bg-gray-100 rounded text-gray-600">
                    {product.status?.toString().toUpperCase()}
                  </span>
                </div>

                <div className="shrink-0 w-full sm:w-32 md:w-40 aspect-square bg-gray-50 rounded overflow-hidden border border-gray-100 self-center sm:self-start">
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageContainer
                      product_id={product.product_id}
                      product_name={product.name}
                      url={product.thumbnail_url}
                    />
                  </div>
                </div>

                <div className="flex-grow flex flex-col min-w-0 gap-2">
                  <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-2">
                    <div className="flex flex-col">
                      <ProductContainer
                        product_id={product.product_id}
                        product_name={product.name}
                        category={product.category}
                      />
                      <div className="hidden sm:flex mt-1 scale-90 origin-top-left">
                        <span className="mr-2 text-gray-400 text-sm">Seller:</span>
                        <UserContainer
                          user_id={product.seller.user_id}
                          user_name={product.seller.name}
                          isLarge={false}
                        />
                      </div>
                    </div>
                    <div className="hidden sm:block text-right">
                      <span
                        className={`inline-block text-xs font-bold px-2 py-1 rounded border ${
                          product.status === 'open'
                            ? 'bg-green-100 text-green-700 border-green-200'
                            : 'bg-gray-100 text-gray-500 border-gray-200'
                        }`}
                      >
                        {product.status?.toString().toUpperCase()}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-3 mt-2 pt-3 border-t border-gray-100 text-sm">
                    <div className="flex flex-col gap-1">
                      <div className="flex justify-between sm:justify-start sm:gap-2">
                        <span className="text-gray-500">End time:</span>
                        <span className="font-medium text-[#8D0000]">
                          {calculateTimeRemaining(product.end_time)}
                        </span>
                      </div>
                      <div className="flex justify-between sm:justify-start sm:gap-2">
                        <span className="text-gray-500">Bid at:</span>
                        <span>{formatDate(product.bid_at)}</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <div className="flex justify-between sm:justify-start sm:gap-2">
                        <span className="text-gray-500">Current Price:</span>
                        <span className="font-bold">
                          {formatCurrency(product.current_price?.toString())}
                        </span>
                      </div>
                      {product.buy_now_price && (
                        <div className="flex justify-between sm:justify-start sm:gap-2">
                          <span className="text-gray-500">Buy Now:</span>
                          <span className="font-medium text-gray-400 decoration-gray-400">
                            {formatCurrency(product.buy_now_price?.toString())}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between sm:justify-start sm:gap-2">
                        <span className="text-gray-500">My Bid:</span>
                        <span className="font-bold text-blue-600">
                          {formatCurrency(product.bid_amount?.toString())}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1 sm:col-span-2 lg:col-span-1 lg:items-end lg:text-right">
                      <div className="flex justify-between lg:justify-end gap-2 items-center">
                        <span className="text-gray-500">Highest:</span>
                        <div className="scale-90 origin-right min-w-0">
                          <UserContainer
                            user_id={product.current_highest_bidder?.user_id}
                            user_name={product.current_highest_bidder?.name ?? 'None'}
                            isLarge={false}
                          />
                        </div>
                      </div>
                      <div className="flex justify-between lg:justify-end gap-4 text-xs text-gray-400 mt-auto">
                        <span>{product.bid_count ?? 0} bids</span>
                        <span>{product.reviews_count ?? 0} reviews</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function WonTab({ profile }: { profile: Profile }) {
  const [products, setProducts] = useState<WonProduct[]>([]);
  const [biddedCount, setBiddedCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const fetchWonProducts = async () => {
    try {
      const res = await fetch('/api/profile/won-products', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await res.json();
      if (res.ok) setProducts(result.data);
    } catch (e) {
      console.log(e);
    }
  };

  const fetchBiddedProducts = async () => {
    try {
      const res = await fetch('/api/profile/biddeds', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await res.json();
      if (res.ok) setBiddedCount(result.data.count);
    } catch (e) {
      console.log(e);
    }
  };

  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true);
      
      try {
        await Promise.all([
          fetchBiddedProducts(),
          fetchWonProducts()
        ]);
      } catch (error) {
        console.error("Lỗi khi tải dữ liệu:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, []);

  return loading ? (
    <div className="min-h-[50vh] w-full flex flex-col justify-center items-center">
      <ClipLoader size={50} color="#8D0000" />
    </div>
  ) : (
    <div className="flex flex-col gap-2 h-full">
      <p className="text-gray-500 font-medium ml-1 shrink-0">
        Won {products.length} product{products.length > 1 ? 's' : ''}
      </p>

      {biddedCount > 0 && products.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-2">
          <div className="bg-white p-3 rounded border border-gray-200 shadow-sm flex flex-col">
            <span className="text-xs text-gray-500 uppercase font-semibold">Total</span>
            <span className="text-2xl font-bold text-gray-800">{biddedCount}</span>
          </div>

          <div className="bg-green-50 p-3 rounded border border-green-200 shadow-sm flex flex-col">
            <span className="text-xs text-green-700 uppercase font-semibold">Won</span>
            <div className="flex items-end gap-2">
              <span className="text-2xl font-bold text-green-700">{products.length}</span>
              <span className="text-sm text-green-600 mb-1">
                ({((products.length / biddedCount) * 100).toFixed(2)}%)
              </span>
            </div>
          </div>
        </div>
      )}

      {products.length > 0 && (
        <div
          className="
          border rounded-md
          flex flex-col gap-4 max-h-[80vh] overflow-y-auto p-2
          scrollbar-custom
        "
        >
          {products.map((product, index) => {
            return (
              <div
                key={index}
                className={`
                  relative flex flex-col p-4 gap-4 bg-white
                  rounded-md border border-gray-200 shadow-sm transition-all duration-200
                  shrink-0
                  hover:shadow-md hover:border-black
                `}
              >
                <div className="flex sm:hidden justify-between items-center pb-2 border-b border-gray-100 mb-2">
                  <UserContainer
                    user_id={product.seller.user_id}
                    user_name={product.seller.name}
                    isLarge={false}
                  />
                  <span
                    className={`text-xs font-bold px-2 py-1 rounded border ${
                      product.order.status === 'completed'
                        ? 'bg-green-100 text-green-700 border-green-200'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {product.order.status.toString().toUpperCase()}
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="shrink-0 w-full sm:w-32 md:w-40 aspect-square bg-gray-50 rounded overflow-hidden border border-gray-100 self-center sm:self-start">
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageContainer
                        product_id={product.product_id}
                        product_name={product.name}
                        url={product.thumbnail_url}
                      />
                    </div>
                  </div>

                  <div className="flex-grow flex flex-col min-w-0 gap-2">
                    <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-2">
                      <div className="flex flex-col">
                        <ProductContainer
                          product_id={product.product_id}
                          product_name={product.name}
                          category={product.category}
                        />
                        <div className="hidden sm:flex mt-1 scale-90 origin-top-left">
                          <span className="mr-2 text-gray-400 text-sm">Seller:</span>
                          <UserContainer
                            user_id={product.seller.user_id}
                            user_name={product.seller.name}
                            isLarge={false}
                          />
                        </div>
                      </div>
                      <div className="hidden sm:block text-right">
                        <span
                          className={`inline-block text-xs font-bold px-2 py-1 rounded border ${
                            product.order.status === 'completed'
                              ? 'bg-green-100 text-green-700 border-green-200'
                              : 'bg-gray-100 text-gray-500 border-gray-200'
                          }`}
                        >
                          {product.order.status.toString().toUpperCase()}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 mt-2 pt-3 border-t border-gray-100 text-sm">
                      <div className="flex flex-col gap-1">
                        <div className="flex justify-between sm:justify-start sm:gap-2">
                          <span className="text-gray-500">Ended at:</span>
                          <span>{formatDate(product.end_time)}</span>
                        </div>
                        <div className="flex justify-between sm:justify-start sm:gap-2">
                          <span className="text-gray-500">Created at:</span>
                          <span>{formatDate(product.order.created_at)}</span>
                        </div>
                      </div>

                      <div className="flex flex-col gap-1">
                        <div className="flex justify-between sm:justify-start sm:gap-2">
                          <span className="text-gray-500">Final Price:</span>
                          <span className="font-bold text-[#8D0000]">
                            {formatCurrency(product.order.final_price?.toString())}
                          </span>
                        </div>
                        <div className="flex justify-between sm:justify-start sm:gap-2">
                          <span className="text-gray-500">Bids:</span>
                          <span className="font-medium">{product.bid_count?.toString() ?? 0}</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-2 pt-2 border-t border-dashed border-gray-200">
                      <ReviewBox
                        order_id={product.order.order_id}
                        review={product.review}
                        role={profile.role}
                        orderStatus={product.order.status}
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function WatchlistTab({ profile }: { profile: Profile }) {
  const [watchlist, setWatchlist] = useState<FollowingProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<number | bigint | string | null>(null);

  const fetchWatchlist = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/profile/watchlist', {
        method: 'GET',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });
      const result = await res.json();
      if (res.ok) setWatchlist(result.data);
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWatchlist();
  }, []);

  const handleRemoveFromWatchlist = async (productID: number | bigint | string) => {
    if (!window.confirm('Confirm to delete this product from watchlist?')) return;
    setDeletingId(productID);

    try {
      const res = await fetch(`/api/watch-list/${productID}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });

      if (res.ok) {
        setWatchlist((prev) => prev.filter((item) => item.product_id !== productID));
      } else {
        const errorData = await res.json();
        alert(errorData.message || "Can't remove product from watchlist");
      }
    } catch (e: any) {
      console.log(e.message);
    } finally {
      setDeletingId(null);
    }
  };

  return loading ? (
    <div className="min-h-[50vh] w-full flex flex-col justify-center items-center">
      <ClipLoader size={50} color="#8D0000" />
    </div>
  ) : (
    <div className="flex flex-col gap-2 h-full">
      <p className="text-gray-500 font-medium ml-1 shrink-0">
        Following {watchlist.length} product{watchlist.length > 1 ? 's' : ''}
      </p>

      {watchlist.length > 0 && (
        <div
          className="
          border rounded-md
          flex flex-col gap-4 max-h-[80vh] overflow-y-auto p-2
          scrollbar-custom
        "
        >
          {watchlist.map((product, index) => {
            const isHighestBidder = product.current_highest_bidder?.name === profile.name;
            const isItemDeleting = deletingId === product.product_id;

            return (
              <div
                key={index}
                className={`
                  relative flex flex-col sm:flex-row p-4 gap-4 bg-white
                  rounded-md border shadow-sm transition-all duration-200
                  shrink-0
                  hover:shadow-md hover:border-black
                  ${isHighestBidder ? 'border-[#8D0000] border-2 bg-red-50/30' : 'border-gray-200'}
                `}
              >
                <div className="flex sm:hidden justify-between items-center pb-2 border-b border-gray-100 mb-2">
                  <UserContainer
                    user_id={product.seller.user_id}
                    user_name={product.seller.name}
                    isLarge={false}
                  />
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      handleRemoveFromWatchlist(product.product_id);
                    }}
                    disabled={isItemDeleting}
                    className="p-1.5 rounded-full bg-gray-50 hover:bg-red-50 transition-colors"
                  >
                    {isItemDeleting ? (
                      <Loader2 className="animate-spin text-gray-400 w-4 h-4" />
                    ) : (
                      <Trash className="text-gray-400 hover:text-red-600 w-4 h-4" />
                    )}
                  </button>
                </div>

                <div className="shrink-0 w-full sm:w-32 md:w-40 aspect-square bg-gray-50 rounded overflow-hidden border border-gray-100 self-center sm:self-start">
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageContainer
                      product_id={product.product_id}
                      product_name={product.name}
                      url={product.thumbnail_url}
                    />
                  </div>
                </div>

                <div className="flex-grow flex flex-col min-w-0 gap-2">
                  <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-2">
                    <div className="flex flex-col pr-8">
                      {' '}
                      <ProductContainer
                        product_id={product.product_id}
                        product_name={product.name}
                        category={product.category}
                      />
                      <div className="hidden sm:flex mt-1 scale-90 origin-top-left items-center">
                        <span className="mr-2 text-gray-400 text-sm">Seller:</span>
                        <UserContainer
                          user_id={product.seller.user_id}
                          user_name={product.seller.name}
                          isLarge={false}
                        />
                      </div>
                    </div>

                    <div className="hidden sm:block absolute top-4 right-4">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          handleRemoveFromWatchlist(product.product_id);
                        }}
                        disabled={isItemDeleting}
                        className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                        title="Remove from watchlist"
                      >
                        {isItemDeleting ? (
                          <Loader2 className="animate-spin text-gray-400 w-5 h-5" />
                        ) : (
                          <Trash className="text-gray-400 hover:text-[#8D0000] w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-3 mt-2 pt-3 border-t border-gray-100 text-sm">
                    <div className="flex flex-col gap-1">
                      <div className="flex justify-between sm:justify-start sm:gap-2">
                        <span className="text-gray-500">End time:</span>
                        <span className="font-medium text-[#8D0000]">
                          {calculateTimeRemaining(product.end_time)}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1">
                      <div className="flex justify-between sm:justify-start sm:gap-2">
                        <span className="text-gray-500">Current Price:</span>
                        <span className="font-bold">
                          {formatCurrency(product.current_price?.toString())}
                        </span>
                      </div>
                      <div className="flex justify-between sm:justify-start sm:gap-2">
                        <span className="text-gray-500">Buy Now:</span>
                        <span className="font-medium text-gray-600">
                          {formatCurrency(product.buy_now_price?.toString())}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1 sm:col-span-2 lg:col-span-1 lg:items-end lg:text-right">
                      <div className="flex justify-between lg:justify-end gap-2 items-center">
                        <span className="text-gray-500">Highest:</span>
                        <div className="scale-90 origin-right min-w-0">
                          <UserContainer
                            user_id={product.current_highest_bidder?.user_id}
                            user_name={product.current_highest_bidder?.name ?? 'None'}
                            isLarge={false}
                          />
                        </div>
                      </div>
                      <div className="flex justify-between lg:justify-end gap-4 text-xs text-gray-400 mt-auto">
                        <span>{product.bid_count ?? 0} bids</span>
                        <span
                          className={`font-bold ${product.status === 'open' ? 'text-green-600' : 'text-gray-500'}`}
                        >
                          {product.status?.toString().toUpperCase()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ReviewsTab() {
  const [loading, setLoading] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/profile/reviews`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await res.json();
      if (res.ok) setReviews(result.data);
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const positiveCount = useMemo(() => reviews.filter(review => review.is_positive).length, [reviews]);
  const negativeCount = reviews.length - positiveCount;
  const percent = (positiveCount / reviews.length) * 100;

  return loading ? (
    <div className="min-h-[50vh] w-full flex flex-col justify-center items-center">
      <ClipLoader size={50} color="#8D0000" />
    </div>
  ) : (
    <div className="flex flex-col gap-2 h-full">
      {/* Header Count */}
      <p className="text-gray-500 font-medium ml-1 shrink-0">
        Received {reviews.length} review{reviews.length > 1 ? 's' : ''}
      </p>

      {reviews.length > 0 &&
        (() => {
          const isHighRating = percent >= 80;
          const ratingColorClass = isHighRating
            ? 'bg-blue-50 border-blue-200 text-blue-700'
            : 'bg-yellow-50 border-yellow-200 text-yellow-700';

          return (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-2">
              <div className="bg-green-50 p-3 rounded border border-green-200 shadow-sm flex flex-col">
                <span className="text-xs text-green-700 uppercase font-semibold">Positive</span>
                <span className="text-2xl font-bold text-green-700">{positiveCount}</span>
              </div>

              <div className="bg-red-50 p-3 rounded border border-red-200 shadow-sm flex flex-col">
                <span className="text-xs text-red-700 uppercase font-semibold">Negative</span>
                <span className="text-2xl font-bold text-red-700">{negativeCount}</span>
              </div>

              <div
                className={`p-3 rounded border shadow-sm flex flex-col col-span-2 md:col-span-1 ${ratingColorClass}`}
              >
                <span className="text-xs uppercase font-semibold">Rating</span>
                <div className="flex items-end gap-1">
                  <span className="text-2xl font-bold">{percent.toFixed(2)}%</span>
                  <span className="text-xs mb-1 opacity-80 font-medium">
                    {isHighRating ? 'Good' : 'Bad'}
                  </span>
                </div>
              </div>
            </div>
          );
        })()}
      {reviews.length > 0 && (
        <div
          className="
          border rounded-md
          flex flex-col gap-4 max-h-[80vh] overflow-y-auto p-2
          scrollbar-custom
        "
        >
          {reviews.map((review, index) => {
            return (
              <div
                key={index}
                className="
                  relative flex flex-col sm:flex-row p-4 gap-4 bg-white
                  rounded-md border border-gray-200 shadow-sm transition-all duration-200
                  shrink-0
                  hover:shadow-md hover:border-black
                "
              >
                <div className="flex sm:hidden justify-between items-center pb-2 border-b border-gray-100 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">From:</span>
                    <UserContainer
                      user_id={review.reviewer.user_id}
                      user_name={review.reviewer.name}
                      isLarge={false}
                    />
                  </div>
                  <span className="text-xs text-gray-400">{formatDate(review.created_at)}</span>
                </div>

                <div className="shrink-0 w-full sm:w-24 md:w-32 aspect-square bg-gray-50 rounded overflow-hidden border border-gray-100 self-center sm:self-start">
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageContainer
                      product_id={review.product.product_id}
                      product_name={review.product.product_name}
                      url={review.product.thumbnail_url}
                    />
                  </div>
                </div>

                <div className="flex-grow flex flex-col min-w-0 gap-2">
                  <div className="flex flex-col justify-between items-start gap-1">
                    <div className="flex justify-between w-full">
                      <ProductContainer
                        product_id={review.product.product_id}
                        product_name={review.product.product_name}
                        category={review.product.category}
                      />
                      <span className="hidden sm:block text-xs text-gray-400 shrink-0 mt-1">
                        {formatDate(review.created_at)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 mt-1">
                    <div className="hidden sm:flex items-center gap-2 text-sm">
                      <span className="text-gray-500">From:</span>
                      <UserContainer
                        user_id={review.reviewer.user_id}
                        user_name={review.reviewer.name}
                        isLarge={false}
                      />
                    </div>

                    <div
                      className={`
                      flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold border
                      ${
                        review.is_positive
                          ? 'bg-green-50 text-green-700 border-green-200'
                          : 'bg-red-50 text-red-700 border-red-200'
                      }
                    `}
                    >
                      {review.is_positive ? (
                        <ThumbsUp className="w-3.5 h-3.5" fill="currentColor" stroke="none" />
                      ) : (
                        <ThumbsDown className="w-3.5 h-3.5" fill="currentColor" stroke="none" />
                      )}
                    </div>
                  </div>

                  {review.comment && (
                    <div className="mt-2 p-3 bg-gray-50 rounded border border-gray-100 text-sm text-gray-700 italic relative">
                      <span
                        className="absolute top-2 left-2 text-gray-300 text-4xl leading-none select-none"
                        aria-hidden="true"
                      >
                        &ldquo;
                      </span>
                      <p className="pl-4 relative z-10 whitespace-pre-wrap">{review.comment}</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function SellingsTab() {
  const [products, setProducts] = useState<SellingProduct[]>([]);
  const [loading, setLoading] = useState(false);

  const fetch_products = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/profile/sellings', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await res.json();

      if (res.ok) setProducts(result.data || result);
      else console.error("Can't load products: ", result.mesage);
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetch_products();
  }, []);
  return loading ? (
    <div className="min-h-[50vh] w-full flex flex-col justify-center items-center">
      <ClipLoader size={50} color="#8D0000" />
    </div>
  ) : (
    <div className="flex flex-col gap-2 h-full">
      <p className="text-gray-500 font-medium ml-1 shrink-0">
        Selling {products.length} product{products.length > 1 ? 's' : ''}
      </p>

      {products.length > 0 && (
        <div
          className="
          border rounded-md
          flex flex-col gap-4 max-h-[80vh] overflow-y-auto p-2
          scrollbar-custom
        "
        >
          {products.map((product, index) => {
            return (
              <div
                key={index}
                className="
                  relative flex flex-col sm:flex-row p-4 gap-4 bg-white
                  rounded-md border border-gray-200 shadow-sm transition-all duration-200
                  shrink-0
                  hover:shadow-md hover:border-black
                "
              >
                <div className="flex sm:hidden justify-between items-center pb-2 border-b border-gray-100 mb-2">
                  <span className="text-xs text-gray-500">
                    Posted: {formatDate(product.created_at)}
                  </span>
                  {product.auto_extend && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded border border-blue-200">
                      Auto-extend
                    </span>
                  )}
                </div>

                <div className="shrink-0 w-full sm:w-32 md:w-40 aspect-square bg-gray-50 rounded overflow-hidden border border-gray-100 self-center sm:self-start">
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageContainer
                      product_id={product.product_id}
                      product_name={product.name}
                      url={product.thumbnail_url}
                    />
                  </div>
                </div>

                <div className="flex-grow flex flex-col min-w-0 gap-2">
                  <div className="flex flex justify-between">
                    <ProductContainer
                      product_id={product.product_id}
                      product_name={product.name}
                      category={product.category}
                    />
                    {product.auto_extend && (
                      <span className="hidden sm:block text-[10px] font-bold px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full h-fit border border-blue-200 shrink-0 ml-2">
                        Auto-extend
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-3 mt-2 pt-3 border-t border-gray-100 text-sm">
                    <div className="flex flex-col gap-1">
                      <div className="flex justify-between sm:justify-start sm:gap-2 truncate">
                        <span className="text-gray-500">End time:</span>
                        <span className="font-medium text-[#8D0000] truncated">
                          {calculateTimeRemaining(product.end_time)}
                        </span>
                      </div>
                      <div className="hidden sm:flex justify-between sm:justify-start sm:gap-2 truncate">
                        <span className="text-gray-500">Posted:</span>
                        <span>{formatDate(product.created_at)}</span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1">
                      <div className="flex justify-between sm:justify-start sm:gap-2">
                        <span className="text-gray-500">Current:</span>
                        <span className="font-bold">
                          {formatCurrency(product.current_price?.toString())}
                        </span>
                      </div>
                      <div className="flex justify-between sm:justify-start sm:gap-2">
                        <span className="text-gray-500">Start:</span>
                        <span className="font-bold">
                          {formatCurrency(product.start_price?.toString())}
                        </span>
                      </div>
                      {product.buy_now_price && (
                        <div className="flex justify-between sm:justify-start sm:gap-2">
                          <span className="text-gray-500">Buy Now:</span>
                          <span className="font-bold">
                            {formatCurrency(product.buy_now_price?.toString())}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-1 sm:col-span-2 lg:col-span-1 lg:items-end lg:text-right">
                      <div className="flex justify-between lg:justify-end gap-2 items-center">
                        <span className="text-gray-500">Highest Bidder:</span>
                        <div className="scale-90 origin-right min-w-0">
                          <UserContainer
                            user_id={product.highest_bidder?.user_id}
                            user_name={product.highest_bidder?.name ?? 'No bidder yet'}
                            isLarge={false}
                          />
                        </div>
                      </div>
                      <div className="flex justify-between lg:justify-end gap-4 text-xs text-gray-400 mt-auto">
                        <span>{product.bid_count ?? 0} bids</span>
                        <span>{product.reviews_count ?? 0} reviews</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ProductsWithWinnerTab({ profile }: { profile: Profile }) {
  const [products, setProducts] = useState<SoldProduct[]>([]);
  const [loading, setLoading] = useState(false);

  const fetch_products = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/profile/solds', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await res.json();

      if (res.ok) setProducts(result.data || result);
      else console.error("Can't load products: ", result.mesage);
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetch_products();
  }, []);

  const handleOrderCancelled = (productId: string) => {
    setProducts((currentProducts) =>
      currentProducts.map((product) => {
        // Tìm sản phẩm có id trùng khớp
        if (product.product_id === productId && product.order) {
          return {
            ...product,
            order: {
              ...product.order,
              order_status: 'cancelled' as OrderStatus,
            },
          };
        }
        return product;
      })
    );
  };

  return loading ? (
    <div className="min-h-[50vh] w-full flex flex-col justify-center items-center">
      <ClipLoader size={50} color="#8D0000" />
    </div>
  ) : (
    <div className="flex flex-col gap-2 h-full">
      <p className="text-gray-500 font-medium ml-1 shrink-0">
        Sold {products.length} product{products.length > 1 ? 's' : ''}
      </p>

      {products.length > 0 && (
        <div
          className="
          border rounded-md
          flex flex-col gap-4 max-h-[80vh] overflow-y-auto p-2
          scrollbar-custom
        "
        >
          {products.map((product, index) => {
            const orderStatus = product.order?.order_status || 'unknown';

            const getStatusColor = (status: string) => {
              switch (status) {
                case 'completed':
                  return 'bg-green-100 text-green-700 border-green-200';
                case 'pending_payment':
                  return 'bg-yellow-100 text-yellow-700 border-yellow-200';
                case 'cancelled':
                  return 'bg-red-100 text-red-700 border-red-200';
                default:
                  return 'bg-gray-100 text-gray-600 border-gray-200';
              }
            };

            return (
              <div
                key={index}
                className="
                  relative flex flex-col p-4 gap-4 bg-white
                  rounded-md border border-gray-200 shadow-sm transition-all duration-200
                  shrink-0
                  hover:shadow-md hover:border-black
                "
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-500">Buyer:</span>
                  <div className="scale-100 origin-left">
                    <UserContainer
                      user_id={product.order?.buyer.user_id}
                      user_name={product.order?.buyer.name ?? 'Unknown'}
                      isLarge={false}
                    />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="shrink-0 w-full sm:w-32 md:w-40 aspect-square bg-gray-50 rounded overflow-hidden border border-gray-100 self-center sm:self-start">
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageContainer
                        product_id={product.product_id}
                        product_name={product.name}
                        url={product.thumbnail_url}
                      />
                    </div>
                  </div>

                  <div className="flex-grow flex flex-col min-w-0 gap-2">
                    <div className="flex justify-between">
                      <ProductContainer
                        product_id={product.product_id}
                        product_name={product.name}
                        category={product.category}
                      />

                      <div className="flex flex-col text-xs items-end text-gray-400 shrink-0">
                        <span className="">Ended: {product.end_time}</span>
                        <span className="">{product.bid_count ?? 0} bids</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 mt-2 pt-3 border-t border-gray-100 text-sm">
                      <div className="flex flex-col gap-1 text-sm text-gray-500">
                        <div className="flex justify-between sm:justify-start sm:gap-2">
                          <span>Created:</span>
                          <span className="text-black">
                            {formatDate(product.order?.created_at)}
                          </span>
                        </div>
                        <div className="flex justify-between sm:justify-start sm:gap-2">
                          <span>Updated:</span>
                          <span className="text-black">
                            {formatDate(product.order?.updated_at)}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2">
                        <div className="flex justify-between sm:justify-start sm:gap-2">
                          <span className="text-gray-500">Final Price:</span>
                          <span className="font-bold text-[#8D0000]">
                            {formatCurrency(product.current_price?.toString())}
                          </span>
                        </div>
                        <div className="flex justify-between sm:justify-start sm:items-center sm:gap-2">
                          <span className="text-gray-500">Status:</span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getStatusColor(orderStatus)}`}
                          >
                            {orderStatus.toUpperCase()}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-1 pt-3 flex flex-col border-t border-gray-200">
                      <ReviewBox
                        order_id={product.order?.order_id || ''}
                        review={product.order?.my_review || null}
                        role={profile.role}
                        orderStatus={product.order?.order_status || 'completed'}
                        onCancelSuccess={() => handleOrderCancelled(product.product_id)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function UserTab({ profile }: { profile: Profile }) {
  const tabs = ['Bidding', 'Won Products', 'Watchlist', 'Ratings', 'My products', 'Sold Products'];
  const filteredTabs = tabs.filter(
    (tab) => !(profile.role === 'bidder' && (tab === 'My products' || tab === 'Sold Products'))
  );
  const [activeTab, setActiveTab] = useState('bidding');

  const renderTab = () => {
    switch (activeTab) {
      case 'bidding':
        return <BiddingTab profile={profile} />;
      case 'won-products':
        return <WonTab profile={profile} />;
      case 'watchlist':
        return <WatchlistTab profile={profile} />;
      case 'ratings':
        return <ReviewsTab />;
      case 'my-products':
        return <SellingsTab />;
      case 'sold-products':
        return <ProductsWithWinnerTab profile={profile} />;
      default:
        return <h1 className="text-lg text-red-500">Invalid Tab!</h1>;
    }
  };

  return (
    <div>
      <div className="flex flex-row overflow-x-auto whitespace-nowrap scrollbar-custom py-3 mb-2">
        {filteredTabs.map((tab) => {
          const tabID = tab.toLowerCase().replace(' ', '-');
          const isActive = activeTab === tabID;

          return (
            <h2
              key={tab}
              onClick={() => setActiveTab(tabID)}
              className={`
                cursor-pointer text-base pb-2 px-4 transition-all duration-100 flex-shrink-0 border-b border-gray-200
                ${
                  isActive
                    ? 'border-b-[#8D0000] text-[#8D0000] font-medium border-b-2'
                    : 'border-gray-300 hover:text-gray-800 hover:font-medium hover:border-b-2 hover:border-gray-500'
                }
              `}
            >
              {tab}
            </h2>
          );
        })}
      </div>

      <div className="px-4">{renderTab()}</div>
    </div>
  );
}
