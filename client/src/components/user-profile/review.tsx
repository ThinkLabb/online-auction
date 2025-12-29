import z, { json } from "zod";
import { useState, useEffect } from "react";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import { UserRole } from "@prisma/client";

export default function ReviewBox(
  {
    order_id,
    review,
    role
  } : {
    order_id: string,
    review: {
      review_id: string;
      is_positive: boolean;
      comment: string | null;
      created_at: string;
    } | null,
    role: UserRole
  }
) {
  const [comment, setComment] = useState(review?.comment || "");
  const [isPositive, setIsPositive] = useState<boolean | null>(review ? review.is_positive : null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (review) {
      setComment(review.comment || "");
      setIsPositive(review.is_positive);
    }
  }, [review]);

  const rate = async(rateValue: boolean) => {
    try {
      const result = await fetch(
        `/api/rate`,
        {
          method: 'POST',
          credentials: 'include',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({
            order_id: order_id,
            review_id: review ? review.review_id : null,
            is_positive: rateValue,
            role: role
          }),
        }
      )

      const jsonResult = await result.json();
      if (!result.ok) throw new Error(jsonResult.message);
      
    } catch(e) {
      console.log(e);
    }
  }

  const sendComment = async() => {
    try {

      setError("");
      if (comment == "") {
        setError("Please type your comment");
        return;
      }

      if (!review && isPositive === null) {
        setError("Please provide rating");
        return
      }

      const result = await fetch(
        `/api/comment`,
        {
          method: 'POST',
          credentials: 'include',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({
            order_id: order_id,
            review_id: review?.review_id,
            comment: comment,
            is_positive: isPositive,
            role: role
          }),
        }
      )

      const jsonResult = await result.json();
      if (!result.ok) throw new Error(jsonResult.message);
      
    } catch(e) {
      console.log(e);
    }
  }

  return (
    <div className="text-sm rounded-sm ring ring-gray-200 shadow-sm shadow-black-300 p-4">
      <div className="flex flex-row justfiy-between gap-3">
        <div className="w-full">
          <label className="block text-sm font-medium mb-2">Comment (optional)</label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="w-full p-2 border rounded"
            rows={4}
          />
        </div>

        <div className="flex flex-col items-center">
          <label className="block text-sm font-medium mb-2">Rating</label>
          <div className="flex gap-4 mb-3">
            <ThumbsUp
              type="button"
              onClick={async () => {
                setIsPositive(true),
                rate(true)
              }}
              className={`hover:scale-105 text-[#8D0000] ${isPositive !== null && isPositive ? 'fill-[#8D0000]' : ''}`}
            />
            <ThumbsDown
              type="button"
              onClick={async () => {
                setIsPositive(false),
                rate(false)
              }}
              className={`hover:scale-105 text-[#8D0000] ${isPositive !== null && !isPositive ? 'fill-[#8D0000]' : ''}`}
            />
          </div>

          <button
            onClick={sendComment}
            className="px-4 py-1 bg-black text-white rounded hover:border hover:bg-white hover:text-black"
          >
            {review && review.comment ? "Update\nComment" : "Submit\nComment"}
          </button>
        </div>
      </div>

      {error && <div className="text-[#8D0000] mt-2">{error}</div>}
    </div>
  );
}