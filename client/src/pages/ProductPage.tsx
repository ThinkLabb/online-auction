import { useEffect, useState } from 'react';
import { Star, User, Share2, Heart, Ban, Clock, Trophy } from 'lucide-react'; // Added Ban, Clock icons
import { useParams } from 'react-router-dom';

// --- INTERFACES ---

const formatTimeAgo = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};

interface ProductSeller {
  name: string;
  rating: number;
  reviews: number;
}

interface DescriptionItem {
  text: string;
  date: string;
}

interface ProductQA {
  question: string;
  asker: string;
  answer: string | null;
  responder: string | null;
  time: string;
}

interface ProductDetails {
  brand: string;
  year?: string;
  condition?: string;
  engine: string;
  frameMaterial?: string;
  color?: string;
  performance?: string;
  exhaust?: string;
}

interface BidHistoryItem {
  id: string;
  bidderId: string;
  bidderName: string;
  amount: number;
  time: string;
}

export interface Product {
  id: string | bigint;
  title: string;
  postedDate: string;
  endsIn: string;
  currentBid: number;
  bidsPlaced: number;
  buyNowPrice: number;
  minBidStep: number;
  images: string[];
  details: ProductDetails;
  description: DescriptionItem[];
  conditionText: string;
  seller: ProductSeller;
  topBidder: ProductSeller;
  qa: ProductQA[];
  isSeller: boolean;
}

