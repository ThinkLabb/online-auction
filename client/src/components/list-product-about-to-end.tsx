import React, { useEffect, useState } from "react";

// --- Types ---

type Product = {
  id?: string | number;
  name: string;
  bid_count: number;
  current_price: string;
  buy_now_price: string | null;
  end_time: string;
  created_at: string;
  highest_bidder_name: string | null;
  image_url: string | null;
}

type TabId = 'about-to-end' | 'most-bid' | 'highest-priced';

type TabsProps = {
  activeTab: TabId;
  setActiveTab: React.Dispatch<React.SetStateAction<TabId>>;
}

type ProductCardProps = {
  product: Product;
}

// --- Helpers ---

const formatCurrency = (priceStr: string | null | undefined): string => {
  if (!priceStr) return '';
  const price = Number(priceStr);
  return new Intl.NumberFormat('de-DE').format(price) + ' $';
};

const formatDate = (dateStr: string | null | undefined): string => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

const calculateTimeRemaining = (endTimeStr: string | null | undefined): string => {
  if (!endTimeStr) return 'N/A';
  const diffMs = new Date(endTimeStr).getTime() - new Date().getTime();

  if (diffMs <= 0) return 'Auction ended';

  const d = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const h = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const m = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  if (d > 0) return `${d}d ${h}h remaining`;
  if (h > 0) return `${h}h ${m}m remaining`;
  if (m > 0) return `${m}m remaining`;
  return 'Ending soon';
};

// --- Static Data ---

const TABS_DATA = [
  { id: 'about-to-end' as TabId, label: 'About to end' },
  { id: 'most-bid' as TabId, label: 'Most bid' },
  { id: 'highest-priced' as TabId, label: 'Highest-priced' },
];

const API_ENDPOINTS: Record<TabId, string> = {
  'about-to-end': '/api/home/products',
  'most-bid': '/api/home/products',
  'highest-priced': '/api/home/products',
};

// --- Sub-components ---

const Tabs = React.memo(({ activeTab, setActiveTab }: TabsProps) => {
  return (
    <nav className="flex space-x-4">
      {TABS_DATA.map((tab) => (
        <div key={tab.id} className={`pb-1 ${activeTab === tab.id ? 'border-b-2 border-[#8D0000]' : ''}`}>
          <button
            onClick={() => setActiveTab(tab.id)}
            className={`px-5 py-2.5 text-sm font-medium whitespace-nowrap rounded font-semibold cursor-pointer
            ${activeTab === tab.id
                ? 'bg-[#8D0000] text-white'
                : 'shadow-slate-500/30 shadow-[0_0_20px_var(--tw-shadow-color)]'
              }
            `}
          >
            {tab.label}
          </button>
        </div>
      ))}
    </nav>
  );
});

const ProductCard = React.memo(({ product }: ProductCardProps) => {
  const {
    name,
    bid_count,
    current_price,
    buy_now_price,
    end_time,
    created_at,
    highest_bidder_name,
    image_url,
  } = product;

  return (
    <div className="border border-gray-200 rounded-md overflow-hidden shadow-sm flex flex-col transition-shadow hover:shadow-md">
      <div className="aspect-4/3 bg-gray-100 relative">
        <img
          src={`/api/assets/` + image_url || 'https://placehold.co/600x400?text=No+Image'}
          alt={name}
          className="w-full h-full object-cover"
        />
        <p className="text-gray-500 text-xs absolute bottom-[5%] left-[5%] bg-white rounded-2xl p-1.5">Bids count: {bid_count}</p>
      </div>

      <div className="p-3 grow flex flex-col text-sm">
        <h3 className="font-semibold text-gray-800 truncate" title={name}>
          {name}
        </h3>

        <div className="mt-2">
          <span className="text-black font-medium">Current price</span>
          <p className="font-bold text-[#8D0000] text-lg">
            {formatCurrency(current_price)}
          </p>
        </div>

        <p className="text-gray-400 text-xs">
          Posted date {formatDate(created_at)}
        </p>

        <div className="mt-2">
          <span className="text-black font-semibold">Highest bidder</span>
          <p className="font-semibold text-red-600 truncate">
            {highest_bidder_name || 'No bids yet'}
          </p>
        </div>

        <p className="text-red-600 font-semibold text-xs mt-2 text-end">
          {calculateTimeRemaining(end_time)}
        </p>
      </div>
      
      <button
        className="w-full bg-[#8D0000] text-white font-bold py-2 text-sm hover:bg-red-900 transition-colors
                   disabled:bg-gray-400 disabled:cursor-not-allowed"
        disabled={!buy_now_price}
      >
        {buy_now_price ? `Buy now: ${formatCurrency(buy_now_price)}` : 'Auction Only'}
      </button>
    </div>
  );
});

// --- Main Component ---

export default function Products() {
  const [activeTab, setActiveTab] = useState<TabId>('about-to-end');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      const apiUrl = API_ENDPOINTS[activeTab];

      try {
        const res = await fetch(apiUrl);
        if (!res.ok) {
          throw new Error('Network response was not ok');
        }
        const data: Product[] = await res.json();
        setProducts(data);
      } catch (error) {
        console.error('Failed to fetch products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [activeTab]);

  return (
    <div className="w-[90%] max-w-8xl mx-auto py-8">
      <Tabs activeTab={activeTab} setActiveTab={setActiveTab} />

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading products...</div>
      ) : products.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mt-6">
          {products.map((product, index) => (
            <ProductCard key={product.id || index} product={product} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-gray-500">No products found.</div>
      )}
    </div>
  );
}