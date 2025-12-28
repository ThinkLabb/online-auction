import { useNavigate } from 'react-router-dom';
import React, { useState, useEffect, JSX, use } from "react";
import { Package, FolderTree, Users, UserCheck, Settings, LogOut, Menu, X, ChevronDown, Trash2, Eye, Shield, Edit, Save } from "lucide-react";
import { useUser } from "../UserContext";
import { includes } from "zod";

// --- Helpers ---
const cn = (...classes: (string | boolean | undefined)[]): string =>
  classes.filter(Boolean).join(' ');

// --- Types & API Endpoints ---
type AdminTabId = 'categories' | 'products' | 'users' | 'upgrade-requests' | 'settings';

interface SidebarItem {
  id: AdminTabId;
  label: string;
  icon: React.FC<any>;
}

const API_ENDPOINTS = {
    categories: '/api/admin/categories',
    products: '/api/admin/products',
    users: '/api/admin/users',
    upgradeRequests: '/api/admin/upgradeRequests',
    settings: '/api/admin/settings',
};

interface Category {
  id: number;
  name: string;
  parent_id: number | null;
  parent_name: string | null;
  product_count: number;
}
interface Product {
  id: number;
  name: string;
  current_price: number;
  status: 'Active Auction' | 'Ended' | 'Draft';
}
interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  address: string;
  created_at: Date;
  birthdate: Date | null;
  minus_review: number;
  plus_review: number;
  updated_at: Date;
}
interface UpgradeRequest {
  request_id: number;
  user_id: number;
  name: string;
  request_at: string;
  message: string;
}

const ADMIN_SIDEBAR_ITEMS: SidebarItem[] = [
    { id: 'categories', label: 'Category Management', icon: FolderTree },
    { id: 'products', label: 'Product Management', icon: Package },
    { id: 'users', label: 'User Management', icon: Users },
    { id: 'upgrade-requests', label: 'Upgrade Approval', icon: UserCheck },
    { id: 'settings', label: 'System Settings', icon: Settings },
];

const fetchData = async <T,>(
  url: string,
  setData: React.Dispatch<React.SetStateAction<T[]>>,
  setLoading: React.Dispatch<React.SetStateAction<boolean>>,
  setError: React.Dispatch<React.SetStateAction<string | null>>
): Promise<void> => {
  setLoading(true);
  setError(null);
  try {
    const response = await fetch(url, { method: 'GET' });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const result = await response.json();
    setData(result.data as T[]);
  } catch (err) {
    console.error('Fetch error:', err);
    setData([]);
  } finally {
    setLoading(false);
  }
};

const getButtonClasses = (
  variant: 'primary' | 'ghost' | 'destructive' | 'default' = 'default',
  size: 'icon' | 'default' | 'sm' = 'default',
  className: string = ''
) => {
  let baseStyle =
    'rounded font-semibold transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed';
  let sizeStyle = 'py-2 px-4';
  let variantStyle = 'bg-gray-200 hover:bg-gray-300 text-gray-800';

  if (variant === 'primary') variantStyle = 'bg-[#8D0000] hover:cursor-pointer text-white';
  if (variant === 'destructive') variantStyle = 'bg-black hover:cursor-pointer text-white';
  if (variant === 'ghost') variantStyle = 'bg-transparent hover:bg-gray-100 text-gray-800';

  if (size === 'icon') sizeStyle = 'p-2 rounded-full';
  if (size === 'sm') sizeStyle = 'py-1.5 px-3 text-sm';

  return cn(baseStyle, sizeStyle, variantStyle, className);
};

const getInputClasses = (className: string = '') =>
  cn('border-2 px-2 rounded-md w-full py-1', className);

// --- Sidebar ---
const AdminSidebar: React.FC<{
  activeTab: AdminTabId;
  setActiveTab: React.Dispatch<React.SetStateAction<AdminTabId>>;
  sidebarOpen: boolean;
  setSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
}> = React.memo(({ activeTab, setActiveTab, sidebarOpen, setSidebarOpen }) => {
  const iconButtonClass = getButtonClasses('ghost', 'icon', 'lg:hidden');
  const navigate = useNavigate();

  const { user, setUser } = useUser();

  const handleLogout = async () => {
    try {
      const res = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });

      const result = await res.json();
      if (res.ok && result.isSuccess) {
        setUser(null);
        navigate('/');
      }
    } catch (e) {
      console.error(e);
    }
  };
  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-50 h-full w-64 transform bg-white border-r border-gray-200 transition-transform duration-200 ease-in-out lg:translate-x-0 shadow-xl',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
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
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors cursor-pointer',
                isActive
                  ? 'bg-[#8D0000] text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              )}
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </div>
          );
        })}
      </nav>
      <div className="absolute bottom-0 left-0 right-0 border-t border-gray-200 p-4">
        <button
          className="text-[#8D0000] font-bold flex flex-row gap-2 justify-center w-full h-full hover:cursor-pointer"
          onClick={() => handleLogout()}
        >
          <LogOut className="h-5 w-5" /> Log Out
        </button>
      </div>
    </aside>
  );
});

