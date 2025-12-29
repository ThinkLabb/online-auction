import { useEffect, useState } from 'react';
import { Profile, BiddingProduct, WonProduct, FollowingProduct, Review, SellingProduct, SoldProduct } from './interfaces';
import { SetTab } from './interfaces';
import { Loader2, ThumbsDown, ThumbsUp, Trash } from 'lucide-react';
import { calculateTimeRemaining, formatCurrency, formatDate } from '../product';
import { Link } from 'react-router-dom';
import { ClipLoader } from 'react-spinners';
import ReviewBox from './review';
import { UserRole } from '@prisma/client';

function BiddingTab({ profile }: { profile: Profile }) {
  const [products, setProducts] = useState<BiddingProduct[]>([])
  const [loading, setLoading] = useState(false);

  const fetchBiddingProducts = async() => {
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
  }

  useEffect(() => {
    fetchBiddingProducts();
  }, []);

  return (
    loading 
    ? <div className="min-h-[50vh] w-full flex flex-col justify-center items-center">
      <ClipLoader size={50} color="#8D0000" />
    </div>
    : <div className="flex flex-col gap-5">
      <p className="text-gray-500">
        Bidding {products.length} product
        {products.length > 1 ? 's' : ''}
      </p>
      {products.map((product, index) => {
        return (
          <div
            key={index}
            className={`
              hover:scale-101 transition duration-150 ease-in-out
              flex bg-white flex-col p-2 gap-1
              rounded-sm ring ${product.current_highest_bidder?.name === profile.name ? 'ring-[#8D0000]' : 'ring-gray-200'} shadow-sm shadow-black-300
            `}
          >
            <Link 
              to={`/profile/${product.seller.user_id}`}
              className='w-fit hover:text-[#8D0000] cursor-pointer text-lg font-bold'
            >
              {product.seller.name}
            </Link>
            <div className='flex flex-col md:items-center text-sm md:flex-row gap-5'> 
              <Link
                to={`/product/${product.product_id}`}
                className="hover:text-[#8D0000] cursor-pointer w-50 h-full"
              >
                <img
                  src={
                    product.thumbnail_url 
                    ? `/api/assets/${product.thumbnail_url}`
                    : 'https://placehold.co/600x400?text=No+Image'
                  }
                  className="rounded-sm w-auto h-full object-contain"
                />
              </Link>
              <div className="flex flex-col gap-2 flex-grow">
                <div className="flex flex-col md:flex-row gap-2 md:items-center justify-between">
                  <div className='flex flex-col'>
                    <Link
                      to={`/product/${product.product_id}`}
                      className="w-fit hover:text-[#8D0000] cursor-pointer text-lg font-bold"
                    >
                      {product.name}
                    </Link>

                    <Link to={`/products/${product.category.category_name_level_1}/${product.category.category_name_level_2}`} className="text-md text-gray-400">
                      {`${product.category.category_name_level_1} > ${product.category.category_name_level_2}`}
                    </Link>
                  </div>
                  <div className='flex flex-row justify-between md:flex-col md:items-end'>
                    <div className="font-medium text-[#8D0000]">{calculateTimeRemaining(product.end_time)}</div>
                    <div ><span className='font-medium'>Bid at: </span> {product.bid_at}</div>
                  </div>
                </div>
                <div className="flex flex flex-col md:flex-row gap-2 md:gap-5">
                  <div className="md:flex-2 min-w-0">
                    <div className='flex gap-3 items-center flex-row md:flex-col md:items-start md:gap-0'>
                      <div className="font-medium">Highest bidder:</div>
                      <Link
                        to={`/profile/${product.current_highest_bidder?.user_id}`}
                        className="w-fit text-[#8D0000] cursor-pointer text-base font-bold">
                        {product.current_highest_bidder?.name}
                      </Link>
                    </div>
                    <div><span className="font-medium">Current price: </span>{formatCurrency(product.current_price?.toString())}</div>
                  </div>
                  <div className="md:flex-2 min-w-0">
                    <div><span className="font-medium">Buy now price: </span>{formatCurrency(product.buy_now_price?.toString())}</div>
                    <div><span className="font-medium">My bid: </span>{formatCurrency(product.bid_amount?.toString())}</div>
                    <div className='font-bold text-base text-[#8D0000]'><span className="text-black font-medium">Status: </span>{product.status?.toString().toUpperCase()}</div>
                  </div>
                  <div className="md:flex-1 min-w-0 flex flex-col md:items-end">
                    <div><span className="font-medium">Bid count: </span>{product.bid_count?.toString() ?? 0}</div>
                    <div><span className="font-medium">Reviews count: </span>{product.reviews_count?.toString()}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function WonTab({profile} : {profile: Profile}) {
  const [products, setProducts] = useState<WonProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const fetchWonProducts = async() => {
    try {
      setLoading(true);
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
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchWonProducts();
  }, []);

  return (
    loading 
    ? <div className="min-h-[50vh] w-full flex flex-col justify-center items-center">
      <ClipLoader size={50} color="#8D0000" />
    </div>
    : <div className="flex flex-col gap-5">
      <p className="text-gray-500">
        Bidding {products.length} product
        {products.length > 1 ? 's' : ''}
      </p>
      {products.map((product, index) => {
        return (
          <div
            key={index}
            className={`
              hover:scale-101 transition duration-150 ease-in-out
              flex bg-white flex-col p-2 gap-1
              rounded-sm ring ring-gray-200 shadow-sm shadow-black-300
            `}
          >
            <Link 
              to={`/profile/${product.seller.user_id}`}
              className='w-fit hover:text-[#8D0000] cursor-pointer text-lg font-bold'
            >
              {product.seller.name}
            </Link>
            <div className='flex flex-col md:items-center text-sm md:flex-row gap-5'> 
              <Link
                to={`/product/${product.product_id}`}
                className="hover:text-[#8D0000] cursor-pointer w-50 h-full"
              >
                <img
                  src={
                    product.thumbnail_url 
                    ? `/api/assets/${product.thumbnail_url}`
                    : 'https://placehold.co/600x400?text=No+Image'
                  }
                  className="rounded-sm w-auto h-full object-contain"
                />
              </Link>
              <div className="flex flex-col gap-2 flex-grow">
                <div className="flex flex-col md:flex-row gap-2 md:items-center justify-between">
                  <div className='flex flex-col'>
                    <Link
                      to={`/product/${product.product_id}`}
                      className="w-fit hover:text-[#8D0000] cursor-pointer text-lg font-bold"
                    >
                      {product.name}
                    </Link>

                    <Link to={`/products/${product.category.category_name_level_1}/${product.category.category_name_level_2}`} className="text-md text-gray-400">
                      {`${product.category.category_name_level_1} > ${product.category.category_name_level_2}`}
                    </Link>
                  </div>
                  <div ><span className='font-medium'>Ended at: </span> {product.end_time}</div>
                </div>
                <div className="flex flex flex-col md:flex-row gap-2 md:gap-5">
                  <div className="md:flex-2 min-w-0">
                    <div><span className="font-medium">Final price: </span>{formatCurrency(product.order.final_price?.toString())}</div>
                    <div><span className="font-medium">Created at: </span>{product.order.created_at?.toString()}</div>
                  </div>
                  <div className="md:flex-2 min-w-0">
                    <div className="text-black font-medium">Order status: </div>
                    <div className='font-bold text-base text-[#8D0000]'>{product.order.status.toString().toUpperCase()}</div>
                  </div>
                  <div className="md:flex-1 min-w-0 flex flex-col md:items-end">
                    <div><span className="font-medium">Bid count: </span>{product.bid_count?.toString() ?? 0}</div>
                  </div>
                </div>
              </div>
            </div>
            
            {<ReviewBox order_id={product.order.order_id} review={product.review} role={profile.role}/>}
          </div>
        );
      })}
    </div>
  );
}

function WatchlistTab(){
  const [watchlist, setWatchlist] = useState<FollowingProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<number | bigint | string | null>(null);
  
  const fetchWatchlist = async() => {
    try {
      setLoading(true);

      const res = await fetch('/api/profile/watchlist', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await res.json();
      if (res.ok) setWatchlist(result.data);
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchWatchlist();
  }, []);
  
  useEffect(() => {
    setWatchlist(watchlist);
  }, [watchlist]);

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
        setWatchlist((prev) => prev.filter((item) => item.product_id !== producID));
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
    loading? <div className="min-h-[50vh] w-full flex flex-col justify-center items-center">
      <ClipLoader size={50} color="#8D0000" />
    </div>
    : <div className="flex flex-col gap-5">
      <p className="text-gray-500">
        Following {watchlist.length} product{watchlist.length > 1 ? 's' : ''}
      </p>

      {watchlist.length === 0 && (
        <div className="text-center py-10 text-gray-400">You haven't follow any product yet.</div>
      )}

      {watchlist.map((product, index) => {
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
                src={`/api/assets/${product.thumbnail_url}`}
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
                  <Link to={`/products/${product.category.category_name_level_1}/${product.category.category_name_level_2}`} className="text-md text-gray-400">
                    {`${product.category.category_name_level_1} > ${product.category.category_name_level_2}`}
                  </Link>
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
                  <div className="font-medium text-lg">{product.seller.name}</div>
                  <div>Bid counts: {product.bid_count}</div>
                </div>
                <div className="flex-2 min-w-0">
                  <label className="font-medium text-lg">Highest bidder</label>
                  <div className="font-medium text-xl text-[#8D0000] mb-2">
                    {product.current_highest_bidder?.name ?? "No bids yet"}
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

function ReviewsTab() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchReviews = async() => {
    try {
      setLoading(true);
      const res = await fetch('/api/profile/reviews', {
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
  }

  useEffect(() => {
    fetchReviews();
  }, []);

  return (
    loading ? <div className="min-h-[50vh] w-full flex flex-col justify-center items-center">
      <ClipLoader size={50} color="#8D0000" />
    </div>
    : <div className="flex flex-col gap-5">
      <p className="text-gray-500">
        Received {reviews.length} rating{reviews.length > 1 ? 's' : ''}
      </p>
      {reviews.map((review, index) => {
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
              <div className="text-lg font-bold">{review.reviewer.name}</div>
              <div className="text-gray-400">{review.created_at}</div>
            </div>
            <div className="flex flex-row gap-10">
              <Link
                to={`/product/${review.product.product_id}`}
                className="hover:text-[#8D0000] cursor-pointer flex-2 font-medium"
              >
                {review.product.product_name}
              </Link>
              <div className="flex-5">{review.comment}</div>
              {review.is_positive ? (
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

function SellingsTab() {
  const [products, setProducts] = useState<SellingProduct[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);
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

  return (
    loading ? <div className="min-h-[50vh] w-full flex flex-col justify-center items-center">
      <ClipLoader size={50} color="#8D0000" />
    </div>
    : <div className="flex flex-col gap-5">
      <p className="text-gray-500">
        You posted {products.length} product{products.length > 1 ? 's' : ''}
      </p>

      {products.length === 0 && (
        <div className="text-center py-10 text-gray-400">Not uploaded yet.</div>
      )}

      {products.map((product, index) => {
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
                src={`/api/assets/${product.thumbnail_url}`}
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
                  <Link to={`/products/${product.category.category_name_level_1}/${product.category.category_name_level_2}`} className="text-md text-gray-400">
                    {`${product.category.category_name_level_1} > ${product.category.category_name_level_2}`}
                  </Link>
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
                    {product.highest_bidder?.name ?? "No bids yet"}
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

function ProductsWithWinnerTab() {
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

  return (
    loading ? <div className="min-h-[50vh] w-full flex flex-col justify-center items-center">
      <ClipLoader size={50} color="#8D0000" />
    </div>
    : <div className="flex flex-col gap-5">
      <p className="text-gray-500">
        There are {products.length} product{products.length > 1 ? 's' : ''} won by buyers.
      </p>

      {products.length === 0 && (
        <div className="text-center py-10 text-gray-400">No product yet.</div>
      )}

      {products.map((product, index) => {
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
                src={`/api/assets/${product.thumbnail_url}`}
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
                  <Link to={`/products/${product.category.category_name_level_1}/${product.category.category_name_level_2}`} className="text-md text-gray-400">
                    {`${product.category.category_name_level_1} > ${product.category.category_name_level_2}`}
                  </Link>
                </div>
              </div>
              <div className="flex flex-row gap-5">
                <div className="flex-1 min-w-0">
                  {/* <div className="font-medium text-lg">{product.seller_name}</div> */}
                  <div>Bid counts: {product.bid_count}</div>
                </div>
                <div className="flex-2 min-w-0">
                  <label className="font-medium text-lg">Buyer</label>
                  <div className="font-medium text-xl text-[#8D0000] mb-2">
                    {product.order?.buyer.name}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <label className="font-medium">Final price:</label>
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

export default function UserTab( { profile }: { profile: Profile } ) {
  const tabs = ['Bidding', 'Won Products', 'Watchlist', 'Ratings', 'My products'];
  const filteredTabs = tabs.filter(tab => !(profile.role === 'bidder' && tab === 'My products'));
  const [activeTab, setActiveTab] = useState('bidding');

  const renderTab = () => {
    switch (activeTab) {
      case 'bidding':
        return <BiddingTab profile={profile} />;
      case 'won-products':
        return <WonTab profile={profile}/>;
      case 'watchlist':
        return <WatchlistTab />;
      case 'ratings':
        return <ReviewsTab />;
      case 'my-products':
        return <SellingsTab />;
      default:
        return <h1 className="text-3xl text-red-500">Invalid Tab!</h1>;
    }
  };

  return (
    <div>
      <div className="flex flex-row">
        {filteredTabs.map((tab) => {
          const tabID = tab.toLowerCase().replace(' ', '-');
          const isActive = activeTab === tabID;

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
