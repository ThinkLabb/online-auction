import { Outlet, useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { useUser } from './UserContext.tsx';
import CategoryDetail from './CategoryMenu.tsx';

function Layout() {
  const { user, setUser } = useUser();
  const navigate = useNavigate();

  const handleLogout = () => {
    setUser(null);
    navigate('/signin');
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <header className="shadow-md px-4 py-4">
        <div className="max-w-5xl flex flex-row justify-between items-center mx-auto">
          {/* Logo */}
          <nav onClick={() => navigate("/")} className="cursor-pointer flex flex-row font-bold text-2xl gap-1">
            <h1 className="text-black">Think</h1>
            <h1 className="text-[#8D0000]">LAB</h1>
          </nav>
          {/* Search */}
          <nav className="flex-1 max-w-md mx-4">
            <input
              type="search"
              placeholder="Find the product here"
              className="w-full px-4 py-1 bg-[#FAE5E5] placeholder:text-sm rounded"
            />
          </nav>
          {/* Auth Buttons */}
          <nav>
            <ul className="flex flex-row gap-4 items-center">
              <li className="cursor-pointer hover:text-[#8D0000]">About us</li>
              {user === null ? (
                <>
                  <li className="bg-[#8D0000] text-white px-3 py-1 rounded cursor-pointer">
                    <Link to="/signin">Sign in</Link>
                  </li>
                  <li className="bg-black text-white px-3 py-1 rounded cursor-pointer">
                    <Link to="/register">Sign up</Link>
                  </li>
                </>
              ) : (
                <>
                  <li className="bg-[#8D0000] text-white px-3 py-1 rounded">Welcome, {user.name}</li>
                  <li
                    className="bg-black text-white px-3 py-1 rounded cursor-pointer"
                    onClick={handleLogout}
                  >
                    Logout
                  </li>
                </>
              )}
            </ul>
          </nav>
        </div>
      </header>

      <CategoryDetail />
      <Outlet />

      {/*Footer*/}
      <footer className='px-4 py-8 border-t-[#8D0000] border-t-solid border-t-2'>

        <div className="max-w-5xl flex flex-row justify-between items-start mx-auto gap-8">

          <nav className="flex flex-row font-bold text-2xl gap-1 my-auto">
            <h1 className="text-black">Think</h1>
            <h1 className="text-[#8D0000]">LAB</h1>
          </nav>

          
          <div>
            <h2 className='text-[#8D0000] font-bold'>Privacy</h2>
            <ul>
              <li>Terms of Service</li>
              <li>Privacy Policy</li>
              <li>Refund Policy</li>
              <li>Return Policy</li>
              <li>Shipping & Delivery</li>
            </ul>
          </div>

          <div>
              <h2 className='text-[#8D0000] font-bold'>Where to find us?</h2>
              <p>227 Street Nguyen Van Cu, Ward 4, Ho Chi Minh City, Vietnam</p>
              <p>Hotlines: <span className='text-[#8D0000] font-bold'>0935 123 321</span></p>
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
