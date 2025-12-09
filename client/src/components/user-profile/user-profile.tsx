import { useState, useEffect, useMemo } from "react";
import UserTab from "./user-profile-tabs";
import { ProfileData } from "./types";
import { SetAction } from "./types";
import { useForm, SubmitHandler } from "react-hook-form";
import z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Navigate, useNavigate } from "react-router-dom";
import { ClipLoader } from "react-spinners";
import { LocationOption } from "../register-form";
import { formatDate } from "../product";

const schema = z.object({
  name: z.string().min(3, { message: "Name must be 3–50 characters." }).max(50, { message: "Name must be 3–50 characters." }),
  email: z.string().email({ message: "Invalid email format" }),
  birthdate: z.string().nullable().optional(),
  homenumber: z.string().min(1, { message: "House number is required" }).regex(/^\d+$/, { message: "Home number must contain only digits." }),
  street: z.string().min(1, { message: "Street is required" }),
  province: z.string().min(1, { message: "Province is required" }),
  ward: z.string().min(1, { message: "Ward is required" }),
});

type Inputs = z.infer<typeof schema>;

export const getAddressParts = (fullAddress?: string | null) => {
  if (!fullAddress) {
    return { homenumber: "", street: "", ward: "", province: "" };
  }
  const parts = fullAddress.split(',').map(part => part.trim());
  
  return {
    homenumber: parts[0] || "",
    street: parts[1] || "",
    ward: parts[2] || "",
    province: parts[3] || ""
  };
};

