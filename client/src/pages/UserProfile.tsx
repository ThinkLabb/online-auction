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

  const handleLogout = async () => {
    try {
      const res = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });

      const result = await res.json();
      if (res.ok && result.isSuccess) {
        setUser(null);
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
    <div className="w-[90%] max-w-8xl justify-between mx-auto">
      {/* TITLE */}
      <h1 className="text-center text-4xl font-bold text-[#8D0000] mt-10">
        Welcome, {profile.name}!
      </h1>

      {/* DASHBOARD */}
      {/* <div className="flex flex-col sm:flex-row gap-6 mx-auto mt-10">
        <div className="flex-1 min-w-0 flex flex-col grow gap-2 px-6 py-3 ring ring-gray-200 rounded-sm shadow-sm shadow-stone-300">
          <h2 className="text-xl font-bold">Total bids</h2>
          <p className="text-3xl font-bold text-[#8D0000]">{profile.total_bids}</p>
          <p>+{profile.bids_this_week} bids this week</p>
        </div>
        <div className="flex-1 min-w-0 flex flex-col grow gap-2 px-6 py-3 ring ring-gray-200 rounded-sm shadow-sm shadow-stone-300">
          <h2 className="text-xl font-bold">Total wins</h2>
          <p className="text-3xl font-bold text-[#8D0000]">{profile.total_wins}</p>
          <p>Win rate: {profile.win_rate}%</p>
        </div>
        <div className="flex-1 min-w-0 flex flex-col grow gap-2 px-6 py-3 ring ring-gray-200 rounded-sm shadow-sm shadow-stone-300">
          <h2 className="text-xl font-bold">Watchlist</h2>
          <p className="text-3xl font-bold text-[#8D0000]">{profile.watchlist_count}</p>
          <p>is following</p>
        </div>
        <div className="flex-1 min-w-0 flex flex-col grow gap-2 px-6 py-3 ring ring-gray-200 rounded-sm shadow-sm shadow-stone-300">
          <h2 className="text-xl font-bold">Rating</h2>
          <p className="text-3xl font-bold text-[#8D0000]">{profile.rating}</p>
          <p>{profile.rating_label}</p>
        </div>
      </div> */}

      {/* PROFLE INFO */}

      <div className="my-10 flex flex-col md:flex-row gap-5">
        {/* PROFILE CARD - LEFT */}
        <div className="max-w-2xl flex-1 min-w-0 px-5 pt-10 rounded-sm ring ring-gray-200 shadow-sm shadow-stone-300">
          <div className="flex flex-row items-center gap-3 mb-5">
            <div className="bg-[#FAE5E5] rounded-full w-10 h-10 flex items-center justify-center p-1">
              <User2 className="fill-[#8D0000] stroke-none w-full h-full" />
            </div>
            <div className="min-w-0">
              <h3 className="text-lg font-bold truncate">{profile.name}</h3>
              <p className="text-base text-gray-300 truncate">{profile.email}</p>
            </div>
          </div>

          <hr className="border-[#8D0000]" />

          <div className="my-5 text-base grid grid-cols-5 gap-2 min-w-0">
            <p className="font-bold col-span-2 col-start-1">Role</p>
            <p className="text-right col-span-3 col-start-3">{profile.role}</p>
            <p className="font-bold col-span-2 col-start-1">Join date</p>
            <p className="text-right col-span-3 col-start-3">
              {new Date(profile.created_at).toLocaleDateString('vi-VN')}
            </p>
          </div>

          <div className="flex flex-col gap-3 text-base my-10">
            {/* Seller Status Display */}
            {profile.role === 'seller' && (
              <div className="mb-3">
                <SellerStatus />
              </div>
            )}

            <button
              onClick={() => setAction('edit-profile')}
              className="
                cursor-pointer bg-[#8D0000] 
                hover:bg-[#760000] hover:scale-101
                active:scale-95 
                transition-all duration-200 hover:shadow-md
                text-white rounded-sm shadow-sm shadow-stone-300 font-medium p-1
              "
            >
              My Profile
            </button>

            <button
              onClick={() => setAction('change-password')}
              className="
              cursor-pointer bg-black text-white
              hover:bg-[#5C5C5C] hover:scale-101
              active:scale-95 
              transition-all duration-200 hover:shadow-md
              rounded-sm shadow-sm shadow-stone-300 font-medium p-1
            "
            >
              Change password
            </button>

            {profile.role === 'bidder' ? (
              <button
                onClick={() => setAction('request-role')}
                className="
              cursor-pointer bg-gray-300 text-black-800
              hover:bg-gray-400 hover:scale-101
              active:scale-95 
              transition-all duration-200 hover:shadow-md 
              rounded-sm ring ring-gray-200 shadow-sm shadow-black-300 font-medium p-1
            "
              >
                Let me sell
              </button>
            ) : (
              <Link
                to="/upload"
                className="
              text-center
              cursor-pointer bg-yellow-300 text-black-800
              hover:bg-yellow-400 hover:scale-101
              active:scale-95 
              transition-all duration-200 hover:shadow-md 
              rounded-sm ring ring-gray-200 shadow-sm shadow-black-300 font-medium p-1
            "
              >
                Add product
              </Link>
            )}

            <button
              className="
                cursor-pointer bg-white text-[#8D0000]
                hover:bg-[#F0EEEE] hover:scale-101
                active:scale-95 
                transition-all duration-200 hover:shadow-md 
                rounded-sm ring ring-gray-100 shadow-sm shadow-black-300 font-medium p-1
              "
              onClick={() => {
                handleLogout();
                navigate('/');
              }}
            >
              Sign out
            </button>
          </div>
        </div>

        {/* TABS */}
        <UserAction profile={profile} action={action} setAction={setAction} />
      </div>
    </div>
  );
}
