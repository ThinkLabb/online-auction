import { useEffect, useMemo, useState, useRef } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { z } from 'zod';
import { ClipLoader } from 'react-spinners';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import ReCAPTCHA from 'react-google-recaptcha';

// Google Auth
import { GoogleLogin, GoogleOAuthProvider } from '@react-oauth/google';

// Zod Schema Definition
const strongPasswordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,30}$/;

const schema = z
  .object({
    name: z
      .string()
      .min(3, { message: 'Name must be 3–50 characters.' })
      .max(50, { message: 'Name must be 3–50 characters.' }),
    email: z.string().email({ message: 'Invalid email format' }),
    password: z.string().regex(strongPasswordRegex, {
      message:
        'Password must contain uppercase, lowercase, number, and special character (!@#$%^&*)',
    }),
    confirmpassword: z.string(),
    otp: z.string().min(1, { message: 'OTP is required' }),
    homenumber: z
      .string()
      .min(1, { message: 'House number is required' })
      .regex(/^\d+$/, { message: 'Home number must contain only digits.' }),
    street: z.string().min(1, { message: 'Street is required' }),
    province: z.string().min(1, { message: 'Province is required' }),
    ward: z.string().min(1, { message: 'Ward is required' }),
  })
  .refine((data) => data.password === data.confirmpassword, {
    message: 'Confirmation password does not match',
    path: ['confirmpassword'],
  });

type Inputs = z.infer<typeof schema>;

export interface LocationOption {
  name: string;
  code: number;
  codename: string;
  path_with_type: string;
}

