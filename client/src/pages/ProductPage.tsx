import { useEffect, useState } from 'react';
import { Share2, Heart, Loader2 } from 'lucide-react'; 
import { useParams } from 'react-router-dom';
import { SellerSidebar } from '../components/seller-sidebar';
import { BidderSidebar } from '../components/bidder-sidebar';
import { Product } from '../lib/type';

const ProductDetail = () => {
  const [product, setProduct] = useState<Product | null>(null);
  const [activeImage, setActiveImage] = useState<string>('');
  const { id } = useParams<{ id: string }>();

  const fetchProduct = async () => {
    try {
      if (!id) return;
      const res = await fetch(`/api/product/${id}`);
      if (!res.ok) throw new Error('Failed to fetch product');
      const data: Product = await res.json();
      setProduct(data);
      if (!activeImage && data.images && data.images.length > 0) {
        setActiveImage(data.images[0]);
      }
    } catch (error) {
      console.error('Error fetching product:', error);
    }
  };

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const getImageUrl = (img: string) => {
    if (!img) return 'https://placehold.co/600x400?text=No+Image';
    return img.startsWith('http') ? img : `/api/assets/${img}`;
  };

  // 2. Updated Loading State
  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-gray-500">
        <Loader2 className="animate-spin mb-4 text-blue-600" size={48} />
        <p>Loading product details...</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 flex-1 py-8">
      {/* ... rest of your component remains exactly the same ... */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-8">
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
                      alt={`Thumb ${idx}`}
                      className="w-full h-full object-cover hover:opacity-80 transition"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Product description</h2>
              <div className="mb-8">
                <h3 className="text-lg font-bold text-gray-900 mb-3">Detail</h3>
                <ul className="space-y-2 text-gray-700">
                  <li>
                    <span className="font-semibold text-gray-900">Brand:</span>{' '}
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
                        Updated: {item.date}
                      </h4>
                      <p className="whitespace-pre-line text-gray-800">{item.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Q & A</h2>
              <div className="space-y-6">
                {product.qa.map((item, idx) => (
                  <div key={idx} className="space-y-3">
                    <div>
                      <h4 className="font-bold text-gray-900">{item.question}</h4>
                      <p className="text-xs text-gray-400 mt-1">Asked by {item.asker}</p>
                    </div>
                    {item.answer && (
                      <div className="bg-blue-50 border-l-4 border-blue-200 p-4 rounded-r-md">
                        <p className="text-sm font-semibold text-gray-800 mb-1">{item.responder}</p>
                        <p className="text-gray-700 text-sm">{item.answer}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-4">
            {product.isSeller ? (
              <SellerSidebar product={product} onBidSuccess={fetchProduct} />
            ) : (
              <BidderSidebar product={product} onBidSuccess={fetchProduct} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;