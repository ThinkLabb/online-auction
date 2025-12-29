import { useState, useEffect } from 'react';
import { Clock, CheckCircle, AlertCircle } from 'lucide-react';

interface SellerStatusData {
  role: string;
  requestType?: 'permanent' | 'temporary';
  isTemporary: boolean;
  expiresAt?: string;
  daysRemaining?: number;
}

export function SellerStatus() {
  const [status, setStatus] = useState<SellerStatusData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSellerStatus();
  }, []);

  const fetchSellerStatus = async () => {
    try {
      const res = await fetch('/api/profile/seller-status', {
        method: 'GET',
        credentials: 'include',
      });

      if (res.ok) {
        const data = await res.json();
        setStatus(data.data);
      }
    } catch (error) {
      console.error('Error fetching seller status:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 border border-gray-200 rounded-lg bg-gray-50 animate-pulse">
        <div className="h-6 bg-gray-300 rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-gray-300 rounded w-1/2"></div>
      </div>
    );
  }

  if (!status || status.role !== 'seller') {
    return null;
  }

  if (status.isTemporary && status.daysRemaining !== undefined) {
    const isExpiringSoon = status.daysRemaining <= 2;

    return (
      <div
        className={`p-4 border rounded-lg ${
          isExpiringSoon ? 'bg-red-50 border-red-300' : 'bg-yellow-50 border-yellow-300'
        }`}
      >
        <div className="flex items-start gap-3">
          {isExpiringSoon ? (
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
          ) : (
            <Clock className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
          )}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3
                className={`font-semibold ${isExpiringSoon ? 'text-red-900' : 'text-yellow-900'}`}
              >
                Temporary Seller
              </h3>
              <span
                className={`text-xs px-2 py-1 rounded-full ${
                  isExpiringSoon ? 'bg-red-200 text-red-800' : 'bg-yellow-200 text-yellow-800'
                }`}
              >
                {status.daysRemaining} {status.daysRemaining === 1 ? 'day' : 'days'} left
              </span>
            </div>
            <p className={`text-sm ${isExpiringSoon ? 'text-red-700' : 'text-yellow-700'}`}>
              Your seller permissions will expire on{' '}
              {status.expiresAt &&
                new Date(status.expiresAt).toLocaleString('en-US', {
                  dateStyle: 'long',
                  timeStyle: 'short',
                })}
            </p>
            {isExpiringSoon && (
              <p className="text-sm text-red-700 mt-2 font-medium">
                ⚠️ Your seller access is expiring soon! Request permanent seller status to continue
                selling.
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (status.requestType === 'permanent') {
    return (
      <div className="p-4 border border-green-300 rounded-lg bg-green-50">
        <div className="flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-green-900 flex items-center gap-2">
              Permanent Seller
            </h3>
            <p className="text-sm text-green-700">
              You have full seller access with no time limit. Keep selling!
            </p>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
