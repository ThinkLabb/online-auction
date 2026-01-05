import { useState, useEffect, useMemo } from 'react';
import UserTab from './user-profile-tabs';
import { Profile, VerifyInputs, SetAction } from './interfaces';
import { useForm, SubmitHandler } from 'react-hook-form';
import z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { ClipLoader } from 'react-spinners';
import { LocationOption } from '../register-form';
import PasswordVerification from './password-verification';

const schema = z.object({
  name: z
    .string()
    .min(3, { message: 'Name must be 3–50 characters.' })
    .max(50, { message: 'Name must be 3–50 characters.' }),
  email: z.string().trim().email({ message: 'Invalid email format' }),
  birthdate: z.string().nullable().optional().refine((dateString) => {
    if (!dateString) return true;

    const date = new Date(dateString);
    
    if (isNaN(date.getTime())) return false;

    const now = new Date();
    return date <= now;
  }, { 
    message: "Birthdate must be in the past." 
  }),
  homenumber: z
    .string()
    .min(1, { message: 'House number is required' })
    .regex(/^\d+$/, { message: 'Home number must contain only digits.' }),
  street: z.string().min(1, { message: 'Street is required' }),
  province: z.string().min(1, { message: 'Province is required' }),
  ward: z.string().min(1, { message: 'Ward is required' }),
});

type Inputs = z.infer<typeof schema>;

export const getAddressParts = (fullAddress?: string | null) => {
  if (!fullAddress) {
    return { homenumber: '', street: '', ward: '', province: '' };
  }
  const parts = fullAddress.split(',').map((part) => part.trim());

  return {
    homenumber: parts[0] || '',
    street: parts[1] || '',
    ward: parts[2] || '',
    province: parts[3] || '',
  };
};

