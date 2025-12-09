import { useEffect, useState } from 'react';
import { Share2, Heart, ChevronRight, ThumbsUp } from 'lucide-react';
import { ClipLoader } from 'react-spinners';
import { useParams } from 'react-router-dom';
import { SellerSidebar } from '../components/seller-sidebar';
import { BidderSidebar } from '../components/bidder-sidebar';
import { Product } from '../lib/type';

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  })
    .format(amount)
    .replace('₫', '');
};

const ProductPage = () => {
  const [product, setProduct] = useState<Product | null>(null);
  const [activeImage, setActiveImage] = useState<string>('');
  const { id } = useParams<{ id: string }>();

  // 1. Fetch dữ liệu
  const fetchProduct = async () => {
    try {
      if (!id) return;
      setProduct(null);
      setActiveImage('');

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
  };

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const getImageUrl = (img: string) => {
    if (!img) return 'https://placehold.co/600x400?text=No+Image';
    return img.startsWith('http') ? img : `/api/assets/${img}`;
  };

  if (!product) {
    return (
      <div className="min-h-[50vh] w-full flex flex-col justify-center items-center bg-gray-50">
        <ClipLoader size={40} color="#8D0000" />
        <p className="mt-4 text-gray-500 text-sm font-medium">Loading product details...</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen py-8 font-sans text-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <div className="text-sm breadcrumbs mb-6 text-gray-500 flex items-center gap-2">
          <span>Home</span> <ChevronRight size={14} />
          <span>{product.details.brand}</span> <ChevronRight size={14} />
          <span className="font-bold text-gray-900 line-clamp-1">{product.title}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
          {/* CỘT TRÁI */}
          <div className="lg:col-span-8 space-y-8">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
              <div className="aspect-[4/3] w-full bg-gray-100 rounded-lg overflow-hidden mb-4 relative group">
                <img
                  src={getImageUrl(activeImage || product.images[0])}
                  alt="Product Main"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute top-4 right-4 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="p-2 bg-white/90 backdrop-blur rounded-full hover:bg-white text-gray-700 shadow-sm transition">
                    <Share2 size={18} />
                  </button>
                  <button className="p-2 bg-white/90 backdrop-blur rounded-full hover:bg-white text-gray-700 shadow-sm transition">
                    <Heart size={18} />
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-5 gap-3">
                {product.images.map((img, idx) => (
                  <div
                    key={idx}
                    onClick={() => setActiveImage(img)}
                    className={`cursor-pointer rounded-md overflow-hidden border-2 aspect-square ${activeImage === img ? 'border-[#8D0000]' : 'border-transparent hover:border-gray-300'}`}
                  >
                    <img
                      src={getImageUrl(img)}
                      alt={`Thumb ${idx}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Description */}
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 mb-6 border-l-4 border-[#8D0000] pl-3">
                Product details
              </h2>
              <div className="mb-8">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-4">
                  Specifications
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-3 gap-x-8 text-sm text-gray-700">
                  <div className="flex justify-between border-b border-gray-100 pb-2">
                    <span className="font-medium text-gray-500">Brand</span>
                    <span className="font-semibold text-gray-900">{product.details.brand}</span>
                  </div>
                  <div className="flex justify-between border-b border-gray-100 pb-2">
                    <span className="font-medium text-gray-500">Type</span>
                    <span className="font-semibold text-gray-900">{product.details.engine}</span>
                  </div>
                  {product.details.condition && (
                    <div className="flex justify-between border-b border-gray-100 pb-2">
                      <span className="font-medium text-gray-500">Condition</span>
                      <span className="font-semibold text-gray-900">
                        {product.details.condition}
                      </span>
                    </div>
                  )}
                  {product.details.color && (
                    <div className="flex justify-between border-b border-gray-100 pb-2">
                      <span className="font-medium text-gray-500">Color</span>
                      <span className="font-semibold text-gray-900">{product.details.color}</span>
                    </div>
                  )}
                </div>
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-4">
                  Description
                </h3>
                <div className="space-y-4 text-gray-600 leading-relaxed text-sm text-justify">
                  {product.description.map((item, idx) => (
                    <div key={idx}>
                      <p className="whitespace-pre-line">{item.text}</p>
                      <p className="text-xs text-gray-400 mt-1 italic">Updated: {item.date}</p>
                    </div>
                  ))}
                </div>
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

        {/* Qna */}
        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 mb-12">
          <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
            <h2 className="text-xl font-bold text-gray-900">Questions & Answers</h2>
            {!product.isSeller && (
              <button className="bg-[#8D0000] text-white px-5 py-2 rounded text-sm font-bold hover:bg-[#6b0000] transition shadow-sm">
                Ask a question
              </button>
            )}
          </div>
          <div className="space-y-6">
            {product.qa.map((item, idx) => (
              <div key={idx} className="flex flex-col gap-3">
                <div>
                  <h4 className="font-bold text-gray-900 text-sm">{item.question}</h4>
                  <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
                    <span>{item.asker}</span>
                    <span>•</span>
                    <span>{item.time}</span>
                  </div>
                </div>
                {item.answer ? (
                  <div className="bg-gray-50 p-4 rounded-lg border-l-2 border-[#8D0000] ml-0 md:ml-6">
                    <p className="text-xs font-bold text-gray-900 mb-1">
                      {item.responder} <span className="text-gray-400 font-normal">(Seller)</span>
                    </p>
                    <p className="text-sm text-gray-700">{item.answer}</p>
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 italic pl-4">Waiting for answer...</p>
                )}
              </div>
            ))}
            {product.qa.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-400 text-sm">No questions yet.</p>
              </div>
            )}
          </div>
        </div>

        {/* --- RELATED PRODUCTS --- */}
        {product.relatedProducts && product.relatedProducts.length > 0 && (
          <div className="mt-16 mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Other products you might like</h2>
              <a
                href="/category"
                className="text-sm font-bold text-[#8D0000] hover:underline flex items-center gap-1"
              >
                View all <ChevronRight size={16} />
              </a>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
              {product.relatedProducts.map((prod) => (
                <a
                  href={`/product/${prod.id}`}
                  key={prod.id}
                  className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group flex flex-col h-full"
                >
                  <div className="aspect-[4/3] bg-gray-100 relative overflow-hidden border-b border-gray-50">
                    <img
                      src={getImageUrl(prod.image || '')}
                      alt={prod.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute bottom-2 left-2 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-md shadow-sm border border-gray-200 text-xs font-semibold text-gray-700">
                      {prod.bidCount} Bids
                    </div>
                  </div>

                  <div className="p-4 flex flex-col flex-1">
                    <h3
                      className="font-bold text-gray-900 text-sm mb-2 line-clamp-2 min-h-[2.5rem] group-hover:text-[#8D0000] transition-colors"
                      title={prod.name}
                    >
                      {prod.name}
                    </h3>

                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] text-gray-500 font-medium">Current Price</span>
                      <span className="text-[#8D0000] font-bold text-lg">
                        {formatCurrency(prod.price)} <span className="text-xs">VND</span>
                      </span>
                    </div>

                    <div className="text-[11px] text-gray-400 mb-3">Posted: {prod.postedDate}</div>

                    <div className="bg-gray-50 rounded px-2.5 py-2 mb-3 border border-gray-100">
                      <p className="text-[10px] text-gray-400 mb-0.5 font-bold uppercase tracking-wider">
                        Highest Bidder
                      </p>
                      <div className="flex items-center gap-1.5">
                        <div className="w-4 h-4 rounded-full bg-gray-200 flex items-center justify-center text-[8px] font-bold text-gray-500">
                          {prod.bidderName.charAt(0)}
                        </div>
                        <p className="text-xs font-semibold text-gray-800 truncate flex-1">
                          {prod.bidderName}
                        </p>
                      </div>
                    </div>

                    <div className="text-right mb-3">
                      <span className="text-[#8D0000] text-xs font-bold bg-red-50 px-2 py-0.5 rounded-full">
                        {prod.timeLeft}
                      </span>
                    </div>

                    <div className="mt-auto pt-2">
                      {prod.buyNowPrice ? (
                        <button className="w-full bg-[#8D0000] hover:bg-[#6b1e1e] text-white font-bold py-2 rounded-lg text-xs uppercase tracking-wide transition-colors shadow-sm flex items-center justify-center gap-1">
                          Buy Now <span className="opacity-80">|</span>{' '}
                          {formatCurrency(prod.buyNowPrice)}
                        </button>
                      ) : (
                        <button className="w-full bg-gray-100 text-gray-400 font-bold py-2 rounded-lg text-xs uppercase cursor-not-allowed">
                          Bid Only
                        </button>
                      )}
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductPage;
