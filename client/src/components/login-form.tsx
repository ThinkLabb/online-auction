import { useState } from 'react';
import { useForm, SubmitHandler } from "react-hook-form";
import { z } from 'zod'
import { ClipLoader } from "react-spinners"
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate } from 'react-router-dom';
import { useUser } from '../UserContext';

const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,30}$/;

const schema = z.object({
    email: z.string().email({ message: "Invalid email format" }),
    password: z.string().regex(strongPasswordRegex, { message: "Password must contain uppercase, lowercase, number, and special character (!@#$%^&*)" })
})

type Inputs = z.infer<typeof schema>;

export default function LogIn() {
    const [loading, setLoading] = useState(false)
    const { setUser } = useUser();
    const navigate = useNavigate()

    const {
        register,
        handleSubmit,
        formState: { errors },
        setError
    } = useForm<Inputs>({
        resolver: zodResolver(schema)
    })

    const onSubmit: SubmitHandler<Inputs> = async (data) => {
        setLoading(true)
        try {
            const res = await fetch('/api/auth/signin', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: data.email,
                    password: data.password
                }),
            });

            const result = await res.json();

            if (!res.ok) {
                if (!result.success) {
                    // Xử lý lỗi từ server (Email không tồn tại hoặc sai Password)
                    if (result.message?.email) {
                        setError('email', { message: result.message.email });
                    }
                    if (result.message?.password) {
                        setError('password', { message: result.message.password });
                    }
                    // Thêm kiểm tra lỗi chung nếu server trả về lỗi không cụ thể
                    if (typeof result.message === 'string') {
                        // Ví dụ: setError('root.serverError', { message: result.message });
                        console.error("Server Error:", result.message);
                    }
                }
            } else {
                // Đăng nhập thành công
                setUser({
                    name: result.data.name,
                    email: result.data.email,
                });
                navigate('/');
            }
        } catch (err) {
            console.error('[v0] Login error:', err);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className='p-4 sm:p-8 border border-gray-200 shadow-lg rounded-lg bg-white w-full max-w-sm mx-auto'>
            <form onSubmit={handleSubmit(onSubmit)} className='flex flex-col gap-4'>

                {/* 1. Email */}
                <div className='flex flex-col gap-2'>
                    <label htmlFor="email" className="font-semibold text-gray-900">Email</label>
                    <input 
                        type="text" 
                        id="email" 
                        placeholder='your@example.com' 
                        {...register("email", { required: true })} 
                        className='w-full px-3 py-2 border rounded-md focus:outline-2 focus:outline-[#8D0000]'
                    />
                    {errors.email && <span className='text-[#8D0000]'>{errors.email.message}</span>}
                </div>

                {/* 2. Password */}
                <div className='flex flex-col gap-2'>
                    <label htmlFor="password" className="font-semibold text-gray-900">Password</label>
                    <input 
                        type="password" 
                        id="password" 
                        placeholder='********' 
                        {...register("password", { required: true })} 
                        className='w-full px-3 py-2 border rounded-md focus:outline-2 focus:outline-[#8D0000]'
                    />
                    {errors.password && <span className='text-[#8D0000]'>{errors.password.message}</span>}
                </div>

                {/* Forgot Password Link */}
                <div className='mb-0 flex flex-row justify-end'>
                    <Link
                        to="/forgotpassword"
                        className="font-semibold text-blue-600 hover:text-blue-700 transition-colors" 
                    >
                        Forgot password?
                    </Link>
                </div>

                {/* Submit Button */}
                <button 
                    type="submit" 
                    disabled={loading}
                    className={`w-full bg-[#8D0000] font-bold text-white py-2.5 rounded-md transition-colors mt-2 flex justify-center items-center ${loading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-red-800'}`}
                >
                    {loading ? <ClipLoader loading={loading} size={20} color='white' /> : <p>Sign In</p>}
                </button>

                {/* Register Link */}
                <p className="text-center text-gray-600"> 
                    Don't have an account?{' '}
                    <Link
                        to="/register"
                        className="font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                    >
                        Register now
                    </Link>
                </p>
            </form>
        </div>
    );
}