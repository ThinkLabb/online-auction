import { JSX, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CategoryContext } from './UserContext';

interface Category {
  id: number;
  name_level_1: string;
  name_level_2: string;
}

interface CategoryMenuData {
  [key: string]: readonly string[];
}

const defaultCategoryDetail: CategoryMenuData = {};

const formatCategories = (categories: Category[]): CategoryMenuData => {
  const formatted: CategoryMenuData = {};
  categories.forEach((cat) => {
    const level1 = cat.name_level_1;
    const level2 = cat.name_level_2;

    if (!formatted[level1]) {
      formatted[level1] = [];
    }

    (formatted[level1] as string[]).push(level2);
  });
  return formatted;
};

export default function CategoryMenu(): JSX.Element {
  const [categoryDetail, setCategoryDetail] = useState<CategoryMenuData>(defaultCategoryDetail);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const { activeLevel1, setActiveLevel1 } = useContext(CategoryContext);

  useEffect(() => {
    const fetchCategories = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/categories', {
          method: 'GET',
        });

        if (!res.ok) {
          throw new Error(`Lỗi HTTP: ${res.status}`);
        }

        const result = await res.json();
        const categories: Category[] = result.data || [];

        const formattedData = formatCategories(categories);
        setCategoryDetail(formattedData);
      } catch (e) {
        console.error('Lỗi khi fetch categories:', e);
        setError(e instanceof Error ? e.message : 'Đã xảy ra lỗi không xác định.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCategories();
  }, []);

  const navigate = useNavigate();

  const handleCategoryClick = (level1: string, level2: string) => {
    setActiveLevel1(level1);
    navigate(`/products/${level1}/${level2}`);
  };

  if (isLoading) {
    return <div className="text-center text-[#8D0000]">Loading Categories...</div>;
  }

  if (error) {
    return <div className="text-center text-[#8D0000]">EError: Can not load categories.</div>;
  }

  return (
    <ul className="flex flex-row justify-center lg:gap-8 xl:gap-12 font-semibold mx-4 flex-wrap">
      {Object.entries(categoryDetail).map(([key, rawItems]) => {
        const items = rawItems as readonly string[];
        const label = (key[0].toUpperCase() + key.slice(1)) as string;

        return (
          <li key={key} className="relative group" onClick={() => handleCategoryClick(key, '')}>
            <button
              // className="cursor-pointer hover:text-[#8D0000] hover:underline group-hover:text-[#8D0000] group-hover:underline ${}:text-[#8D0000] focus:underline"
              className={`cursor-pointer px-2 py-1 font-semibold hover:text-[#8D0000] hover:underline group-hover:text-[#8D0000] group-hover:underline ${activeLevel1 === key ? 'underline text-[#8D0000]' : ''}`}
              aria-haspopup="true"
              aria-expanded="false"
            >
              {label}
            </button>
            <div
              className="absolute top-full pt-4 left-0 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transform transition-all duration-150 bg-white shadow-xl z-10 min-w-40 rounded-b-md"
              role="menu"
              // group-focus-within:opacity-100 group-focus-within:pointer-events-auto
            >
              <ul className="space-y-1">
                {items.map((it) => (
                  <li
                    key={it}
                    role="menuitem"
                    className="hover:text-[#8D0000] cursor-pointer hover:bg-[#FAE5E5] px-2 py-1 font-normal rounded-md"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleCategoryClick(key, it);
                    }}
                  >
                    {it}
                  </li>
                ))}
              </ul>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
