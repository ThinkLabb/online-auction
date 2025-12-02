import { useState } from "react";
import UserTab from "./user-profile-tabs";
import { ProfileData } from "./types";
import { SetAction } from "./types";

function EditProfile( {profile, setAction} : {profile: ProfileData, setAction: SetAction} ) {
  const [name, setName] = useState(profile.name);
  const [email, setEmail] = useState(profile.email);
  const [birthdate, setBirthdate] = useState(profile.birthdate)
  const [address, setAddress] = useState(profile.address)
  const [disable, setDisable] = useState(true)

  return(
    <div className="p-10 flex flex-col gap-5 rounded-sm shadow-sm shadow-stone-300">
      {/* <div className="flex flex-col md:flex-row md:flex-wrap gap-10"> */}
      <div className="flex flex-col md:flex-row gap-5 md:items-center w-full">
        <label htmlFor="username" className="flex-1 font-medium truncate">Username</label>
        <input
          id="username"
          disabled={disable}
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="border-2 border-gray-300 rounded-sm p-2 flex-3 truncate"
        />
      </div>

      <div className="flex flex-col md:flex-row gap-5 md:items-center w-full">
        <label htmlFor="email" className="flex-1 font-medium truncate">Email</label>
        <input
          id="email"
          disabled={disable}
          type="text"
          value={email}
          onChange={(e) => setName(e.target.value)}
          className="border-2 border-gray-300 rounded-sm p-2 flex-3 truncate"
        />
      </div>

      <div className="flex flex-col md:flex-row gap-5 md:items-center w-full">
        <label htmlFor="birthdate" className="flex-1 font-medium truncate">Birthdate</label>
        <input
          id="birthdate"
          disabled={disable}
          type="text"
          value={birthdate?.toISOString()}
          onChange={(e) => setName(e.target.value)}
          className="border-2 border-gray-300 rounded-sm p-2 flex-3 truncate"
        />
      </div>
      {/* </div> */}
      <div className="flex flex-col md:flex-row gap-5 md:items-center w-full">
        <label htmlFor="address" className="flex-1 font-medium truncate">Address</label>
        <input
          id="address"
          disabled={disable}
          type="text"
          value={address}
          onChange={(e) => setName(e.target.value)}
          className="border-2 border-gray-300 rounded-sm p-2 flex-3 truncate"
        />
      </div>

      <div>
      </div>


    </div>
  )
}

function ChangePassword( {profile, setAction} : {profile: ProfileData, setAction: SetAction} ) {
  return(<></>)
}

function ViewTabs( {profile, setAction} : {profile: ProfileData, setAction: SetAction} ) {
  return(
    <UserTab profile={profile}/>
  )
}

export default function UserAction( {profile, action, setAction} : {profile:ProfileData, action:string, setAction: SetAction}) {
  const renderAction = () => {
    switch(action) {
      case "edit-profile" : return(<EditProfile profile={profile} setAction={setAction}/>)
      case "change-password" : return(<ChangePassword profile={profile} setAction={setAction}/>)
      case "view-tabs" : return(<ViewTabs profile={profile} setAction={setAction}/>)
      default : return <h1 className="text-3xl text-red-500">Invalid Action!</h1>;
    }
  }
  return(
    <div className="flex-3 min-w-0">
      {renderAction()}
    </div>
  )
}