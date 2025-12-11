import { useState } from 'react';
import { MessageCircle, X, Send, Edit2 } from 'lucide-react';
import { ClipLoader } from 'react-spinners';
import { Product } from '../lib/type';

interface ProductQAProps {
  product: Product;
  onRefresh: () => void;
}

export const ProductQA = ({ product, onRefresh }: ProductQAProps) => {
  // State for asking question (user)
  const [showAskForm, setShowAskForm] = useState(false);
  const [questionText, setQuestionText] = useState('');
  const [isSendingQA, setIsSendingQA] = useState(false);

  // State for Reply (seller)
  const [replyingQaId, setReplyingQaId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isSendingReply, setIsSendingReply] = useState(false);

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

  const handleSendReply = async (qaId: string) => {
    if (!replyText.trim()) return alert('Enter your answer');

    setIsSendingReply(true);
    try {
      const res = await fetch(`/api/qa/${qaId}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answer: replyText }),
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to reply');

      alert('Reply sent!, The questioner has been notified via email.');
      setReplyText('');
      setReplyingQaId(null);
      onRefresh(); // Refresh the QA list
    } catch (error: any) {
      alert(error.message);
    } finally {
      setIsSendingReply(false);
    }
  };

  // edit reply form helper
  const openReplyForm = (qaId: string, currentAnswer: string | null) => {
    setReplyingQaId(qaId);
    setReplyText(currentAnswer || '');
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
      {/* Ask Form */}
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
            {item.answer && (
              <div className="bg-gray-50 p-4 rounded-lg border-l-2 border-[#8D0000] ml-0 md:ml-6">
                <p className="text-xs font-bold text-gray-900 mb-1">
                  {item.responder} <span className="text-gray-400 font-normal">(Seller)</span>
                </p>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{item.answer}</p>
              </div>
            )}
            {product.isSeller && (
              <div className="ml-0 md:ml-6">
                {replyingQaId === item.id ? (
                  <div className="bg-amber-50 p-4 rounded-lg border border-amber-200 animate-in fade-in mt-2">
                    <p className="text-xs font-bold text-amber-800 mb-2">
                      {item.answer ? 'Edit your answer:' : 'Your Answer:'}
                    </p>
                    <textarea
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      rows={3}
                      className="w-full border border-amber-300 rounded p-2 text-sm bg-white mb-2 focus:outline-none focus:ring-1 focus:ring-amber-500"
                      placeholder="Type answer..."
                    />
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => setReplyingQaId(null)}
                        className="px-3 py-1.5 text-xs font-bold text-gray-600 bg-white border rounded hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleSendReply(item.id)}
                        disabled={isSendingReply}
                        className="px-3 py-1.5 text-xs font-bold text-white bg-[#8D0000] hover:bg-[#6b1e1e] rounded"
                      >
                        {isSendingReply
                          ? 'Sending...'
                          : item.answer
                            ? 'Update Answer'
                            : 'Submit Reply'}
                      </button>
                    </div>
                  </div>
                ) : (
                  // Nut reply / edit khi chua reply / da co reply
                  <button
                    onClick={() => openReplyForm(item.id, item.answer)}
                    className="text-xs font-bold text-[#8D0000] hover:underline flex items-center gap-1 mt-1"
                  >
                    {item.answer ? (
                      <>
                        <Edit2 size={12} /> Edit Answer
                      </>
                    ) : (
                      <>
                        <MessageCircle size={14} /> Reply to this question
                      </>
                    )}
                  </button>
                )}
              </div>
            )}
            {/* thong bao doi tra loi cho user */}
            {!product.isSeller && !item.answer && (
              <p className="text-xs text-gray-400 italic pl-4 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-gray-300"></span> Waiting for seller
                response...
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
