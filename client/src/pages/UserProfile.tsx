import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import userIcon from '../assets/user.png'
import { useUser } from '../UserContext'
import { ProfileData } from "../components/user-profile/types"
import UserTab from "../components/user-profile/user-profile-tabs"
import UserAction from "../components/user-profile/user-profile"

export default function UserProfile() {
  const user = useUser();
  const navigate = useNavigate();
  const [action, setAction] = useState("view-tabs")
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<ProfileData | null>(null);

  useEffect(() => {
    if (!user) {
      navigate("/signin");
      return;
    }

    const fetchProfile = async () => {
      try {
        const res = await fetch("/api/profile/me", {
          credentials: "include",
        });

        if (res.ok) {
          const data = await res.json();
          setProfile(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user.user, navigate])

  const handleSignOut = () => {
    user.setUser(null);
    navigate("/");
  };

  if (loading) return <div className="text-center py-32">Loading...</div>;
  if (!profile) return <div className="text-center py-32 text-red-500">Error</div>;

  return (
    <div className="w-[90%] max-w-8xl justify-between mx-auto">
      <h1 className="text-center text-5xl font-bold text-[#8D0000] mt-10">
        Welcome, {profile.name}!
      </h1>

      <div className="flex flex-col sm:flex-row gap-6 mx-auto mt-10">
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
          <h2 className="text-xl font-bold">My watchlist</h2>
          <p className="text-3xl font-bold text-[#8D0000]">{profile.watchlist_count}</p>
          <p>is following</p>
        </div>
        <div className="flex-1 min-w-0 flex flex-col grow gap-2 px-6 py-3 ring ring-gray-200 rounded-sm shadow-sm shadow-stone-300">
          <h2 className="text-xl font-bold">My Rating</h2>
          <p className="text-3xl font-bold text-[#8D0000]">{profile.rating}</p>
          <p>{profile.rating_label}</p>
        </div>
      </div>

      <div className="my-10 flex flex-col md:flex-row gap-5">
        <div className="max-w-2xl flex-1 min-w-0 px-5 pt-10 rounded-sm ring ring-gray-200 shadow-sm shadow-stone-300">
          <div className="flex flex-row gap-5 mb-5">
            <img src={userIcon} alt="User icon" className="w-auto h-12"/>
            <div className="min-w-0">
              <h3 className="text-lg font-bold truncate">{profile.name}</h3>
              <p className="text-md text-gray-300 truncate">{profile.email}</p>
            </div>
          </div>

          <hr className="border-[#8D0000]"/>
          
          <div className="my-5 grid grid-cols-5 gap-2 min-w-0">
            <p className="font-bold col-span-2 col-start-1">Account type</p>
            <p className="text-right col-span-3 col-start-3">{profile.role}</p>
            <p className="font-bold col-span-2 col-start-1">Join date</p>
            <p className="text-right col-span-3 col-start-3">{new Date(profile.created_at).toLocaleDateString("vi-VN")}</p>
          </div>

          <div className="flex flex-col gap-3 my-10">
            <button 
              onClick={() => setAction("edit-profile")}
              className="
                cursor-pointer bg-[#8D0000] 
                hover:bg-[#760000] hover:scale-101
                active:scale-95 
                transition-all duration-200 shadow-md hover:shadow-md
                text-white rounded-sm shadow-sm shadow-stone-300 font-medium p-2
              "
            >
              My Profile
            </button>

            <button className="
              cursor-pointer bg-black text-white
              hover:bg-[#5C5C5C] hover:scale-101
              active:scale-95 
              transition-all duration-200 shadow-md hover:shadow-md
              rounded-sm shadow-sm shadow-stone-300 font-medium p-2
            ">
              Change password
            </button>
            
            <button className="
              cursor-pointer bg-yellow-300 text-black-800
              hover:bg-yellow-400 hover:scale-101
              active:scale-95 
              transition-all duration-200 shadow-md hover:shadow-md 
              rounded-sm ring ring-gray-200 shadow-sm shadow-black-300 font-medium p-2
            ">
              Let me sell
            </button>

            <button 
              className="
                cursor-pointer bg-white text-[#8D0000]
                hover:bg-[#F0EEEE] hover:scale-101
                active:scale-95 
                transition-all duration-200 shadow-md hover:shadow-md 
                rounded-sm ring ring-gray-200 shadow-sm shadow-black-300 font-medium p-2
              "
              onClick={() => {
                user.setUser(null);
                navigate("/");
              }}
            >
              Sign out
            </button>
          </div>
        </div>

        <UserAction profile={profile} action={action} setAction={setAction}/>
      </div>
    </div>
  )
}