function EditProfile(
  { 
    profile, 
    setAction,
    setProfile
  } : {
    profile: Profile; 
    setAction: SetAction;
    setProfile: React.Dispatch<React.SetStateAction<Profile | null>>;
  }) 
{
  const formatDateForInput = (dateInput?: string | Date | null) => {
    if (!dateInput) return '';
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) return '';
    return date.toISOString().split('T')[0];
  };

  const addressDefaults = getAddressParts(profile.address);

  const {
    register,
    watch,
    handleSubmit,
    reset,
    formState: { errors },
    setError,
  } = useForm<Inputs>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: profile.name,
      email: profile.email,
      birthdate: formatDateForInput(profile.birthdate),
      homenumber: addressDefaults.homenumber,
      street: addressDefaults.street,
      ward: addressDefaults.ward,
      province: addressDefaults.province,
    },
  });

  const [loading, setLoading] = useState(false);
  const [isDisable, setIsDisable] = useState(true);
  const [pendingData, setPendingData] = useState<Inputs | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  const [province, setProvince] = useState<LocationOption[]>([]);
  const [ward, setWard] = useState<LocationOption[]>([]);
  const provinceCur = watch('province');
  const wardCurr = watch('ward');

  const fetchJsonData = async (url: string) => {
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`HTTP error! Status: ${res.status}`);
    }
    const data = await res.json();
    return Object.values(data) as LocationOption[];
  };

  function loadProvince() {
    fetchJsonData('../admin_new/province.json')
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

    fetchJsonData('../admin_new/ward.json')
      .then((data) => {
        setWard(data);
      })
      .catch((error) => {
        console.error('Fetch ward error:', error);
      });
  }

  watch('province');

  const onPreSubmit: SubmitHandler<Inputs> = (data) => {
    setPendingData(data);
    setIsVerifying(true);
  };

  const handleVerificationSuccess = async () => {
    setIsVerifying(false);

    if (!pendingData) return;

    const data = pendingData;
    setLoading(true);

    try {
      const address = `${data.homenumber}, ${data.street}, ${data.ward}, ${data.province}`;

      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          address: address,
          birthdate: data.birthdate,
        }),
      });

      const result = await res.json();

      if (!res.ok || result.isSuccess === false) {
        alert('Edited profile failed! Resetting to default...');
        if (result.errorField === 'email') 
          setError('email', { message: result.message });

        const originalAddress = getAddressParts(profile.address)

        reset({
          name: profile.name,
          email: profile.email,
          birthdate: formatDateForInput(profile.birthdate),
          homenumber: originalAddress.homenumber,
          street: originalAddress.street,
          ward: originalAddress.ward,
          province: originalAddress.province,
        });
      } else {
        alert('Edited profile successfully!');

        const updatedProfile: Profile = {
          ...profile,
          name: result.data.name,
          email: result.data.email,
          address: result.data.address,
          birthdate: result.data.birthdate,
        };
        setProfile(updatedProfile);
        setPendingData(null);
        setIsDisable(true);
      }

    } catch (err) {
      console.error('[v0] Update error:', err);
      alert('An unexpected error occurred');

      reset({
        name: profile.name,
        email: profile.email,
        birthdate: formatDateForInput(profile.birthdate),
        homenumber: addressDefaults.homenumber,
        street: addressDefaults.street,
        ward: addressDefaults.ward,
        province: addressDefaults.province,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProvince();
  }, []);

  useEffect(() => {
    loadWard();
  }, [provinceCur]);

  const filterWard = useMemo(() => {
    if (!ward || ward.length === 0 || !provinceCur) return [];
    return ward.filter((w) => w.path_with_type.includes(provinceCur));
  }, [provinceCur, ward]);

  if (isVerifying) {
    return (
      <PasswordVerification
        email={profile.email}
        onSuccess={handleVerificationSuccess}
        onFinish={handleVerificationSuccess}
        onCancel={() => setIsVerifying(false)}
      />
    );
  }
  return (
    <div className="p-10 rounded-sm ring ring-gray-200 shadow-sm shadow-stone-300">
      <form
        onSubmit={handleSubmit(onPreSubmit)}
        className={`flex flex-col gap-2 ${isDisable ? 'text-gray-500' : 'text-black'}`}
      >
        <div className="flex flex-col gap-2">
          <label htmlFor="name" className="font-semibold text-gray-900">
            Full Name
          </label>
          <input
            disabled={isDisable}
            type="text"
            id="name"
            placeholder="John Doe"
            {...register('name', { required: true })}
            className="w-full px-3 py-2 border rounded-md focus:outline-2 focus:outline-[#8D0000]"
          />
          {errors.name && <span className="text-[#8D0000]">{errors.name.message}</span>}
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="email" className="font-semibold text-gray-900">
            Email
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              disabled={isDisable}
              type="text"
              id="email"
              placeholder="your@example.com"
              {...register('email', { required: true })}
              className="flex-grow px-3 py-2 border rounded-md focus:outline-2 focus:outline-[#8D0000]"
            />
          </div>
          {errors.email && <span className="text-[#8D0000]">{errors.email.message}</span>}
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="birthdate" className="font-semibold text-gray-900">
            Date of Birth
          </label>
          <input
            disabled={isDisable}
            type="date"
            id="birthdate"
            {...register('birthdate')}
            className="w-full px-3 py-2 border rounded-md focus:outline-2 focus:outline-[#8D0000]"
          />
          {errors.birthdate && <span className="text-[#8D0000]">{errors.birthdate.message}</span>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {' '}
          {/* Province/City */}
          <div className="flex flex-col gap-2">
            <label htmlFor="city" className="font-semibold text-gray-900">
              Province/City
            </label>
            <select
              disabled={isDisable}
              id="city"
              value={provinceCur}
              {...register('province')}
              className="w-full px-3 py-2 border rounded-md focus:outline-2 focus:outline-[#8D0000]"
            >
              <option value="">Select city</option>
              {province.map((option) => (
                <option key={option.code} value={option.name}>
                  {option.name}
                </option>
              ))}
            </select>
            {errors.province && <span className="text-[#8D0000]">{errors.province.message}</span>}
          </div>
          {/* Ward */}
          <div className="flex flex-col gap-2">
            <label htmlFor="ward" className="font-semibold text-gray-900">
              Ward
            </label>
            <select
              disabled={isDisable}
              id="ward"
              value={wardCurr}
              {...register('ward')}
              className="w-full px-3 py-2 border rounded-md focus:outline-2 focus:outline-[#8D0000]"
            >
              <option value="">Select ward</option>
              {filterWard.map((option) => (
                <option key={option.code} value={option.name}>
                  {option.name}
                </option>
              ))}
            </select>
            {errors.ward && <span className="text-[#8D0000]">{errors.ward.message}</span>}
          </div>
          {/* Street */}
          <div className="flex flex-col gap-2">
            <label htmlFor="street" className="font-semibold text-gray-900">
              Street
            </label>
            <input
              disabled={isDisable}
              type="text"
              id="street"
              className="w-full px-3 py-2 border rounded-md focus:outline-2 focus:outline-[#8D0000]"
              {...register('street')}
            />
            {errors.street && <span className="text-[#8D0000]">{errors.street.message}</span>}
          </div>
          {/* House Number */}
          <div className="flex flex-col gap-2">
            <label htmlFor="homenumber" className="font-semibold text-gray-900">
              House Number
            </label>
            <input
              disabled={isDisable}
              type="text"
              id="homenumber"
              className="w-full px-3 py-2 border rounded-md focus:outline-2 focus:outline-[#8D0000]"
              {...register('homenumber')}
            />
            {errors.homenumber && (
              <span className="text-[#8D0000]">{errors.homenumber.message}</span>
            )}
          </div>
        </div>

        <div className="mt-5 flex flex-col md:flex-row md:mx-auto gap-3">
          {isDisable ? (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  setIsDisable(false);
                }}
                className="
                  md:order-2
                  rounded-sm ring ring-gray-200 shadow-sm shadow-black-300 py-1 px-10
                  cursor-pointer bg-black text-white
                  hover:scale-101 hover:bg-white hover:border hover:text-black
                  transition-all duration-200 active:scale-95
                "
              >
                Edit
              </button>
              <button
                onClick={() => setAction('view-tabs')}
                type="button"
                className="
                md:order-1
                rounded-sm ring ring-gray-200 shadow-sm shadow-black-300 py-1 px-10
                cursor-pointer bg-white text-black
                hover:scale-101 hover:bg-gray-100 hover:shadow-md
                transition-all duration-200 active:scale-95
              "
              >
                Back
              </button>
            </>
          ) : (
            <>
              <button
                type="submit"
                disabled={loading}
                className="
                  md:order-2
                  rounded-sm ring ring-gray-200 shadow-sm shadow-black-300 py-1 px-10
                  cursor-pointer bg-[#8D0000] text-white
                  hover:scale-101 hover:bg-[#760000] hover:shadow-md
                  transition-all duration-200 active:scale-95
                "
              >
                {loading ? <ClipLoader loading={loading} size={20} color="white" /> : <p>Save</p>}
              </button>

              <button
                onClick={() => setIsDisable(true)}
                type="button"
                className="
                md:order-1
                rounded-sm ring ring-gray-200 shadow-sm shadow-black-300 py-1 px-10
                cursor-pointer bg-white
                hover:scale-101 hover:bg-gray-100 hover:shadow-md
                transition-all duration-200 active:scale-95
              "
              >
                Cancel
              </button>
            </>
          )}
        </div>
      </form>
    </div>
  );
}

function ChangePassword({ profile, setAction }: { profile: Profile; setAction: SetAction }) {
  const [step, setStep] = useState<'verify' | 'new-password'>('verify');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const email = profile.email;

  const strongPasswordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,30}$/;

  const schema = z
    .object({
      password: z.string().regex(strongPasswordRegex, {
        message:
          'Password must contain uppercase, lowercase, number, and special character (!@#$%^&*)',
      }),
      confirmpassword: z.string(),
    })
    .refine((data) => data.password === data.confirmpassword, {
      message: 'Confirmation password does not match',
      path: ['confirmpassword'],
    });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<VerifyInputs>({
    resolver: zodResolver(schema),
  });

  const onSubmitNewPassword = async (data: VerifyInputs) => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch('/api/changepassword', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          password: data.password,
        }),
      });

      setLoading(false);
      const result = await res.json();

      if (!result.isSuccess) {
        console.log('Fail full!!!');
        setError(result.message);
      } else {
        alert('Changed password successfully!');
        setError(null);
        setAction('view-tabs');
      }
    } catch (e: any) {
      setLoading(false);
      console.error(e.message);
      setError('An error occurred while changing password.');
    }
  };

  if (step === 'verify') {
    return (
      <PasswordVerification
        email={email}
        onSuccess={() => setStep('new-password')}
        onCancel={() => setAction('view-tabs')}
        onFinish={() => setAction('view-tabs')}
      />
    );
  }

  return (
    <div className="p-8 border border-gray-200 shadow-lg rounded-lg bg-white flex flex-col gap-4">
      <h1 className="text-3xl font-bold text-foreground">Create a new password</h1>
      <hr />

      {error && <div className="text-[#8D0000]">{error}</div>}

      <form className="flex flex-col gap-2" onSubmit={handleSubmit(onSubmitNewPassword)}>
        <div className="flex flex-col gap-2">
          <label htmlFor="password" className="font-semibold text-gray-900">
            New password
          </label>
          <input
            type="password"
            id="password"
            placeholder="********"
            className="w-full px-3 py-2 border rounded-md focus:outline-2 focus:outline-[#8D0000]"
            {...register('password')}
          />
          {errors.password && (
            <span className="text-red-500 text-sm">{errors.password.message}</span>
          )}
          <p className="text-xs text-gray-500">
            At least 8 characters with uppercase, lowercase, number, and special character
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="confirmpassword" className="font-semibold text-gray-900">
            Retype new password
          </label>
          <input
            type="password"
            id="confirmpassword"
            placeholder="********"
            className="w-full px-3 py-2 border rounded-md focus:outline-2 focus:outline-[#8D0000]"
            {...register('confirmpassword')}
          />
          {errors.confirmpassword && (
            <span className="text-red-500 text-sm">{errors.confirmpassword.message}</span>
          )}
        </div>

        <div className="flex flex-row gap-4 w-full justify-end mt-4">
          <div
            onClick={() => setAction('view-tabs')}
            className={`w-fit bg-black font-bold text-white py-2 px-4 rounded-md transition-color hover:cursor-pointer`}
          >
            Cancel
          </div>
          <button
            type="submit"
            disabled={loading}
            className={`w-fit bg-[#8D0000] font-bold text-white py-2 px-4 rounded-md transition-color hover:cursor-pointer`}
          >
            {loading ? <ClipLoader loading={loading} size={20} color="white" /> : <p>Continue</p>}
          </button>
        </div>
      </form>
    </div>
  );
}

