import { useEffect, useState } from 'react';
import { Profile, BiddingProduct, WonProduct, FollowingProduct, Review, SellingProduct, SoldProduct } from './interfaces';
import { Loader2, ThumbsDown, ThumbsUp, Trash } from 'lucide-react';
import { calculateTimeRemaining, formatCurrency, formatDate } from '../product';
import { Link } from 'react-router-dom';
import { ClipLoader } from 'react-spinners';
import ReviewBox from './review';
import { OrderStatus, UserRole } from '@prisma/client';

function ImageContainer({product_id, product_name, url} : {product_id: string, product_name: string, url?: string }) {
  return (
    <Link
      to={`/product/${product_id}`}
      className="self-center hover:text-[#8D0000] cursor-pointer lg:w-50 w-full h-full"
    >
      <img
        src={
          product_name
          ? `/api/assets/${url}`
          : 'https://placehold.co/600x400?text=No+Image'
        }
        className="rounded-sm w-auto h-full object-contain"
      />
    </Link>
  )
}

function UserContainer({user_id, user_name, isLarge} : {user_id?: string, user_name: string, isLarge: boolean}) {
  if (!user_id)
    return <h2 className={`w-fit text-${isLarge ? 'lg' : 'base'} font-bold`}>No bidder yet</h2>
  return (
    <Link 
      to={`/profile/${user_id}`}
      className={`w-fit cursor-pointer text-${isLarge ? 'lg hover:text-[#8D0000]' : 'base hover:scale-105 text-[#8D0000]'} font-bold`}
    >
      {user_name}
    </Link>
  )
}

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
    : <div className="flex flex-col gap-2">
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
            <div className='flex flex-col lg:items-center text-sm lg:flex-row gap-5'>
              <ImageContainer product_id={product.product_id} product_name={product.name} url={product.thumbnail_url}/>
              <div className="flex flex-col gap-2 flex-grow">
                <div className="flex flex-col md:flex-row gap-2 lg:items-center md:justify-between">
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
                    <div ><span className='font-medium'>Bid at: </span> {formatDate(product.bid_at)}</div>
                  </div>
                </div>
                <div className="flex flex flex-col lg:flex-row gap-2 lg:gap-5">
                  <div className="lg:flex-2 min-w-0">
                    <div className='flex gap-3 items-center flex-row lg:flex-col lg:items-start lg:gap-0'>
                      <div className="font-medium">Highest bidder:</div>
                      <UserContainer
                        user_id={product.current_highest_bidder?.user_id}
                        user_name={product.current_highest_bidder?.name ?? "No bidder yet"}
                        isLarge={false}
                      />
                    </div>
                    <div><span className="font-medium">Current price: </span>{formatCurrency(product.current_price?.toString())}</div>
                  </div>
                  <div className="lg:flex-2 min-w-0">
                    <div><span className="font-medium">Buy now price: </span>{formatCurrency(product.buy_now_price?.toString())}</div>
                    <div><span className="font-medium">My bid: </span>{formatCurrency(product.bid_amount?.toString())}</div>
                    <div className='font-bold text-base text-[#8D0000]'><span className="text-black font-medium">Status: </span>{product.status?.toString().toUpperCase()}</div>
                  </div>
                  <div className="lg:flex-1 min-w-0 flex flex-col lg:items-end">
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
            <div className='flex flex-col lg:items-center text-sm lg:flex-row gap-5'> 
              <ImageContainer product_id={product.product_id} product_name={product.name} url={product.thumbnail_url}/>
              <div className="flex flex-col gap-2 flex-grow">
                <div className="flex flex-col lg:flex-row gap-2 lg:items-center justify-between">
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
                  <div ><span className='font-medium'>Ended at: </span> {formatDate(product.end_time)}</div>
                </div>
                <div className="flex flex flex-col lg:flex-row gap-2 lg:gap-5">
                  <div className="lg:flex-2 min-w-0">
                    <div><span className="font-medium">Final price: </span>{formatCurrency(product.order.final_price?.toString())}</div>
                    <div><span className="font-medium">Created at: </span>{formatDate(product.order.created_at)}</div>
                  </div>
                  <div className="lg:flex-2 min-w-0">
                    <div className="text-black font-medium">Order status: </div>
                    <div className='font-bold text-base text-[#8D0000]'>{product.order.status.toString().toUpperCase()}</div>
                  </div>
                  <div className="lg:flex-1 min-w-0 flex flex-col lg:items-end">
                    <div><span className="font-medium">Bid count: </span>{product.bid_count?.toString() ?? 0}</div>
                  </div>
                </div>
              </div>
            </div>
            
            <ReviewBox order_id={product.order.order_id} review={product.review} role={profile.role} autoComment={false} orderStatus={product.order.status}/>
          </div>
        );
      })}
    </div>
  );
}