function EditProfile( {profile, setAction} : {profile: ProfileData, setAction: SetAction} ) {
  const addressDefaults = getAddressParts(profile.address);

  const {
    register,
    watch,
    handleSubmit,
    formState: { errors },
    setError
  } = useForm<Inputs>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: profile.name,
      email: profile.email,
      birthdate: formatDate(profile.birthdate?.toLocaleDateString()),
      homenumber: addressDefaults.homenumber,
      street: addressDefaults.street,
      ward: addressDefaults.ward,
      province: addressDefaults.province
    }
  })

  // const navigate = useNavigate()

  const [loading, setLoading] = useState(false)
  const [disable, setDisable] = useState(true)

  const onSubmitProfile: SubmitHandler<Inputs> = async (data) => {
    setLoading(true)    

    try {
      const address = `${data.homenumber}, ${data.street}, ${data.ward}, ${data.province}`;

      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          address: address,
          birthdate: data.birthdate
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        if (!result.success) {
          if (result.message?.name)
            setError('name', { message: result.message.name });
          if (result.message?.email)
            setError('email', { message: result.message.email });
          if (result.message?.birthdate)
            setError('birthdate', { message: result.message.birthdate });
          // if (result.message?.address)
          //   setError('address', { message: result.message.address });
        }
      }
    } catch (err) {
      console.error('[v0] Update error:', err);
    } finally {
      setLoading(false);
    }
  }

  const [province, setProvince] = useState<LocationOption[]>([])
  const [ward, setWard] = useState<LocationOption[]>([])
  const provinceCur = watch("province");

  const fetchJsonData = async (url: string) => {
    const res = await fetch(url);
    if (!res.ok) {
        throw new Error(`HTTP error! Status: ${res.status}`);
    }
    const data = await res.json();
    return Object.values(data) as LocationOption[]; 
  }

  function loadProvince() {
      fetchJsonData("../admin_new/province.json")
          .then((data) => {
              console.log(data);
              setProvince(data);
          })
          .catch((error) => {
              console.error('Fetch province error:', error);
          });
  }

  function loadWard() {
    if (!provinceCur) {
      setWard([]);
      return;
    }

    fetchJsonData("../admin_new/ward.json")
      .then((data) => {
        setWard(data);
      })
      .catch((error) => {
        console.error('Fetch ward error:', error);
      });
  }

  console.log(watch("province"))

  useEffect(() => {
    loadProvince()
  }, [])

  useEffect(() => {
    loadWard()
  }, [provinceCur]) 

  const filterWard = useMemo(() => {
    if (!ward || ward.length === 0 || !provinceCur) return [];
    return ward.filter(w =>
        w.path_with_type.includes(provinceCur)
    );
  }, [provinceCur, ward]);

  return(
    <div className="px-10 py-20 rounded-sm ring ring-gray-200 shadow-sm shadow-stone-300">
      <form onSubmit={handleSubmit(onSubmitProfile)} className='flex flex-col gap-4'>

        {/* 1. Full Name */}
        <div className='flex flex-col gap-2'>
          <label htmlFor="name" className="font-semibold text-gray-900">Full Name</label>
          <input 
            type="text" 
            id="name" 
            placeholder='John Doe' 
            {...register("name", { required: true })} 
            className='w-full px-3 py-2 border rounded-md focus:outline-2 focus:outline-[#8D0000]' 
          />
          {errors.name && <span className='text-[#8D0000]'>{errors.name.message}</span>}
        </div>

        {/* 2. Email and Send Code */}
        <div className='flex flex-col gap-2'>
          <label htmlFor="email" className="font-semibold text-gray-900">Email</label>
          <div className='flex flex-col sm:flex-row gap-2'> {/* Thêm flex-col trên mobile, flex-row trên sm+ */}
            <input 
                type="text" 
                id="email" 
                placeholder='your@example.com' 
                {...register("email", { required: true })} 
                className='flex-grow px-3 py-2 border rounded-md focus:outline-2 focus:outline-[#8D0000]' 
            />
          </div>
          {errors.email && <span className='text-[#8D0000]'>{errors.email.message}</span>}
        </div>
        
        <div className='flex flex-col gap-2'>
          <label htmlFor="birthdate" className="font-semibold text-gray-900">Date of Birth</label>
          <input
            type="date"
            id="birthdate"
            {...register("birthdate")}
            className='w-full px-3 py-2 border rounded-md focus:outline-2 focus:outline-[#8D0000]'
          />
          {errors.birthdate && <span className='text-[#8D0000]'>{errors.birthdate.message}</span>}
        </div>

        {/* 4. Address Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4"> {/* Grid 1 cột trên mobile, 2 cột trên sm+ */}

          {/* Province/City */}
          <div className="flex flex-col gap-2">
            <label htmlFor="city" className="font-semibold text-gray-900" >Province/City</label>
            <select id="city" value={provinceCur} {...register("province")}
              className="w-full px-3 py-2 border rounded-md focus:outline-2 focus:outline-[#8D0000]">
              <option value="">Select city</option>
              {province.map((option) => (
                <option key={option.code} value={option.name}>{option.name}</option>
              ))}
            </select>
            {errors.province && <span className="text-[#8D0000]">{errors.province.message}</span>}
          </div>

            {/* Ward */}
          <div className="flex flex-col gap-2">
            <label htmlFor="ward" className="font-semibold text-gray-900" >Ward</label>
            <select id="ward"
              {...register("ward")} 
              className="w-full px-3 py-2 border rounded-md focus:outline-2 focus:outline-[#8D0000]" >
              <option value="">Select ward</option>
              {filterWard.map((option) => (
                <option key={option.code} value={option.name}>{option.name}</option>
              ))}
            </select>
            {errors.ward && <span className="text-[#8D0000]">{errors.ward.message}</span>}
          </div>
              
              {/* Street */}
          <div className="flex flex-col gap-2">
            <label htmlFor="street" className="font-semibold text-gray-900" >Street</label>
            <input type="text" id="street" 
              className="w-full px-3 py-2 border rounded-md focus:outline-2 focus:outline-[#8D0000]"
              {...register("street")}
            />
            {errors.street && <span className="text-[#8D0000]">{errors.street.message}</span>}
          </div>

              {/* House Number */}
          <div className="flex flex-col gap-2">
            <label htmlFor="homenumber" className="font-semibold text-gray-900" >House Number</label>
            <input type="text" id="homenumber" 
              className="w-full px-3 py-2 border rounded-md focus:outline-2 focus:outline-[#8D0000]"
              {...register("homenumber")}
            />
            {errors.homenumber && <span className="text-[#8D0000]">{errors.homenumber.message}</span>}
          </div>
        </div>

        <button 
            type="submit" 
            disabled={loading}
            className={`w-full bg-[#8D0000] font-bold text-white py-2.5 rounded-md transition-colors mt-2 flex justify-center items-center ${loading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-red-800'}`}
        >
            {loading ? <ClipLoader loading={loading} size={20} color='white' /> : <p>Save</p>}
        </button>
      </form>

    </div>
  )
}

function ChangePassword( {profile, setAction} : {profile: ProfileData, setAction: SetAction} ) {
  const [loading, setLoading] = useState(false)
  const [oldPassword, setOldPassword] = useState('')
  const [error, setError] = useState<string | null> (null)
  
  const [step, setStep] = useState("verify")
  
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
    <div className="h-full flex-4 min-w-0">
      {renderAction()}
    </div>
  )
}