// --- Header ---
const AdminHeader: React.FC<{
  title: string;
  setSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
}> = React.memo(({ title, setSidebarOpen }) => {
  const menuButtonClass = getButtonClasses('ghost', 'icon', 'lg:hidden');
  const [name, setName] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/admin', { credentials: 'include' });
        const result = await res.json();
        if (!res.ok || !result.isSuccess) {
          navigate('/');
        } else {
          setName(result.data);
        }
      } catch (e) {
        navigate('/');
      }
    })();
  }, []);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 lg:px-6 shadow-sm">
      <h1 className="text-xl font-bold text-gray-800">Admin Management</h1>
      <div className="flex items-center gap-4">
        <button className={menuButtonClass} onClick={() => setSidebarOpen(true)}>
          <Menu className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-2">
          <li className="bg-[#8D0000] text-white px-3 py-1 rounded text-sm hidden sm:block">
            Welcome, {name}
          </li>
        </div>
      </div>
    </header>
  );
});

// --- Category Management ---
const CategoryManagement: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryParent, setNewCategoryParent] = useState<number | null>(null);

  const primaryButtonClass = getButtonClasses('primary', 'default', 'flex flex-row items-center');
  const iconGhostBlueClass = getButtonClasses(
    'ghost',
    'icon',
    'text-blue-600 hover:text-blue-800 mr-2'
  );
  const iconDestructiveClass = getButtonClasses('destructive', 'icon', '');

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editCategory, setEditCategory] = useState<Category | null>(null);
  const [editName, setEditName] = useState('');
  const [editParentId, setEditParentId] = useState<number | null>(null);

  const openEditModal = (category: Category) => {
    setEditCategory(category);
    setEditName(category.name);
    setEditParentId(category.parent_id);
    setIsEditModalOpen(true);
  };

  useEffect(() => {
    fetchData<Category>(API_ENDPOINTS.categories, setCategories, setLoading, setError);
  }, []);

  const handleDeleteCategory = async (category: Category) => {
    if (category.product_count > 0) return;
    try {
      setLoading(true);
      const res = await fetch(API_ENDPOINTS.categories, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: category.name,
        }),
      });

      const result = await res.json();
      setLoading(false);

      if (!res.ok && result.isSuccess == false) {
        setError(result.message);
      } else {
        setCategories(result.data);
      }
    } catch (e) {
      setError(String(e));
    }
  };

  const handleEditCategory = async (newCategory: Category) => {
    try {
      setLoading(true);
      const res = await fetch(API_ENDPOINTS.categories, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          newCategory,
        }),
      });

      const result = await res.json();
      setLoading(false);

      if (!res.ok && result.isSuccess == false) {
        setError(result.message);
      } else {
        setCategories(result.data);
      }
    } catch (e) {
      setError(String(e));
    }
  };

  const handleAddCategory = async (category: Category) => {
    try {
      setLoading(true);
      const res = await fetch(API_ENDPOINTS.categories, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          category,
        }),
      });

      const result = await res.json();
      setNewCategoryName('');
      setNewCategoryParent(null);
      setIsAddModalOpen(false);
      setLoading(false);

      if (!res.ok && result.isSuccess == false) {
        setError(result.message);
      } else {
        setCategories(result.data);
      }
    } catch (e) {
      setError(String(e));
    }
  };

  if (loading) return <div className="text-center py-8">Loading Categories...</div>;
  if (error) return <div className="text-center py-8 text-red-600">Error: {error}</div>;

  return (
    <div className="max-w-6xl flex flex-col gap-4">
      <div className="flex flex-row gap-2 justify-between items-center">
        <h2 className="text-2xl font-bold">Category Management</h2>
        <button className={primaryButtonClass} onClick={() => setIsAddModalOpen(true)}>
          Add
        </button>
      </div>

      <div className="overflow-x-auto border rounded-md shadow-md bg-white">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Category Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Parent Category
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Product Count
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {categories.map((category, index) => {
              const canDelete = category.product_count === 0;
              return (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {category.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {category.parent_name || (
                      <span className="text-gray-400 italic">None (Level 1)</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {category.product_count}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                    {/* <button className={iconGhostBlueClass} title="View Details"><Eye className="h-4 w-4" /></button> */}
                    {/* <button className={getButtonClasses('ghost', 'icon', "text-yellow-600 hover:text-yellow-800 mr-2")} title="Edit"><Edit className="h-4 w-4" /></button> */}
                    <button
                      className={getButtonClasses(
                        'ghost',
                        'icon',
                        'text-yellow-600 hover:text-yellow-800 mr-2'
                      )}
                      title="Edit"
                      onClick={() => openEditModal(category)}
                    >
                      <Edit className="h-4 w-4" />
                    </button>

                    <button
                      className={cn(iconDestructiveClass, !canDelete && 'cursor-not-allowed')}
                      disabled={!canDelete}
                      title={!canDelete ? 'Cannot delete category with products' : 'Delete'}
                      onClick={() => handleDeleteCategory(category)}
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

      {/* --- Add Modal --- */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl p-6 w-full max-w-md transform transition-all">
            <h3 className="text-xl font-bold mb-4">Add New Category</h3>

            <label className="block mb-2 font-semibold">Category Name</label>
            <input
              type="text"
              className={getInputClasses()}
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
            />

            <label className="block mt-4 mb-2 font-semibold">Parent Category</label>
            <select
              className={getInputClasses()}
              value={newCategoryParent ?? ''}
              onChange={(e) => setNewCategoryParent(Number(e.target.value) || null)}
            >
              <option value="">None (Level 1)</option>
              {categories
                .filter((cat) => cat.parent_id === null)
                .map((cat, index) => (
                  <option key={index} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
            </select>

            <div className="mt-6 flex justify-end gap-2">
              <button
                className={getButtonClasses('default')}
                onClick={() => setIsAddModalOpen(false)}
              >
                Cancel
              </button>
              <button
                className={getButtonClasses('primary')}
                onClick={() => {
                  if (newCategoryName.trim() === '') return;
                  const newCategory: Category = {
                    id: Date.now(), // tạm tạo id
                    name: newCategoryName,
                    parent_id: categories.find((c) => c.id === newCategoryParent)?.id || null,
                    parent_name: categories.find((c) => c.id === newCategoryParent)?.name || null,
                    product_count: 0,
                  };
                  handleAddCategory(newCategory);
                  // setCategories(prev => [...prev, newCategory]);
                  // setNewCategoryName('');
                  // setNewCategoryParent(null);
                  // setIsAddModalOpen(false);
                }}
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}

      {isEditModalOpen && editCategory && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl p-6 w-full max-w-md transform transition-all">
            <h3 className="text-xl font-bold mb-4">Edit Category</h3>

            <label className="block mb-2 font-semibold">Category Name</label>
            <input
              type="text"
              className={getInputClasses()}
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
            />

            <label className="block mt-4 mb-2 font-semibold">Parent Category</label>
            <select
              className={getInputClasses()}
              value={editParentId ?? ''}
              onChange={(e) => setEditParentId(Number(e.target.value) || null)}
            >
              <option value="">None (Level 1)</option>
              {categories
                .filter((cat) => cat.parent_id === null)
                .map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
            </select>

            <div className="mt-6 flex justify-end gap-2">
              <button
                className={getButtonClasses('default')}
                onClick={() => setIsEditModalOpen(false)}
              >
                Cancel
              </button>
              <button
                className={getButtonClasses('primary')}
                onClick={() => {
                  const updatedCategory: Category = {
                    ...editCategory,
                    name: editName,
                    parent_id: editParentId,
                    parent_name: categories.find((c) => c.id === editParentId)?.name || null,
                  };

                  handleEditCategory(updatedCategory);
                  setIsEditModalOpen(false);
                }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// --- Product Management ---
const ProductManagement: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const iconGhostBlueClass = getButtonClasses(
    'ghost',
    'icon',
    'text-blue-600 hover:text-blue-800 mr-2'
  );
  const iconDestructiveClass = getButtonClasses('destructive', 'icon', 'mr-2');

  useEffect(() => {
    fetchData<Product>(API_ENDPOINTS.products, setProducts, setLoading, setError);
  }, []);

  const handleDeleteProduct = async (product: Product) => {
    try {
      setLoading(true);
      const res = await fetch(API_ENDPOINTS.products, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: product.id,
        }),
      });

      const result = await res.json();
      setLoading(false);

      if (!res.ok && result.isSuccess == false) {
        setError(result.message);
      } else {
        setProducts(result.data);
      }
    } catch (e) {
      setError(String(e));
    }
  };

  if (loading) return <div className="text-center py-8">Loading Products...</div>;
  if (error) return <div className="text-center py-8 text-red-600">Error: {error}</div>;

  return (
    <div className="max-w-6xl flex flex-col gap-4">
      <h2 className="text-2xl font-bold">Product Management</h2>
      {/* <div className="flex flex-row gap-2 justify-between items-center bg-white p-4 rounded-lg shadow-sm">
                <input type="text" placeholder="Search Products..." className={getInputClasses("w-1/3 border-gray-300")} />
            </div> */}

      <div className="overflow-x-auto border rounded-md">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Product Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Current Price
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Status
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {products.map((product) => (
              <tr key={product.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {product.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {product.current_price.toLocaleString('en-US', {
                    style: 'currency',
                    currency: 'USD',
                  })}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span
                    className={cn(
                      product.status === 'Active Auction' ? 'text-green-600' : 'text-red-600',
                      'font-semibold'
                    )}
                  >
                    {product.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                  {/* <button className={iconGhostBlueClass} title="View Details"><Eye className="h-4 w-4" /></button> */}
                  <button
                    className={iconDestructiveClass}
                    title="Remove Product"
                    onClick={() => handleDeleteProduct(product)}
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
  );
};

// --- User Management ---
const UserManagement: React.FC<{
  setActiveTab: React.Dispatch<React.SetStateAction<AdminTabId>>;
}> = ({ setActiveTab }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const openViewModal = (user: User) => {
    setSelectedUser(user);
    setIsViewModalOpen(true);
  };

  const iconGhostBlueClass = getButtonClasses(
    'ghost',
    'icon',
    'text-blue-600 hover:text-blue-800 mr-2'
  );
  const iconDestructiveClass = getButtonClasses('destructive', 'icon', '');

  useEffect(() => {
    fetchData<User>(API_ENDPOINTS.users, setUsers, setLoading, setError);
  }, []);

  const handleDeleteUser = async (user: User) => {
    try {
      setLoading(true);
      const res = await fetch(API_ENDPOINTS.users, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: user.email,
        }),
      });

      const result = await res.json();
      setLoading(false);

      if (!res.ok && result.isSuccess == false) {
        setError(result.message);
      } else {
        setUsers(result.data);
      }
    } catch (e) {
      setError(String(e));
    }
  };

  if (loading) return <div className="text-center py-8">Loading Users...</div>;
  if (error) return <div className="text-center py-8 text-red-600">Error: {error}</div>;

  return (
    <div className="max-w-6xl flex flex-col gap-4">
      <h2 className="text-2xl font-bold">Users List</h2>
      {/* <div className="flex flex-row gap-2 justify-between items-center bg-white p-4 rounded-lg shadow-sm">
                <input type="text" placeholder="Search Users..." className={getInputClasses("w-1/3 border-gray-300")} />
            </div> */}

      <div className="overflow-x-auto border rounded-md">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Role
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {user.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.role}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                  {/* <button className={iconGhostBlueClass} title="View Details"><Eye className="h-4 w-4" /></button> */}
                  {/* <button className={iconGhostBlueClass} title="View Details"><Eye className="h-4 w-4" /></button> */}
                  <button
                    className={iconGhostBlueClass}
                    title="View Details"
                    onClick={() => {
                      openViewModal(user);
                    }}
                  >
                    <Eye className="h-4 w-4" />
                  </button>

                  <button
                    className={iconDestructiveClass}
                    title="Remove Product"
                    onClick={() => handleDeleteUser(user)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {isViewModalOpen && selectedUser && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="max-w-xl mx-auto p-6 bg-white shadow-lg rounded-2xl space-y-4">
              <h2 className="text-2xl font-semibold mb-4 text-gray-800">User Details</h2>
              <div className="grid grid-cols-2 gap-4 text-gray-700">
                <div className="font-medium">Name:</div>
                <div>{selectedUser.name}</div>
                <div className="font-medium">Email:</div>
                <div>{selectedUser.email}</div>
                <div className="font-medium">Address:</div>
                <div>{selectedUser.address || ''}</div>
                <div className="font-medium">Role:</div>
                <div>{selectedUser.role}</div>
                <div className="font-medium">Plus Review:</div>
                <div>{selectedUser.plus_review}</div>
                <div className="font-medium">Minus Review:</div>
                <div>{selectedUser.minus_review}</div>
                <div className="font-medium">Birth Date:</div>
                <div>
                  {selectedUser.birthdate
                    ? new Date(selectedUser.birthdate).toLocaleDateString('vi-VN', {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })
                    : ''}
                </div>
                <div className="font-medium">Created At:</div>
                <div>
                  {new Date(selectedUser.created_at).toLocaleDateString('vi-VN', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  })}{' '}
                </div>
                <div className="font-medium">Updated At:</div>
                <div>
                  {new Date(selectedUser.updated_at).toLocaleDateString('vi-VN', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  })}
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  onClick={() => setIsViewModalOpen(false)}
                  className="px-4 py-2 bg-[#8D0000] text-white font-medium rounded-md text-sm hover:cursor-pointer transition duration-150 ease-in-out"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// --- Upgrade Requests Management ---
const UpgradeRequestsManagement: React.FC = () => {
  const [requests, setRequests] = useState<UpgradeRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<UpgradeRequest | null>(null);

  useEffect(() => {
    fetchData<UpgradeRequest>(API_ENDPOINTS.upgradeRequests, setRequests, setLoading, setError);
  }, []);

  const handleSubmitRequest = async (request: UpgradeRequest, answer: string) => {
    try {
      setLoading(true);
      const res = await fetch(API_ENDPOINTS.upgradeRequests, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: request.request_id,
          user_id: request.user_id,
          answer: answer,
        }),
      });

      const result = await res.json();
      setLoading(false);
      if (!res.ok && !result.isSuccess) {
        setError(result.message);
      } else {
        setRequests(result.data);
      }
    } catch (e) {
      setError(String(e));
    }
  };

  const handleViewRequest = (request: UpgradeRequest) => setSelectedRequest(request);

  if (loading) return <div className="text-center py-8">Loading Requests...</div>;
  if (error) return <div className="text-center py-8 text-red-600">Error: {error}</div>;

  return (
    <div className="max-w-6xl flex flex-col gap-4">
      <h2 className="text-2xl font-bold">Upgrade Requests</h2>
      <div className="overflow-x-auto border rounded-md">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                User Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Request Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Message
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {requests.map((request) => (
              <tr key={request.request_id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {request.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(request.request_at).toLocaleString()}
                </td>
                <td
                  className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 cursor-pointer font-medium hover:text-blue-700"
                  onClick={() => handleViewRequest(request)}
                >
                  View File
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                  <button
                    className={getButtonClasses('primary', 'sm')}
                    onClick={() => handleSubmitRequest(request, 'approve')}
                  >
                    Approve
                  </button>
                  <button
                    className={getButtonClasses('destructive', 'sm', 'ml-2')}
                    onClick={() => handleSubmitRequest(request, 'deny')}
                  >
                    Reject
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

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
    </div>
  );
};

const SettingsManagement: React.FC = () => {
    // 1. CHANGED: Use string state to avoid hardcoding defaults and allow empty inputs
    const [windowMinutes, setWindowMinutes] = useState<string>("");
    const [durationMinutes, setDurationMinutes] = useState<string>("");
    
    const [loading, setLoading] = useState<boolean>(true);
    const [saving, setSaving] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);

    // Fetch initial settings
    useEffect(() => {
        const fetchSettings = async () => {
            setLoading(true);
            try {
                const res = await fetch(API_ENDPOINTS.settings, { credentials: 'include' });
                const result = await res.json();
                
                if (res.ok && result.isSuccess) {
                    // 2. CHANGED: Convert DB numbers to strings for the inputs
                    setWindowMinutes(String(result.data.extend_window_minutes));
                    setDurationMinutes(String(result.data.extend_duration_minutes));
                } else {
                    setError(result.message || "Failed to load settings");
                }
            } catch (err) {
                setError("Network error loading settings");
            } finally {
                setLoading(false);
            }
        };
        fetchSettings();
    }, []);

    const handleSave = async () => {
        // 3. ADDED: Basic validation before sending
        const windowVal = parseInt(windowMinutes);
        const durationVal = parseInt(durationMinutes);

        if (isNaN(windowVal) || isNaN(durationVal) || windowVal < 1 || durationVal < 1) {
            setError("Please enter valid positive numbers for both fields.");
            return;
        }

        setSaving(true);
        setError(null);
        setSuccessMsg(null);

        try {
            const res = await fetch(API_ENDPOINTS.settings, {
                method: "PUT",
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    // 4. CHANGED: Convert strings back to numbers for the DB
                    extend_window_minutes: windowVal,
                    extend_duration_minutes: durationVal
                })
            });

            const result = await res.json();
            
            if (res.ok && result.isSuccess) {
                setSuccessMsg("Configuration saved successfully!");
                setTimeout(() => setSuccessMsg(null), 3000);
            } else {
                setError(result.message || "Failed to save settings");
            }
        } catch (err) {
            setError("Network error saving settings");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="text-center py-8">Loading Settings...</div>;

    return (
        <div className="max-w-2xl flex flex-col gap-6 bg-white p-8 rounded-lg shadow-sm border border-gray-200">
            <div>
                <h2 className="text-2xl font-bold text-gray-800">System Configuration</h2>
                <p className="text-gray-500 text-sm mt-1">Configure global rules for automatic auction extensions.</p>
            </div>

            {error && <div className="p-3 bg-red-50 text-red-700 rounded-md border border-red-200 text-sm">{error}</div>}
            {successMsg && <div className="p-3 bg-green-50 text-green-700 rounded-md border border-green-200 text-sm">{successMsg}</div>}

            <div className="space-y-6">
                {/* Window Input */}
                <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">
                        Extension Trigger Window (Minutes)
                    </label>
                    <p className="text-xs text-gray-500">
                        If a bid is placed within this many minutes before the auction ends...
                    </p>
                    <div className="flex items-center gap-3">
                        <input
                            type="number"
                            min="1"
                            className={getInputClasses("max-w-[150px]")}
                            value={windowMinutes}
                            onChange={(e) => setWindowMinutes(e.target.value)} // No Number() casting here
                            placeholder="e.g. 5"
                        />
                        <span className="text-sm text-gray-600">minutes</span>
                    </div>
                </div>

                <div className="border-t border-gray-100"></div>

                {/* Duration Input */}
                <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">
                        Extension Duration (Minutes)
                    </label>
                    <p className="text-xs text-gray-500">
                        ...the auction end time will be extended by this amount.
                    </p>
                    <div className="flex items-center gap-3">
                        <input
                            type="number"
                            min="1"
                            className={getInputClasses("max-w-[150px]")}
                            value={durationMinutes}
                            onChange={(e) => setDurationMinutes(e.target.value)} // No Number() casting here
                            placeholder="e.g. 10"
                        />
                        <span className="text-sm text-gray-600">minutes</span>
                    </div>
                </div>

                <div className="pt-4">
                    <button
                        className={getButtonClasses('primary', 'default', "w-full sm:w-auto flex justify-center items-center gap-2")}
                        onClick={handleSave}
                        disabled={saving}
                    >
                        {saving ? (
                            <>Processing...</>
                        ) : (
                            <>
                                <Save className="w-4 h-4" /> Save Changes
                            </>
                        )}
                    </button>
                </div>
            </div>
            
            <div className="mt-4 p-4 bg-yellow-50 rounded-md border border-yellow-200">
                <div className="flex gap-2">
                    <Shield className="w-5 h-5 text-yellow-600 shrink-0" />
                    <div>
                        <h4 className="text-sm font-bold text-yellow-800">Important Note</h4>
                        <p className="text-xs text-yellow-700 mt-1">
                            Changes affect active auctions immediately. If an active auction receives a new bid after you save these settings, the new rules will apply.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- Admin Page ---
const AdminPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AdminTabId>('categories');
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);

    let MainContent: JSX.Element;
    switch (activeTab) {
        case 'categories': MainContent = <CategoryManagement />; break;
        case 'products': MainContent = <ProductManagement />; break;
        case 'users': MainContent = <UserManagement setActiveTab={setActiveTab} />; break;
        case 'upgrade-requests': MainContent = <UpgradeRequestsManagement />; break;
        case 'settings': MainContent = <SettingsManagement />; break; // Added this line
        default: MainContent = <div>Page Not Found</div>;
    }

  return (
    <div className="flex">
      <AdminSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />
      <div className="flex-1 min-h-screen bg-gray-50 lg:ml-64">
        <AdminHeader title="Admin Dashboard" setSidebarOpen={setSidebarOpen} />
        <main className="p-6">{MainContent}</main>
      </div>
    </div>
  );
};

export default AdminPage;
