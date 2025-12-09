import { Outlet, useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { CategoryContext, useUser } from './UserContext.tsx';
import CategoryDetail from './CategoryMenu.tsx';
import { useEffect, useState } from 'react';

function Layout() {
    const { user, setUser } = useUser();

    const [isSearchOpen, setIsSearchOpen] = useState(false);

    const navigate = useNavigate();
    
    const handleLogout = async() => {
        try {
            const res = await fetch('/api/auth/logout', {
                method: 'POST',
                credentials: 'include'
            });

            const result = await res.json();
            if (res.ok && result.isSuccess) {
                setUser(null);
                navigate("/");
            } 
        } catch(e) {
            console.error(e);
        }
    };

    useEffect(() => {
        (async() => {
            try {
                const res = await fetch('/api/auth/me', {
                    method: 'POST',
                    credentials: 'include',
                });
                const result = await res.json()
                if (res.ok && result.isSuccess) {
                    if (result.data.role === "admin") {
                        navigate("/admin")
                    } 
                    setUser({
                        name: result.data.name,
                        email: result.data.email,
                    });
                }
            } catch(e) {
                console.error(e)
            }
        })()
    }, [])
    
    const [activeLevel1, setActiveLevel1] = useState("")

    return (
        <div className="min-h-screen flex flex-col">
            <header className="shadow-md px-4 py-4 w-full">
                <div className="max-w-5xl flex flex-row justify-between items-center mx-auto gap-3">
                    
                    <Link 
                        to="/" 
                        className="flex flex-row font-bold text-2xl gap-1 flex-shrink-0" 
                        onClick={() => { setActiveLevel1(""); setIsSearchOpen(false); }} 
                    >
                        <h1 className="text-black">Think<span className="text-[#8D0000]">LAB</span></h1>
                    </Link>
                    
                    <nav className="hidden sm:block sm:flex-1 sm:max-w-md sm:mx-4">
                        <input
                            type="search"
                            placeholder="Find the product here"
                            className="w-full px-4 py-1 bg-[#FAE5E5] placeholder:text-sm rounded"
                        />
                    </nav>

                    <nav className='flex-shrink-0 flex items-center gap-2'>
                        <button 
                            className="sm:hidden p-2 hover:text-[#8D0000] transition-colors flex items-center justify-center"
                            onClick={() => setIsSearchOpen(!isSearchOpen)}
                            aria-label="Toggle Search"
                        >
                            
                            {isSearchOpen ? (
                                <span className="text-xl">✕</span> 
                            ) : (
                                <svg 
                                    xmlns="http://www.w3.org/2000/svg" 
                                    viewBox="0 0 512 512" 
                                    className="w-5 h-5 fill-current" 
                                >
                                    <path d="M416 208c0 45.9-14.9 88.3-40 122.7L502.6 457.4c12.5 12.5 12.5 32.8 0 45.3s-32.8 12.5-45.3 0L330.7 376C296.3 401.1 253.9 416 208 416 93.1 416 0 322.9 0 208S93.1 0 208 0 416 93.1 416 208zM208 352a144 144 0 1 0 0-288 144 144 0 1 0 0 288z"/>
                                </svg>
                            )}
                        </button>

                        <ul className="flex flex-row gap-2 sm:gap-4 items-center flex-wrap justify-end">
                            <li className="hidden sm:block cursor-pointer hover:text-[#8D0000]">About us</li>
                            
                            {user === null ? (
                                <>
                                    <li className="bg-[#8D0000] text-white px-3 py-1 rounded cursor-pointer text-sm">
                                        <Link to="/signin">Sign in</Link>
                                    </li>
                                    <li className="bg-black text-white px-3 py-1 rounded cursor-pointer text-sm">
                                        <Link to="/register">Sign up</Link>
                                    </li>
                                </>
                            ) : (
                                <>
                                    <li className="bg-[#8D0000] text-white px-3 py-1 rounded text-sm hidden sm:block">Welcome, {user.name}</li>
                                    <li className="bg-black text-white px-3 py-1 rounded cursor-pointer text-sm" onClick={handleLogout}>Logout</li>
                                </>
                            )}
                        </ul>
                    </nav>
                </div>

                <div className={`w-full px-4 pt-3 sm:hidden ${isSearchOpen ? 'block' : 'hidden'}`}>
                    <input
                        type="search"
                        placeholder="Find the product here..."
                        className="w-full px-4 py-2 bg-[#FAE5E5] placeholder:text-sm rounded border border-gray-300 focus:outline-none focus:border-[#8D0000]"
                        autoFocus={isSearchOpen}
                    />
                </div>
                
                <CategoryContext.Provider value={{ activeLevel1, setActiveLevel1 }}>
                    <div className='pt-4 max-w-5xl mx-auto'> 
                        <CategoryDetail />
                    </div>
                </CategoryContext.Provider>
            </header>

            <main className='flex-grow'>
                <Outlet />
            </main>

            <footer className='px-4 py-8 border-t-[#8D0000] border-t-solid border-t-2'>
                <div className="max-w-5xl flex flex-col sm:flex-row justify-between items-start mx-auto gap-6 sm:gap-8"> 
                    
                    <nav className="flex flex-row font-bold text-2xl gap-1 sm:my-auto">
                        <h1 className="text-black">Think</h1><h1 className="text-[#8D0000]">LAB</h1>
                    </nav>

                    <div>
                        <h2 className='text-[#8D0000] font-bold'>Privacy</h2>
                        <ul className='text-sm space-y-1'>
                            <li>Terms of Service</li>
                            <li>Privacy Policy</li>
                            <li>Refund Policy</li>
                            <li>Return Policy</li>
                            <li>Shipping & Delivery</li>
                        </ul>
                    </div>

                    <div>
                        <h2 className='text-[#8D0000] font-bold'>Where to find us?</h2>
                        <p className='text-sm'>227 Street Nguyen Van Cu, Ward 4, Ho Chi Minh City, Vietnam</p>
                        <p className='text-sm'>Hotlines: <span className='text-[#8D0000] font-bold'>0935 123 321</span></p>
                    </div>

                    <div>
                        <h2 className='text-[#8D0000] font-bold'>Contact us</h2>
                    </div>
                </div>
            </footer>
        </div>
    );
}

export default Layout;