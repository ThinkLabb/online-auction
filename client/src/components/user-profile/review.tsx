import { useState, useEffect } from "react";
import { ThumbsUp, ThumbsDown, Trash, UndoIcon } from "lucide-react";
import { OrderStatus, UserRole } from "@prisma/client";
import { formatDate } from "../product";

export default function ReviewBox(
  {
    order_id,
    review,
    role,
    orderStatus,
    onCancelSuccess
  } : {
    order_id: string,
    review: {
      review_id: string;
      is_positive: boolean;
      comment: string | null;
      created_at: string;
    } | null,
    role: UserRole,
    orderStatus: OrderStatus,
    onCancelSuccess?: () => void
  }
) {
  const [comment, setComment] = useState(review?.comment || "");
  const [isPositive, setIsPositive] = useState<boolean | null>(review ? review.is_positive : null);
  const [isReviewing, setIsReviewing] = useState(false)
  const [error, setError] = useState("");
  const [localReview, setLocalReview] = useState(review);

  useEffect(() => {
    setLocalReview(review);
    if (review) {
      setComment(review.comment || "");
      setIsPositive(review.is_positive);
    }
  }, [review]);

  const submitReview = async() => {
    try {
      setError("");
      if (comment == "") {
        setError("Please type your comment");
        return;
      }

      if (!localReview && isPositive === null) {
        setError("Please provide rating");
        return
      }
      
      if (!localReview) {
        const result = await fetch(`/api/review/create`, {
          method: 'POST',
          credentials: 'include',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({
            order_id: order_id,
            comment: comment,
            is_positive: isPositive,
            role: role
          }),
        })

        const jsonResult = await result.json();
        if (!result.ok) throw new Error(jsonResult.message);

        setLocalReview({
          review_id: jsonResult.data.review_id,
          is_positive: jsonResult.data.is_positive,
          comment: jsonResult.data.comment,
          created_at: jsonResult.data.created_at
        })

        setComment(jsonResult.data.comment || "");
        setIsPositive(jsonResult.data.is_positive);
        
        setIsReviewing(false);
        return
      }

      const result = await fetch(`/api/review/update`, {
        method: 'PUT',
        credentials: 'include',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          review_id: localReview?.review_id,
          comment: comment,
          is_positive: isPositive,
        }),
      })

      const jsonResult = await result.json();
      if (!result.ok) throw new Error(jsonResult.message);

      setLocalReview({
        review_id: jsonResult.data.review_id,
        is_positive: jsonResult.data.is_positive,
        comment: jsonResult.data.comment,
        created_at: jsonResult.data.created_at
      })
      setComment(jsonResult.data.comment || "");
      setIsPositive(jsonResult.data.is_positive);
      
      setIsReviewing(false);

    } catch(e) {
      console.log(e);
    } finally {
      setIsReviewing(false)
    }
  }

  const cancelOrder = async() => {
    try {
      const result = await fetch(`/api/order/cancel/${order_id}`, {
        method: 'POST',
        credentials: 'include',
        headers: {'Content-Type': 'application/json'},
      })

      if (onCancelSuccess) {
        onCancelSuccess(); 
      }
    } catch(e) {
      console.log(e);
    }
  }

  if (
    role ==='bidder' && (orderStatus === 'completed' || orderStatus === 'cancelled')
    || role ==='seller' && orderStatus !== 'pending_payment'
  )
    return (
      <div className="mt-2">
        {isReviewing 
          ?  <div className="text-sm rounded-sm ring ring-gray-200 shadow-sm shadow-black-300 p-2">
          <div className="flex flex-col justfiy-between gap-3">
            <div className="flex gap-5 items-center">
              <label className={`block text-base font-medium`}>My Review</label>
              <div className="flex gap-2 items-center">
                <ThumbsUp
                  type="button"
                  onClick={() => setIsPositive(true)}
                  className={`w-5 h-5 hover:scale-105 text-[#8D0000] ${isPositive !== null && isPositive ? 'fill-[#8D0000]' : ''}`}
                />
                <ThumbsDown
                  type="button"
                  onClick={() => setIsPositive(false)}
                  className={`w-5 h-5 hover:scale-105 text-[#8D0000] ${isPositive !== null && !isPositive ? 'fill-[#8D0000]' : ''}`}
                />
              </div>
            </div>
            <textarea
              value={comment}
              disabled={orderStatus !== 'completed' || !isReviewing}
              onChange={(e) => setComment(e.target.value)}
              className={`w-full bg-gray-100 p-2 border rounded ${isReviewing ? 'text-black' : 'text-gray-300'}`}
              rows={4}
            />
            <div className="flex flex-col gap-2 items-center">
              <button
                onClick={submitReview}
                className={`w-full px-4 py-1 rounded text-white bg-[#8D0000]  hover:border hover:bg-white hover:text-[#8D0000]`}
              >
                Submit
              </button>

              <button
                onClick={() => setIsReviewing(false)}
                className={`w-full px-4 py-1 rounded text-white bg-black hover:border hover:bg-white hover:text-black`}
              >
                Cancel
              </button>
            </div>
            
          </div>
          {error && <div className="text-[#8D0000] mt-2">{error}</div>}
        </div>
        : <div>
          {localReview !== undefined && localReview !== null
          ? <div>
            <div className="flex justify-between">
              <div className="flex gap-2 items-center mb-2">
                <label className={`block text-base font-medium`}>My Review</label>
                {localReview.is_positive === true 
                  ? <ThumbsUp className={`w-5 h-5 text-[#8D0000] fill-[#8D0000]`}/>
                  : <ThumbsDown className={`w-5 h-5 text-[#8D0000] fill-[#8D0000]`}/>
                }
                  
              </div>
              <div className="text-sm">{formatDate(localReview.created_at)}</div>
            </div>


            {localReview.comment && <p className="mb-2 text-sm p-1 w-full bg-white p-2 border border-gray-300 rounded">{localReview.comment}</p>}
          </div>
          : <p className="mb-2">No review yet</p>}

          <button
            onClick={() => setIsReviewing(true)}
            className={`w-full px-4 py-1 rounded text-white bg-black hover:border hover:bg-white hover:text-black hover:scale-101`}
          >
            {localReview ? 'Edit' : 'Review'}
          </button>
        </div>}
      </div>


    );

  if (orderStatus === 'pending_payment' && role === 'seller')
    return(
      <button
        onClick={cancelOrder}
        className="mt-1 w-fit self-end px-4 py-1 bg-black text-white rounded hover:border hover:bg-white hover:text-black"
      >
        Cancel
      </button>
    )

}