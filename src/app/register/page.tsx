'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signUp } from '@/lib/auth';
import { createClient } from '@supabase/supabase-js';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [promoStatus, setPromoStatus] = useState<{
    valid: boolean;
    message: string;
    details?: any;
  } | null>(null);
  const [checkingPromo, setCheckingPromo] = useState(false);
  const router = useRouter();

  // Validate promo code in real-time
  const validatePromoCode = async (code: string) => {
    if (!code.trim()) {
      setPromoStatus(null);
      return;
    }

    setCheckingPromo(true);
    try {
      const response = await fetch('/api/promo-code/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.trim() })
      });

      const result = await response.json();

      if (result.valid) {
        setPromoStatus({
          valid: true,
          message: `${code.toUpperCase()} applied: ${result.free_days} days free!`,
          details: result
        });
      } else {
        setPromoStatus({
          valid: false,
          message: result.error || 'Invalid promo code'
        });
      }
    } catch (error) {
      setPromoStatus({
        valid: false,
        message: 'Unable to validate promo code'
      });
    } finally {
      setCheckingPromo(false);
    }
  };

  // Handle promo code input changes
  const handlePromoCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const code = e.target.value;
    setPromoCode(code);
    
    // Debounced validation (validate after user stops typing)
    setTimeout(() => {
      if (e.target.value === code) { // Only validate if value hasn't changed
        validatePromoCode(code);
      }
    }, 500);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // Validation
    if (!email || !password || !confirmPassword) {
      setError('Please fill in all fields');
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    // Check if promo code is invalid (if provided)
    if (promoCode.trim() && promoStatus && !promoStatus.valid) {
      setError('Please enter a valid promo code or leave it blank');
      setLoading(false);
      return;
    }

    try {
      // Attempt registration
      const { user, error: signUpError } = await signUp(email, password);

      if (signUpError) {
        setError(signUpError);
        setLoading(false);
        return;
      }

      if (user) {
        // If promo code was provided and valid, apply it
        if (promoCode.trim() && promoStatus?.valid) {
          try {
            const applyResponse = await fetch('/api/promo-code/apply', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                code: promoCode.trim(),
                userId: user.id 
              })
            });

            const applyResult = await applyResponse.json();
            
            if (!applyResponse.ok) {
              console.warn('Promo code application failed:', applyResult.error);
              // Don't fail registration, just log the issue
            }
          } catch (promoError) {
            console.warn('Promo code application error:', promoError);
            // Don't fail registration, just log the issue
          }
        }

        setSuccess(true);
      }
    } catch (error) {
      setError('Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

 const handleGoogleSignUp = async () => {
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`
        }
      });
      
      if (error) {
        console.error('Google registration error:', error);
        setError('Failed to register with Google. Please try again.');
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      setError('Something went wrong. Please try again.');
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Registration Successful!
              </h2>
              <p className="text-gray-600 mb-4">
                We've sent you a confirmation email. Please check your inbox and click the confirmation link to activate your account.
              </p>
              {promoStatus?.valid && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                  <p className="text-green-800 text-sm font-medium">
                    🎉 {promoStatus.message}
                  </p>
                </div>
              )}
              <div className="space-y-3">
  <Link
    href="/"
    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
  >
    Back to Homepage
  </Link>
</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900">
              Create Your Account
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Join thousands of learners improving their English skills
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">
                      Registration Error
                    </h3>
                    <div className="mt-2 text-sm text-red-700">
                      {error}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            <div>
               <label htmlFor="password" className="block text-sm font-medium text-gray-700">
    Password
  </label>
  <div className="mt-1 relative">
    <input
      id="password"
      name="password"
      type={showPassword ? "text" : "password"}
      autoComplete="new-password"
      required
      value={password}
      onChange={(e) => setPassword(e.target.value)}
      className="appearance-none block w-full px-3 py-2 pr-10 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
      placeholder="Create a password"
    />
    <button
      type="button"
      onClick={() => setShowPassword(!showPassword)}
      className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
    >
      {showPassword ? (
        // Eye slash icon (hide password)
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L8.464 8.464m1.414 1.414L19.071 19.071m-9.193-9.193A3 3 0 119.878 9.878zm8.585 2.683A9.98 9.98 0 0122 12c-1.274 4.057-5.064 7-9.542 7-.847 0-1.669-.105-2.454-.303m-.273-.225L21.071 19.071" />
        </svg>
      ) : (
        // Eye icon (show password)
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
      )}
    </button>
  </div>
  <p className="mt-1 text-xs text-gray-500">
    Must be at least 6 characters long
  </p>
            </div>

            <div>
              <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700">
                Confirm Password
              </label>
              <div className="mt-1">
                <input
                  id="confirm-password"
                  name="confirm-password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Confirm your password"
                />
              </div>
            </div>

            {/* Promo Code Section */}
            <div className="border-t pt-6">
              <div className="flex items-center mb-3">
                <span className="text-sm font-medium text-gray-700">Have a promo code?</span>
                <span className="ml-2 text-xs text-gray-500">(Optional)</span>
              </div>
              
              <div className="relative">
                <input
                  id="promo-code"
                  type="text"
                  value={promoCode}
                  onChange={handlePromoCodeChange}
                  placeholder="Enter promo code"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
                {checkingPromo && (
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                    <svg className="animate-spin h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  </div>
                )}
              </div>

              {/* Promo Code Status */}
              {promoStatus && (
                <div className={`mt-2 p-3 rounded-lg text-sm ${
                  promoStatus.valid 
                    ? 'bg-green-50 border border-green-200 text-green-800' 
                    : 'bg-red-50 border border-red-200 text-red-800'
                }`}>
                  <div className="flex items-center">
                    {promoStatus.valid ? (
                      <svg className="h-4 w-4 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                      </svg>
                    ) : (
                      <svg className="h-4 w-4 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                      </svg>
                    )}
                    <span className="font-medium">{promoStatus.message}</span>
                  </div>
                  {promoStatus.valid && promoStatus.details && (
                    <div className="mt-2 text-xs">
                      <p>• {promoStatus.details.remaining_uses} uses remaining</p>
                      {promoStatus.details.description && (
                        <p>• {promoStatus.details.description}</p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div>
              <button
                type="submit"
                disabled={loading || checkingPromo}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating Account...
                  </>
                ) : (
                  <>
                    Create Account
                    {promoStatus?.valid && (
                      <span className="ml-2 text-xs bg-green-500 px-2 py-1 rounded-full">
                        +{promoStatus.details?.free_days} days free
                      </span>
                    )}
                  </>
                )}
              </button>
            </div>

  {/* Google Registration Section */}
            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Or continue with</span>
                </div>
              </div>

              <div className="mt-6">
                <button
                  type="button"
                  onClick={handleGoogleSignUp}
                  className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 transition-colors"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  <span className="ml-2">Sign up with Google</span>
                </button>
              </div>
            </div>

            <div className="text-center">
              <p className="text-sm text-gray-600">
                Already have an account?{' '}
                <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
                  Sign in here
                </Link>
              </p>
            </div>
          </form>
        </div>

        <div className="text-center">
          <Link
            href="/"
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            ← Back to Homepage
          </Link>
        </div>
      </div>
    </div>
  );
}