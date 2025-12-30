import { useState, ChangeEvent, useEffect } from 'react';
import { CheckCircle2, Circle, MessageSquare, XCircle, ThumbsUp, ThumbsDown } from 'lucide-react';
import { OrderChat } from './order-chat';
import { ClipLoader } from 'react-spinners';

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
  review: string | null;
  likestatus: boolean | null;
  partner_name: string;
  partner_id: string;
  cur_name: string;
  payment_proof_url: string;
  shipping_proof_url: string;
}

// ---------- HELPER FUNCTION ----------
const toBase64 = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
  });

// ---------- COMPONENT ----------
export function OrderCompletionView({ order: orderProp }: { order: Order }) {
  const [order, setOrder] = useState<Order>(orderProp);
  const [showChat, setShowChat] = useState(false);
  const [shippingAddress, setShippingAddress] = useState(order.shipping_address ?? '');

  // Invoice files
  const [paymentInvoice, setPaymentInvoice] = useState<File | null>(null);
  const [paymentInvoicePreview, setPaymentInvoicePreview] = useState<string | null>(null);
  const [shippingInvoice, setShippingInvoice] = useState<File | null>(null);
  const [shippingInvoicePreview, setShippingInvoicePreview] = useState<string | null>(null);

  // Rating / Review states
  const [likeStatus, setLikeStatus] = useState<LikeStatus>(null);
  const [review, setReview] = useState('');
  const [reviewSubmitted, setReviewSubmitted] = useState(order.is_reviewed);
  const [isEditingReview, setIsEditingReview] = useState(false);
  const [loadingSubmit, setloadingSubmit] = useState(false);

  const isBuyer = !order.is_seller;
  const isCancelled = order.status === 'cancelled';

  // ---------- UI CLASSES ----------
  const PRIMARY = 'bg-[#8D0000] text-white hover:bg-gray-800 transition-colors';
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
    if (orderProp.likestatus) {
      setLikeStatus(orderProp.likestatus ? 'like' : 'dislike');
    }
    if (orderProp.review) setReview(orderProp.review);

    setShippingAddress(orderProp.shipping_address ?? '');
    setReviewSubmitted(orderProp.is_reviewed);
  }, [orderProp]);

  useEffect(() => {
    return () => {
      if (paymentInvoicePreview) URL.revokeObjectURL(paymentInvoicePreview);
      if (shippingInvoicePreview) URL.revokeObjectURL(shippingInvoicePreview);
    };
  }, [paymentInvoicePreview, shippingInvoicePreview]);

  const updateOrderStateUI = (updates: Partial<Order>) => {
    setOrder((prev) => ({ ...prev, ...updates }));
  };

  // ---------- HANDLERS ----------
  const handlePaymentInvoiceChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPaymentInvoice(file);
      if (paymentInvoicePreview) URL.revokeObjectURL(paymentInvoicePreview);
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
      if (shippingInvoicePreview) URL.revokeObjectURL(shippingInvoicePreview);
      if (file.type.startsWith('image/')) {
        setShippingInvoicePreview(URL.createObjectURL(file));
      } else {
        setShippingInvoicePreview(null);
      }
    }
  };

  const handleDeletePaymentInvoice = () => {
    setPaymentInvoice(null);
    if (paymentInvoicePreview) URL.revokeObjectURL(paymentInvoicePreview);
    setPaymentInvoicePreview(null);
  };

  const handleDeleteShippingInvoice = () => {
    setShippingInvoice(null);
    if (shippingInvoicePreview) URL.revokeObjectURL(shippingInvoicePreview);
    setShippingInvoicePreview(null);
  };

  const handleSubmit = async (shipping_address_arg: string | null, status: OrderStatus) => {
    if (status === 'cancelled') {
      setLikeStatus('dislike');
      setReview('The winner did not pay.');
    }
    if (status === 'payment_confirmed' && (!paymentInvoice || !shippingAddress)) {
      alert('Need to add shipping address and payment invoice');
      return;
    }
    if (status === 'shipped' && !shippingInvoice) {
      alert('Need to add shipping invoice');
      return;
    }

    try {
      const payload: any = {
        shipping_address: shipping_address_arg,
        status: status,
      };

      if (status === 'payment_confirmed' && paymentInvoice) {
        const base64Image = await toBase64(paymentInvoice);
        payload.payment_invoice = base64Image;
      }
      if (status === 'shipped' && shippingInvoice) {
        const base64Image = await toBase64(shippingInvoice);
        payload.shipping_invoice = base64Image;
      }

      setloadingSubmit(true);
      const res = await fetch(`/api/payment/${order.order_id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        setloadingSubmit(false);
        alert('Failed to connect to server');
        return;
      }

      const result = await res.json();
      setloadingSubmit(false);

      if (!result.isSuccess) {
        alert(result.message);
        return;
      }

      updateOrderStateUI({
        shipping_address: shippingAddress ? shippingAddress : shipping_address_arg,
        status: status,
      });

      if (status === 'payment_confirmed') setPaymentInvoice(null);
      if (status === 'shipped') setShippingInvoice(null);
    } catch (e) {
      console.error(e);
      alert('An error occurred while updating the order.');
    }
  };

  const handleSubmitReview = async () => {
    if (!likeStatus) {
      alert('Need to choose like or dislike!');
      return;
    }
    try {
      setloadingSubmit(true);
      const res = await fetch(`/api/payment-review/${order.order_id}`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviewer_id: order.cur_user_id,
          reviewee_id: order.partner_id,
          product_id: order.product_id,
          is_positive: likeStatus === 'like',
          comment: review,
        }),
      });

      if (!res.ok) {
        setloadingSubmit(false);
        return;
      }

      const result = await res.json();
      setloadingSubmit(false);
      if (!result.isSuccess) {
        alert(result.message);
        return;
      }

      setReviewSubmitted(true);
      setIsEditingReview(false);
    } catch (e) {
      alert('Error submitting review');
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
              className={`h-10 px-4 rounded-md border flex items-center ${showChat ? 'bg-[#8D0000] text-white' : 'bg-white text-gray-700'}`}
              onClick={() => setShowChat((v) => !v)}
            >
              <MessageSquare className="h-4 w-4 mr-2" /> Chat
            </button>
            {order.is_seller && order.status === 'pending_payment' && (
              <button
                className={`h-10 px-4 rounded-md ${DESTRUCTIVE} self-end`}
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

              <div className="flex-1 pb-8 justify-center">
                <h3 className="font-semibold text-lg">
                  Step {step.number}: {step.title}
                </h3>
                <p className="text-sm text-gray-500 mb-4">{step.description}</p>

                {/* STEP 1 Logic */}
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
                        onClick={() => document.getElementById('paymentInvoiceInput')?.click()}
                        className="border-2 border-dashed border-gray-300 rounded-lg h-32 flex items-center justify-center text-center cursor-pointer hover:bg-gray-50 transition"
                      >
                        <p className="text-gray-500 text-sm">Click to upload payment invoice</p>
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
                      <div className="relative block">
                        <img
                          src={paymentInvoicePreview}
                          className="mt-2 h-32 object-contain border rounded"
                          alt="Preview"
                        />
                        <button
                          onClick={handleDeletePaymentInvoice}
                          className="absolute -top-1 -right-1 bg-black text-white rounded-full w-6 h-6 flex items-center justify-center"
                        >
                          ×
                        </button>
                      </div>
                    )}
                    <button
                      className={`h-10 px-4 mt-2 rounded-md ${PRIMARY} self-end`}
                      onClick={() => handleSubmit(shippingAddress, 'payment_confirmed')}
                    >
                      {loadingSubmit ? (
                        <ClipLoader size={20} color="white" />
                      ) : (
                        'Submit address & pay'
                      )}
                    </button>
                  </div>
                )}
                {step.number === 1 && order.payment_proof_url && (
                  <img
                    className="mt-2 h-32 object-contain border rounded"
                    src={`/api/assets/${order.payment_proof_url}`}
                    alt="Proof"
                  />
                )}

                {/* STEP 2 Logic */}
                {step.number === 2 && order.is_seller && order.status === 'payment_confirmed' && (
                  <div className="space-y-3">
                    {!shippingInvoicePreview && (
                      <div
                        onClick={() => document.getElementById('shippingInvoiceInput')?.click()}
                        className="border-2 border-dashed border-gray-300 rounded-lg h-32 flex items-center justify-center cursor-pointer hover:bg-gray-50 transition"
                      >
                        <p className="text-gray-500 text-sm">Upload shipping invoice</p>
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
                      <div className="relative block">
                        <img
                          src={shippingInvoicePreview}
                          className="mt-2 h-32 object-contain border rounded"
                          alt="Shipping Preview"
                        />
                        <button
                          onClick={handleDeleteShippingInvoice}
                          className="absolute -top-1 -right-1 bg-black text-white rounded-full w-6 h-6 flex items-center justify-center"
                        >
                          ×
                        </button>
                      </div>
                    )}
                    <button
                      className={`h-10 px-4 rounded-md ${PRIMARY}`}
                      disabled={!shippingInvoice}
                      onClick={() => handleSubmit(null, 'shipped')}
                    >
                      {/* Confirm shipment */}
                      {loadingSubmit ? <ClipLoader size={20} color="white" /> : 'Confirm shipment'}
                    </button>
                  </div>
                )}
                {step.number === 2 && order.shipping_proof_url && (
                  <img
                    className="mt-2 h-32 object-contain border rounded"
                    src={`/api/assets/${order.shipping_proof_url}`}
                    alt="Shipping Proof"
                  />
                )}

                {/* STEP 3 Logic */}
                {step.number === 3 && isBuyer && order.status === 'shipped' && (
                  <button
                    className={`h-10 px-4 rounded-md ${PRIMARY}`}
                    onClick={() => handleSubmit(null, 'completed')}
                  >
                    Item received
                  </button>
                )}

                {/* Rating / Review Section */}
                {step.number === 3 && order.status === 'completed' && (
                  <div className="mt-6 border rounded-lg p-5 bg-gray-50 space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="font-semibold">Your Experience</h4>
                      {reviewSubmitted && !isEditingReview && (
                        <button
                          onClick={() => setIsEditingReview(true)}
                          className="text-sm font-medium text-[#8D0000] underline"
                        >
                          Edit Review
                        </button>
                      )}
                    </div>

                    {reviewSubmitted && !isEditingReview ? (
                      <div className="bg-white p-4 rounded border">
                        <div className="flex items-center gap-2 mb-2">
                          {likeStatus === 'like' ? (
                            <ThumbsUp className="h-4 w-4 text-[#8D0000]" />
                          ) : (
                            <ThumbsDown className="h-4 w-4 text-red-600" />
                          )}
                          <span className="capitalize font-bold text-sm">{likeStatus}</span>
                        </div>
                        <p className="text-gray-600 text-sm italic">
                          "{review || 'No comment provided.'}"
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="flex gap-4">
                          <button
                            onClick={() => setLikeStatus('like')}
                            className={`flex items-center gap-2 px-4 py-2 border rounded-md transition-all ${likeStatus === 'like' ? 'bg-black text-white shadow-md' : 'bg-white'}`}
                          >
                            <ThumbsUp className="h-4 w-4" /> Like
                          </button>
                          <button
                            onClick={() => setLikeStatus('dislike')}
                            className={`flex items-center gap-2 px-4 py-2 border rounded-md transition-all ${likeStatus === 'dislike' ? 'bg-black text-white shadow-md' : 'bg-white'}`}
                          >
                            <ThumbsDown className="h-4 w-4" /> Dislike
                          </button>
                        </div>
                        <textarea
                          className="w-full border rounded-md p-3 text-sm focus:ring-2 focus:ring-gray-200 outline-none"
                          placeholder="Tell us more about the transaction..."
                          rows={3}
                          value={review}
                          onChange={(e) => setReview(e.target.value)}
                        />
                        <div className="flex gap-2">
                          <button
                            className={`${PRIMARY} h-10 px-6 rounded-md font-medium`}
                            onClick={handleSubmitReview}
                          >
                            {loadingSubmit ? (
                              <ClipLoader size={20} color="white" />
                            ) : (
                              'Submit Review'
                            )}
                          </button>
                          {isEditingReview && (
                            <button
                              className="h-10 px-4 rounded-md border bg-white hover:bg-gray-100"
                              onClick={() => setIsEditingReview(false)}
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                      </div>
                    )}
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
