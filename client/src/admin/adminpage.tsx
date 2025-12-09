import React, { useState, useEffect, useCallback } from "react";
import { Package, FolderTree, Users, UserCheck, Settings, LogOut, Menu, X, ChevronDown, Trash2, Eye, Shield, Edit } from "lucide-react";
import { useNavigate } from "react-router-dom";

// --- Helpers ---
// Hàm cn: Chỉ chấp nhận string, boolean, hoặc undefined. Sử dụng toán tử && cho điều kiện.
const cn = (...classes: (string | boolean | undefined)[]): string => classes.filter(Boolean).join(' ');

// --- Types & API Endpoints ---

type AdminTabId = 'categories' | 'products' | 'users' | 'upgrade-requests' | 'settings';

interface SidebarItem {
    id: AdminTabId;
    label: string;
    icon: React.FC<any>;
}

// Định nghĩa các Endpoint API - Để trống để bạn điền vào sau
const API_ENDPOINTS = {
    categories: '/api/admin/categories', // URL API cho Category Management
    products: '/api/admin/products', // URL API cho Product Management
    users: '/api/admin/users', // URL API cho User Management
    upgradeRequests: '/api/admin/upgradeRequests', // URL API cho Upgrade Approval
};

// 1. Types cho Category
interface Category {
    id: number;
    name: string;
    parent_id: number | null;
    parent_name: string | null;
    product_count: number;
}
// 2. Types cho Product
interface Product {
    id: number;
    name: string;
    current_price: number; // Ví dụ: 1500
    status: 'Active Auction' | 'Ended' | 'Draft'; // Ví dụ: Trạng thái đấu giá
}
// 3. Types cho User
interface User {
    id: number;
    name: string;
    email: string;
    role: string;
}
// 4. Types cho Upgrade Request
interface UpgradeRequest {
    request_id: number;
    user_id: number;
    name: string;
    request_at: string; // Ví dụ: "20/12/2025"
    message: string; // Link đến tài liệu đính kèm
}


const ADMIN_SIDEBAR_ITEMS: SidebarItem[] = [
    { id: 'categories', label: 'Category Management', icon: FolderTree },
    { id: 'products', label: 'Product Management', icon: Package },
    { id: 'users', label: 'User Management', icon: Users },
    { id: 'upgrade-requests', label: 'Upgrade Approval', icon: UserCheck },
    { id: 'settings', label: 'System Settings', icon: Settings },
];

const fetchData = async <T,>(url: string, setData: React.Dispatch<React.SetStateAction<T[]>>, setLoading: React.Dispatch<React.SetStateAction<boolean>>, setError: React.Dispatch<React.SetStateAction<string | null>>): Promise<void> => {
    setLoading(true);
    setError(null);
    console.log(url);
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const result = await response.json();
        console.log(result)
        setData(result.data as T[]);
    } catch (err) {
        console.error("Fetch error:", err);
        setData([]); 
    } finally {
        setLoading(false);
    }
};


const getButtonClasses = (variant: 'primary' | 'ghost' | 'destructive' | 'default' = 'default', size: 'icon' | 'default' | 'sm' = 'default', className: string = '') => {
    let baseStyle = "rounded font-semibold transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed";
    let sizeStyle = "py-2 px-4";
    let variantStyle = "bg-gray-200 hover:bg-gray-300 text-gray-800";

    if (variant === 'primary') variantStyle = "bg-[#8D0000] hover:cursor-pointer text-white";
    if (variant === 'destructive') variantStyle = "bg-black hover:cursor-pointer text-white";
    if (variant === 'ghost') variantStyle = "bg-transparent hover:bg-gray-100 text-gray-800";

    if (size === 'icon') sizeStyle = "p-2 rounded-full";
    if (size === 'sm') sizeStyle = "py-1.5 px-3 text-sm";
    
    return cn(baseStyle, sizeStyle, variantStyle, className);
};

const getInputClasses = (className: string = '') => {
    return cn("border-2 px-2 rounded-md w-full py-1", className);
};


