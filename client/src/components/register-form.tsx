import { useEffect, useMemo, useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { z } from 'zod';
import { ClipLoader } from 'react-spinners';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import ReCAPTCHA from 'react-google-recaptcha';
import { useRef } from 'react';

// 1. Định nghĩa Schema Zod
const strongPasswordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,30}$/;

const schema = z
  .object({
    name: z
      .string()
      .min(3, { message: 'Name must be 3–8 characters.' })
      .max(8, { message: 'Name must be 3–8 characters.' }),
    email: z.string().email({ message: 'Invalid email format' }),
    password: z
      .string()
      .regex(strongPasswordRegex, {
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

  const {
    register,
    watch,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<Inputs>({
    resolver: zodResolver(schema),
  });

  const navigate = useNavigate();

  const onSubmit: SubmitHandler<Inputs> = async (data) => {
    setLoading(true);
    try {
      const address = `${data.homenumber}, ${data.street}, ${data.ward}, ${data.province}`;
      const token = recaptchaRef.current?.getValue();
      if (!token) {
        alert('Vui lòng xác thực reCAPTCHA');
        return;
      }

      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
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

      if (!res.ok) {
        if (!result.success) {
          if (result.message?.email) {
            setError('email', { message: result.message.email });
          }
          if (result.message?.password) {
            setError('password', { message: result.message.password });
          }
          if (result.message?.code) {
            setError('otp', { message: result.message.code });
          }
          if (result.message && typeof result.message === 'string') {
            console.error('Server Error:', result.message);
          }
        }
      } else {
        navigate('/signin');
      }
    } catch (err) {
      console.error('[v0] Registration error:', err);
    } finally {
      setLoading(false);
    }
  };

  const sendCode = async () => {
    setLoadingSendCode(true);
    setError('email', { message: undefined });

    const res = await fetch('/api/sendmail', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: watch('email'),
        register: true,
      }),
    });
    const result = await res.json();
    setLoadingSendCode(false);
    if (!res.ok) {
      if (!result.success) {
        setError('email', {
          message: result.message,
        });
      }
    }
  };

  const [province, setProvince] = useState<LocationOption[]>([]);
  const [ward, setWard] = useState<LocationOption[]>([]);
  const provinceCur = watch('province');

  const fetchJsonData = async (url: string) => {
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`HTTP error! Status: ${res.status}`);
    }
    const data = await res.json();
    return Object.values(data) as LocationOption[];
  };

  function loadProvince() {
    fetchJsonData('/admin_new/province.json')
      .then((data) => {
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

    fetchJsonData('admin_new/ward.json')
      .then((data) => {
        setWard(data);
      })
      .catch((error) => {
        console.error('Fetch ward error:', error);
      });
  }

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

  return (
    <div className="p-4 sm:p-8 border border-gray-200 shadow-lg rounded-lg bg-white w-full max-w-sm sm:max-w-md mx-auto">
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        {/* 1. Full Name */}
        <div className="flex flex-col gap-2">
          <label htmlFor="name" className="font-semibold text-gray-900">
            Full Name
          </label>
          <input
            type="text"
            id="name"
            placeholder="John Doe"
            {...register('name', { required: true })}
            className="w-full px-3 py-2 border rounded-md focus:outline-2 focus:outline-[#8D0000]"
          />
          {errors.name && <span className="text-[#8D0000]">{errors.name.message}</span>}
        </div>

        {/* 2. Email and Send Code */}
        <div className="flex flex-col gap-2">
          <label htmlFor="email" className="font-semibold text-gray-900">
            Email
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            {' '}
            {/* Thêm flex-col trên mobile, flex-row trên sm+ */}
            <input
              type="text"
              id="email"
              placeholder="your@example.com"
              {...register('email', { required: true })}
              className="flex-grow px-3 py-2 border rounded-md focus:outline-2 focus:outline-[#8D0000]"
            />
            <button
              type="button"
              onClick={sendCode}
              disabled={loadingSendCode}
              className={`flex-shrink-0 w-full sm:w-fit bg-[#8D0000] font-bold text-white py-2 px-4 rounded-md transition-colors ${loadingSendCode ? 'opacity-70 cursor-not-allowed' : 'hover:bg-red-800'}`} // Nút chiếm toàn bộ chiều rộng trên mobile
            >
              {loadingSendCode ? (
                <ClipLoader loading={loadingSendCode} size={20} color="white" />
              ) : (
                'Send Code'
              )}
            </button>
          </div>
          {errors.email && <span className="text-[#8D0000]">{errors.email.message}</span>}
        </div>

        {/* 3. OTP */}
        <div className="flex flex-col gap-2">
          <label htmlFor="otp" className="font-semibold text-gray-900">
            OTP
          </label>
          <input
            type="number"
            id="otp"
            placeholder="123456"
            {...register('otp', { required: true })}
            className="w-full px-3 py-2 border rounded-md focus:outline-2 focus:outline-[#8D0000]"
          />
          {errors.otp && <span className="text-[#8D0000]">{errors.otp.message}</span>}
        </div>

        {/* 4. Address Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {' '}
          {/* Grid 1 cột trên mobile, 2 cột trên sm+ */}
          {/* Province/City */}
          <div className="flex flex-col gap-2">
            <label htmlFor="city" className="font-semibold text-gray-900">
              Province/City
            </label>
            <select
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
              id="ward"
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

        {/* 5. Password */}
        <div className="flex flex-col gap-2">
          <label htmlFor="password" className="font-semibold text-gray-900">
            Password
          </label>
          <input
            type="password"
            id="password"
            placeholder="********"
            {...register('password', { required: true })}
            className="w-full px-3 py-2 border rounded-md focus:outline-2 focus:outline-[#8D0000]"
          />
          {!errors.password && (
            <p className="text-xs text-gray-500">
              At least 8 characters with uppercase, lowercase, number, and special character
            </p>
          )}
          {errors.password && <span className="text-[#8D0000]">{errors.password.message}</span>}
        </div>

        {/* 6. Confirm Password */}
        <div className="flex flex-col gap-2">
          <label htmlFor="confirmpassword" className="font-semibold text-gray-900">
            Confirm Password
          </label>
          <input
            type="password"
            id="confirmpassword"
            placeholder="********"
            {...register('confirmpassword', { required: true })}
            className="w-full px-3 py-2 border rounded-md focus:outline-2 focus:outline-[#8D0000]"
          />
          {errors.confirmpassword && (
            <span className="text-[#8D0000]">{errors.confirmpassword.message}</span>
          )}
        </div>

        <ReCAPTCHA sitekey="6Lce-yosAAAAANX0klvmA9vGX6u_GknKTrz-0tzM" ref={recaptchaRef} />

        {/* Submit Button */}
        <button
          type="submit"
          data-sitekey="6LfB-SosAAAAABEI2CZiXH1ps_FpGyEqE-vpjZOm"
          disabled={loading}
          className={`w-full bg-[#8D0000] font-bold text-white py-2.5 rounded-md transition-colors mt-2 flex justify-center items-center ${loading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-red-800'}`}
        >
          {loading ? (
            <ClipLoader loading={loading} size={20} color="white" />
          ) : (
            <p>Create Account</p>
          )}
        </button>

        {/* Sign-in link */}
        <p className="text-center text-gray-600">
          Already have an account?{' '}
          <Link
            to="/signin"
            className="font-semibold text-blue-600 hover:text-blue-700 transition-colors"
          >
            Sign in
          </Link>
        </p>
      </form>
    </div>
  );
}
