import React, { useEffect, useState, useMemo, JSX } from 'react';
import { ClipLoader } from 'react-spinners';
import { useParams, useSearchParams } from 'react-router-dom';
import { MemoProductCard } from '../components/product';

type Product = {
  id: string | number;
  name: string;
  bid_count: number;
  current_price: string;
  buy_now_price: string | null;
  end_time: string;
  created_at: string;
  highest_bidder_name: string | null;
  image_url: string | null;
};

type ProductCardProps = { product: Product };
type SortTabId = 'endTimeDesc' | 'priceAsc';

interface SortTabItem {
  id: SortTabId;
  label: string;
  sort: string;
  order: 'desc' | 'asc';
}

interface SortTabsProps {
  activeTab: SortTabId;
  setActiveTab: React.Dispatch<React.SetStateAction<SortTabId>>;
}

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

interface PaginatedProductsResponse {
  products: Product[];
  totalItems: number;
}

const INITIAL_ITEMS_PER_PAGE = 10;
const ITEMS_PER_PAGE_OPTIONS = [5, 10, 20, 50];

const SORT_TABS_DATA: SortTabItem[] = [
  { id: 'endTimeDesc', label: 'End time: Descending', sort: 'end_time', order: 'desc' },
  { id: 'priceAsc', label: 'Price: Ascending', sort: 'current_price', order: 'asc' },
];

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

// **Responsive Change for SortTabs**: Uses flex-wrap and reduced spacing on mobile