const AdminSidebar: React.FC<{ activeTab: AdminTabId; setActiveTab: React.Dispatch<React.SetStateAction<AdminTabId>>; sidebarOpen: boolean; setSidebarOpen: React.Dispatch<React.SetStateAction<boolean>> }> = 
    React.memo(({ activeTab, setActiveTab, sidebarOpen, setSidebarOpen }) => {
    
    const iconButtonClass = getButtonClasses('ghost', 'icon', "lg:hidden");
    const navigate = useNavigate();

    useEffect(() => {
        (async() => {
            try {
                const res = await fetch('/admin', {
                    credentials: 'include',
                });
                const result = await res.json()
                if (!res.ok || !result.isSuccess) {
                    navigate('/');
                }
            } catch(e) {
                navigate('/');
            }
        })()
    }, [])

    return (
        <aside
            className={cn(
                "fixed left-0 top-0 z-50 h-full w-64 transform bg-white border-r border-gray-200 transition-transform duration-200 ease-in-out lg:translate-x-0 shadow-xl",
                sidebarOpen ? "translate-x-0" : "-translate-x-full",
            )}
        >
            <div className="flex h-16 items-center justify-between border-b border-gray-200 px-4">
                <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#8D0000]">
                        <Package className="h-5 w-5 text-white" />
                    </div>
                    <span className="text-lg font-bold text-gray-800">Menu</span>
                </div>
                <button className={iconButtonClass} onClick={() => setSidebarOpen(false)}>
                    <X className="h-5 w-5" />
                </button>
            </div>
            {/* Nav Menu */}
            <nav className="flex flex-col gap-1 p-4">
                {ADMIN_SIDEBAR_ITEMS.map((item) => {
                    const isActive = activeTab === item.id;
                    const Icon = item.icon;
                    return (
                        <div
                            key={item.id}
                            onClick={() => {
                                setActiveTab(item.id);
                                setSidebarOpen(false);
                            }}
                            className={cn(
                                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors cursor-pointer",
                                isActive
                                    ? "bg-[#8D0000] text-white shadow-md"
                                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
                            )}
                        >
                            <Icon className="h-5 w-5" />
                            {item.label}
                        </div>
                    );
                })}
            </nav>
            {/* Logout */}
            <div className="absolute bottom-0 left-0 right-0 border-t border-gray-200 p-4">
                <button className="text-[#8D0000] font-bold flex flex-row gap-2 justify-center">
                    <LogOut className="h-5 w-5" /> Log Out
                </button>
            </div>
        </aside>
    );
});

const AdminHeader: React.FC<{ title: string; setSidebarOpen: React.Dispatch<React.SetStateAction<boolean>> }> = React.memo(({ title, setSidebarOpen }) => {
    const menuButtonClass = getButtonClasses('ghost', 'icon', "lg:hidden");
    
    return (
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 lg:px-6 shadow-sm">
            <h1 className="text-xl font-bold text-gray-800">Admin Management</h1>
            <div className="flex items-center gap-4">
                {/* Menu Button */}
                <button className={menuButtonClass} onClick={() => setSidebarOpen(true)}>
                    <Menu className="h-5 w-5" />
                </button>
                {/* User Dropdown/Avatar placeholder */}
                <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center font-bold text-sm">AD</div>
                    <ChevronDown className="h-4 w-4 text-gray-600" />
                </div>
            </div>
        </header>
    );
});

// --- Content Components (Management Tabs) ---

