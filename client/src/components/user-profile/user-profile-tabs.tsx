import { useEffect, useState } from 'react';
import { ProfileData, ProductItem } from './types';
import { SetTab } from './types';
import { Loader2, ThumbsDown, ThumbsUp, Trash } from 'lucide-react';
import { calculateTimeRemaining, formatCurrency, formatDate } from '../product';
import { Link } from 'react-router-dom';
import { ClipLoader } from 'react-spinners';

function BiddingTab({ profile }: { profile: ProfileData }) {
  return (
    <div className="flex flex-col gap-5">
      <p className="text-gray-500">
        Bidding {profile.bidding_products.length} product
        {profile.bidding_products.length > 1 ? 's' : ''}
      </p>
      {profile.bidding_products.map((product, index) => {
        return (
          <div
            key={index}
            className="
              hover:scale-101 transition duration-150 ease-in-out
              flex bg-white flex-row p-5 gap-5
              rounded-sm ring ring-gray-200 shadow-sm shadow-black-300
            "
          >
            <Link
              to={`/product/${product.product_id}`}
              className="hover:text-[#8D0000] cursor-pointer w-50 h-full"
            >
              <img
                src={`/api/assets/${product.image_url}`}
                className="rounded-sm w-auto h-full object-contain"
              />
            </Link>
            <div className="flex flex-col gap-5 flex-grow">
              <div className="flex flex-row gap-5 justify-between">
                <div>
                  <Link
                    to={`/product/${product.product_id}`}
                    className="hover:text-[#8D0000] cursor-pointer text-2xl font-bold"
                  >
                    {product.name}
                  </Link>
                  <div className="text-md text-gray-400">{product.category_name}</div>
                </div>
                <div className="flex flex-col place-items-end">
                  <Trash />
                  <div className="font-medium text-[#8D0000]">
                    {calculateTimeRemaining(product.end_time)}
                  </div>
                </div>
              </div>
              <div className="flex flex-row gap-5">
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-lg">{product.seller_name}</div>
                  <div>Bid counts: {product.bid_count}</div>
                </div>
                <div className="flex-2 min-w-0">
                  <label className="font-medium text-lg">Highest bidder</label>
                  <div className="font-medium text-xl text-[#8D0000] mb-2">
                    {product.current_highest_bidder_name}
                  </div>
                  <label className="font-medium">My price</label>
                  <div>{formatCurrency(product.max_bid?.toString())}</div>
                </div>
                <div className="flex-1 min-w-0">
                  <label className="font-medium">Buy now price:</label>
                  <div>{formatCurrency(product.buy_now_price?.toString())}</div>
                  <label className="font-medium">Current price:</label>
                  <div>{formatCurrency(product.current_price.toString())}</div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function WonTab({ profile }: { profile: ProfileData }) {
  return (
    <div className="flex flex-col gap-5 hover:scale-101">
      <p className="text-gray-500">
        Won {profile.won_products.length} product{profile.won_products.length > 1 ? 's' : ''}
      </p>
      {profile.won_products.map((product, index) => {
        return (
          <div
            key={index}
            className="
              hover:scale-101 transition duration-150 ease-in-out
              flex bg-white flex-row p-5 gap-5
              rounded-sm ring ring-gray-200 shadow-sm shadow-black-300
            "
          >
            <Link
              to={`/product/${product.product_id}`}
              className="hover:text-[#8D0000] cursor-pointer w-50 h-full"
            >
              <img
                src={`/api/assets/${product.image_url}`}
                className="rounded-sm w-auto h-full object-contain"
              />
            </Link>
            <div className="flex flex-col gap-5 flex-grow">
              <div>
                <Link
                  to={`/product/${product.product_id}`}
                  className="hover:text-[#8D0000] cursor-pointer text-2xl font-bold"
                >
                  {product.name}
                </Link>
                <div className="text-md text-gray-400">{product.category_name}</div>
              </div>
              <div className="flex flex-row gap-5">
                <div className="flex-1 min-w-0">
                  <div className="flex-1 font-medium text-lg">{product.seller_name}</div>
                  <label className="font-medium ">Won price</label>
                  <div className="font-medium text-xl text-[#8D0000] mb-2">
                    {formatCurrency(product.final_price.toString())}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <label className="font-medium">Order Status</label>
                  <div>{product.order_status?.toString()}</div>
                  <label className="font-medium">Won date:</label>
                  <div>{formatDate(product.won_at)}</div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function WatchlistTab({ profile }: { profile: ProfileData }) {
  const [localWatchlist, setLocalWatchlist] = useState(profile.watchlist);
  const [deletingId, setDeletingId] = useState<number | bigint | string | null>(null);
  useEffect(() => {
    setLocalWatchlist(profile.watchlist);
  }, [profile.watchlist]);

  const handleRemoveFromWatchlist = async (producID: number | bigint | string) => {
    if (!window.confirm('Confirm to delete this product from watchlist?')) return;
    setDeletingId(producID);

    try {
      const res = await fetch(`/api/watch-list/${producID}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (res.ok) {
        // Xóa thành công -> Cập nhật state để loại bỏ item khỏi giao diện ngay lập tức
        setLocalWatchlist((prev) => prev.filter((item) => item.product_id !== producID));
        profile.watchlist_count -= 1;
      } else {
        const errorData = await res.json();
        alert(errorData.message || "Can't remove product from watchlist");
      }
    } catch (e: any) {
      console.log(e.mesage);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <p className="text-gray-500">
        Following {profile.watchlist.length} product{profile.watchlist.length > 1 ? 's' : ''}
      </p>

      {localWatchlist.length === 0 && (
        <div className="text-center py-10 text-gray-400">You haven't follow any product yet.</div>
      )}

      {localWatchlist.map((product, index) => {
        const isDeleting = deletingId === product.product_id;
        return (
          <div
            key={index}
            className="
              hover:scale-101 transition duration-150 ease-in-out
              flex bg-white flex-row p-5 gap-5
              rounded-sm ring ring-gray-200 shadow-sm shadow-black-300
            "
          >
            <Link
              to={`/product/${product.product_id}`}
              className="hover:text-[#8D0000] cursor-pointer w-50 h-full"
            >
              <img
                src={`/api/assets/${product.image_url}`}
                className="rounded-sm w-auto h-full object-contain"
              />
            </Link>
            <div className="flex flex-col gap-5 flex-grow">
              <div className="flex flex-row gap-5 justify-between">
                <div>
                  <Link
                    to={`/product/${product.product_id}`}
                    className="hover:text-[#8D0000] cursor-pointer text-2xl font-bold"
                  >
                    {product.name}
                  </Link>
                  <div className="text-md text-gray-400">{product.category_name}</div>
                </div>
                <div className="flex flex-col place-items-end">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      handleRemoveFromWatchlist(product.product_id);
                    }}
                    disabled={isDeleting}
                    className="p-2 rounded-full hover:bg-gray-100 transition-colors group"
                    title="Unfollow"
                  >
                    {isDeleting ? (
                      <Loader2 className="animate-spin text-gray-400 w-5 h-5" />
                    ) : (
                      <Trash className="text-gray-500 hover:text-[#8D0000] transition-colors duration-200" />
                    )}
                  </button>
                  <div className="font-medium text-[#8D0000]">
                    {calculateTimeRemaining(product.end_time)}
                  </div>
                </div>
              </div>
              <div className="flex flex-row gap-5">
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-lg">{product.seller_name}</div>
                  <div>Bid counts: {product.bid_count}</div>
                </div>
                <div className="flex-2 min-w-0">
                  <label className="font-medium text-lg">Highest bidder</label>
                  <div className="font-medium text-xl text-[#8D0000] mb-2">
                    {product.current_highest_bidder_name}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <label className="font-medium">Buy now price:</label>
                  <div>{formatCurrency(product.buy_now_price?.toString())}</div>
                  <label className="font-medium">Current price:</label>
                  <div>{formatCurrency(product.current_price.toString())}</div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function RatingsTab({ profile }: { profile: ProfileData }) {
  return (
    <div className="flex flex-col gap-5">
      <p className="text-gray-500">
        Received {profile.ratings.length} rating{profile.ratings.length > 1 ? 's' : ''}
      </p>
      {profile.ratings.map((rating, index) => {
        return (
          <div
            key={index}
            className="
              hover:scale-101 transition duration-150 ease-in-out
              flex flex-col bg-white p-5 gap-5
              rounded-sm ring ring-gray-200 shadow-sm shadow-black-300
            "
          >
            <div className="flex flex-row justify-between">
              <div className="text-lg font-bold">{rating.reviewer_name}</div>
              <div className="text-gray-400">{rating.created_at}</div>
            </div>
            <div className="flex flex-row gap-10">
              <Link
                to={`/product/${rating.product_id}`}
                className="hover:text-[#8D0000] cursor-pointer flex-2 font-medium"
              >
                {rating.product_name}
              </Link>
              <div className="flex-5">{rating.comment}</div>
              {rating.is_positive ? (
                <ThumbsUp className="flex-1" color="#8D0000" />
              ) : (
                <ThumbsDown className="flex-1" color="#8D0000" />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ProductsTab() {
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fetch_products = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/profile/seller/products', {
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

  const handleRemoveFromProducts = async (producID: string) => {
    if (!window.confirm('Confirm to delete this product from list?')) return;
    setDeletingId(producID);

    try {
      const res = await fetch(`/api/seller-list/${producID}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (res.ok) {
        // Xóa thành công -> Cập nhật state để loại bỏ item khỏi giao diện ngay lập tức
        setProducts((prev) => prev.filter((item) => item.product_id !== producID));
      } else {
        const errorData = await res.json();
        alert(errorData.message || "Can't remove product from watchlist");
      }
    } catch (e: any) {
      console.log(e.mesage);
    } finally {
      setDeletingId(null);
    }
  };

  if (loading)
    return (
      <div className="min-h-[50vh] w-full flex flex-col justify-center items-center">
        <ClipLoader size={50} color="#8D0000" />
      </div>
    );

  return (
    <div className="flex flex-col gap-5">
      <p className="text-gray-500">
        You posted {products.length} product{products.length > 1 ? 's' : ''}
      </p>

      {products.length === 0 && (
        <div className="text-center py-10 text-gray-400">Not uploaded yet.</div>
      )}

      {products.map((product: ProductItem, index) => {
        const isDeleting = deletingId === product.product_id;
        return (
          <div
            key={index}
            className="
              hover:scale-101 transition duration-150 ease-in-out
              flex bg-white flex-row p-5 gap-5
              rounded-sm ring ring-gray-200 shadow-sm shadow-black-300
            "
          >
            <Link
              to={`/product/${product.product_id}`}
              className="hover:text-[#8D0000] cursor-pointer w-50 h-full"
            >
              <img
                src={`/api/assets/${product.image_url}`}
                className="rounded-sm w-auto h-full object-contain"
              />
            </Link>
            <div className="flex flex-col gap-5 flex-grow">
              <div className="flex flex-row gap-5 justify-between">
                <div>
                  <Link
                    to={`/product/${product.product_id}`}
                    className="hover:text-[#8D0000] cursor-pointer text-2xl font-bold"
                  >
                    {product.product_name}
                  </Link>
                  <div className="text-md text-gray-400">{product.category_name}</div>
                </div>
                <div className="flex flex-col place-items-end">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      handleRemoveFromProducts(product.product_id);
                    }}
                    disabled={isDeleting}
                    className="p-2 rounded-full hover:bg-gray-100 transition-colors group"
                    title="Unfollow"
                  >
                    {isDeleting ? (
                      <Loader2 className="animate-spin text-gray-400 w-5 h-5" />
                    ) : (
                      <Trash className="text-gray-500 hover:text-[#8D0000] transition-colors duration-200" />
                    )}
                  </button>
                  <div className="font-medium text-[#8D0000]">
                    {calculateTimeRemaining(product.end_time)}
                  </div>
                </div>
              </div>
              <div className="flex flex-row gap-5">
                <div className="flex-1 min-w-0">
                  {/* <div className="font-medium text-lg">{product.seller_name}</div> */}
                  <div>Bid counts: {product.bid_count}</div>
                </div>
                <div className="flex-2 min-w-0">
                  <label className="font-medium text-lg">Highest bidder</label>
                  <div className="font-medium text-xl text-[#8D0000] mb-2">
                    {product.highest_bidder_name}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <label className="font-medium">Buy now price:</label>
                  <div>{formatCurrency(product.buy_now_price?.toString())}</div>
                  <label className="font-medium">Current price:</label>
                  <div>{formatCurrency(product.current_price.toString())}</div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function UserTab({ profile }: { profile: ProfileData }) {
  const tabs = ['Bidding', 'Won Products', 'Watchlist', 'Ratings', 'My products'];
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
        return <RatingsTab profile={profile} />;
      case 'my-products':
        return <ProductsTab />;
      default:
        return <h1 className="text-3xl text-red-500">Invalid Tab!</h1>;
    }
  };

  return (
    <div>
      <div className="flex flex-row">
        {tabs.map((tab) => {
          const tabID = tab.toLowerCase().replace(' ', '-');
          const isActive = activeTab === tabID;

          if (profile.role === 'bidder' && tab === 'My products') return <></>;

          return (
            <h2
              key={tab}
              onClick={() => setActiveTab(tabID)}
              className={`
                  cursor-pointer text-xl pb-1 px-3 border-b truncate
                  ${
                    isActive
                      ? 'border-[#8D0000] text-[#8D0000] font-medium border-b-2'
                      : 'border-gray-300 hover:font-medium hover:border-b-2 hover:border-gray-500'
                  }
                `}
            >
              {tab}
            </h2>
          );
        })}
      </div>

      <div className="mt-5 h-full bg-gray-100 p-5 rounded-sm ring ring-gray-200 shadow-sm shadow-black-300 p-2">
        {renderTab()}
      </div>
    </div>
  );
}