const SortTabs = React.memo(({ activeTab, setActiveTab }: SortTabsProps): JSX.Element => {
  return (
    <nav className="flex flex-wrap justify-center sm:justify-start space-x-2 sm:space-x-4">
      {SORT_TABS_DATA.map((tab) => (
        <div
          key={tab.id}
          className={`pb-1 ${activeTab === tab.id ? 'border-b-2 border-[#8D0000]' : ''}`}
        >
          <button
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-1.5 sm:px-5 sm:py-2.5 text-xs sm:text-sm whitespace-nowrap rounded font-semibold cursor-pointer transition-colors ${
              activeTab === tab.id ? 'bg-[#8D0000] text-white' : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            {tab.label}
          </button>
        </div>
      ))}
    </nav>
  );
});

const Pagination = React.memo(
  ({ currentPage, totalPages, onPageChange }: PaginationProps): JSX.Element => {
    if (totalPages <= 1) return <></>;

    const getPageNumbers = () => {
      const delta = 2;
      const range = [];
      for (
        let i = Math.max(2, currentPage - delta);
        i <= Math.min(totalPages - 1, currentPage + delta);
        i++
      ) {
        range.push(i);
      }
      if (currentPage - delta > 2) range.unshift('...');
      if (currentPage + delta < totalPages - 1) range.push('...');
      range.unshift(1);
      if (totalPages > 1) range.push(totalPages);

      return range.filter(
        (item, index, self) =>
          !(item === '...' && self[index - 1] === '...') && !(item === self[index - 1])
      );
    };

    const pageNumbers = useMemo(getPageNumbers, [currentPage, totalPages]);

    return (
      <div className="flex justify-center items-center space-x-1 sm:space-x-2 mt-8 flex-wrap">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-3 py-1 border rounded-md bg-gray-100 text-sm disabled:opacity-50 hover:bg-gray-200 transition-colors"
        >
          &lt;
        </button>
        {pageNumbers.map((item, index) =>
          item === '...' ? (
            <span key={index} className="px-1 py-1 text-gray-500">
              ...
            </span>
          ) : (
            <button
              key={index}
              onClick={() => onPageChange(Number(item))}
              className={`px-3 sm:px-4 py-1 border rounded-md text-sm font-semibold transition-colors ${
                currentPage === item
                  ? 'bg-[#8D0000] text-white border-[#8D0000]'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300'
              }`}
            >
              {item}
            </button>
          )
        )}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-3 py-1 border rounded-md bg-gray-100 text-sm disabled:opacity-50 hover:bg-gray-200 transition-colors"
        >
          &gt;
        </button>
      </div>
    );
  }
);

export default function ProductsPage(): JSX.Element {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeSortTab, setActiveSortTab] = useState<SortTabId>('endTimeDesc');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [itemsPerPage, setItemsPerPage] = useState<number>(INITIAL_ITEMS_PER_PAGE);
  const { level1, level2 } = useParams<{ level1: string; level2: string }>();
  // get keyword from URL search params
  const [searchParams] = useSearchParams();
  const keyword = searchParams.get('keyword');

  const currentSort = SORT_TABS_DATA.find((tab) => tab.id === activeSortTab)!;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [level1, level2, activeSortTab, itemsPerPage, keyword]);

  useEffect(() => {
    let apiUrlWithParams = '';
    const fetchProducts = async () => {
      setLoading(true);
      const params = new URLSearchParams({
        sort: currentSort.sort,
        order: currentSort.order,
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
      });
      console.log('lvel', level1, level2);
      // *** full-text search
      if (keyword) {
        params.append('keyword', keyword);
        apiUrlWithParams = `/api/products/search?${params.toString()}`;
      } else if (!level2 || level2 === '*') {
        console.log('----');
        if (!level1 || level1 === 'all' || level1 === '*')
          apiUrlWithParams = `/api/productsLV/*/*?${params.toString()}`;
        else {
          apiUrlWithParams = `/api/productsLV/${level1}/*?${params.toString()}`;
          console.log(apiUrlWithParams);
        }
      } else {
        // specific category
        const safeLevel2 = level2 === 'all' || !level2 ? '*' : level2;
        apiUrlWithParams = `/api/productsLV/${level1}/${safeLevel2}?${params.toString()}`;
      }

      try {
        const res = await fetch(apiUrlWithParams);
        if (!res.ok) {
          throw new Error('Network response was not ok');
        }
        const data = await res.json();
        const productList = data.products || data.data || [];
        const total = data.totalItems || data.pagination?.total || 0;
        setProducts(productList);
        setTotalItems(total);
      } catch (error) {
        console.error('Failed to fetch products:', error);
        setProducts([]);
        setTotalItems(0);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [level1, level2, activeSortTab, currentPage, itemsPerPage, keyword]);

  return (
    <div className="w-[95%] sm:w-[90%] max-w-8xl mx-auto py-6 sm:py-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800">
          {/* // ! based on keyword presence */}
          {keyword
            ? `Search results for "${keyword}"`
            : `Products ${level1 ? `in ${level1}` : ''} ${level2 ? `/ ${level2}` : ''}`}
        </h2>
        <SortTabs activeTab={activeSortTab} setActiveTab={setActiveSortTab} />
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2 sm:gap-0">
        <p className="text-gray-600 text-xs sm:text-sm font-medium">
          {totalItems > 0
            ? `Showing ${(currentPage - 1) * itemsPerPage + 1} - ${Math.min(currentPage * itemsPerPage, totalItems)} of ${totalItems} products`
            : 'No products to show'}
        </p>
        <div className="flex items-center space-x-2 text-sm">
          <label htmlFor="items-per-page" className="text-gray-600 text-xs sm:text-sm">
            Items per page:
          </label>
          <select
            id="items-per-page"
            value={itemsPerPage}
            onChange={(e) => setItemsPerPage(Number(e.target.value))}
            className="p-1 border border-gray-300 rounded focus:border-[#8D0000] focus:ring-[#8D0000] cursor-pointer text-sm"
          >
            {ITEMS_PER_PAGE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      </div>

      <hr className="mb-6" />

      {loading ? (
        <div className="min-h-[50vh] w-full flex flex-col justify-center items-center">
          <ClipLoader size={50} color="#8D0000" />
          <p className="mt-4 text-gray-600">Loading products...</p>
        </div>
      ) : products.length > 0 ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 mt-6">
            {products.map((product) => (
              <MemoProductCard key={product.id} product={product} />
            ))}
          </div>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </>
      ) : (
        <div className="text-center py-12 text-gray-500">
          {keyword
            ? `No products found matching "${keyword}".`
            : 'No products found for this category.'}
        </div>
      )}
    </div>
  );
}