function WatchlistTab({profile} : {profile: Profile}){
  const [watchlist, setWatchlist] = useState<FollowingProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<number | bigint | string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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
    loading 
    ? <div className="min-h-[50vh] w-full flex flex-col justify-center items-center">
      <ClipLoader size={50} color="#8D0000" />
    </div>
    : <div className="flex flex-col gap-2">
      <p className="text-gray-500">
        Bidding {watchlist.length} product
        {watchlist.length > 1 ? 's' : ''}
      </p>
      {watchlist.map((product, index) => {
        return (
          <div
            key={index}
            className={`
              hover:scale-101 transition duration-150 ease-in-out
              flex bg-white flex-col p-2 gap-1
              rounded-sm ring ${product.current_highest_bidder?.name === profile.name ? 'ring-[#8D0000]' : 'ring-gray-200'} shadow-sm shadow-black-300
            `}
          >
            <div className='flex justify-between'>
              <UserContainer user_id={product.seller.user_id} user_name={product.seller.name} isLarge={true}/>

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
            </div>

            <div className='flex flex-col lg:items-center text-sm lg:flex-row gap-5'> 
              <ImageContainer product_id={product.product_id} product_name={product.name} url={product.thumbnail_url}/>
              <div className="flex flex-col gap-2 flex-grow">
                <div className="flex flex-col md:flex-row gap-2 md:justify-between">
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
                  <div className="font-medium text-[#8D0000]">{calculateTimeRemaining(product.end_time)}</div>
                </div>
                <div className="flex flex flex-col lg:flex-row gap-2 lg:gap-5">
                  <div className="lg:flex-2 min-w-0">
                    <div className='flex gap-3 items-center flex-row lg:flex-col lg:items-start lg:gap-0'>
                      <div className="font-medium">Highest bidder:</div>
                      <UserContainer 
                        user_id={product.current_highest_bidder?.user_id}
                        user_name={product.current_highest_bidder?.name ?? "No bidder yet"}
                        isLarge={false}
                      />
                    </div>
                    <div><span className="font-medium">Current price: </span>{formatCurrency(product.current_price?.toString())}</div>
                  </div>
                  <div className="lg:flex-2 min-w-0">
                    <div><span className="font-medium">Buy now price: </span>{formatCurrency(product.buy_now_price?.toString())}</div>
                    <div className='font-bold text-base text-[#8D0000]'><span className="text-black font-medium">Status: </span>{product.status?.toString().toUpperCase()}</div>
                  </div>
                  <div className="lg:flex-1 min-w-0 flex flex-col lg:items-end">
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

function ReviewsTab() {
  const [loading, setLoading] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);

  const fetchReviews = async() => {
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
  }

  useEffect(() => {
    fetchReviews();
  }, []);

  return (
    loading ? <div className="min-h-[50vh] w-full flex flex-col justify-center items-center">
      <ClipLoader size={50} color="#8D0000" />
    </div>
    : <div className="flex flex-col gap-2">
      <p className="text-gray-500">
        Received {reviews.length} rating{reviews.length > 1 ? 's' : ''}
      </p>
      {reviews.map((review, index) => {
        return (
          <div
            key={index}
            className="
              hover:scale-101 transition duration-150 ease-in-out
              flex flex-col bg-white p-2 gap-1 text-sm
              rounded-sm ring ring-gray-200 shadow-sm shadow-black-300
            "
          >
            <div className="flex flex-row justify-between">
              <div className='flex gap-2 items-center'>
                <p className='text-base'>From</p>
                <UserContainer user_id={review.reviewer.user_id} user_name={review.reviewer.name} isLarge={true}/>
                {review.is_positive ? <ThumbsUp className="w-5 h-5" fill='#8D0000 stroke-none'/> : <ThumbsDown className='w-5 h-5 stroke-none' fill='#8D0000'/>}
              </div>
              <div className="text-gray-400">{formatDate(review.created_at)}</div>
            </div>
            <div className='flex flex-col md:flex-row md:gap-5 md:items-center'>
              <Link
                to={`/product/${review.product.product_id}`}
                className="w-fit hover:text-[#8D0000] cursor-pointer text-base font-bold"
              >
                {review.product.product_name}
              </Link>

              <Link to={`/products/${review.product.category.category_name_level_1}/${review.product.category.category_name_level_2}`} className="text-md text-gray-400">
                {`${review.product.category.category_name_level_1} > ${review.product.category.category_name_level_2}`}
              </Link>
            </div>

            {review && review.comment && <p className="my-2 text-sm p-1 w-full bg-white p-2 border border-gray-300 rounded">{review.comment}</p>}

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
    loading 
    ? <div className="min-h-[50vh] w-full flex flex-col justify-center items-center">
      <ClipLoader size={50} color="#8D0000" />
    </div>
    : <div className="flex flex-col gap-2">
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
            <div className='flex flex-col lg:items-center text-sm lg:flex-row gap-5'>
              <ImageContainer product_id={product.product_id} product_name={product.name} url={product.thumbnail_url}/>
              <div className="flex flex-col gap-2 flex-grow">
                <div className="flex flex-col md:flex-row gap-2 lg:items-center md:justify-between">
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
                    <div ><span className='font-medium'>Posted at: </span> {formatDate(product.created_at)}</div>
                  </div>
                </div>
                <div className="flex flex flex-col lg:flex-row gap-2 lg:gap-5">
                  <div className="lg:flex-2 min-w-0">
                    <div className='flex gap-3 items-center flex-row lg:flex-col lg:items-start lg:gap-0'>
                      <div className="font-medium">Highest bidder:</div>
                      <UserContainer
                        user_id={product.highest_bidder?.user_id}
                        user_name={product.highest_bidder?.name ?? "No bidder yet"}
                        isLarge={false}
                      />
                    </div>
                    <div><span className="font-medium">Current price: </span>{formatCurrency(product.current_price?.toString())}</div>
                  </div>
                  <div className="lg:flex-2 min-w-0">
                    <div><span className="font-medium">Start price: </span>{formatCurrency(product.start_price?.toString())}</div>
                    <div><span className="font-medium">Buy now price: </span>{formatCurrency(product.buy_now_price?.toString())}</div>
                  </div>
                  <div className="lg:flex-1 min-w-0 flex flex-col lg:items-end">
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

function ProductsWithWinnerTab({profile} : {profile: Profile}) {
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
    setProducts(currentProducts => 
      currentProducts.map(product => {
        // Tìm sản phẩm có id trùng khớp
        if (product.product_id === productId && product.order) {
          return {
            ...product,
            order: {
              ...product.order,
              order_status: 'cancelled' as OrderStatus // Cập nhật trạng thái
            }
          };
        }
        return product;
      })
    );
  };

  return (
    loading 
    ? <div className="min-h-[50vh] w-full flex flex-col justify-center items-center">
      <ClipLoader size={50} color="#8D0000" />
    </div>
    : <div className="flex flex-col gap-2">
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
            <div>
              <div className='flex gap-2 items-center'>
                <p className='text-sm'>Buyer:</p>
                <UserContainer user_id={product.order?.buyer.user_id} user_name={product.order?.buyer.name ?? ""} isLarge={false}/>
              </div>
              
            </div>

            <div className='flex flex-col lg:items-center text-sm lg:flex-row gap-5'>
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
                <div className="flex flex-col lg:flex-row gap-2 lg:items-center justify-between">
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
                <div className="flex flex flex-col lg:flex-row gap-2 lg:gap-5">
                  <div className="lg:flex-2 min-w-0">
                    <div><span className="font-medium">Final price: </span>{formatCurrency(product.current_price.toString())}</div>
                    <div><span className="font-medium">Created at: </span>{formatDate(product.order?.created_at)}</div>
                    <div><span className="font-medium">Last updated: </span>{formatDate(product.order?.updated_at)}</div>
                  </div>
                  <div className="lg:flex-2 min-w-0">
                    <div className="text-black font-medium">Order status: </div>
                    <div className='font-bold text-base text-[#8D0000]'>{product.order?.order_status.toString().toUpperCase()}</div>
                  </div>
                  <div className="lg:flex-1 min-w-0 flex flex-col lg:items-end">
                    <div><span className="font-medium">Bid count: </span>{product.bid_count?.toString() ?? 0}</div>
                  </div>
                </div>
              </div>
            </div>
            
            <ReviewBox 
              order_id={product.order?.order_id||""}
              review={product.order?.my_review || null}
              role={profile.role} autoComment={true} 
              orderStatus={product.order?.order_status || 'completed'} 
              onCancelSuccess={() => handleOrderCancelled(product.product_id)}
            />
          </div>
        );
      })}
    </div>
  );
}

export default function UserTab( { profile }: { profile: Profile } ) {
  const tabs = ['Bidding', 'Won Products', 'Watchlist', 'Ratings', 'My products', 'Sold Products'];
  const filteredTabs = tabs.filter(tab => !(profile.role === 'bidder' && (tab === 'My products' || tab === 'Sold Products')));
  const [activeTab, setActiveTab] = useState('bidding');

  const renderTab = () => {
    switch (activeTab) {
      case 'bidding':
        return <BiddingTab profile={profile} />;
      case 'won-products':
        return <WonTab profile={profile}/>;
      case 'watchlist':
        return <WatchlistTab profile={profile} />;
      case 'ratings':
        return <ReviewsTab />;
      case 'my-products':
        return <SellingsTab />;
      case 'sold-products':
        return <ProductsWithWinnerTab profile={profile} />;
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

      <div className="mt-5 h-full bg-gray-100 p-2 rounded-sm ring ring-gray-200 shadow-sm shadow-black-300 p-2">
        {renderTab()}
      </div>
    </div>
  );
}
