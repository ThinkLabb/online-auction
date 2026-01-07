import { useState, useEffect } from 'react';
import { Clock, CheckCircle, AlertCircle } from 'lucide-react';

interface SellerStatusData {
  role: string;
  requestType?: 'permanent' | 'temporary';
  isTemporary: boolean;
  expiresAt?: string;
  daysRemaining?: number;
  hoursRemaining?: number;
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
    const expirationDate = status.expiresAt ? new Date(status.expiresAt) : null;
    const hoursRemaining = status.hoursRemaining || 0;

    // Display format based on time remaining
    let timeRemainingDisplay = '';
    if (status.daysRemaining > 1) {
      timeRemainingDisplay = `${status.daysRemaining} ${status.daysRemaining === 1 ? 'day' : 'days'} left`;
    } else if (hoursRemaining > 0) {
      timeRemainingDisplay = `${hoursRemaining} ${hoursRemaining === 1 ? 'hour' : 'hours'} left`;
    } else {
      timeRemainingDisplay = 'Expiring soon';
    }

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
            <div className="mb-2">
              <h3
                className={`font-semibold ${isExpiringSoon ? 'text-red-900' : 'text-yellow-900'}`}
              >
                Seller Access (7 Days)
              </h3>
              <div className="mt-1">
                <span
                  className={`inline-block text-xs px-2 py-1 rounded-full font-semibold ${
                    isExpiringSoon ? 'bg-red-200 text-red-800' : 'bg-yellow-200 text-yellow-800'
                  }`}
                >
                  {timeRemainingDisplay}
                </span>
              </div>
            </div>

            {expirationDate && (
              <div className="space-y-1 mb-2">
                <div
                  className={`text-sm flex items-center gap-2 ${isExpiringSoon ? 'text-red-700' : 'text-yellow-700'}`}
                >
                  <span className="font-medium">Expires on:</span>
                  <span className="font-semibold">
                    {expirationDate.toLocaleDateString('en-US', {
                      weekday: 'short',
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                  <span className="text-xs">
                    at{' '}
                    {expirationDate.toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>
            )}

            {isExpiringSoon && (
              <p className="text-sm text-red-700 mt-2 font-medium">
                Your seller access is expiring soon! You can request another 7-day access period
                after it expires.
              </p>
            )}
            <p className="text-sm mt-2 text-gray-600">
              Note: Your existing products will remain active even after your seller access expires.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
