import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../UserContext';
import { Profile } from '../components/user-profile/interfaces';
import UserAction from '../components/user-profile/user-profile';
import { Link } from 'react-router-dom';
import { ClipLoader } from 'react-spinners';
import { SellerStatus } from '../components/user-profile/seller-status';
import { User2 } from 'lucide-react';

export default function UserProfile() {
  const navigate = useNavigate();
  const [action, setAction] = useState('view-tabs');
  const [loading, setLoading] = useState(true);
  const { user, setUser } = useUser();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [signoutLoading, setSignoutLoading] = useState(false);

  const handleLogout = async () => {
    try {
      setSignoutLoading(true);
      const res = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });

      const result = await res.json();
      if (res.ok && result.isSuccess) {
        setUser(null);
        setSignoutLoading(false);
      }
    } catch (e) {}
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch('/api/profile', {
          method: 'GET',
          credentials: 'include',
        });

        if (res.ok) {
          const jsonResult = await res.json();
          setProfile(jsonResult.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user, navigate]);

  if (loading)
    return (
      <div className="min-h-[50vh] w-full flex flex-col justify-center items-center">
        <ClipLoader size={50} color="#8D0000" />
      </div>
    );
  if (!profile) return <div className="text-center py-32 text-red-500">Error</div>;

  return (
    <div className="w-[90%] max-w-7xl mx-auto pb-10">
      <h1 className="text-center text-3xl md:text-4xl font-bold text-[#8D0000] mt-8 md:mt-10">
        Welcome, {profile.name}!
      </h1>

      <div className="my-8 flex flex-col lg:flex-row gap-6 md:gap-8 items-start">
        
        <div className="
          w-full lg:w-[350px] lg:shrink-0
          bg-white rounded-md border border-gray-200 
          shadow-sm shadow-gray-300 p-5
          self-start
        ">
          
          <div className="flex flex-row items-center gap-4 mb-6">
            <div className="bg-[#FAE5E5] rounded-full w-14 h-14 shrink-0 flex items-center justify-center p-2">
              <User2 className="text-[#8D0000] w-full h-full" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-xl font-bold truncate text-gray-800" title={profile.name}>
                {profile.name}
              </h3>
              <p className="text-sm text-gray-500 truncate" title={profile.email}>
                {profile.email}
              </p>
            </div>
          </div>

          <hr className="border-gray-200 my-4" />

          <div className="grid grid-cols-2 gap-y-3 text-sm md:text-base text-gray-700 mb-6">
            <span className="font-semibold text-gray-500">Role</span>
            <span className="text-right font-medium capitalize">{profile.role}</span>
            
            <span className="font-semibold text-gray-500">Join date</span>
            <span className="text-right font-medium">
              {new Date(profile.created_at).toLocaleDateString('vi-VN')}
            </span>
          </div>

          {profile.role === 'seller' && (
            <div className="mb-4">
              <SellerStatus />
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex lg:flex-col gap-3">
            
            <button
              onClick={() => setAction('edit-profile')}
              className="
                col-span-1
                py-2 px-4 rounded font-medium transition-all duration-200
                bg-[#8D0000] text-white
                hover:bg-[#760000] hover:shadow-md active:scale-95
              "
            >
              My Profile
            </button>

            <button
              onClick={() => setAction('change-password')}
              className="
                col-span-1
                py-2 px-4 rounded font-medium transition-all duration-200
                bg-black text-white
                hover:bg-[#333] hover:shadow-md active:scale-95
              "
            >
              Change password
            </button>

            {profile.role === 'bidder' ? (
              <button
                onClick={() => setAction('request-role')}
                className="
                  col-span-1 sm:col-span-1 lg:col-span-1
                  py-2 px-4 rounded font-medium transition-all duration-200
                  bg-gray-200 text-gray-800
                  hover:bg-gray-300 hover:shadow active:scale-95
                "
              >
                Let me sell
              </button>
            ) : (
              <Link
                to="/upload"
                className="
                  col-span-1 sm:col-span-1 lg:col-span-1
                  flex items-center justify-center
                  py-2 px-4 rounded font-medium transition-all duration-200
                  bg-gray-200 text-gray-800
                  hover:bg-gray-300 hover:shadow active:scale-95
                "
              >
                Add product
              </Link>
            )}

            <button
              disabled={signoutLoading}
              onClick={() => {
                handleLogout();
                navigate('/');
              }}
              className={`
                col-span-1 sm:col-span-1 lg:col-span-1
                py-2 px-4 rounded font-medium transition-all duration-200 border border-gray-200
                ${signoutLoading ? 'bg-gray-200 text-gray-500' : 'bg-white text-[#8D0000]'}
                hover:bg-gray-50 hover:border-gray-300 hover:shadow-sm active:scale-95
              `}
            >
              {signoutLoading ? 'Signing out...' : 'Sign out'}
            </button>
          </div>
        </div>

        <UserAction
          profile={profile}
          action={action}
          setAction={setAction}
          setProfile={setProfile}
        />

      </div>
    </div>
  );
}
