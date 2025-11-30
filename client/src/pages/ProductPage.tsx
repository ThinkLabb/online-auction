import { useEffect, useState } from 'react';
import { Star, User, ShieldCheck, MapPin, Heart, Share2 } from 'lucide-react';
import { useParams } from 'react-router-dom';

// --- INTERFACES ---

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
}

const ProductDetail = () => {
  const [product, setProduct] = useState<Product | null>(null);
  const [activeImage, setActiveImage] = useState<string>('');
  const [bidAmount, setBidAmount] = useState<string>('');
  const { id } = useParams<{ id: string }>();

  useEffect(() => {
    (async () => {
      try {
        if (!id) return;
        const res = await fetch(`/api/product/${id}`);
        if (!res.ok) throw new Error('Failed to fetch');

        const data: Product = await res.json();
        setProduct(data);

        if (data.images && data.images.length > 0) {
          setActiveImage(data.images[0]);
        }
      } catch (error) {
        console.error('Error fetching product:', error);
      }
    })();
  }, [id]);

  // Helper to handle image URLs (if it's a full URL use it, otherwise use api path)
  const getImageUrl = (img: string) => {
    if (!img) return 'https://placehold.co/600x400?text=No+Image';
    return img.startsWith('http') ? img : `/api/assets/${img}`;
  };

  if (!product) return <div className="p-10 text-center">Loading product details...</div>;

  // Calculate minimum next bid for display
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

              {/* --- ACTION FORM (RESTORED) --- */}
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

                <button className="w-full bg-red-800 text-white font-bold py-3 rounded shadow hover:bg-red-900 transition duration-200">
                  Place bid
                </button>
                <button className="w-full bg-white border border-red-800 text-red-800 font-bold py-3 rounded shadow-sm hover:bg-red-50 transition duration-200">
                  Buy now for {product.buyNowPrice.toLocaleString()} VND
                </button>

                <p className="text-[10px] text-center text-gray-400 mt-2">
                  By bidding, you agree to our terms and conditions
                </p>
              </div>
            </div>

            {/* Seller Card */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h3 className="text-sm font-bold text-gray-900 mb-4">Seller</h3>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-500">
                  <User size={20} />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">{product.seller.name}</p>
                  <div className="flex items-center text-xs text-yellow-500">
                    <Star size={12} fill="currentColor" className="mr-1" />
                    <span className="font-medium text-gray-700 mr-1">{product.seller.rating}</span>
                    <span className="text-gray-400">({product.seller.reviews} reviews)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
