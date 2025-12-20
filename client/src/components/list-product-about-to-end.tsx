import React, { useEffect, useState } from 'react';
import { ClipLoader } from 'react-spinners';
import { MemoProductCard, Product } from './product';

type TabId = 'about-to-end' | 'most-bid' | 'highest-priced';

type TabsProps = {
  activeTab: TabId;
  setActiveTab: React.Dispatch<React.SetStateAction<TabId>>;
};

const TABS_DATA = [
  { id: 'about-to-end' as TabId, label: 'About to end' },
  { id: 'most-bid' as TabId, label: 'Most bid' },
  { id: 'highest-priced' as TabId, label: 'Highest-priced' },
];

const API_ENDPOINTS: Record<TabId, string> = {
  'about-to-end': '/api/home/products/endest',
  'most-bid': '/api/home/products/topbid',
  'highest-priced': '/api/home/products/highestprice',
};

const Tabs = React.memo(({ activeTab, setActiveTab }: TabsProps) => {
  return (
    <nav className="flex space-x-4">
      {TABS_DATA.map((tab) => (
        <div
          key={tab.id}
          className={`pb-1 ${activeTab === tab.id ? 'border-b-2 border-[#8D0000]' : ''}`}
        >
          <button
            onClick={() => setActiveTab(tab.id)}
            className={`px-5 py-2.5 text-sm whitespace-nowrap rounded font-semibold cursor-pointer
            ${
              activeTab === tab.id
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
        <div className="min-h-[50vh] w-full flex flex-col justify-center items-center">
          <ClipLoader size={50} color="#8D0000" />
        </div>
      ) : products.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mt-6">
          {products.map((product, index) => (
            <MemoProductCard key={product.id || index} product={product} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-gray-500">No products found.</div>
      )}
    </div>
  );
}
