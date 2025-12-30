import type React from 'react';
import { useState, useRef, useEffect } from 'react';
import { Resolver, useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate } from 'react-router-dom';
import { ClipLoader } from 'react-spinners';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

// 1. Schema
const productUploadSchema = z
  .object({
    productName: z
      .string()
      .min(1, 'Product name is required')
      .min(3, 'Product name must be at least 3 characters'),
    categoryId: z.coerce.number().min(1, 'Please select a category'),
    startingPrice: z.coerce.number().positive().min(1),
    stepPrice: z.coerce.number().positive().min(1),
    buyNowPrice: z.coerce.number().min(0).default(0),
    description: z
      .string()
      .min(1, 'Description is required')
      .min(10, 'Description must be at least 10 characters'),
    autoRenewal: z.boolean().default(false),
    isRequiredReview: z.boolean().default(false),allowUnratedBidders: z.boolean().default(true),
    auctionEndTime: z.coerce.date().refine((val) => val > new Date(), {
      message: 'Auction end time must be in the future',
    }),
  })
  .refine(
    (data) => {
      if (!data.buyNowPrice || data.buyNowPrice === 0) return true;
      const minRequired = data.startingPrice + data.stepPrice;
      return data.buyNowPrice > minRequired;
    },
    {
      message: 'Buy Now price must be higher than Starting Price + Step Price',
      path: ['buyNowPrice'],
    }
  );

type ProductUploadFormData = z.infer<typeof productUploadSchema>;

interface Category {
  category_id: number;
  name_level_1: string;
  name_level_2: string;
}

