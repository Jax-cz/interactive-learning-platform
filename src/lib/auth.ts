// src/lib/auth.ts
import { supabase } from './supabase'

export type AuthUser = {
  id: string
  email: string
  email_verified: boolean
  created_at: string
}

export type UserProfile = {
  id: string
  email: string
  preferred_content_type: 'esl' | 'clil' | 'both' | null
  preferred_level: 'beginner' | 'intermediate' | 'both' | null
  preferred_language: string
  subscription_tier: 'free' | 'esl_only' | 'clil_only' | 'clil_plus' | 'complete_plan'
  subscription_status: 'active' | 'inactive' | 'cancelled' | 'past_due'
  onboarding_completed: boolean
  created_at: string
  last_level_change: string | null
  level_change_count: number
}

// Sign up new user
// Updated signUp function - replace the existing one in src/lib/auth.ts

export async function signUp(email: string, password: string) {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`
      }
    })

    if (error) throw error

    // Create user profile in our users table
    if (data.user) {
      console.log('Creating profile for user:', data.user.id); // Debug log
      
      const { error: profileError } = await supabase
        .from('users')
        .upsert({
          id: data.user.id,
          email: data.user.email!,
          email_verified: false,
          onboarding_completed: false,
          preferred_content_type: 'esl',
          preferred_level: 'beginner', 
          preferred_language: 'en',
          subscription_tier: 'free',
          subscription_status: 'inactive',
          notifications_enabled: true,
          last_level_change: null,
          level_change_count: 0,
          free_trial_days: 0,
          timezone: 'UTC'
        }, { 
          onConflict: 'id',
          ignoreDuplicates: false 
        })

      if (profileError) {
        console.error('Profile creation error:', profileError)
        // Don't fail registration, but log the detailed error
        console.error('Profile error details:', {
          message: profileError.message,
          details: profileError.details,
          hint: profileError.hint,
          code: profileError.code
        })
      } else {
        console.log('Profile created successfully!'); // Debug log
      }
    }

    return { user: data.user, error: null }
  } catch (error: any) {
    console.error('SignUp error:', error); // Debug log
    return { user: null, error: error.message }
  }
}

// Sign in existing user
export async function signIn(email: string, password: string, rememberMe: boolean = false) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
      options: {
        // Set session persistence based on "Remember Me"
        // true = session persists until explicitly signed out (30+ days)
        // false = session expires when browser closes
        ...(rememberMe && {
          redirectTo: undefined, // Don't redirect automatically
          captchaToken: undefined,
        })
      }
    })

    if (error) throw error

    // Set session persistence in browser
    if (rememberMe) {
      // Store preference for long-term session
      localStorage.setItem('rememberMe', 'true')
    } else {
      // Remove any existing preference
      localStorage.removeItem('rememberMe')
    }

    return { user: data.user, error: null }
  } catch (error: any) {
    return { user: null, error: error.message }
  }
}

// Get current user
export async function getCurrentUser() {
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error) throw error
    return { user, error: null }
  } catch (error: any) {
    return { user: null, error: error.message }
  }
}

// Get user profile from our users table
export async function getUserProfile(userId: string): Promise<{ profile: UserProfile | null, error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) throw error

    return { profile: data, error: null }
  } catch (error: any) {
    return { profile: null, error: error.message }
  }
}

// Update user profile
export async function updateUserProfile(userId: string, updates: Partial<UserProfile>) {
  try {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single()

    if (error) throw error

    return { profile: data, error: null }
  } catch (error: any) {
    return { profile: null, error: error.message }
  }
}

// Reset password
export async function resetPassword(email: string) {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`
    })

    if (error) throw error

    return { error: null }
  } catch (error: any) {
    return { error: error.message }
  }
}

// Update password
export async function updatePassword(newPassword: string) {
  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    })

    if (error) throw error

    return { error: null }
  } catch (error: any) {
    return { error: error.message }
  }
}

// Check if user has active subscription
export async function hasActiveSubscription(userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('subscription_status, subscription_tier')
      .eq('id', userId)
      .single()

    if (error || !data) return false

    return data.subscription_status === 'active' && data.subscription_tier !== 'free'
  } catch (error) {
    return false
  }
}

