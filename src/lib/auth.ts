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
  language_support: string
  subscription_tier: 'free' | 'esl_only' | 'clil_plus' | 'complete_plan'
  subscription_status: 'active' | 'inactive' | 'cancelled' | 'past_due'
  onboarding_completed: boolean
  created_at: string
  last_level_change: string | null
  level_change_count: number
}

// Clean sign up function with proper error handling
export async function signUp(email: string, password: string) {
  try {
    console.log('🚀 Starting registration for:', email);

    // Step 1: Create Supabase auth user
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/login` // Instead of /auth/callback
      }
    })

    if (error) {
      console.error('❌ Auth signup error:', error);
      throw error;
    }

    if (!data.user) {
      throw new Error('User creation failed - no user returned');
    }

    console.log('✅ Auth user created:', data.user.id);

    // Step 2: Create user profile in our users table
    const profileData = {
      id: data.user.id,
      email: data.user.email!,
      email_verified: false,
      onboarding_completed: false,
      preferred_content_type: 'both',    // Shows ESL + CLIL samples  
preferred_level: 'both',           // Shows beginner + intermediate samples
      language_support: null,
      subscription_tier: 'free' as const,
      subscription_status: 'inactive' as const,
      notifications_enabled: true,
      timezone: 'UTC',
      last_level_change: null,
      level_change_count: 0,
      free_trial_days: 0,
    };

    console.log('📝 Creating profile with data:', profileData);

    const { data: profileResult, error: profileError } = await supabase
      .from('users')
      .insert(profileData)
      .select()
      .single();

    if (profileError) {
      console.error('❌ Profile creation error:', {
        message: profileError.message,
        details: profileError.details,
        hint: profileError.hint,
        code: profileError.code
      });
      
      // Don't fail the entire registration - user can still login
      console.warn('⚠️ Registration succeeded but profile creation failed');
      return { 
        user: data.user, 
        error: null,
        profileCreated: false,
        profileError: profileError.message
      };
    }

    console.log('✅ Profile created successfully:', profileResult);

    return { 
      user: data.user, 
      error: null,
      profileCreated: true
    };

  } catch (error: any) {
    console.error('💥 Registration failed:', error);
    return { 
      user: null, 
      error: error.message,
      profileCreated: false
    };
  }
}

// Sign in existing user
export async function signIn(email: string, password: string, rememberMe: boolean = false) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) throw error

    // Set session persistence in browser
    if (rememberMe) {
      localStorage.setItem('rememberMe', 'true')
    } else {
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

// Create user profile (for cases where registration succeeded but profile creation failed)
export async function createUserProfile(userId: string, email: string): Promise<{ profile: UserProfile | null, error: string | null }> {
  try {
    const profileData = {
      id: userId,
      email: email,
      email_verified: false,
      onboarding_completed: false,
      preferred_content_type: 'both',    // Shows ESL + CLIL samples
preferred_level: 'both',           // Shows beginner + intermediate samples
      language_support: null,
      subscription_tier: 'free' as const,
      subscription_status: 'inactive' as const,
      notifications_enabled: true,
      timezone: 'UTC',
      last_level_change: null,
      level_change_count: 0,
      free_trial_days: 0,
    };

    const { data, error } = await supabase
      .from('users')
      .insert(profileData)
      .select()
      .single();

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

// Get user's content access permissions
export async function getContentAccess(userId: string) {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('subscription_tier, subscription_status, preferred_content_type, preferred_level, language_support')
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
      canAccessCLIL: hasActiveSubscription && (tier === 'clil_plus' || tier === 'complete_plan'),
      canAccessLanguageSupport: hasActiveSubscription && (tier === 'clil_plus' || tier === 'complete_plan'),
      preferredContentType: data.preferred_content_type,
      preferredLevel: data.preferred_level,
      preferredLanguage: data.language_support
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

// Reset password
export async function resetPassword(email: string) {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
  redirectTo: `${window.location.origin}/auth/callback`
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

// Check if user has "Remember Me" preference
export function hasRememberMePreference(): boolean {
  if (typeof window === 'undefined') return false
  return localStorage.getItem('rememberMe') === 'true'
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