export default function ProductUploadForm() {
  const [uploadedImages, setUploadedImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageScrollIndex, setImageScrollIndex] = useState(0);

  const navigate = useNavigate();

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProductUploadFormData>({
    resolver: zodResolver(productUploadSchema) as Resolver<ProductUploadFormData>,
    mode: 'onBlur',
  });

  const modules = {
    toolbar: [
      [{ header: [1, 2, false] }],
      ['bold', 'italic', 'underline', 'strike', 'blockquote'],
      [{ list: 'ordered' }, { list: 'bullet' }],
      ['link'],
      ['clean'],
    ],
  };

  const toBase64 = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
    });

  const handleImageSelect = async (files: FileList | null) => {
    if (!files) return;
    const newFiles = Array.from(files).filter((file) => file.type.startsWith('image/'));
    if (uploadedImages.length + newFiles.length > 10) {
      alert('Maximum 10 images allowed');
      return;
    }
    const newPreviews = await Promise.all(newFiles.map(toBase64));
    setUploadedImages((prev) => [...prev, ...newFiles]);
    setImagePreviews((prev) => [...prev, ...newPreviews]);
  };

  const removeImage = (index: number) => {
    setUploadedImages((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.currentTarget.classList.add('bg-blue-50', 'border-blue-400');
  };
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.currentTarget.classList.remove('bg-blue-50', 'border-blue-400');
  };
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.currentTarget.classList.remove('bg-blue-50', 'border-blue-400');
    handleImageSelect(e.dataTransfer.files);
  };
  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };
  const scrollLeft = () => {
    if (imageScrollIndex > 0) setImageScrollIndex(imageScrollIndex - 1);
  };
  const scrollRight = () => {
    if (imageScrollIndex < Math.max(0, uploadedImages.length - 3))
      setImageScrollIndex(imageScrollIndex + 1);
  };

  const onSubmit = async (data: ProductUploadFormData) => {
    try {
      if (uploadedImages.length < 4) {
        alert('Please upload at least four product images');
        return;
      }
      const base64Images = await Promise.all(uploadedImages.map(toBase64));

      // data now includes 'isRequiredReview' automatically
      const payload = { ...data, images: base64Images };
      console.log('Submitting Payload:', payload);

      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        credentials: 'include',
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      navigate('/');
    } catch (error) {
      console.error('Upload error:', error);
      alert('Error uploading product');
    }
  };

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const resUpload = await fetch('/api/upload', { credentials: 'include' });
        if (isMounted && !resUpload.ok) {
          navigate('/');
          return;
        }
        const resCat = await fetch('/api/categories');
        const dataCat = await resCat.json();
        if (isMounted && dataCat.isSuccess) {
          setCategories(dataCat.data);
        }
      } catch (err) {
        console.error('Failed to load initial data', err);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="flex-1 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl sm:text-4xl font-bold text-center mb-8">Upload new product</h1>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="bg-white rounded-lg border border-gray-200 p-6 sm:p-8"
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              {/* Product Name */}
              <div>
                <label
                  htmlFor="productName"
                  className="block text-sm font-medium text-gray-900 mb-2"
                >
                  Product name
                </label>
                <input
                  id="productName"
                  type="text"
                  placeholder="Enter product name"
                  {...register('productName')}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 transition ${errors.productName ? 'border-[#8D0000] focus:ring-[#8D0000]' : 'border-gray-300 focus:ring-blue-500'}`}
                />
                {errors.productName && (
                  <p className="mt-1 text-sm text-[#8D0000]">{errors.productName.message}</p>
                )}
              </div>

              {/* Category Select */}
              <div>
                <label
                  htmlFor="categoryId"
                  className="block text-sm font-medium text-gray-900 mb-2"
                >
                  Category
                </label>
                <div className="relative">
                  <select
                    id="categoryId"
                    {...register('categoryId')}
                    defaultValue=""
                    className={`w-full px-4 py-2 border rounded-lg appearance-none bg-white focus:outline-none focus:ring-2 transition ${
                      errors.categoryId
                        ? 'border-[#8D0000] focus:ring-[#8D0000]'
                        : 'border-gray-300 focus:ring-blue-500'
                    }`}
                  >
                    <option value="" disabled>
                      Select a category
                    </option>
                    {categories &&
                      categories.map(
                        (cat) =>
                          cat.name_level_2 ? (
                            <option key={cat.category_id} value={cat.category_id}>
                              {cat.name_level_2} ({cat.name_level_1})
                            </option>
                          ) : null
                      )}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                    <svg
                      className="fill-current h-4 w-4"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                    </svg>
                  </div>
                </div>
                {errors.categoryId && (
                  <p className="mt-1 text-sm text-[#8D0000]">{errors.categoryId.message}</p>
                )}
              </div>

              {/* Prices Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label
                    htmlFor="startingPrice"
                    className="block text-sm font-medium text-gray-900 mb-2"
                  >
                    Starting price
                  </label>
                  <div className="relative">
                    <input
                      id="startingPrice"
                      type="number"
                      placeholder="0"
                      {...register('startingPrice')}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 transition ${errors.startingPrice ? 'border-[#8D0000] focus:ring-[#8D0000]' : 'border-gray-300 focus:ring-blue-500'}`}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium pointer-events-none">
                      USD
                    </span>
                  </div>
                  {errors.startingPrice && (
                    <p className="mt-1 text-sm text-[#8D0000]">{errors.startingPrice.message}</p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="stepPrice"
                    className="block text-sm font-medium text-gray-900 mb-2"
                  >
                    Step price
                  </label>
                  <div className="relative">
                    <input
                      id="stepPrice"
                      type="number"
                      placeholder="0"
                      {...register('stepPrice')}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 transition ${errors.stepPrice ? 'border-[#8D0000] focus:ring-[#8D0000]' : 'border-gray-300 focus:ring-blue-500'}`}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium pointer-events-none">
                      USD
                    </span>
                  </div>
                  {errors.stepPrice && (
                    <p className="mt-1 text-sm text-[#8D0000]">{errors.stepPrice.message}</p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="buyNowPrice"
                    className="block text-sm font-medium text-gray-900 mb-2"
                  >
                    Buy now price
                  </label>
                  <div className="relative">
                    <input
                      id="buyNowPrice"
                      type="number"
                      placeholder="0"
                      {...register('buyNowPrice')}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 transition ${errors.buyNowPrice ? 'border-[#8D0000] focus:ring-[#8D0000]' : 'border-gray-300 focus:ring-blue-500'}`}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium pointer-events-none">
                      USD
                    </span>
                  </div>
                  {errors.buyNowPrice && (
                    <p className="mt-1 text-sm text-[#8D0000]">{errors.buyNowPrice.message}</p>
                  )}
                </div>
              </div>

              {/* Auction Time */}
              <div>
                <label
                  htmlFor="auctionEndTime"
                  className="block text-sm font-medium text-gray-900 mb-2"
                >
                  Time end of auction
                </label>
                <input
                  id="auctionEndTime"
                  type="datetime-local"
                  {...register('auctionEndTime')}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 transition ${errors.auctionEndTime ? 'border-[#8D0000] focus:ring-[#8D0000]' : 'border-gray-300 focus:ring-blue-500'}`}
                />
                {errors.auctionEndTime && (
                  <p className="mt-1 text-sm text-[#8D0000]">{errors.auctionEndTime.message}</p>
                )}
              </div>

              {/* Description */}
              <div className="flex-1 flex flex-col">
                <label
                  htmlFor="description"
                  className="block text-sm font-medium text-gray-900 mb-2"
                >
                  Description
                </label>

                <Controller
                  name="description"
                  control={control}
                  render={({ field }) => (
                    <div className={errors.description ? 'border border-[#8D0000] rounded-lg' : ''}>
                      <ReactQuill
                        theme="snow"
                        value={field.value || ''}
                        onChange={field.onChange}
                        modules={modules}
                        className="bg-white rounded-lg h-64 mb-12"
                      />
                    </div>
                  )}
                />

                {errors.description && (
                  <p className="mt-1 text-sm text-[#8D0000]">{errors.description.message}</p>
                )}
              </div>
            </div>

            {/* Right Side: Images */}
            <div className="flex flex-col space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Upload image</label>
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={triggerFileInput}
                  className="border-2 border-dashed border-gray-300 rounded-lg h-48 flex items-center justify-center text-center cursor-pointer transition hover:border-gray-400 hover:bg-gray-50"
                >
                  <div className="flex flex-col items-center justify-center">
                    <svg
                      className="w-12 h-12 text-gray-400 mb-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                    <p className="text-gray-500 text-sm">Drag photo in</p>
                  </div>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target) handleImageSelect(e.target.files);
                  }}
                  className="hidden"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Image</label>
                <div className="relative">
                  <div className="grid grid-cols-3 gap-3">
                    {Array.from({ length: 3 }).map((_, displayIndex) => {
                      const actualIndex = imageScrollIndex + displayIndex;
                      return (
                        <div
                          key={displayIndex}
                          className="relative aspect-square border-2 border-gray-200 rounded-lg overflow-hidden bg-gray-50"
                        >
                          {imagePreviews[actualIndex] ? (
                            <>
                              <img
                                src={imagePreviews[actualIndex] || '/placeholder.svg'}
                                alt="Preview"
                                className="w-full h-full object-cover"
                              />
                              <button
                                type="button"
                                onClick={() => removeImage(actualIndex)}
                                className="absolute top-1 right-1 bg-[#8D0000] text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-[#8D0000] transition"
                              >
                                ×
                              </button>
                            </>
                          ) : (
                            <div className="w-full h-full bg-gray-100" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                  {uploadedImages.length > 3 && (
                    <>
                      <button
                        type="button"
                        onClick={scrollLeft}
                        disabled={imageScrollIndex === 0}
                        className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 bg-white border border-gray-300 rounded-full w-8 h-8 flex justify-center items-center shadow-md"
                      >
                        {'<'}
                      </button>
                      <button
                        type="button"
                        onClick={scrollRight}
                        disabled={imageScrollIndex >= uploadedImages.length - 3}
                        className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 bg-white border border-gray-300 rounded-full w-8 h-8 flex justify-center items-center shadow-md"
                      >
                        {'>'}
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Auto Renewal Toggle */}
              <div className="flex items-center gap-3">
                <label htmlFor="autoRenewal" className="flex items-center gap-3 cursor-pointer">
                  <div className="relative">
                    <input
                      id="autoRenewal"
                      type="checkbox"
                      {...register('autoRenewal')}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </div>
                  <span className="text-sm text-gray-700 font-medium">Auto renewal</span>
                </label>
              </div>

              <div className="flex items-center gap-3">
                <label htmlFor="isRequiredReview" className="flex items-center gap-3 cursor-pointer">
                  <div className="relative">
                    <input
                      id="isRequiredReview"
                      type="checkbox"
                      {...register('isRequiredReview')}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </div>
                  <span className="text-sm text-gray-700 font-medium">Required review</span>
                </label>
              </div>

              <div className="flex items-center gap-3">
                  <label htmlFor="allowUnratedBidders" className="flex items-center gap-3 cursor-pointer">
                    <div className="relative">
                      <input
                        id="allowUnratedBidders"
                        type="checkbox"
                        {...register('allowUnratedBidders')}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm text-gray-700 font-medium">Allow unrated bidders</span>
                      <span className="text-xs text-gray-500">Allow users with 0 ratings to bid</span>
                    </div>
                  </label>
                </div>

              <div className="flex gap-8 justify-end mt-auto pt-4">
                <button
                  type="button"
                  onClick={() => navigate('/')}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition"
                >
                  Back
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2 bg-[#8D0000] text-white font-medium rounded-lg hover:bg-[#8D0000] disabled:bg-[#8D0000] disabled:opacity-70 disabled:cursor-not-allowed transition flex items-center justify-center min-w-[100px]"
                >
                  {isSubmitting ? (
                    <ClipLoader color="#ffffff" loading={true} size={20} />
                  ) : (
                    'Submit'
                  )}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}