// Get user's content access permissions
export async function getContentAccess(userId: string) {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('subscription_tier, subscription_status, preferred_content_type, preferred_level, preferred_language')
      .eq('id', userId)
      .single()

    if (error || !data) {
      return {
        canAccessESL: false,
        canAccessCLIL: false,
        canAccessLanguageSupport: false,
        preferredContentType: null,
        preferredLevel: null,
        preferredLanguage: 'en'
      }
    }

    const hasActiveSubscription = data.subscription_status === 'active'
    const tier = data.subscription_tier

    return {
      canAccessESL: hasActiveSubscription && (tier === 'esl_only' || tier === 'complete_plan'),
      canAccessCLIL: hasActiveSubscription && (tier === 'clil_only' || tier === 'clil_plus' || tier === 'complete_plan'),
      canAccessLanguageSupport: hasActiveSubscription && (tier === 'clil_plus' || tier === 'complete_plan'),
      preferredContentType: data.preferred_content_type,
      preferredLevel: data.preferred_level,
      preferredLanguage: data.preferred_language
    }
  } catch (error) {
    return {
      canAccessESL: false,
      canAccessCLIL: false,
      canAccessLanguageSupport: false,
      preferredContentType: null,
      preferredLevel: null,
      preferredLanguage: 'en'
    }
  }
}

// Check if user has "Remember Me" preference
export function hasRememberMePreference(): boolean {
  if (typeof window === 'undefined') return false
  return localStorage.getItem('rememberMe') === 'true'
}

// Session management utilities
export async function refreshSession() {
  try {
    const { data, error } = await supabase.auth.refreshSession()
    if (error) throw error
    return { session: data.session, error: null }
  } catch (error: any) {
    return { session: null, error: error.message }
  }
}

// Check session validity
export async function isSessionValid() {
  try {
    const { data: { session }, error } = await supabase.auth.getSession()
    if (error) throw error
    
    if (!session) return false
    
    // Check if session is expired
    const now = new Date().getTime()
    const expiresAt = new Date(session.expires_at || 0).getTime()
    
    return now < expiresAt
  } catch (error) {
    return false
  }
}

// Enhanced sign out with session cleanup
export async function signOut() {
  try {
    // Clear remember me preference
    if (typeof window !== 'undefined') {
      localStorage.removeItem('rememberMe')
    }
    
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    return { error: null }
  } catch (error: any) {
    return { error: error.message }
  }
}

// Check if user can change level (once per week limit)
export async function canChangeLevel(userId: string): Promise<{ canChange: boolean, daysUntilNext: number }> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('last_level_change')
      .eq('id', userId)
      .single()

    if (error || !data) return { canChange: true, daysUntilNext: 0 }

    if (!data.last_level_change) return { canChange: true, daysUntilNext: 0 }

    const lastChange = new Date(data.last_level_change)
    const now = new Date()
    const daysSinceChange = Math.floor((now.getTime() - lastChange.getTime()) / (1000 * 60 * 60 * 24))
    const cooldownDays = 7

    return {
      canChange: daysSinceChange >= cooldownDays,
      daysUntilNext: Math.max(0, cooldownDays - daysSinceChange)
    }
  } catch (error) {
    return { canChange: false, daysUntilNext: 7 }
  }
}

// Change user level with cooldown enforcement
export async function changeUserLevel(userId: string, newLevel: 'beginner' | 'intermediate' | 'both') {
  try {
    // Check if change is allowed
    const { canChange, daysUntilNext } = await canChangeLevel(userId)
    
    if (!canChange) {
      return { 
        success: false, 
        error: `You can change your level in ${daysUntilNext} days` 
      }
    }

    // Update user level and track the change
    const { data, error } = await supabase
      .from('users')
      .update({
        preferred_level: newLevel,
        last_level_change: new Date().toISOString(),
        level_change_count: 1
      })
      .eq('id', userId)
      .select()
      .single()

    if (error) throw error

    return { success: true, error: null, profile: data }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}