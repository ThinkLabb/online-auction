import { useState } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { Link, useNavigate } from 'react-router-dom';

const ACCENT_COLOR = '#8D0000';

const strongPasswordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,30}$/;

const validationSchema = Yup.object().shape({
  name: Yup.string()
    .required('Name is required')
    .min(3, 'Name must be at least 3 characters')
    .max(8, 'Name must not exceed 8 characters'),
  email: Yup.string().email('Please enter a valid email').required('Email is required'),
  password: Yup.string()
    .required('Password is required')
    .min(8, 'Password must be at least 8 characters')
    .max(30, 'Password must not exceed 30 characters')
    .matches(
      strongPasswordRegex,
      'Password must contain uppercase, lowercase, number, and special character (!@#$%^&*)'
    ),
  confirmPassword: Yup.string()
    .required('Confirming password is required')
    .oneOf([Yup.ref('password')], 'Confirmation password does not match'), // Must match the password field
});

export default function RegisterForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const navigate = useNavigate();

  const formik = useFormik({
    initialValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
    validationSchema,
    onSubmit: async (values) => {
      setIsLoading(true);
      setError(null);
      setSuccess(false);
      const { confirmPassword, ...submitValues } = values;

      try {
        const response = await fetch('http://localhost:8000/api/auth/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(submitValues),
        });

        const data = await response.json();

        if (!response.ok) {
          const serverMessage =
            data.message || (data.errors && data.errors[0].msg) || 'Registration failed';
          throw new Error(serverMessage);
        }

        setSuccess(true);
       
        console.log('[v0] Registration successful:', data);
        formik.resetForm();
        navigate('/signin');
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Registration failed';
        setError(errorMessage);
        console.error('[v0] Registration error:', err);
      } finally {
        setIsLoading(false);
      }
    },
  });

  return (
    <div className="p-8 border border-gray-200 shadow-lg rounded-lg bg-white">
      {/* Error Message */}
      {error && (
        <div
          className={`mb-4 p-3 bg-red-100 border border-[${ACCENT_COLOR}] text-[${ACCENT_COLOR}] rounded-md text-sm`}
        >
          {error}
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded-md text-sm">
          Registration successful! Redirecting...
        </div>
      )}

      <form onSubmit={formik.handleSubmit} className="space-y-6">
        {/* Full Name */}
        <div className="space-y-2.5">
          <label htmlFor="name" className="text-sm font-semibold text-gray-900">
            Full Name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            placeholder="John Doe"
            value={formik.values.name}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[${ACCENT_COLOR}] transition-colors ${
              formik.touched.name && formik.errors.name
                ? `border-[${ACCENT_COLOR}] focus:ring-[${ACCENT_COLOR}]`
                : 'border-gray-300'
            }`}
            disabled={isLoading}
          />
          {formik.touched.name && formik.errors.name && (
            <p className={`text-xs font-medium text-[${ACCENT_COLOR}]`}>{formik.errors.name}</p>
          )}
        </div>

        {/* Email Field */}
        <div className="space-y-2.5">
          <label htmlFor="email" className="text-sm font-semibold text-gray-900">
            Email Address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            placeholder="you@example.com"
            value={formik.values.email}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[${ACCENT_COLOR}] transition-colors ${
              formik.touched.email && formik.errors.email
                ? `border-[${ACCENT_COLOR}] focus:ring-[${ACCENT_COLOR}]`
                : 'border-gray-300'
            }`}
            disabled={isLoading}
          />
          {formik.touched.email && formik.errors.email && (
            <p className={`text-xs font-medium text-[${ACCENT_COLOR}]`}>{formik.errors.email}</p>
          )}
        </div>

        {/* Password Field */}
        <div className="space-y-2.5">
          <label htmlFor="password" className="text-sm font-semibold text-gray-900">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            placeholder="••••••••"
            value={formik.values.password}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[${ACCENT_COLOR}] transition-colors ${
              formik.touched.password && formik.errors.password
                ? `border-[${ACCENT_COLOR}] focus:ring-[${ACCENT_COLOR}]`
                : 'border-gray-300'
            }`}
            disabled={isLoading}
          />
          {formik.touched.password && formik.errors.password && (
            <p className={`text-xs font-medium text-[${ACCENT_COLOR}]`}>{formik.errors.password}</p>
          )}
          <p className="text-xs text-gray-500">
            At least 8 characters with uppercase, lowercase, number, and special character
          </p>
        </div>

        {/* Confirm Password Field */}
        <div className="space-y-2.5">
          <label htmlFor="confirmPassword" className="text-sm font-semibold text-gray-900">
            Confirm Password
          </label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            placeholder="••••••••"
            value={formik.values.confirmPassword}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[${ACCENT_COLOR}] transition-colors ${
              formik.touched.confirmPassword && formik.errors.confirmPassword
                ? `border-[${ACCENT_COLOR}] focus:ring-[${ACCENT_COLOR}]`
                : 'border-gray-300'
            }`}
            disabled={isLoading}
          />
          {formik.touched.confirmPassword && formik.errors.confirmPassword && (
            <p className={`text-xs font-medium text-[${ACCENT_COLOR}]`}>
              {formik.errors.confirmPassword}
            </p>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className={`w-full bg-[#8D0000] hover:bg-[#A80000] font-bold text-white py-2.5 mt-8 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
          disabled={isLoading || !formik.isValid}
        >
          {isLoading ? 'Creating Account...' : 'Create Account'}
        </button>

        {/* Sign In Link */}
        <p className="text-center text-sm text-gray-600">
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
