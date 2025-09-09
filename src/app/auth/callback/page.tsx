'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

// Loading component for Suspense fallback
function LoadingFallback() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mb-4">
              <svg className="animate-spin h-6 w-6 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Loading...
            </h2>
            <p className="text-gray-600">
              Please wait while we initialize the authentication process.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper function to parse URL fragments (after #) - capture immediately
function captureFragmentParams(): Record<string, string> {
  const params: Record<string, string> = {};
  
  if (typeof window === 'undefined') return params;
  
  const fragment = window.location.hash;
  if (!fragment) return params;
  
  // Remove leading # if present
  const cleanFragment = fragment.startsWith('#') ? fragment.slice(1) : fragment;
  
  // Split by & and parse key=value pairs
  cleanFragment.split('&').forEach(pair => {
    const [key, value] = pair.split('=');
    if (key && value !== undefined) {
      params[key] = decodeURIComponent(value.replace(/\+/g, ' '));
    }
  });
  
  console.log('🔍 Captured fragment params:', params);
  console.log('🔍 Raw fragment:', fragment);
  
  return params;
}

// Component that uses useSearchParams - must be wrapped in Suspense
function AuthCallbackContent() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Capture fragment params FIRST before Supabase processes the URL
        const fragmentParams = captureFragmentParams();
        
        // Let Supabase handle the auth callback
        const { data, error: authError } = await supabase.auth.getSession();
        
        console.log('🔍 Supabase session data:', data);
        console.log('🔍 Supabase auth error:', authError);
        
        // Get URL search parameters (after ?)
        const type = searchParams?.get('type');
        const errorParam = searchParams?.get('error');
        const errorDescription = searchParams?.get('error_description');
        
        // Combine search params and fragment params
        const finalType = type || fragmentParams.type;
        const finalError = errorParam || fragmentParams.error;
        const finalErrorDescription = errorDescription || fragmentParams.error_description;
        const errorCode = fragmentParams.error_code;
        
        console.log('🔍 Search params:', Object.fromEntries(searchParams?.entries() || []));
        console.log('🔍 Final type:', finalType);
        console.log('🔍 Final error:', finalError);
        console.log('🔍 Error code:', errorCode);

        // PRIORITY 1: Handle password recovery FIRST (before checking session)
        if (finalType === 'recovery' || fragmentParams.type === 'recovery') {
          console.log('🔍 Password recovery detected - PRIORITY ROUTE');
          console.log('🔍 Fragment access token:', !!fragmentParams.access_token);
          console.log('🔍 Session access token:', !!data.session?.access_token);
          
          // For password recovery, we need some form of valid token
          if (fragmentParams.access_token || data.session?.access_token) {
            console.log('✅ Valid recovery tokens found, redirecting to reset password');
            setSuccess('Password reset link verified. You must set a new password to continue...');
            setLoading(false);
            setTimeout(() => {
              router.push('/auth/reset-password');
            }, 1500);
            return;
          } else {
            console.log('❌ Recovery type detected but no valid tokens');
            setError('The password reset link has expired or is invalid. Please request a new one.');
            setLoading(false);
            return;
          }
        }

        // PRIORITY 2: Handle errors
        if (finalError) {
          console.log('🔍 Error detected:', finalError);
          if (finalError === 'access_denied') {
            if (errorCode === 'otp_expired' || finalErrorDescription?.includes('expired')) {
              setError('The email link has expired. Please request a new password reset.');
            } else if (errorCode === 'otp_invalid' || finalErrorDescription?.includes('invalid')) {
              setError('The email link is invalid. Please request a new password reset.');
            } else {
              setError(finalErrorDescription || 'Authentication failed. Please try again.');
            }
          } else {
            setError(finalErrorDescription || 'Authentication failed. Please try again.');
          }
          setLoading(false);
          return;
        }

        // PRIORITY 3: Handle email confirmation
        if (finalType === 'signup') {
          console.log('🔍 Email confirmation detected');
          setSuccess('Email confirmed! Welcome to your learning dashboard...');
          setLoading(false);
          setTimeout(() => {
            router.push('/dashboard');
          }, 2000);
          return;
        }

        // PRIORITY 4: Handle regular sessions (lowest priority)
        if (data.session?.access_token) {
          console.log('✅ Regular session found, redirecting to dashboard');
          router.push('/dashboard');
          return;
        }

        // DEFAULT: No valid session or type
        console.log('🔍 No valid session or type, redirecting to login');
        router.push('/login');
        
      } catch (err: any) {
        console.error('❌ Callback handling error:', err);
        setError('Something went wrong. Please try again.');
        setLoading(false);
      }
    };

    // Run immediately without delay
    handleAuthCallback();
  }, [router, searchParams]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mb-4">
                <svg className="animate-spin h-6 w-6 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Processing Authentication...
              </h2>
              <p className="text-gray-600">
                Please wait while we verify your authentication.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Authentication Error
              </h2>
              <p className="text-gray-600 mb-6">
                {error}
              </p>
              <div className="space-y-3">
                <Link
                  href="/auth/forgot-password"
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                  Request New Reset Link
                </Link>
                <Link
                  href="/login"
                  className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                  Go to Login
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
                Success!
              </h2>
              <p className="text-gray-600 mb-6">
                {success}
              </p>
              <p className="text-sm text-gray-500">
                Redirecting you automatically...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

// Main component with Suspense boundary
export default function AuthCallback() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <AuthCallbackContent />
    </Suspense>
  );
}