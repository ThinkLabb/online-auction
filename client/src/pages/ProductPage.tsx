import { useEffect, useState } from 'react';
import { Share2, Heart, ChevronRight, Plus, Pencil } from 'lucide-react'; // Removed unused imports
import { ClipLoader } from 'react-spinners';
import { useParams } from 'react-router-dom';
import ReactQuill from 'react-quill-new'; // Import Quill
import 'react-quill-new/dist/quill.snow.css'; // Import Styles

import { SellerSidebar } from '../components/seller-sidebar';
import { BidderSidebar } from '../components/bidder-sidebar';
import { ProductQA } from '../components/productQA';
import { Product } from '../lib/type';

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  })
    .format(amount)
    .replace('₫', '');
};

// Toolbar configuration for the Append Info box (simplified)
const quillModules = {
  toolbar: [['bold', 'italic', 'underline'], [{ list: 'ordered' }, { list: 'bullet' }], ['clean']],
};

const ProductPage = () => {
  const [product, setProduct] = useState<Product | null>(null);
  const [activeImage, setActiveImage] = useState<string>('');

  const { id } = useParams<{ id: string }>();

  const [isAddingDesc, setIsAddingDesc] = useState(false);
  const [newDesc, setNewDesc] = useState('');
  const [isSavingDesc, setIsSavingDesc] = useState(false);

  // 1. Fetch dữ liệu
  const fetchProduct = async () => {
    try {
      if (!id) return;
      // setProduct(null); // Optional: Comment out to prevent flashing loading screen on re-fetch
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

  // Edit description handler
  const handleAppendDescription = async () => {
    // Validation: Strip HTML tags to check if it's truly empty
    const plainText = newDesc.replace(/<[^>]+>/g, '').trim();

    if (!plainText) {
      alert('Please enter description content');
      return;
    }

    setIsSavingDesc(true);
    try {
      const res = await fetch(`/api/product/${product?.id}/description`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: newDesc }), // Send HTML string
        credentials: 'include',
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Failed to update');
      }

      alert('Description updated successfully!');
      setNewDesc('');
      setIsAddingDesc(false);
      fetchProduct();
    } catch (error: any) {
      alert(error.message);
    } finally {
      setIsSavingDesc(false);
    }
  };

  if (!product) {
    return (
      <div className="min-h-[50vh] w-full flex flex-col justify-center items-center">
        <ClipLoader size={40} color="#8D0000" />
        <p className="mt-4 text-gray-500 text-sm font-medium">Loading product details...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 font-sans text-black">
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

            {/* Description & Specs Container */}
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 mb-6 border-l-4 border-[#8D0000] pl-3">
                Product details
              </h2>

              {/* --- SPECIFICATIONS --- */}
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

              {/* --- DESCRIPTION --- */}
              <div>
                <div className="flex justify-between items-end mb-4">
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">
                    Description
                  </h3>
                  {product.isSeller && !isAddingDesc && (
                    <button
                      onClick={() => setIsAddingDesc(true)}
                      className="text-xs font-bold text-[#8D0000] flex items-center gap-1 hover:bg-red-50 px-2 py-1 rounded transition-colors"
                    >
                      <Plus size={14} /> Add Info
                    </button>
                  )}
                </div>

                {/* FORM NHẬP LIỆU (UPDATED FOR QUILL) */}
                {isAddingDesc && (
                  <div className="mb-6 bg-gray-50 p-4 rounded-lg border border-gray-200 animate-in fade-in">
                    <h4 className="text-xs font-bold text-gray-800 mb-2 flex items-center gap-1">
                      <Pencil size={12} /> Append info:
                    </h4>

                    {/* Quill Editor */}
                    <div className="bg-white mb-3">
                      <ReactQuill
                        theme="snow"
                        value={newDesc}
                        onChange={setNewDesc}
                        modules={quillModules}
                        className="h-32 mb-10" // mb-10 handles toolbar overflow space usually
                      />
                    </div>

                    <div className="flex justify-end gap-2 mt-2">
                      <button
                        onClick={() => {
                          setIsAddingDesc(false);
                          setNewDesc('');
                        }}
                        className="px-3 py-1 text-xs font-bold text-gray-600 bg-white border border-gray-300 hover:bg-gray-100 rounded"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleAppendDescription}
                        disabled={isSavingDesc}
                        className="px-3 py-1 text-xs font-bold text-white bg-[#8D0000] hover:bg-[#6b0000] rounded"
                      >
                        {isSavingDesc ? <ClipLoader size={10} color="#fff" /> : 'Save'}
                      </button>
                    </div>
                  </div>
                )}

                {/* List of descriptions */}
                <div className="space-y-4 text-gray-600 leading-relaxed text-sm text-justify">
                  {product.description.map((item, idx) => (
                    <div
                      key={idx}
                      className={idx > 0 ? 'border-t border-dashed border-gray-300 pt-4 mt-2' : ''}
                    >
                      {idx > 0 && (
                        <div className="flex items-center gap-1 text-[#8D0000] font-bold text-[10px] mb-1 bg-red-50 w-fit px-2 py-0.5 rounded">
                          <Pencil size={10} />
                          <span>UPDATE: {item.date}</span>
                        </div>
                      )}

                      <div
                        className="content-html"
                        dangerouslySetInnerHTML={{ __html: item.text }}
                      />

                      {idx === 0 && item.date && (
                        <p className="text-xs text-gray-400 mt-2 italic">
                          Original posted: {item.date}
                        </p>
                      )}
                    </div>
                  ))}
                  {product.description.length === 0 && (
                    <p className="italic text-gray-400">No description provided.</p>
                  )}
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
        <div className="mt-8">
          <ProductQA product={product} onRefresh={fetchProduct} />
        </div>

        {/* Related Products - Logic Hidden to save space as it was unchanged */}
        {product.relatedProducts && product.relatedProducts.length > 0 && (
          <div className="mt-16 mb-12">
            {/* ... (Existing related products code) ... */}
            {/* I'm omitting the full render here to keep the answer focused, 
                   but in your real file, keep the code you had below ProductQA */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Other products</h2>
              {/* ... */}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
              {product.relatedProducts.map((prod) => (
                <a
                  href={`/product/${prod.id}`}
                  key={prod.id}
                  className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group flex flex-col h-full"
                >
                  {/* ... Product Card Content ... */}
                  <div className="p-4 flex flex-col flex-1">
                    <h3 className="font-bold text-gray-900 text-sm mb-2 line-clamp-2">
                      {prod.name}
                    </h3>
                    <div className="mt-auto pt-2">
                      <span className="text-[#8D0000] font-bold">
                        {formatCurrency(prod.price)} VND
                      </span>
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
