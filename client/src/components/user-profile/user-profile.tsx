import { useState } from "react";
import UserTab from "./user-profile-tabs";
import { ProfileData } from "./types";
import { SetAction } from "./types";
import { useForm, SubmitHandler } from "react-hook-form";
import z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Navigate, useNavigate } from "react-router-dom";
import { METHODS } from "http";
import { ClipLoader } from "react-spinners";


const UserEditData = z.object({
  name: z.string(),
  email: z.string(),
  birthdate: z.date(),
  address: z.string()
});

type UserFormData = z.infer<typeof UserEditData>

function EditProfile( {profile, setAction} : {profile: ProfileData, setAction: SetAction} ) {
  const [name, setName] = useState(profile.name);
  const [email, setEmail] = useState(profile.email);
  const [birthdate, setBirthdate] = useState<Date | null>(profile.birthdate)
  const [address, setAddress] = useState(profile.address)
  const [disable, setDisable] = useState(true)

  return(
    <div className="px-10 py-20 rounded-sm ring ring-gray-200 shadow-sm shadow-stone-300">
      {/* <div className="flex flex-col md:flex-row md:flex-wrap gap-10"> */}
      <form className="flex flex-col gap-5">
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
            onChange={(e) => setEmail(e.target.value)}
            className="border-2 border-gray-300 rounded-sm p-2 flex-3 truncate"
          />
        </div>

        <div className="flex flex-col md:flex-row gap-5 md:items-center w-full">
          <label htmlFor="birthdate" className="flex-1 font-medium truncate">Birthdate</label>
          <input
            id="birthdate"
            disabled={disable}
            type="date"
            value={birthdate ? birthdate.toISOString().split("T")[0] : ""}
            onChange={(e) => setBirthdate(e.target.value ? new Date(e.target.value) : null)}
            className="border-2 border-gray-300 rounded-sm p-2 flex-3"
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
            onChange={(e) => setAddress(e.target.value)}
            className="border-2 border-gray-300 rounded-sm p-2 flex-3 truncate"
          />
        </div>

        <div className="mt-10 flex flex-col md:flex-row md:mx-auto gap-5">
          {
            disable
            ? <button 
                onClick={() => setDisable(false)}
                className="
                  md:order-2
                  rounded-sm ring ring-gray-200 shadow-sm shadow-black-300 py-3 px-10
                  cursor-pointer bg-[#8D0000] text-white
                  hover:scale-101 hover:bg-[#760000] hover:shadow-md
                  transition-all duration-200 active:scale-95
                "
              >
                Edit
              </button>

            : <div className="flex flex-col md:flex-row gap-5">
                <button
                  type="submit"
                  onClick={() => {setDisable(true)}}
                  className="
                    md:order-2
                    rounded-sm ring ring-gray-200 shadow-sm shadow-black-300 py-3 px-10
                    cursor-pointer bg-[#8D0000] text-white
                    hover:scale-101 hover:bg-[#760000] hover:shadow-md
                    transition-all duration-200 active:scale-95
                  "
                >
                  Save
                </button>

                <button
                  onClick={() => setDisable(true)}
                  className="
                    md:order-2
                    rounded-sm ring ring-gray-200 shadow-sm shadow-black-300 py-3 px-10
                    cursor-pointer bg-black text-white
                    hover:scale-101 hover:bg-gray-700 hover:shadow-md
                    transition-all duration-200 active:scale-95
                  "
                >
                  Cancel
                </button>
              </div>
          }
          <button 
            onClick={() => setAction("view-tabs")}
            className="
              md:order-1
              rounded-sm ring ring-gray-200 shadow-sm shadow-black-300 py-3 px-10
              cursor-pointer bg-white
              hover:scale-101 hover:bg-gray-100 hover:shadow-md
              transition-all duration-200 active:scale-95
            "
          >
            Back
          </button>
        </div>
      </form>

    </div>
  )
}

function ChangePassword( {profile, setAction} : {profile: ProfileData, setAction: SetAction} ) {
  const [loading, setLoading] = useState(false)
  const [oldPassword, setOldPassword] = useState('')
  const [error, setError] = useState<string | null> (null)
  
  const [step, setStep] = useState("verify")
  
  const navigate = useNavigate()
  const email = profile.email

  const onSubmitVerify = async () => {
    setError(null);
    setLoading(true);

    try {

      const res = await fetch('/api/profile/verifyuser', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          email: email,
          password: oldPassword
        })
      });

      const result = await res.json();
      setLoading(false);

      if (!res.ok) {
        let errorMsg = "Errors occure";
         
         if (typeof result.message === 'string') {
             errorMsg = result.message;
         } else if (result.message && typeof result.message === 'object') {
             errorMsg = Object.values(result.message)[0] as string;
         }
         
         setError(errorMsg);
      } else {
        setError(null)
        setStep("new-password")
      }
    } catch(e) {
      setLoading(false);
      console.log(e)
    }
  }

   const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,30}$/;
    
   const schema = z.object({
      password: z.string().regex(strongPasswordRegex, {message: "Password must contain uppercase, lowercase, number, and special character (!@#$%^&*)"}),
      confirmpassword: z.string(),
   }).refine((data) => data.password === data.confirmpassword, {
      message: "Confirmation password does not match",
      path: ["confirmpassword"]
   })

  type Inputs = {
    password: string
    confirmpassword: string
  }

  const {
    register,
    watch,
    handleSubmit,
    formState: {errors},
  } = useForm<Inputs>({
    resolver: zodResolver(schema)
  })


   
  const onSubmitNewPassword = async (data: Inputs) => {
    try { 
        setLoading(true);
        const res = await fetch('/api/changepassword', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
          },
          body: JSON.stringify({
              email: email,
              password: data.password
          }),
        });

        setLoading(false)
        const result = await res.json();

        if (!result.isSuccess) {
          console.log("Fail full!!!")
          setError(result.message)
        } else {
          console.log("Success full!!!")
          setError(null);
          setAction("view-tabs")
        }

    } catch(e) {
        console.error(e)
    }
  }

  const renderStep = () => {
    switch(step) {
      case "verify":
        return(
          <div className='p-8 border border-gray-200 shadow-lg rounded-lg bg-white flex flex-col gap-4'>
            <h1 className="text-3xl font-bold text-foreground">
                Verify your self!
            </h1>
            
            <hr/>

            {error && <div className="text-[#8D0000]">{error}</div>}

            <form
              onSubmit={(e) => {
                e.preventDefault()
                onSubmitVerify()
              }}
              className="flex flex-col gap-6"
            >
              <label 
                htmlFor="password"
                className="text-muted-foreground"
              >
                Old password
              </label>

              <input 
                id="password" type="password"
                onChange={(e) => setOldPassword(e.target.value)}
                placeholder="********"
                className='w-full px-3 py-2 border rounded-md focus:outline-2 focus:outline-[#8D0000]'
              />

              <div className="mt-10 flex flex-col md:flex-row md:mx-auto gap-5">
                <button
                  type="submit"
                  disabled={loading}
                  className="
                    md:order-2
                    rounded-sm ring ring-gray-200 shadow-sm shadow-black-300 py-3 px-10
                    cursor-pointer bg-[#8D0000] text-white
                    hover:scale-101 hover:bg-[#760000] hover:shadow-md
                    transition-all duration-200 active:scale-95
                  "
                >
                  {loading ? "Đang kiểm tra..." : "Continue"}
                </button>

                <button 
                  onClick={() => setAction("view-tabs")}
                  className="
                    md:order-1
                    rounded-sm ring ring-gray-200 shadow-sm shadow-black-300 py-3 px-10
                    cursor-pointer bg-white
                    hover:scale-101 hover:bg-gray-100 hover:shadow-md
                    transition-all duration-200 active:scale-95
                  "
                >
                  Back
                </button>
              </div>
            </form>


  
          </div>
        )
      
      case "new-password":
        return(
          <div className='p-8 border border-gray-200 shadow-lg rounded-lg bg-white flex flex-col gap-4'>
            <h1 className="text-3xl font-bold text-foreground">
                Create a new password
            </h1>
            <hr/>
            <form className="flex flex-col gap-2" onSubmit={handleSubmit(onSubmitNewPassword)}>
                <div className="flex flex-col gap-2">
                  <label htmlFor="password" className="font-semibold text-gray-900" >New password </label>
                  <input type="password" id="password" placeholder="********" className='w-full px-3 py-2 border rounded-md focus:outline-2 focus:outline-[#8D0000]' {...register("password")}/>
                  <p className="text-xs text-gray-500">
                      At least 8 characters with uppercase, lowercase, number, and special character
                  </p>
                </div>
                <div className="flex flex-col gap-2">
                  <label htmlFor="confirmpassword" className="font-semibold text-gray-900">Retype new password</label>
                  <input type="password" id="confirmpassword" placeholder="********" className='w-full px-3 py-2 border rounded-md focus:outline-2 focus:outline-[#8D0000]'  {...register("confirmpassword")}/>
                </div>

                <div className="flex flex-row gap-4 w-full justify-end mt-4">
                  <div onClick={() => setAction("view-tabs")} className={`w-fit bg-black font-bold text-white py-2 px-4 rounded-md transition-color hover:cursor-pointer`}>
                      Cancel
                  </div>
                  <button type="submit" className={`w-fit bg-[#8D0000] font-bold text-white py-2 px-4 rounded-md transition-color hover:cursor-pointer`}>
                      {loading ? <ClipLoader loading={loading} size={20} color='white'/> : <p>Continue</p> }
                  </button>
                </div>
            </form>
          </div>
        )
    }
  }

  return(
    <>
      {renderStep()}
    </>
  )
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