const ProductDetail = () => {
  const [product, setProduct] = useState<Product | null>(null);
  const [activeImage, setActiveImage] = useState<string>('');
  const [bidAmount, setBidAmount] = useState<string>('');

  const [bidHistory, setBidHistory] = useState<BidHistoryItem[]>([]);
  const { id } = useParams<{ id: string }>();

  useEffect(() => {
    (async () => {
      try {
        if (!id) return;
        const res = await fetch(`/api/product/${id}`);
        if (!res.ok) throw new Error('Failed to fetch product');

        const data: Product = await res.json();
        setProduct(data);
        if (data.images && data.images.length > 0) {
          setActiveImage(data.images[0]);
        }
      } catch (error) {
        console.error('Error fetching product:', error);
      }
    })();
  }, []);

  useEffect(() => {
    if (product?.isSeller && id) {
      (async () => {
        try {
          const res = await fetch(`/api/product/${id}/bids`);
          if (!res.ok) throw new Error('Failed to fetch bids');
          const data: BidHistoryItem[] = await res.json();
          setBidHistory(data);
        } catch (error) {
          console.error('Error fetching bid history:', error);
        }
      })();
    }
  }, [product, id]);

  const getImageUrl = (img: string) => {
    if (!img) return 'https://placehold.co/600x400?text=No+Image';
    return img.startsWith('http') ? img : `/api/assets/${img}`;
  };

  const handleBanUser = async (bidderId: string) => {
    const isConfirmed = window.confirm('Are you sure you want to ban this user from bidding?');
    if (!isConfirmed) return;

    try {
      const response = await fetch(`/api/ban/${product?.id}/${bidderId}`, {
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

      (async () => {
        try {
          const res = await fetch(`/api/product/${id}/bids`);
          if (!res.ok) throw new Error('Failed to fetch bids');
          const data: BidHistoryItem[] = await res.json();
          setBidHistory(data);
        } catch (error) {
          console.error('Error fetching bid history:', error);
        }
      })();

      alert('User has been banned.');
    } catch (error) {
      console.error('Error banning user:', error);
      alert('Something went wrong while banning the user.');
    }
  };

  const handleBid = async function () {
    const bidValue = parseFloat(bidAmount);

    if (isNaN(bidValue)) {
      alert('Please enter a valid number.');
      return;
    }

    if (!product) {
      return;
    }

    const minRequiredBid = product.currentBid + product.minBidStep;

    if (bidValue < minRequiredBid) {
      alert(
        `Bid too low! You must bid at least ${minRequiredBid} (Current Price: ${product.currentBid} + Step: ${product.minBidStep})`
      );
      return;
    }

    if ((bidValue - minRequiredBid) % product.minBidStep != 0) {
      alert(`Bid must be a multiple of ${product.minBidStep} starting from ${minRequiredBid}.`);
      return;
    }
    try {
      const response = await fetch(`/api/bid/${product?.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: bidValue,
        }),
        credentials: 'include',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to place bid');
      }

      alert('Bid placed successfully!');
      setBidAmount('');
      (async () => {
        try {
          if (!id) return;
          const res = await fetch(`/api/product/${id}`);
          if (!res.ok) throw new Error('Failed to fetch product');

          const data: Product = await res.json();
          setProduct(data);
          if (data.images && data.images.length > 0) {
            setActiveImage(data.images[0]);
          }
        } catch (error) {
          console.error('Error fetching product:', error);
        }
      })();
    } catch (error: any) {
      console.error('Bid Error:', error);
      alert(error.message);
    }
  };

  if (!product) return <div className="p-10 text-center">Loading product details...</div>;

  const minNextBid = product.currentBid + product.minBidStep;

  return (
    <div className="bg-gray-50 flex-1 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* ---------------- LEFT COLUMN ---------------- */}
          <div className="lg:col-span-8 space-y-8">
            {/* Image Gallery */}
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div className="aspect-4/3 w-full bg-gray-200 rounded-lg overflow-hidden mb-4 relative">
                <img
                  src={getImageUrl(activeImage)}
                  alt="Product Main"
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-4 right-4 flex space-x-2">
                  <button className="p-2 bg-white/80 rounded-full hover:bg-white text-gray-700">
                    <Share2 size={20} />
                  </button>
                  <button className="p-2 bg-white/80 rounded-full hover:bg-white text-gray-700">
                    <Heart size={20} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4">
                {product.images.map((img, idx) => (
                  <div
                    key={idx}
                    onClick={() => setActiveImage(img)}
                    className={`cursor-pointer rounded-md overflow-hidden border-2 aspect-4/3 ${activeImage === img ? 'border-red-600' : 'border-transparent'}`}
                  >
                    <img
                      src={getImageUrl(img)}
                      alt={`Thumbnail ${idx}`}
                      className="w-full h-full object-cover hover:opacity-80 transition"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Description and Details */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Product description</h2>
              <div className="mb-8">
                <h3 className="text-lg font-bold text-gray-900 mb-3">Detail</h3>
                <ul className="space-y-2 text-gray-700">
                  <li>
                    <span className="font-semibold text-gray-900">Brand/Category:</span>{' '}
                    {product.details.brand}
                  </li>
                  <li>
                    <span className="font-semibold text-gray-900">Type:</span>{' '}
                    {product.details.engine}
                  </li>
                  {product.details.condition && (
                    <li>
                      <span className="font-semibold text-gray-900">Condition:</span>{' '}
                      {product.details.condition}
                    </li>
                  )}
                </ul>
              </div>

              <hr className="my-6 border-gray-200" />

              <div className="mb-8">
                <h3 className="text-lg font-bold text-gray-900 mb-3">Description</h3>
                <div className="space-y-6 text-gray-600 leading-relaxed">
                  {product.description.map((item, idx) => (
                    <div key={idx} className="bg-gray-50 p-4 rounded-md border border-gray-100">
                      <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
                        Updated on: {item.date}
                      </h4>
                      <p className="whitespace-pre-line text-gray-800">{item.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Q&A Section */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Questions & Answers</h2>
              <div className="space-y-6">
                {product.qa.map((item, idx) => (
                  <div key={idx} className="space-y-3">
                    <div>
                      <h4 className="font-bold text-gray-900">{item.question}</h4>
                      <p className="text-xs text-gray-400 mt-1">Asked by {item.asker}</p>
                    </div>
                    {item.answer && (
                      <div className="bg-blue-50 border-l-4 border-blue-200 p-4 rounded-r-md">
                        <p className="text-sm font-semibold text-gray-800 mb-1">
                          {item.responder}{' '}
                          <span className="font-normal text-gray-500 text-xs ml-2">
                            {item.time}
                          </span>
                        </p>
                        <p className="text-gray-700 text-sm">{item.answer}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ---------------- RIGHT COLUMN (Sidebar) ---------------- */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h1 className="text-xl font-bold text-gray-900 mb-1">{product.title}</h1>
              <div className="flex justify-between text-xs text-gray-500 mb-6">
                <div>
                  Posted: <br />
                  <span className="text-gray-900 font-medium">{product.postedDate}</span>
                </div>
                <div className="text-right">
                  Ends in: <br />
                  <span className="text-gray-900 font-medium">{product.endsIn}</span>
                </div>
              </div>

              <div className="mb-6">
                <p className="text-sm text-gray-500">Current bid:</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-gray-900">
                    {product.currentBid.toLocaleString()} VND
                  </span>
                  <span className="text-sm text-gray-500">{product.bidsPlaced} bids placed</span>
                </div>
              </div>

              {/* Buy Now Box */}
              <div className="bg-red-50 border border-red-100 p-3 rounded mb-6 flex justify-between items-center">
                <span className="text-sm font-medium text-red-800">Buy it now!</span>
                <span className="text-xl font-bold text-gray-900">
                  {product.buyNowPrice.toLocaleString()} VND
                </span>
              </div>

              {/* --- ACTION FORM (CONDITIONAL RENDER) --- */}
              {!product.isSeller ? (
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs text-gray-500">Your Bid amount</label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        className="flex-1 border border-gray-300 rounded px-3 py-2 text-gray-900 focus:outline-none focus:border-red-500"
                        placeholder={`Min ${minNextBid} VND`}
                        value={bidAmount}
                        onChange={(e) => setBidAmount(e.target.value)}
                      />
                      <div className="bg-gray-200 text-gray-600 px-3 py-2 rounded font-medium text-sm flex items-center">
                        VND
                      </div>
                    </div>
                    <p className="text-[10px] text-gray-400">
                      Minimum bid: + {product.minBidStep} VND
                    </p>
                  </div>

                  <button
                    className="w-full bg-red-800 text-white font-bold py-3 rounded shadow hover:bg-red-900 transition duration-200"
                    onClick={handleBid}
                  >
                    Place bid
                  </button>
                  <button className="w-full bg-white border border-red-800 text-red-800 font-bold py-3 rounded shadow-sm hover:bg-red-50 transition duration-200">
                    Buy now for {product.buyNowPrice.toLocaleString()} VND
                  </button>

                  <p className="text-[10px] text-center text-gray-400 mt-2">
                    By bidding, you agree to our terms and conditions
                  </p>
                </div>
              ) : (
                <div className="bg-gray-100 border border-gray-200 p-4 rounded text-center">
                  <p className="text-gray-800 font-bold text-sm">You are the seller</p>
                  <p className="text-xs text-gray-500 mt-1">
                    You cannot bid on or buy your own listing.
                  </p>
                </div>
              )}
            </div>

            {/* Seller / Top Bidder Card */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              {/* ONLY SHOW SELLER INFO IF THE USER IS NOT THE SELLER */}
              {!product.isSeller && (
                <>
                  <h3 className="text-sm font-bold text-gray-900 mb-4">Seller</h3>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-500">
                      <User size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">{product.seller.name}</p>
                      <div className="flex items-center text-xs text-yellow-500">
                        <Star size={12} fill="currentColor" className="mr-1" />
                        <span className="font-medium text-gray-700 mr-1">
                          {product.seller.rating}
                        </span>
                        <span className="text-gray-400">({product.seller.reviews} reviews)</span>
                      </div>
                    </div>
                  </div>

                  <button className="w-full border border-black text-black font-medium py-2 rounded-full hover:bg-gray-50 transition duration-200 mb-6">
                    Contact seller
                  </button>

                  <hr className="border-gray-200 mb-6" />
                </>
              )}

              {/* TOP BID SECTION (Visible to everyone) */}
              <h3 className="text-sm font-bold text-gray-900 mb-4">Top bid</h3>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-500">
                  <User size={20} />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">{product.topBidder.name}</p>
                  <div className="flex items-center text-xs text-yellow-500">
                    <Star size={12} fill="currentColor" className="mr-1" />
                    <span className="font-medium text-gray-700 mr-1">
                      {product.topBidder.rating}
                    </span>
                    <span className="text-gray-400">({product.topBidder.reviews} reviews)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* --- NEW CARD: BID HISTORY (SELLER ONLY) --- */}
            {product.isSeller && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Header */}
                <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-white">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Bid History</h3>
                    <p className="text-xs text-gray-500 mt-1">
                      {bidHistory.length} total bids placed
                    </p>
                  </div>
                  <div className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs font-semibold">
                    Live
                  </div>
                </div>

                {/* List */}
                <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                  {bidHistory.length === 0 ? (
                    <div className="p-8 text-center text-gray-400 flex flex-col items-center">
                      <Clock size={32} className="mb-2 opacity-20" />
                      <p>No bids yet.</p>
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
                            {/* Left: User Info */}
                            {/* CRITICAL CHANGE: Added 'flex-1 min-w-0' here so this whole block can shrink inside the row */}
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              {/* Avatar Section - Keep shrink-0 so it never squishes */}
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

                              {/* Text Content - min-w-0 allows the inner text to truncate */}
                              <div className="flex flex-col min-w-0">
                                <div className="flex items-center gap-2">
                                  {/* Name: truncate adds the '...' */}
                                  <p className="text-sm font-bold text-gray-900 truncate">
                                    {bid.bidderName}
                                  </p>

                                  {/* Badge: shrink-0 ensures the badge is always fully visible */}
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

                            {/* Right: Amount & Actions */}
                            <div className="flex items-center gap-4">
                              <div className="text-right">
                                <p
                                  className={`font-mono font-bold ${
                                    isTopBid ? 'text-amber-600 text-base' : 'text-gray-900 text-sm'
                                  }`}
                                >
                                  {formatCurrency(bid.amount)}
                                </p>
                              </div>

                              {/* Ban Button - Appears cleaner, highlights on hover */}
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
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