export default function Register() {
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingSendCode, setLoadingSendCode] = useState<boolean>(false);
  const recaptchaRef = useRef<ReCAPTCHA>(null);
  const navigate = useNavigate();

  const {
    register,
    watch,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<Inputs>({
    resolver: zodResolver(schema),
  });

  // --- API HANDLERS ---

  // Standard Email Registration
  const onSubmit: SubmitHandler<Inputs> = async (data) => {
    setLoading(true);
    try {
      const address = `${data.homenumber}, ${data.street}, ${data.ward}, ${data.province}`;
      const token = recaptchaRef.current?.getValue();
      if (!token) return alert('Please verify reCAPTCHA');

      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          address: address,
          password: data.password,
          code: data.otp,
          recaptchaToken: token,
        }),
      });

      const result = await res.json();
      if (res.ok) {
        navigate('/signin');
      } else if (result.message && typeof result.message === 'object') {
        Object.keys(result.message).forEach((key) => {
          setError(key as any, { message: result.message[key] });
        });
      }
    } catch (err) {
      console.error('Registration error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Google Login Success Handler
  const onGoogleSuccess = async (googleToken: string) => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/social-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: 'google', token: googleToken }),
      });
      const result = await res.json();
      if (res.ok) {
        navigate('/');
      } else {
        alert(result.message || 'Google Authentication failed');
      }
    } catch (err) {
      console.error('Social login error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Send OTP Logic
  const sendCode = async () => {
    setLoadingSendCode(true);
    try {
      const res = await fetch('/api/sendmail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: watch('email'), register: true }),
      });
      const result = await res.json();
      if (!res.ok) setError('email', { message: result.message });
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingSendCode(false);
    }
  };

  // --- LOCATION LOGIC ---
  const [province, setProvince] = useState<LocationOption[]>([]);
  const [ward, setWard] = useState<LocationOption[]>([]);
  const provinceCur = watch('province');

  useEffect(() => {
    fetch('/admin_new/province.json')
      .then((res) => res.json())
      .then((data) => setProvince(Object.values(data)));
  }, []);

  useEffect(() => {
    if (provinceCur) {
      fetch('admin_new/ward.json')
        .then((res) => res.json())
        .then((data) => setWard(Object.values(data)));
    }
  }, [provinceCur]);

  const filterWard = useMemo(() => {
    if (!provinceCur) return [];
    return ward.filter((w) => w.path_with_type.includes(provinceCur));
  }, [provinceCur, ward]);

  return (
    <GoogleOAuthProvider
      clientId="229504266736-tsn5rk0694t0vu0lkh65s0vj2m26mf7o.apps.googleusercontent.com"
      locale="en"
    >
      <div className="p-4 sm:p-8 border border-gray-200 shadow-xl rounded-xl bg-white w-full max-w-sm sm:max-w-md mx-auto my-10">
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          {/* Full Name */}
          <div className="flex flex-col gap-1">
            <label className="font-semibold text-sm text-gray-700">Full Name</label>
            <input
              {...register('name')}
              className="px-3 py-2 border rounded-md focus:ring-2 focus:ring-[#8D0000] outline-none"
              placeholder="John Doe"
            />
            {errors.name && (
              <span className="text-red-600 text-xs font-medium">{errors.name.message}</span>
            )}
          </div>

          {/* Email & Send OTP */}
          <div className="flex flex-col gap-1">
            <label className="font-semibold text-sm text-gray-700">Email Address</label>
            <div className="flex gap-2">
              <input
                {...register('email')}
                className="flex-grow px-3 py-2 border rounded-md focus:ring-2 focus:ring-[#8D0000] outline-none"
                placeholder="email@example.com"
              />
              <button
                type="button"
                onClick={sendCode}
                disabled={loadingSendCode}
                className="bg-[#8D0000] text-white px-4 py-2 rounded-md font-bold text-xs uppercase hover:bg-red-800 transition-all"
              >
                {loadingSendCode ? <ClipLoader size={14} color="white" /> : 'Send Code'}
              </button>
            </div>
            {errors.email && (
              <span className="text-red-600 text-xs font-medium">{errors.email.message}</span>
            )}
          </div>

          {/* OTP */}
          <div className="flex flex-col gap-1">
            <label className="font-semibold text-sm text-gray-700">Verification Code (OTP)</label>
            <input
              type="number"
              {...register('otp')}
              className="px-3 py-2 border rounded-md focus:ring-2 focus:ring-[#8D0000] outline-none"
              placeholder="123456"
            />
            {errors.otp && (
              <span className="text-red-600 text-xs font-medium">{errors.otp.message}</span>
            )}
          </div>

          {/* Location Selectors */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-gray-700 uppercase">Province</label>
              <select
                {...register('province')}
                className="border rounded px-2 py-2 text-sm bg-gray-50"
              >
                <option value="">Select city</option>
                {province.map((p) => (
                  <option key={p.code} value={p.name}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-gray-700 uppercase">Ward</label>
              <select {...register('ward')} className="border rounded px-2 py-2 text-sm bg-gray-50">
                <option value="">Select ward</option>
                {filterWard.map((w) => (
                  <option key={w.code} value={w.name}>
                    {w.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Street & House Number */}
          <div className="grid grid-cols-2 gap-3">
            <input
              {...register('street')}
              placeholder="Street Name"
              className="border rounded px-3 py-2 text-sm"
            />
            <input
              {...register('homenumber')}
              placeholder="House No."
              className="border rounded px-3 py-2 text-sm"
            />
          </div>

          {/* Passwords */}
          <div className="flex flex-col gap-1">
            <label className="font-semibold text-sm text-gray-700">Password</label>
            <input
              type="password"
              {...register('password')}
              className="px-3 py-2 border rounded-md focus:ring-2 focus:ring-[#8D0000] outline-none"
              placeholder="********"
            />
            {errors.password && (
              <span className="text-red-600 text-xs font-medium">{errors.password.message}</span>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <label className="font-semibold text-sm text-gray-700">Confirm Password</label>
            <input
              type="password"
              {...register('confirmpassword')}
              className="px-3 py-2 border rounded-md focus:ring-2 focus:ring-[#8D0000] outline-none"
              placeholder="********"
            />
            {errors.confirmpassword && (
              <span className="text-red-600 text-xs font-medium">
                {errors.confirmpassword.message}
              </span>
            )}
          </div>

          <div className="flex justify-center scale-90 sm:scale-100 origin-center py-2">
            <ReCAPTCHA sitekey="6Lce-yosAAAAANX0klvmA9vGX6u_GknKTrz-0tzM" ref={recaptchaRef} />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#8D0000] text-white py-3 rounded-md font-bold hover:bg-red-800 shadow-md transition-all flex justify-center items-center"
          >
            {loading ? <ClipLoader size={20} color="white" /> : 'Register Now'}
          </button>

          {/* --- GOOGLE SIGN IN ONLY --- */}
          <div className="relative flex py-3 items-center">
            <div className="flex-grow border-t border-gray-300"></div>
            <span className="mx-4 text-gray-400 text-xs font-bold">OR SIGN UP WITH</span>
            <div className="flex-grow border-t border-gray-300"></div>
          </div>

          <div className="flex justify-center">
            <GoogleLogin
              onSuccess={(res) => onGoogleSuccess(res.credential!)}
              onError={() => console.log('Google Authentication Failed')}
              theme="filled_black"
              shape="pill"
              text="signup_with"
              width="100%"
            />
          </div>

          <p className="text-center text-sm mt-4 text-gray-600">
            Already have an account?{' '}
            <Link to="/signin" className="text-blue-700 font-bold hover:underline">
              Sign In
            </Link>
          </p>
        </form>
      </div>
    </GoogleOAuthProvider>
  );
}