// 4.1 Category Management
const CategoryManagement: React.FC = () => {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const primaryButtonClass = getButtonClasses('primary', 'default', "flex flex-row items-center");
    const iconGhostBlueClass = getButtonClasses('ghost', 'icon', "text-blue-600 hover:text-blue-800 mr-2");
    const iconDestructiveClass = getButtonClasses('destructive', 'icon', "");

    useEffect(() => {
        fetchData<Category>(API_ENDPOINTS.categories, setCategories, setLoading, setError);
    }, []);

   
    if (loading) return <div className="text-center py-8">Loading Categories...</div>;
    if (error) return <div className="text-center py-8 text-red-600">Error: {error}</div>;


    return (
        <div className="max-w-6xl flex flex-col gap-4">
            <h2 className="text-2xl font-bold">Category Management</h2>
            
            {/* Search and Add Button */}
            <div className="flex flex-row gap-2 justify-between items-center bg-white p-4 rounded-lg shadow-sm">
                <input 
                    type="text" 
                    placeholder="Search Categories..." 
                    className={getInputClasses("w-1/3 border-gray-300")} 
                />
                <button className={primaryButtonClass}>
                    Add
                </button>
            </div>
            
            {/* Category Table */}
            <div className="overflow-x-auto border rounded-md shadow-md bg-white">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Parent Category</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product Count</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {categories.map((category, index) => {
                            const canDelete = category.product_count === 0;
                            
                            return (
                                <tr key={index} className="hover:bg-gray-50">
                                    <td className='px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900'>
                                        {category.name}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {category.parent_name || <span className="text-gray-400 italic">None (Level 1)</span>}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {category.product_count}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                                        <button className={iconGhostBlueClass} title="View Details"><Eye className="h-4 w-4" /></button>
                                        <button className={getButtonClasses('ghost', 'icon', "text-yellow-600 hover:text-yellow-800 mr-2")} title="Edit"><Edit className="h-4 w-4" /></button>
                                        <button 
                                            className={cn(iconDestructiveClass, !canDelete && 'cursor-not-allowed')} 
                                            disabled={!canDelete} 
                                            title={!canDelete ? "Cannot delete category with products" : "Delete"}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// 4.2 Product Management
const ProductManagement: React.FC = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const primaryButtonClass = getButtonClasses('primary', 'default', "flex flex-row items-center");
    const iconGhostBlueClass = getButtonClasses('ghost', 'icon', "text-blue-600 hover:text-blue-800 mr-2");
    const iconDestructiveClass = getButtonClasses('destructive', 'icon', "mr-2");

    useEffect(() => {
        fetchData<Product>(API_ENDPOINTS.products, setProducts, setLoading, setError);
    }, []);

    if (loading) return <div className="text-center py-8">Loading Products...</div>;
    if (error) return <div className="text-center py-8 text-red-600">Error: {error}</div>;

    return (
         <div className="max-w-6xl flex flex-col gap-4">
            <h2 className="text-2xl font-bold">Product Management</h2>
            
            {/* Search and Add Button */}
            <div className="flex flex-row gap-2 justify-between items-center bg-white p-4 rounded-lg shadow-sm">
                <input 
                    type="text" 
                    placeholder="Search Products..." 
                    className={getInputClasses("w-1/3 border-gray-300")}
                />
                <button className={primaryButtonClass}>
                    Add
                </button>
            </div>
            {/* Product Table */}
            <div className="overflow-x-auto border rounded-md">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Current Price</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {products.map(product => (
                            <tr key={product.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{product.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{product.current_price.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm"><span className={cn(product.status === 'Active Auction' ? 'text-green-600' : 'text-red-600', "font-semibold")}>{product.status}</span></td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                                    <button className={iconGhostBlueClass} title="View Details"><Eye className="h-4 w-4" /></button>
                                    <button className={getButtonClasses('ghost', 'icon', "text-yellow-600 hover:text-yellow-800 mr-2")} title="Edit"><Edit className="h-4 w-4" /></button>
                                    <button className={iconDestructiveClass} title="Remove Product"><Trash2 className="h-4 w-4" /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// 4.3 User Management
const UserManagement: React.FC<{ setActiveTab: React.Dispatch<React.SetStateAction<AdminTabId>> }> = ({ setActiveTab }) => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const primaryButtonClass = getButtonClasses('primary', 'default', "flex flex-row items-center");
    const iconGhostBlueClass = getButtonClasses('ghost', 'icon', "text-blue-600 hover:text-blue-800 mr-2");
    const iconDestructiveClass = getButtonClasses('destructive', 'icon', "");

    useEffect(() => {
        fetchData<User>(API_ENDPOINTS.users, setUsers, setLoading, setError);
    }, []);

    if (loading) return <div className="text-center py-8">Loading Users...</div>;
    if (error) return <div className="text-center py-8 text-red-600">Error: {error}</div>;

    return (
        
        <div className="max-w-6xl flex flex-col gap-4">
            <h2 className="text-2xl font-bold">Users List</h2>
            
            <div className="flex flex-row gap-2 justify-between items-center bg-white p-4 rounded-lg shadow-sm">
                <input 
                    type="text" 
                    placeholder="Search Users..." 
                    className={getInputClasses("w-1/3 border-gray-300")}
                />
            </div>
            <div>
                <div className="overflow-x-auto border rounded-md">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {users.map(user => (
                                <tr key={user.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        <span className={cn(
                                            user.role === 'admin' ? 'text-[#8D0000]' : user.role === 'seller' ? 'text-[#8D0000]' : 'text-black', 
                                            "font-semibold"
                                        )}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                                        <button className={iconGhostBlueClass} title="View Details"><Eye className="h-4 w-4" /></button>
                                        <button 
                                            className={cn(iconDestructiveClass, !(user.role === 'admin')  && 'cursor-not-allowed')} 
                                            disabled={user.role === 'admin'} 
                                            title={!(user.role === 'admin') ? "Cannot delete users who is admin" : "Delete"}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            
            {/* Link to Upgrade Requests */}
            <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-2xl font-bold mb-4">Bidder ➠ Seller Upgrade Requests</h2>
                <div className="mb-4">
                    <button className={primaryButtonClass} onClick={() => setActiveTab('upgrade-requests')}>
                        <Shield className="h-4 w-4 mr-2" /> View pending requests
                    </button>
                </div>
            </div>
        </div>
    );
};

// 4.3 (Cont.) Upgrade Approval
const UpgradeRequestsManagement: React.FC = () => {
    const [requests, setRequests] = useState<UpgradeRequest[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedRequest, setSelectedRequest] = useState<UpgradeRequest | null>(null);

    const smPrimaryButtonClass = getButtonClasses('primary', 'sm', "mr-2");
    const smDestructiveButtonClass = getButtonClasses('destructive', 'sm', "");

    useEffect(() => {
        fetchData<UpgradeRequest>(API_ENDPOINTS.upgradeRequests, setRequests, setLoading, setError);
    }, []);

    if (loading) return <div className="text-center py-8">Loading Requests...</div>;
    if (error) return <div className="text-center py-8 text-red-600">Error: {error}</div>;

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold mb-4">Upgrade Requests List</h2>
            {/* Requests Table */}
            <div className="overflow-x-auto border rounded-md">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Username</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Request Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Request Message</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
                        </tr>
                    </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {requests.map(request => (
                                <tr key={request.request_id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{request.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{request.request_at}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 cursor-pointer font-medium hover:text-blue-700"
                                    onClick={() => setSelectedRequest(request)}>
                                    View File
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                                    <button className={smPrimaryButtonClass}>Approve</button>
                                    <button className={smDestructiveButtonClass}>Reject</button>
                                </td>
                                </tr>
                            ))}

                            {selectedRequest && (
                                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                                <div className="bg-white rounded-lg shadow-2xl p-6 w-full max-w-md transform transition-all">
                                    <h2 className="text-xl font-semibold mb-4 border-b pb-2 text-gray-900">
                                        Request Message
                                    </h2>
                                    
                                    <div className="max-h-60 overflow-y-auto mb-6 p-2 bg-gray-50 rounded-md border border-gray-200">
                                    <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">
                                        {selectedRequest.message}
                                    </p>
                                    </div>

                                    <div className="flex justify-end">
                                    <button
                                        onClick={() => setSelectedRequest(null)}
                                        className="px-4 py-2 bg-[#8D0000] text-white font-medium rounded-md text-sm hover:cursor-pointer transition duration-150 ease-in-out"
                                    >
                                        Close
                                    </button>
                                    </div>
                                </div>
                                </div>
                            )}
                        </tbody>

                </table>
            </div>
        </div>
    );
};

const SettingsManagement: React.FC = () => (
    <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-4">System Settings</h2>
        <p className="text-gray-600">This area is for configuring the general operating parameters of the auction platform.</p>
    </div>
);


// --- Main Component (KHÔNG THAY ĐỔI) ---
export default function AdminPage() {
    const [activeTab, setActiveTab] = useState<AdminTabId>('categories');
    const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);

    const currentItem = ADMIN_SIDEBAR_ITEMS.find(item => item.id === activeTab);
    const title = currentItem ? currentItem.label : 'Admin Dashboard';

    const renderContent = () => {
        switch (activeTab) {
            case 'categories':
                return <CategoryManagement />;
            case 'products':
                return <ProductManagement />;
            case 'users':
                return <UserManagement setActiveTab={setActiveTab} />;
            case 'upgrade-requests':
                return <UpgradeRequestsManagement />;
            case 'settings':
                return <SettingsManagement />;
            default:
                return <div className="text-center py-12 text-gray-500">Please select a management section.</div>;
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Overlay for Mobile */}
            {sidebarOpen && (
                <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
            )}

            <AdminSidebar activeTab={activeTab} setActiveTab={setActiveTab} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
            
            <div className="lg:pl-64">
                <AdminHeader title={title} setSidebarOpen={setSidebarOpen} />
                
                {/* Main Content */}
                <main className="p-4 lg:p-6">
                    {renderContent()}
                </main>
            </div>
        </div>
    );
}