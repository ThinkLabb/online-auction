import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { ClipLoader } from 'react-spinners';
import { z } from 'zod';

export default function ForgotPassword() {
  const [curPage, setCurPage] = useState('EnterEmail');
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();

  const onSubmitEmail = async () => {
    setLoading(true);
    const res = await fetch('/api/sendmail', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: email,
        register: false,
      }),
    });

    const result = await res.json();

    setLoading(false);

    if (!res.ok) {
      if (!result.success) {
        setError(result.message);
      }
    } else {
      setError(null);
      setCurPage('EnterCode');
    }
  };

  const onSubmitCode = async () => {
    setLoading(true);
    const res = await fetch('api/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: email,
        code: code,
      }),
    });

    setLoading(false);
    const result = await res.json();

    setLoading(false);

    if (!res.ok) {
      if (!result.success) {
        setError(result.message);
      }
    } else {
      setError(null);
      setCurPage('EnterNewPassword');
    }
  };

  const strongPasswordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,30}$/;

  const schema = z
    .object({
      password: z
        .string()
        .regex(strongPasswordRegex, {
          message:
            'Password must contain uppercase, lowercase, number, and special character (!@#$%^&*)',
        }),
      confirmpassword: z.string(),
    })
    .refine((data) => data.password === data.confirmpassword, {
      message: 'Confirmation password does not match',
      path: ['confirmpassword'],
    });

  type Inputs = {
    password: string;
    confirmpassword: string;
  };

  const {
    register,
    watch,
    handleSubmit,
    formState: { errors },
  } = useForm<Inputs>({
    resolver: zodResolver(schema),
  });

  const onSubmitNewPassword = async (data: Inputs) => {
    try {
      setLoading(true);
      const res = await fetch('api/changepassword', {
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

      if (!result.success) {
        setError(result.message);
      } else {
        setError(null);
        navigate('/signin');
      }
    } catch (e) {
      console.error(e);
    }
  };

  function render() {
    switch (curPage) {
      case 'EnterEmail':
        return (
          <div className="p-8 border border-gray-200 shadow-lg rounded-lg bg-white flex flex-col gap-4">
            <h1 className="text-3xl font-bold text-foreground">Find Your Account</h1>
            <hr />
            <form
              onSubmit={(e) => {
                e.preventDefault();
                onSubmitEmail();
              }}
              className="flex flex-col gap-2"
            >
              <label htmlFor="email" className="text-muted-foreground">
                Enter your email address to get a code to verify your account.
              </label>
              <input
                type="email"
                id="email"
                placeholder="your@example.com"
                className="w-full px-3 py-2 border rounded-md focus:outline-2 focus:outline-[#8D0000]"
                onChange={(e) => {
                  setEmail(e.target.value);
                }}
              />
              {error && <span className="text-[#8D0000]">{error}</span>}
              <div className="flex flex-row gap-4 w-full justify-end mt-4">
                <div
                  onClick={() => navigate('/signin')}
                  className={`w-fit bg-black font-bold text-white py-2 px-4 rounded-md transition-color hover:cursor-pointer`}
                >
                  Cancel
                </div>
                <button
                  type="submit"
                  className={`w-fit bg-[#8D0000] font-bold text-white py-2 px-4 rounded-md transition-color hover:cursor-pointer`}
                >
                  {loading ? (
                    <ClipLoader loading={loading} size={20} color="white" />
                  ) : (
                    <p>Continue</p>
                  )}
                </button>
              </div>
            </form>
          </div>
        );
      case 'EnterCode':
        return (
          <div className="p-8 border border-gray-200 shadow-lg rounded-lg bg-white flex flex-col gap-4">
            <h1 className="text-3xl font-bold text-foreground">Enter security code</h1>
            <hr />
            <form
              onSubmit={(e) => {
                e.preventDefault();
                onSubmitCode();
              }}
              className="flex flex-col gap-2"
            >
              <label htmlFor="code" className="text-muted-foreground">
                Please check your emails for a message with your code. Your code is 6 numbers long.
              </label>
              <input
                type="number"
                id="code"
                placeholder="123456"
                className="w-full px-3 py-2 border rounded-md focus:outline-2 focus:outline-[#8D0000]"
                onChange={(e) => setCode(e.target.value)}
              />
              {error && <span className="text-[#8D0000]">{error}</span>}

              <div
                onClick={onSubmitEmail}
                className="font-semibold text-blue-600 hover:text-blue-700 transition-colors self-start hover:cursor-pointer"
              >
                {loading ? (
                  <ClipLoader loading={loading} size={20} color="white" />
                ) : (
                  <p>Resend code?</p>
                )}
              </div>

              <div className="flex flex-row gap-4 w-full justify-end mt-4">
                <div
                  onClick={() => setCurPage('EnterEmail')}
                  className={`w-fit bg-black font-bold text-white py-2 px-4 rounded-md transition-color hover:cursor-pointer`}
                >
                  Back
                </div>
                <button
                  type="submit"
                  className={`w-fit bg-[#8D0000] font-bold text-white py-2 px-4 rounded-md transition-color hover:cursor-pointer`}
                >
                  {loading ? (
                    <ClipLoader loading={loading} size={20} color="white" />
                  ) : (
                    <p>Continue</p>
                  )}
                </button>
              </div>
            </form>
          </div>
        );
      case 'EnterNewPassword':
        return (
          <div className="p-8 border border-gray-200 shadow-lg rounded-lg bg-white flex flex-col gap-4">
            <h1 className="text-3xl font-bold text-foreground">Create a new password</h1>
            <hr />
            <form className="flex flex-col gap-2" onSubmit={handleSubmit(onSubmitNewPassword)}>
              <div className="flex flex-col gap-2">
                <label htmlFor="password" className="font-semibold text-gray-900">
                  New password{' '}
                </label>
                <input
                  type="password"
                  id="password"
                  placeholder="********"
                  className="w-full px-3 py-2 border rounded-md focus:outline-2 focus:outline-[#8D0000]"
                  {...register('password')}
                />
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
              </div>

              <div className="flex flex-row gap-4 w-full justify-end mt-4">
                <div
                  onClick={() => navigate('/signin')}
                  className={`w-fit bg-black font-bold text-white py-2 px-4 rounded-md transition-color hover:cursor-pointer`}
                >
                  Cancel
                </div>
                <button
                  type="submit"
                  className={`w-fit bg-[#8D0000] font-bold text-white py-2 px-4 rounded-md transition-color hover:cursor-pointer`}
                >
                  {loading ? (
                    <ClipLoader loading={loading} size={20} color="white" />
                  ) : (
                    <p>Continue</p>
                  )}
                </button>
              </div>
            </form>
          </div>
        );
    }
  }

  return <div className="max-w-xl m-auto h-screen flex flex-col justify-center">{render()}</div>;
}
