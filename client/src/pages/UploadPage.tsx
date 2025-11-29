import type React from 'react';
import { useState, useRef } from 'react';
import { Resolver, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const productUploadSchema = z
  .object({
    productName: z
      .string()
      .min(1, 'Product name is required')
      .min(3, 'Product name must be at least 3 characters'),
    startingPrice: z.coerce.number().positive().min(1),
    stepPrice: z.coerce.number().positive().min(1),
    buyNowPrice: z.coerce.number().positive().min(1),
    description: z
      .string()
      .min(1, 'Description is required')
      .min(10, 'Description must be at least 10 characters'),
    autoRenewal: z.boolean().default(false),
    auctionEndTime: z.coerce.date().refine(
      (val) => {
        const selectedDate = new Date(val);
        const now = new Date();
        return selectedDate > now;
      },
      {
        message: 'Auction end time must be in the future',
      }
    ),
  })
  .refine(
    (data) => {
      return data.buyNowPrice > data.startingPrice;
    },
    {
      message: 'Buy now price must be greater than starting price',
      path: ['buyNowPrice'],
    }
  );

type ProductUploadFormData = z.infer<typeof productUploadSchema>;

export default function ProductUploadForm() {
  // Managing uploaded image files (supports multiple images)
  const [uploadedImages, setUploadedImages] = useState<File[]>([]);
  // Preview URLs for uploaded images
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  // File input reference for triggering click
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Image carousel state for horizontal scrolling
  const [imageScrollIndex, setImageScrollIndex] = useState(0);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ProductUploadFormData>({
    resolver: zodResolver(productUploadSchema) as Resolver<ProductUploadFormData>,
    mode: 'onBlur',
  });

  const handleImageSelect = (files: FileList | null) => {
    if (!files) return;

    // Convert FileList to Array and filter for image types only
    const newFiles = Array.from(files).filter((file) => file.type.startsWith('image/'));

    // Limit to max 10 images
    if (uploadedImages.length + newFiles.length > 10) {
      alert('Maximum 10 images allowed');
      return;
    }

    // Add new files to the state
    setUploadedImages((prev) => [...prev, ...newFiles]);

    // Generate preview URLs for each new image
    newFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (reader.result) {
          setImagePreviews((prev) => [...prev, reader.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  // Drag img
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

  // Remove img
  const removeImage = (index: number) => {
    setUploadedImages((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  // add img by click
  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  // scroll img
  const scrollLeft = () => {
    if (imageScrollIndex > 0) {
      setImageScrollIndex(imageScrollIndex - 1);
    }
  };

  const scrollRight = () => {
    if (imageScrollIndex < Math.max(0, uploadedImages.length - 3)) {
      setImageScrollIndex(imageScrollIndex + 1);
    }
  };

  // Helper: Convert file to Base64 string
  const toBase64 = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
    });

  const onSubmit = async (data: ProductUploadFormData) => {
    try {
      if (uploadedImages.length < 4) {
        alert('Please upload at least four product images');
        return;
      }

      // 1. Convert all images to Base64 strings
      // This results in an array of strings: ["data:image/png;base64,iVBOR...", ...]
      const base64Images = await Promise.all(uploadedImages.map(toBase64));

      // 2. Prepare the JSON payload
      const payload = {
        ...data,
        images: base64Images, // Array of Base64 strings
      };

      // 3. Send as application/json
      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      reset();
      setUploadedImages([]);
      setImagePreviews([]);
      setImageScrollIndex(0);
    } catch (error) {
      console.error('Upload error:', error);
      alert('Error uploading product');
    }
  };

  return (
    <div className="flex-1 bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Page Title */}
        <h1 className="text-3xl sm:text-4xl font-bold text-center mb-8">Upload new product</h1>

        {/* Main Form Container */}
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="bg-white rounded-lg border border-gray-200 p-6 sm:p-8"
        >
          {/* Two-column layout: Form fields on left, Image upload on right */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* ================================================================
                LEFT COLUMN - FORM FIELDS
                ================================================================ */}
            <div className="space-y-6">
              {/* Product Name Field */}
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
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 transition ${
                    errors.productName
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-gray-300 focus:ring-blue-500 focus:border-transparent'
                  }`}
                  aria-invalid={errors.productName ? 'true' : 'false'}
                />
                {/* Error message display */}
                {errors.productName && (
                  <p className="mt-1 text-sm text-red-600">{errors.productName.message}</p>
                )}
              </div>

              {/* Price Fields Container - Responsive grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Starting Price */}
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
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 transition ${
                        errors.startingPrice
                          ? 'border-red-500 focus:ring-red-500'
                          : 'border-gray-300 focus:ring-blue-500 focus:border-transparent'
                      }`}
                      aria-invalid={errors.startingPrice ? 'true' : 'false'}
                    />
                    {/* Currency indicator */}
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium pointer-events-none">
                      VND
                    </span>
                  </div>
                  {errors.startingPrice && (
                    <p className="mt-1 text-sm text-red-600">{errors.startingPrice.message}</p>
                  )}
                </div>

                {/* Step Price */}
                <div>
                  <label
                    htmlFor="stepPrice"
                    className="block text-sm font-medium text-gray-900 mb-2"
                  >
                    Step price
                  </label>
                  <div className="relative">
                    <input
                      id="startingPrice"
                      type="number"
                      placeholder="0"
                      {...register('stepPrice')}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 transition ${
                        errors.startingPrice
                          ? 'border-red-500 focus:ring-red-500'
                          : 'border-gray-300 focus:ring-blue-500 focus:border-transparent'
                      }`}
                      aria-invalid={errors.startingPrice ? 'true' : 'false'}
                    />
                    {/* Currency indicator */}
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium pointer-events-none">
                      VND
                    </span>
                  </div>
                  {errors.stepPrice && (
                    <p className="mt-1 text-sm text-red-600">{errors.stepPrice.message}</p>
                  )}
                </div>

                {/* Buy Now Price */}
                <div>
                  <label
                    htmlFor="buyNowPrice"
                    className="block text-sm font-medium text-gray-900 mb-2"
                  >
                    Buy now price
                  </label>
                  <div className="relative">
                    <input
                      id="startingPrice"
                      type="number"
                      placeholder="0"
                      {...register('buyNowPrice')}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 transition ${
                        errors.startingPrice
                          ? 'border-red-500 focus:ring-red-500'
                          : 'border-gray-300 focus:ring-blue-500 focus:border-transparent'
                      }`}
                      aria-invalid={errors.startingPrice ? 'true' : 'false'}
                    />
                    {/* Currency indicator */}
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium pointer-events-none">
                      VND
                    </span>
                  </div>
                  {errors.buyNowPrice && (
                    <p className="mt-1 text-sm text-red-600">{errors.buyNowPrice.message}</p>
                  )}
                </div>
              </div>

              {/* Auction End Time Field - datetime-local input for selecting when auction ends */}
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
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 transition ${
                    errors.auctionEndTime
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-gray-300 focus:ring-blue-500 focus:border-transparent'
                  }`}
                  aria-invalid={errors.auctionEndTime ? 'true' : 'false'}
                />
                {/* Error message display */}
                {errors.auctionEndTime && (
                  <p className="mt-1 text-sm text-red-600">{errors.auctionEndTime.message}</p>
                )}
              </div>

              {/* Description Field - Textarea for longer content */}
              <div className="flex-1 flex flex-col">
                <label
                  htmlFor="description"
                  className="block text-sm font-medium text-gray-900 mb-2"
                >
                  Description
                </label>
                <textarea
                  id="description"
                  placeholder="Describe your product ..."
                  rows={12}
                  {...register('description')}
                  className={`w-full flex-1 px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition resize-none ${
                    errors.description
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-gray-300 focus:ring-blue-500 focus:border-transparent'
                  }`}
                  aria-invalid={errors.description ? 'true' : 'false'}
                />
                {errors.description && (
                  <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
                )}
              </div>
            </div>

            {/* ================================================================
                RIGHT COLUMN - IMAGE UPLOAD SECTION
                ================================================================ */}
            <div className="flex flex-col space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Upload image</label>

                {/* Drag and drop area - rectangular shape */}
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={triggerFileInput}
                  className="border-2 border-dashed border-gray-300 rounded-lg h-48 flex items-center justify-center text-center cursor-pointer transition hover:border-gray-400 hover:bg-gray-50"
                >
                  {/* Icon and text for drag-and-drop hint */}
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
                    <p className="text-gray-500 text-sm">The first one will be avatar</p>
                  </div>
                </div>

                {/* Hidden file input - triggered by click or drop */}
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target) {
                      handleImageSelect(e.target.files);
                    }
                  }}
                  className="hidden"
                  aria-label="Upload product images"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Image</label>
                <div className="relative">
                  {/* Carousel container - shows exactly 3 images */}
                  <div className="grid grid-cols-3 gap-3">
                    {/* Display 3 visible image slots based on scroll index */}
                    {Array.from({ length: 3 }).map((_, displayIndex) => {
                      const actualIndex = imageScrollIndex + displayIndex;
                      return (
                        <div
                          key={displayIndex}
                          className="relative aspect-square border-2 border-gray-200 rounded-lg overflow-hidden bg-gray-50"
                        >
                          {imagePreviews[actualIndex] ? (
                            <>
                              {/* Display uploaded image preview */}
                              <img
                                src={imagePreviews[actualIndex] || '/placeholder.svg'}
                                alt={`Preview ${actualIndex + 1}`}
                                className="w-full h-full object-cover"
                              />
                              {/* Remove button overlaid on image */}
                              <button
                                type="button"
                                onClick={() => removeImage(actualIndex)}
                                className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-700 transition text-lg leading-none"
                                aria-label={`Remove image ${actualIndex + 1}`}
                              >
                                ×
                              </button>
                            </>
                          ) : (
                            // Empty placeholder slot
                            <div className="w-full h-full bg-gray-100" />
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {uploadedImages.length > 3 && (
                    <>
                      {/* Left arrow */}
                      <button
                        type="button"
                        onClick={scrollLeft}
                        disabled={imageScrollIndex === 0}
                        className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 bg-white border-2 border-gray-300 rounded-full w-8 h-8 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition shadow-md"
                        aria-label="Scroll left"
                      >
                        <svg
                          className="w-4 h-4 text-gray-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 19l-7-7 7-7"
                          />
                        </svg>
                      </button>

                      {/* Right arrow */}
                      <button
                        type="button"
                        onClick={scrollRight}
                        disabled={imageScrollIndex >= uploadedImages.length - 3}
                        className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 bg-white border-2 border-gray-300 rounded-full w-8 h-8 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition shadow-md"
                        aria-label="Scroll right"
                      >
                        <svg
                          className="w-4 h-4 text-gray-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <label htmlFor="autoRenewal" className="flex items-center gap-3 cursor-pointer">
                  {/* Toggle switch */}
                  <div className="relative">
                    <input
                      id="autoRenewal"
                      type="checkbox"
                      {...register('autoRenewal')}
                      className="sr-only peer"
                      aria-label="Enable auto renewal"
                    />
                    {/* Toggle background */}
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </div>
                  <span className="text-sm text-gray-700 font-medium">Auto renewal</span>
                </label>
              </div>

              <div className="flex gap-8 justify-end mt-auto pt-4">
                {/* Back Button - Secondary action */}
                <button
                  type="button"
                  onClick={() => {
                    reset();
                    setUploadedImages([]);
                    setImagePreviews([]);
                    setImageScrollIndex(0);
                  }}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition cursor-pointer"
                >
                  Back
                </button>

                {/* Submit Button - Primary action (Red for emphasis) */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 disabled:bg-red-400 transition cursor-pointer"
                >
                  {isSubmitting ? 'Uploading...' : 'Submit'}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
