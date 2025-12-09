// --- src/pages/ProductPage.tsx ---

import { useEffect, useState } from 'react';
import { Share2, Heart } from 'lucide-react';
import { ClipLoader } from 'react-spinners';
import { useParams } from 'react-router-dom';
import { SellerSidebar } from '../components/seller-sidebar';
import { BidderSidebar } from '../components/bidder-sidebar';
import { Product } from '../lib/type'; // Đảm bảo đã import từ file type.ts đã sửa

// Helper format tiền tệ (Ví dụ: 5.000.000)
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  })
    .format(amount)
    .replace('₫', '');
};

const ProductDetail = () => {
  const [product, setProduct] = useState<Product | null>(null);
  const [activeImage, setActiveImage] = useState<string>('');
  const { id } = useParams<{ id: string }>();

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
  }, [id]); // Chạy lại khi ID trên URL thay đổi

  const getImageUrl = (img: string) => {
    if (!img) return 'https://placehold.co/600x400?text=No+Image';
    return img.startsWith('http') ? img : `/api/assets/${img}`;
  };

  if (!product) {
    return (
      <div className="min-h-[50vh] w-full flex flex-col justify-center items-center">
        <ClipLoader size={50} color="#8D0000" />
        <p className="mt-4 text-gray-600">Loading product...</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 flex-1 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* CỘT TRÁI: ẢNH & CHI TIẾT */}
          <div className="lg:col-span-8 space-y-8">
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div className="aspect-4/3 w-full bg-gray-200 rounded-lg overflow-hidden mb-4 relative">
                <img
                  src={getImageUrl(activeImage)}
                  alt="Product Main"
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-4 right-4 flex space-x-2">
                  <button className="p-2 bg-white/80 rounded-full hover:bg-white text-gray-700 transition">
                    <Share2 size={20} />
                  </button>
                  <button className="p-2 bg-white/80 rounded-full hover:bg-white text-gray-700 transition">
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
                {product.qa.length === 0 && (
                  <p className="text-gray-400 italic">No questions yet.</p>
                )}
              </div>
            </div>
          </div>

          {/* CỘT PHẢI: SIDEBAR */}
          <div className="lg:col-span-4">
            {product.isSeller ? (
              <SellerSidebar product={product} onBidSuccess={fetchProduct} />
            ) : (
              <BidderSidebar product={product} onBidSuccess={fetchProduct} />
            )}
          </div>
        </div>

        {/* RELATED PRODUCTS */}
        {product.relatedProducts && product.relatedProducts.length > 0 && (
          <div className="mt-12 mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Other products</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {product.relatedProducts.map((prod) => (
                <a
                  href={`/product/${prod.id}`}
                  key={prod.id}
                  className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-xl transition-all duration-300 group flex flex-col h-full"
                >
                  {/* ẢNH & BADGE */}
                  <div className="aspect-[4/3] bg-gray-100 relative overflow-hidden">
                    <img
                      src={getImageUrl(prod.image || '')}
                      alt={prod.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-sm px-3 py-1 rounded shadow-sm border border-gray-200 text-xs font-medium text-gray-700">
                      Bids: {prod.bidCount}
                    </div>
                  </div>

                  {/* THÔNG TIN CARD */}
                  <div className="p-4 flex flex-col flex-1">
                    <h3
                      className="font-bold text-gray-900 text-base mb-2 line-clamp-1"
                      title={prod.name}
                    >
                      {prod.name}
                    </h3>

                    <div className="mb-2">
                      <span className="text-xs text-gray-500 block">Current Price</span>
                      <span className="text-[#8D0000] font-bold text-xl">
                        {formatCurrency(prod.price)} <span className="text-sm">VND</span>
                      </span>
                    </div>

                    <div className="text-xs text-gray-400 mb-3">Posted: {prod.postedDate}</div>

                    <div className="bg-gray-50 rounded p-2 mb-2 border border-gray-100">
                      <p className="text-[10px] text-gray-400 mb-0.5">Highest Bidder</p>
                      <p className="text-sm font-medium text-gray-800 truncate">
                        {prod.bidderName}
                      </p>
                    </div>

                    <div className="text-right mb-3">
                      <span className="text-[#8D0000] text-xs font-bold">{prod.timeLeft}</span>
                    </div>

                    <div className="mt-auto">
                      {prod.buyNowPrice ? (
                        <button className="w-full bg-[#6b1e1e] hover:bg-[#521616] text-white font-bold py-2.5 rounded text-sm transition-colors shadow-sm">
                          Buy Now: {formatCurrency(prod.buyNowPrice)} VND
                        </button>
                      ) : (
                        <button className="w-full bg-gray-100 text-gray-400 font-bold py-2.5 rounded text-sm cursor-not-allowed">
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

export default ProductDetail;
