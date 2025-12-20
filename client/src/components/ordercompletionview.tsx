'use client';

import { useState, ChangeEvent, useEffect } from 'react';
import { CheckCircle2, Circle, MessageSquare, XCircle, ThumbsUp, ThumbsDown } from 'lucide-react';
import { OrderChat } from './order-chat';

// ---------- TYPES ----------
type OrderStatus = 'pending_payment' | 'payment_confirmed' | 'shipped' | 'completed' | 'cancelled';

type LikeStatus = 'like' | 'dislike' | null;

interface Order {
  order_id: string;
  product_name: string;
  final_price: number;
  status: OrderStatus;
  shipping_address: string | null;
  product_id: string;
  is_seller: boolean;
  cur_user_id: string;
  is_reviewed: boolean;
  partner_name: string;
  partner_id: string;
  cur_name: string;
}

// ---------- COMPONENT ----------
export function OrderCompletionView({ order: orderProp }: { order: Order }) {
  const [order, setOrder] = useState<Order>(orderProp);
  const [showChat, setShowChat] = useState(false);
  const [shippingAddress, setShippingAddress] = useState(order.shipping_address ?? '');

  // ⭐ Invoice file + preview
  const [paymentInvoice, setPaymentInvoice] = useState<File | null>(null);
  const [paymentInvoicePreview, setPaymentInvoicePreview] = useState<string | null>(null);

  const [shippingInvoice, setShippingInvoice] = useState<File | null>(null);
  const [shippingInvoicePreview, setShippingInvoicePreview] = useState<string | null>(null);

  // ⭐ Rating / Review
  const [likeStatus, setLikeStatus] = useState<LikeStatus>(null);
  const [review, setReview] = useState('');
  const [reviewSubmitted, setReviewSubmitted] = useState(order.is_reviewed);

  const isBuyer = !order.is_seller;
  const isCancelled = order.status === 'cancelled';

  // ---------- UI CLASSES ----------
  const PRIMARY = 'bg-[#8D0000] text-white hover:bg-gray-800';
  const DESTRUCTIVE = 'bg-black text-white hover:cursor-pointer';
  const MUTE = 'bg-gray-100';

  // ---------- STEPS ----------
  const steps = [
    {
      number: 1,
      title: 'Provide address & payment invoice',
      description: 'Bidder enters shipping address and completes payment',
      completed: !!order.shipping_address && order.status !== 'pending_payment',
    },
    {
      number: 2,
      title: 'Confirm & ship order',
      description: 'Seller confirms and ships the order',
      completed: order.status === 'shipped' || order.status === 'completed',
    },
    {
      number: 3,
      title: 'Receive & complete',
      description: 'Bidder confirms item received',
      completed: order.status === 'completed',
    },
  ];

  useEffect(() => {
    setOrder(orderProp);
    setShippingAddress(orderProp.shipping_address ?? '');
    setReviewSubmitted(orderProp.is_reviewed);
  }, [orderProp]);

  const updateOrderStateUI = (updates: Partial<Order>) => {
    setOrder((prev) => ({ ...prev, ...updates }));
  };

  // ---------- HANDLERS ----------
  const handlePaymentInvoiceChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPaymentInvoice(file);
      if (file.type.startsWith('image/')) {
        setPaymentInvoicePreview(URL.createObjectURL(file));
      } else {
        setPaymentInvoicePreview(null);
      }
    }
  };

  const handleShippingInvoiceChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setShippingInvoice(file);
      if (file.type.startsWith('image/')) {
        setShippingInvoicePreview(URL.createObjectURL(file));
      } else {
        setShippingInvoicePreview(null);
      }
    }
  };

  // ⭐ New feature: delete uploaded files
  const handleDeletePaymentInvoice = () => {
    setPaymentInvoice(null);
    setPaymentInvoicePreview(null);
  };

  const handleDeleteShippingInvoice = () => {
    setShippingInvoice(null);
    setShippingInvoicePreview(null);
  };

  const handleSubmit = async (shipping_address: string | null, status: OrderStatus) => {
    if (status === 'payment_confirmed' && (!paymentInvoice || !shippingAddress)) {
      alert('Need to add shipping address and payment invoice');
      return;
    }

    if (status === 'shipped' && !shippingInvoice) {
      alert('Need to add shipping invoice');
      return;
    }

    try {
      const res = await fetch(`/api/payment/${order.order_id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          shipping_address: shipping_address,
          status: status,
        }),
      });

      if (!res.ok) {
        return;
      }

      const result = await res.json();

      if (!result.isSuccess) {
        alert(result.message);
        return;
      }

      updateOrderStateUI({
        shipping_address: shippingAddress ? shippingAddress : shipping_address,
        status: status,
      });
    } catch (e) {
      alert(e);
    }
  };

  const handleSubmitReview = async () => {
    if (!likeStatus) {
      alert('Need to choose like or dislike!');
      return;
    }
    try {
      const res = await fetch(`/api/payment-review/${order.order_id}`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reviewer_id: order.cur_user_id,
          reviewee_id: order.partner_id,
          product_id: order.product_id,
          is_positive: likeStatus === 'like',
          comment: review,
        }),
      });

      if (!res.ok) {
        return;
      }

      const result = await res.json();

      if (!result.isSuccess) {
        alert(result.message);
        return;
      }

      setReviewSubmitted(true);
    } catch (e) {
      alert(e);
    }
  };

  // ---------- CANCELLED VIEW ----------
  if (isCancelled) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-4xl mx-auto border rounded-xl bg-white shadow-lg">
          <div className="p-6 border-b flex justify-between items-center">
            <h2 className="text-2xl font-semibold">Transaction Cancelled</h2>
            <span className="rounded-full bg-black text-[#8D0000] px-3 py-1 text-xs font-semibold">
              Cancelled
            </span>
          </div>

          <div className="p-6">
            <div className="flex gap-3 items-start border border-[#8D0000] p-4 rounded-lg">
              <XCircle className="h-5 w-5 text-[#8D0000] mt-0.5" />
              <p className="text-[#8D0000]">
                This transaction has been cancelled and cannot be continued.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ---------- FINAL COMPLETED VIEW ----------
  if (reviewSubmitted) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-4xl mx-auto border rounded-xl bg-white shadow-lg">
          <div className="p-6 border-b flex justify-between items-center">
            <h2 className="text-2xl font-semibold">Order Completed</h2>
            <span className="rounded-full bg-black text-white px-3 py-1 text-xs font-semibold">
              Completed
            </span>
          </div>

          <div className="p-8 flex flex-col items-center text-center gap-4">
            <CheckCircle2 className="h-16 w-16 text-black" />
            <h3 className="text-xl font-semibold">Thank you for your review</h3>
            <p className="text-gray-500">This order has been successfully completed.</p>
          </div>
        </div>
      </div>
    );
  }

  // ---------- MAIN UI ----------
  return (
    <div className="container mx-auto py-8 px-4 flex flex-col gap-4 max-w-4xl">
      <div className="mx-auto border rounded-xl bg-white shadow-lg w-full">
        {/* Header */}
        <div className="p-6 border-b flex justify-between items-start">
          <div className="space-y-1">
            <h2 className="text-2xl font-semibold">Product: {order.product_name}</h2>
            <p className="text-xl font-bold text-[#8D0000]">${order.final_price}</p>
          </div>

          <div className="flex gap-2">
            <button
              className={`h-10 px-4 rounded-md border ${
                showChat ? 'bg-[#8D0000] text-white' : 'bg-white text-gray-700'
              }`}
              onClick={() => setShowChat((v) => !v)}
            >
              <MessageSquare className="h-4 w-4 mr-2 inline" />
              Chat
            </button>

            {order.is_seller && (
              <button
                className={`h-10 px-4 rounded-md ${DESTRUCTIVE}`}
                onClick={() => handleSubmit(null, 'cancelled')}
              >
                Cancel Transaction
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-8">
          {steps.map((step, idx) => (
            <div key={step.number} className="flex gap-4">
              <div className="flex flex-col items-center">
                {step.completed ? (
                  <CheckCircle2 className="h-8 w-8 text-black" />
                ) : (
                  <Circle className="h-8 w-8 text-gray-400" />
                )}
                {idx < steps.length - 1 && <div className="w-px h-20 bg-gray-300 mt-2" />}
              </div>

              <div className="flex-1 pb-8">
                <h3 className="font-semibold text-lg">
                  Step {step.number}: {step.title}
                </h3>
                <p className="text-sm text-gray-500 mb-4">{step.description}</p>

                {/* STEP 1: Buyer submit address + payment invoice */}
                {step.number === 1 && isBuyer && order.status === 'pending_payment' && (
                  <div className={`${MUTE} p-4 rounded-lg space-y-3`}>
                    <textarea
                      className="w-full border rounded-md p-2 text-sm"
                      placeholder="Enter shipping address"
                      value={shippingAddress}
                      onChange={(e) => setShippingAddress(e.target.value)}
                    />

                    {!paymentInvoicePreview && (
                      <div
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.currentTarget.classList.add('bg-blue-50', 'border-blue-400');
                        }}
                        onDragLeave={(e) => {
                          e.currentTarget.classList.remove('bg-blue-50', 'border-blue-400');
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          e.currentTarget.classList.remove('bg-blue-50', 'border-blue-400');
                          handlePaymentInvoiceChange({
                            target: { files: e.dataTransfer.files },
                          } as any);
                        }}
                        onClick={() => document.getElementById('paymentInvoiceInput')?.click()}
                        className="border-2 border-dashed border-gray-300 rounded-lg h-32 flex items-center justify-center text-center cursor-pointer transition hover:border-gray-400 hover:bg-gray-50"
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
                          <p className="text-gray-500 text-sm">
                            Drag or click to upload payment invoice
                          </p>
                        </div>
                      </div>
                    )}
                    <input
                      id="paymentInvoiceInput"
                      type="file"
                      accept=".pdf,.jpg,.png"
                      onChange={handlePaymentInvoiceChange}
                      className="hidden"
                    />
                    {paymentInvoicePreview && (
                      <div className="relative">
                        <img
                          src={paymentInvoicePreview}
                          className="mt-2 h-32 object-contain border rounded"
                        />
                        <button
                          onClick={handleDeletePaymentInvoice}
                          className="absolute top-1 right-1 bg-black text-white rounded-full w-6 h-6 flex items-center justify-center text-xs"
                        >
                          ×
                        </button>
                      </div>
                    )}
                    {paymentInvoice && !paymentInvoicePreview && (
                      <div className="flex items-center justify-between mt-2 border rounded p-2">
                        <span className="text-sm text-gray-500">{paymentInvoice.name}</span>
                        <button
                          onClick={handleDeletePaymentInvoice}
                          className="bg-black text-white rounded px-2 py-0.5 text-xs"
                        >
                          Delete
                        </button>
                      </div>
                    )}

                    <button
                      className={`h-10 px-4 rounded-md ${PRIMARY}`}
                      onClick={() => handleSubmit(shippingAddress, 'payment_confirmed')}
                    >
                      Submit address & pay
                    </button>
                  </div>
                )}

                {/* STEP 2: Seller confirm + shipping invoice */}
                {step.number === 2 && order.is_seller && order.status === 'payment_confirmed' && (
                  <div className="space-y-3">
                    {!shippingInvoicePreview && (
                      <div
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.currentTarget.classList.add('bg-blue-50', 'border-blue-400');
                        }}
                        onDragLeave={(e) => {
                          e.currentTarget.classList.remove('bg-blue-50', 'border-blue-400');
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          e.currentTarget.classList.remove('bg-blue-50', 'border-blue-400');
                          handleShippingInvoiceChange({
                            target: { files: e.dataTransfer.files },
                          } as any);
                        }}
                        onClick={() => document.getElementById('shippingInvoiceInput')?.click()}
                        className="border-2 border-dashed border-gray-300 rounded-lg h-32 flex items-center justify-center text-center cursor-pointer transition hover:border-gray-400 hover:bg-gray-50"
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
                          <p className="text-gray-500 text-sm">
                            Drag or click to upload shipping invoice
                          </p>
                        </div>
                      </div>
                    )}
                    <input
                      id="shippingInvoiceInput"
                      type="file"
                      accept=".pdf,.jpg,.png"
                      onChange={handleShippingInvoiceChange}
                      className="hidden"
                    />
                    {shippingInvoicePreview && (
                      <div className="relative">
                        <img
                          src={shippingInvoicePreview}
                          className="mt-2 h-32 object-contain border rounded"
                        />
                        <button
                          onClick={handleDeleteShippingInvoice}
                          className="absolute top-1 right-1 bg-black text-white rounded-full w-6 h-6 flex items-center justify-center text-xs"
                        >
                          ×
                        </button>
                      </div>
                    )}
                    {shippingInvoice && !shippingInvoicePreview && (
                      <div className="flex items-center justify-between mt-2 border rounded p-2">
                        <span className="text-sm text-gray-500">{shippingInvoice.name}</span>
                        <button
                          onClick={handleDeleteShippingInvoice}
                          className="bg-black text-white rounded px-2 py-0.5 text-xs"
                        >
                          Delete
                        </button>
                      </div>
                    )}

                    <button
                      className={`h-10 px-4 rounded-md ${PRIMARY}`}
                      disabled={!shippingInvoice}
                      onClick={() => handleSubmit(null, 'shipped')}
                    >
                      Confirm shipment
                    </button>
                  </div>
                )}

                {/* STEP 3: Buyer confirms received */}
                {step.number === 3 && isBuyer && order.status === 'shipped' && (
                  <button
                    className={`h-10 px-4 rounded-md ${PRIMARY}`}
                    onClick={() => handleSubmit(null, 'completed')}
                  >
                    Item received
                  </button>
                )}

                {/* ⭐ Rating / Review */}
                {step.number === 3 && order.status === 'completed' && !reviewSubmitted && (
                  <div className="mt-4 border rounded-lg p-4 space-y-4">
                    <p className="font-medium">Rate your experience</p>
                    <div className="flex gap-4">
                      <button
                        onClick={() => setLikeStatus('like')}
                        className={`flex items-center gap-2 px-4 py-2 border rounded-md ${
                          likeStatus === 'like' ? 'bg-black text-white' : ''
                        }`}
                      >
                        <ThumbsUp className="h-4 w-4" />
                        Like
                      </button>
                      <button
                        onClick={() => setLikeStatus('dislike')}
                        className={`flex items-center gap-2 px-4 py-2 border rounded-md ${
                          likeStatus === 'dislike' ? 'bg-black text-white' : ''
                        }`}
                      >
                        <ThumbsDown className="h-4 w-4" />
                        Dislike
                      </button>
                    </div>
                    <textarea
                      className="w-full border rounded-md p-2 text-sm"
                      placeholder="Write a short review (optional)"
                      value={review}
                      onChange={(e) => setReview(e.target.value)}
                    />
                    <button
                      className={`${PRIMARY} h-10 px-4 rounded-md`}
                      onClick={handleSubmitReview}
                    >
                      Submit review
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {showChat && (
        <OrderChat
          orderId={order.order_id}
          cur_id={order.cur_user_id}
          partner_name={order.partner_name}
          partner_id={order.partner_id}
          cur_name={order.cur_name}
        />
      )}
    </div>
  );
}
