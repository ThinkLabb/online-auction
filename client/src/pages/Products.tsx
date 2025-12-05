import React, { useEffect, useState, useMemo, JSX } from "react";
import { ClipLoader } from "react-spinners";
import { useParams } from "react-router-dom";

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
type ProductCardProps = { product: Product; }
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


const SortTabs = React.memo(({ activeTab, setActiveTab }: SortTabsProps): JSX.Element => {
    return (
        <nav className="flex space-x-4">
            {SORT_TABS_DATA.map((tab) => (
                <div key={tab.id} className={`pb-1 ${activeTab === tab.id ? 'border-b-2 border-[#8D0000]' : ''}`}>
                    <button
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-5 py-2.5 text-sm whitespace-nowrap rounded font-semibold cursor-pointer transition-colors
                            ${activeTab === tab.id ? 'bg-[#8D0000] text-white' : 'text-gray-700 hover:bg-gray-100'}`}
                    >
                        {tab.label}
                    </button>
                </div>
            ))}
        </nav>
    );
});

const ProductCard = React.memo(({ product }: ProductCardProps): JSX.Element => {
    const {name,bid_count,current_price,buy_now_price,end_time,created_at,highest_bidder_name,image_url,} = product;
    const handleBuyNowClick = (e: React.MouseEvent) => {e.stopPropagation();console.log(`Buy now clicked for product ${product.id}`);};
    const handleCardClick = () => {console.log(`Navigating to product ${product.id}`);};
    return (
        <div 
            className="border border-gray-200 rounded-md overflow-hidden shadow-sm flex flex-col transition-shadow hover:shadow-md cursor-pointer"
            onClick={handleCardClick}
        >
            <div className="aspect-4/3 bg-gray-100 relative">
                <img
                    src={`/api/assets/` + image_url || 'https://placehold.co/600x400?text=No+Image'}
                    alt={name}
                    className="w-full h-full object-cover"
                />
                <p className="text-gray-500 text-xs absolute bottom-[5%] left-[5%] bg-white rounded-2xl p-1.5">Bids count: {bid_count}</p>
            </div>
            <div className="p-3 grow flex flex-col text-sm">
                <h3 className="font-semibold text-gray-800 truncate" title={name}>{name}</h3>
                <div className="mt-2">
                    <span className="text-black font-medium">Current price</span>
                    <p className="font-bold text-[#8D0000] text-lg">{formatCurrency(current_price)}</p>
                </div>
                <p className="text-gray-400 text-xs">Posted date {formatDate(created_at)}</p>
                <div className="mt-2">
                    <span className="text-black font-semibold">Highest bidder</span>
                    <p className="font-semibold text-red-600 truncate">{highest_bidder_name || 'No bids yet'}</p>
                </div>
                <p className="text-red-600 font-semibold text-xs mt-2 text-end">{calculateTimeRemaining(end_time)}</p>
            </div>
            <button
                className="w-full bg-[#8D0000] text-white font-bold py-2 text-sm hover:bg-red-900 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                disabled={!buy_now_price}
                onClick={handleBuyNowClick}
            >
                {buy_now_price ? `Buy now: ${formatCurrency(buy_now_price)}` : 'Auction Only'}
            </button>
        </div>
    );
});

const Pagination = React.memo(({ currentPage, totalPages, onPageChange }: PaginationProps): JSX.Element => {
    // Ẩn thanh phân trang nếu chỉ có 1 trang hoặc ít hơn
    if (totalPages <= 1) return <></>; 
    
    const getPageNumbers = () => {
        const delta = 2;
        const range = [];
        for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
            range.push(i);
        }
        if (currentPage - delta > 2) range.unshift('...');
        if (currentPage + delta < totalPages - 1) range.push('...');
        
        range.unshift(1);
        if (totalPages > 1) range.push(totalPages);
        
        return range.filter((item, index, self) =>
            !(item === '...' && self[index - 1] === '...') && !(item === self[index-1])
        );
    };
    const pageNumbers = useMemo(getPageNumbers, [currentPage, totalPages]);
    
    return (
        <div className="flex justify-center items-center space-x-2 mt-8">
            <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-1 border rounded-md bg-gray-100 text-sm disabled:opacity-50"
            >
                &lt;
            </button>
            
            {pageNumbers.map((item, index) => (
                item === '...' ? (
                    <span key={index} className="px-1 py-1 text-gray-500">...</span>
                ) : (
                    <button
                        key={index}
                        onClick={() => onPageChange(Number(item))}
                        className={`px-4 py-1 border rounded-md text-sm font-semibold transition-colors
                            ${currentPage === item
                                ? 'bg-[#8D0000] text-white border-[#8D0000]'
                                : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300'
                            }`}
                    >
                        {item}
                    </button>
                )
            ))}
            
            <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-1 border rounded-md bg-gray-100 text-sm disabled:opacity-50"
            >
                &gt;
            </button>
        </div>
    );
});


export default function ProductsPage(): JSX.Element {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [activeSortTab, setActiveSortTab] = useState<SortTabId>('endTimeDesc');
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [totalItems, setTotalItems] = useState<number>(0);
    const [itemsPerPage, setItemsPerPage] = useState<number>(INITIAL_ITEMS_PER_PAGE); 
    
    const { level1, level2 } = useParams<{ level1: string, level2: string }>();
    const currentSort = SORT_TABS_DATA.find(tab => tab.id === activeSortTab)!;
    
    const totalPages = Math.ceil(totalItems / itemsPerPage); 

    useEffect(() => {
        setCurrentPage(1);
    }, [level1, level2, activeSortTab, itemsPerPage]);

    useEffect(() => {
        if (!level1 || !level2) {
            console.error("Missing category parameters in URL.");
            setLoading(false);
            return;
        }

        const fetchProducts = async () => {
            setLoading(true);
            
            const params = new URLSearchParams({
                sort: currentSort.sort,
                order: currentSort.order,
                page: currentPage.toString(),
                limit: itemsPerPage.toString(), 
            });
            const apiUrlWithParams = `/api/products/${level1}/${level2}?${params.toString()}`;
            console.log(`Fetching products from: ${apiUrlWithParams}`);
            
            try {
                const res = await fetch(apiUrlWithParams);
                if (!res.ok) {
                    throw new Error('Network response was not ok');
                }
                
                const data: PaginatedProductsResponse = await res.json();
                
                setProducts(data.products || []); 
                setTotalItems(data.totalItems || 0); 
                
            } catch (error) {
                console.error('Failed to fetch products:', error);
                setProducts([]);
                setTotalItems(0);
            } finally {
                setLoading(false);
            }
        };

        fetchProducts();
        
    }, [level1, level2, activeSortTab, currentPage, itemsPerPage]);

    return (
        <div className="w-[90%] max-w-8xl mx-auto py-8">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">
                    Products in {level1} {level2 !== "*" ? `/ ${level2}` : ""}
                </h2>
                <SortTabs activeTab={activeSortTab} setActiveTab={setActiveSortTab} />
            </div>

            <div className="flex justify-between items-center mb-4">
                <p className="text-gray-600 text-sm font-medium">
                    {totalItems > 0 
                        ? `Showing ${((currentPage - 1) * itemsPerPage) + 1} - ${Math.min(currentPage * itemsPerPage, totalItems)} of ${totalItems} products` 
                        : 'No products to show'}
                </p>
                
                <div className="flex items-center space-x-2 text-sm">
                    <label htmlFor="items-per-page" className="text-gray-600">Items per page:</label>
                    <select
                        id="items-per-page"
                        value={itemsPerPage}
                        onChange={(e) => setItemsPerPage(Number(e.target.value))}
                        className="p-1 border border-gray-300 rounded focus:border-[#8D0000] focus:ring-[#8D0000] cursor-pointer"
                    >
                        {ITEMS_PER_PAGE_OPTIONS.map(option => (
                            <option key={option} value={option}>{option}</option>
                        ))}
                    </select>
                </div>
            </div>
            
            <hr className="mb-6"/>

            {loading ? (
                <div className="min-h-[50vh] w-full flex flex-col justify-center items-center">
                    <ClipLoader size={50} color="#8D0000"/>
                    <p className="mt-4 text-gray-600">Loading products...</p>
                </div>
            ) : products.length > 0 ? (
                <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mt-6">
                        {products.map((product, index) => (
                            <ProductCard key={product.id || index} product={product} />
                        ))}
                    </div>
                    
                    <Pagination 
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                    />
                </>
            ) : (
                <div className="text-center py-12 text-gray-500">No products found for this category or sort criteria.</div>
            )}
        </div>
    );
}