import { useState } from "react";
import { ProfileData } from "./types";
import { SetTab } from "./types";

function BiddingTab({ profile, setTab }: { profile: ProfileData; setTab: SetTab }) {  
  return(<></>)
}

function WonTab({ profile, setTab }: { profile: ProfileData; setTab: SetTab }) {  
  return(<></>)
}

function WatchlistTab({ profile, setTab }: { profile: ProfileData; setTab: SetTab }) {  
  return(<></>)

}

function RatingsTab({ profile, setTab }: { profile: ProfileData; setTab: SetTab }) {  
  return(<></>)

}

export default function UserTab( {profile} : {profile: ProfileData} ) {
  const tabs = ["Bidding", "Won Products", "Watchlist", "Ratings"];
  const [ activeTab, setActiveTab ] = useState("bidding");

  const renderTab = () => {
    switch (activeTab) {
      case "bidding":
        return <BiddingTab profile={profile} setTab={setActiveTab} />;
      case "won-products":
        return <WonTab profile={profile} setTab={setActiveTab} />;
      case "watchlist":
        return <WatchlistTab profile={profile} setTab={setActiveTab} />;
      case "ratings":
        return <RatingsTab profile={profile} setTab={setActiveTab} />;
      default:
        return <h1 className="text-3xl text-red-500">Invalid Tab!</h1>;
    }
  };

  return (
    <div>
      <div className="flex flex-row">
        {
          tabs.map((tab) => {
            const tabID = tab.toLowerCase().replace(" ", "-");
            const isActive = activeTab === tabID;

            return(
              <h2
                key={tab}
                onClick={() => setActiveTab(tabID)}
                className={`
                  cursor-pointer text-xl pb-1 px-3 border-b truncate
                  ${
                    isActive ?
                    "border-[#8D0000] text-[#8D0000] font-medium border-b-2" :
                    "border-gray-300 hover:font-medium hover:border-b-2 hover:border-gray-500"
                  }
                `}
              >
                {tab}
              </h2>
            )
          })
        }
      </div>

      <div className="mt-5 p-5 rounded-sm ring ring-gray-200 shadow-sm shadow-black-300 font-medium p-2">
        {renderTab()}
      </div>
    </div>
  )
}