import { useState } from 'react';
import { MessageCircle, X, Send, ThumbsUp } from 'lucide-react';
import { ClipLoader } from 'react-spinners';
import { Product } from '../lib/type';

interface ProductQAProps {
  product: Product;
  onRefresh: () => void;
}

export const ProductQA = ({ product, onRefresh }: ProductQAProps) => {
  const [showAskForm, setShowAskForm] = useState(false);
  const [questionText, setQuestionText] = useState('');
  const [isSendingQA, setIsSendingQA] = useState(false);

  const handleSendQuestion = async () => {
    if (!questionText.trim()) {
      alert('Please enter your question.');
      return;
    }

    setIsSendingQA(true);
    try {
      const res = await fetch(`/api/product/${product.id}/qa`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: questionText }),

        credentials: 'include',
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Failed to send question');
      }

      alert('Question sent! The seller has been notified via email.');
      setQuestionText('');
      setShowAskForm(false);
      onRefresh();
    } catch (error: any) {
      alert(error.message);
    } finally {
      setIsSendingQA(false);
    }
  };

  return (
    <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 mb-12">
      <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
        <h2 className="text-xl font-bold text-gray-900">Questions & Answers</h2>
        {!product.isSeller && (
          <button
            onClick={() => setShowAskForm(!showAskForm)}
            className={`px-5 py-2 rounded text-sm font-bold transition shadow-sm flex items-center gap-2 ${
              showAskForm
                ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                : 'bg-[#8D0000] text-white hover:bg-[#6b0000]'
            }`}
          >
            {showAskForm ? (
              <>
                <X size={16} /> Cancel
              </>
            ) : (
              <>
                <MessageCircle size={16} /> Ask a Question
              </>
            )}
          </button>
        )}
      </div>
      {showAskForm && (
        <div className="mb-8 bg-gray-50 border border-gray-200 rounded-lg p-5 animate-in fade-in slide-in-from-top-2 duration-200">
          <h4 className="text-sm font-bold text-gray-800 mb-2">New Question</h4>
          <p className="text-xs text-gray-500 mb-3">
            Your question will be sent to the seller via email.
          </p>

          <textarea
            value={questionText}
            onChange={(e) => setQuestionText(e.target.value)}
            rows={3}
            placeholder="E.g., Is the warranty still valid?"
            className="w-full border border-gray-300 rounded-md p-3 text-sm focus:outline-none focus:border-[#8D0000] focus:ring-1 focus:ring-[#8D0000] bg-white mb-3"
          />

          <div className="flex justify-end">
            <button
              onClick={handleSendQuestion}
              disabled={isSendingQA}
              className="bg-[#8D0000] text-white px-4 py-2 rounded text-sm font-bold hover:bg-[#6b0000] transition disabled:opacity-50 flex items-center gap-2"
            >
              {isSendingQA ? (
                <ClipLoader size={14} color="#fff" />
              ) : (
                <>
                  <Send size={14} /> Send Question
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* QA list */}
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
              <p className="text-xs text-gray-400 italic pl-4 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-gray-300"></span> Waiting for answer...
              </p>
            )}
          </div>
        ))}
        {product.qa.length === 0 && (
          <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-300">
            <p className="text-gray-400 text-sm">No questions yet. Be the first to ask!</p>
          </div>
        )}
      </div>
    </div>
  );
};