function RequesRole({ setAction }: { setAction: SetAction }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState<string | null>(null);

  const onSubmitRequest = async () => {
    if (!message || message.trim() === '') {
      setError('Message must not be left blank!');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/profile/role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: message,
          request_type: 'temporary',
        }),
      });

      const result = await res.json();
      setLoading(false);

      if (!res.ok) {
        let errorMsg = 'Errors occure';

        if (typeof result.message === 'string') {
          errorMsg = result.message;
        } else if (result.message && typeof result.message === 'object') {
          errorMsg = Object.values(result.message)[0] as string;
        }

        setError(errorMsg);
      } else {
        setError(null);
        setAction('view-tabs');
      }
    } catch (e) {
      setLoading(false);
      console.log(e);
    }
  };

  return (
    <div className="p-8 border border-gray-200 shadow-lg rounded-lg bg-white flex flex-col gap-4">
      <h1 className="text-3xl font-bold text-foreground">Request Seller Access (7 Days)</h1>

      <hr />

      {error && <div className="text-[#8D0000]">{error}</div>}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmitRequest();
        }}
        className="flex flex-col gap-6"
      >
        <div className="p-4 border border-blue-300 rounded-lg bg-blue-50">
          <div className="flex items-start gap-3">
            <div className="flex-1">
              <div className="font-semibold text-blue-900 flex items-center gap-2 mb-2">
                Seller Access (7 Days)
              </div>
              <div className="text-sm text-blue-700">
                You will receive seller permissions for 7 days after approval. During this time, you
                can create and manage product listings. After 7 days, your seller access will
                automatically expire, but your existing products will remain active.
              </div>
            </div>
          </div>
        </div>

        <label htmlFor="message" className="text-muted-foreground">
          Your message
        </label>

        <textarea
          id="message"
          onChange={(e) => {
            if (error) setError(null);
            setMessage(e.target.value);
          }}
          placeholder="Leave your message here..."
          className="w-full px-3 py-2 border rounded-md focus:outline-2 focus:outline-[#8D0000]"
          rows={4}
        />

        <div className="mt-10 flex flex-col md:flex-row md:mx-auto gap-5">
          <button
            type="submit"
            disabled={loading}
            className="
              md:order-2
              rounded-sm ring ring-gray-200 shadow-sm shadow-black-300 py-1 px-10
              cursor-pointer bg-[#8D0000] text-white
              hover:scale-101 hover:bg-[#760000] hover:shadow-md
              transition-all duration-200 active:scale-95
            "
          >
            {loading ? 'Checking...' : 'Continue'}
          </button>

          <button
            onClick={() => setAction('view-tabs')}
            type="button"
            className="
              md:order-1
              rounded-sm ring ring-gray-200 shadow-sm shadow-black-300 py-1 px-10
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
  );
}

function ViewTabs({ profile }: { profile: Profile }) {
  return <UserTab profile={profile} />;
}

export default function UserAction({
  profile,
  action,
  setAction,
  setProfile,
}: {
  profile: Profile;
  action: string;
  setAction: SetAction;
  setProfile: React.Dispatch<React.SetStateAction<Profile | null>>;
}) {
  const renderAction = () => {
    switch (action) {
      case 'edit-profile':
        return <EditProfile profile={profile} setAction={setAction} setProfile={ setProfile }/>;
      case 'change-password':
        return <ChangePassword profile={profile} setAction={setAction} />;
      case 'request-role':
        return <RequesRole setAction={setAction} />;
      case 'view-tabs':
        return <ViewTabs profile={profile} />;
      default:
        return <h1 className="text-3xl text-red-500">Invalid Action!</h1>;
    }
  };
  return <div className="h-full w-full flex-4 min-w-0">{renderAction()}</div>;
}
