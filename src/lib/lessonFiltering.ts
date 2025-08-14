// src/lib/lessonFiltering.ts

import { supabase } from './supabase';
import { type UserProfile } from './auth';
import { type Lesson } from '../app/dashboard/page';

export interface ContentAccess {
  canAccessESL: boolean;
  canAccessCLIL: boolean;
}

export interface ProgressionData {
  total_completed: number;
  available_lessons: number;
  unlock_rate: number;
  weeks_since_join: number;
  current_week: number;
  days_until_next_unlock: number;
  lessons_needed_for_unlock: number;
  is_caught_up: boolean;
}

export interface FilterOptions {
  contentType?: string;
  level?: string;
  language?: string;
}

/**
 * Calculate user progression data based on join date, completion, and current content
 */
export const calculateProgressionData = async (
  userId: string, 
  userProfile: UserProfile | null
): Promise<ProgressionData> => {
  try {
    const { data: completedLessons, error: progressError } = await supabase
  .from('user_progress')
  .select(`
    lesson_id, 
    is_completed,
    lessons!inner(week_number)
  `)
  .eq('user_id', userId)
  .eq('is_completed', true);

if (progressError) throw progressError;

// Only count regular lessons (weeks 1-998) for progression, NOT samples (week 999)
const totalCompleted = completedLessons?.filter((progress: any) => 
  progress.lessons?.week_number !== 999
).length || 0;
    const joinDate = new Date(userProfile?.created_at || new Date());
    const currentDate = new Date();
    const weeksSinceJoin = Math.floor((currentDate.getTime() - joinDate.getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1;

    const { data: latestLesson } = await supabase
      .from('lessons')
      .select('week_number')
      .eq('is_published', true)
      .order('week_number', { ascending: false })
      .limit(1)
      .single();

    const currentWeek = latestLesson?.week_number || 1;
    const starterPack = 5;
    let availableLessons = starterPack;
    const weeksBehind = currentWeek - weeksSinceJoin;
    const unlockRate = weeksBehind > 4 ? 2 : 1;
    const additionalWeeks = Math.max(0, weeksSinceJoin - 1);
    availableLessons += additionalWeeks * unlockRate;
    availableLessons = Math.min(availableLessons, currentWeek);

    const lessonsNeededForUnlock = Math.max(0, availableLessons - 3 - totalCompleted);
    const canUnlockMore = lessonsNeededForUnlock === 0;

    const nextMonday = new Date();
    nextMonday.setDate(nextMonday.getDate() + (7 - nextMonday.getDay() + 1) % 7);
    const daysUntilNextUnlock = Math.ceil((nextMonday.getTime() - currentDate.getTime()) / (24 * 60 * 60 * 1000));

    const isCaughtUp = availableLessons >= currentWeek - 2;

    return {
      total_completed: totalCompleted,
      available_lessons: canUnlockMore ? availableLessons : totalCompleted + 3,
      unlock_rate: unlockRate,
      weeks_since_join: weeksSinceJoin,
      current_week: currentWeek,
      days_until_next_unlock: daysUntilNextUnlock,
      lessons_needed_for_unlock: lessonsNeededForUnlock,
      is_caught_up: isCaughtUp
    };

  } catch (error) {
    console.error('Error calculating progression:', error);
    return {
      total_completed: 0,
      available_lessons: 5,
      unlock_rate: 1,
      weeks_since_join: 1,
      current_week: 1,
      days_until_next_unlock: 7,
      lessons_needed_for_unlock: 0,
      is_caught_up: false
    };
  }
};

/**
 * Load lessons filtered at database level for specific user
 */
export const loadLessonsForUser = async (
  userProfile: UserProfile | null,
  contentAccess: ContentAccess,
  progressionData: ProgressionData,
  admin: boolean = false
): Promise<Lesson[]> => {
  try {
    // ADMIN: Get everything
    if (admin) {
      const { data, error } = await supabase
        .from('lessons')
        .select('*')
        .eq('is_published', true)
        .order('week_number', { ascending: true });

      if (error) throw error;
      return data || [];
    }

    // FREE USERS: Only samples
    if (!contentAccess.canAccessESL && !contentAccess.canAccessCLIL) {
      const { data, error } = await supabase
        .from('lessons')
        .select('*')
        .eq('is_published', true)
        .eq('week_number', 999) // Only samples
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    }

    // PAID USERS: Build dynamic query
    let query = supabase
      .from('lessons')
      .select('*')
      .eq('is_published', true);

    // Content type filtering
    const contentTypes = [];
    if (contentAccess.canAccessESL) contentTypes.push('esl');
    if (contentAccess.canAccessCLIL) contentTypes.push('clil');
    
    if (contentTypes.length > 0) {
      query = query.in('content_type', contentTypes);
    }

    // Language filtering for CLIL
    if (contentAccess.canAccessCLIL && userProfile?.language_support) {
      // For CLIL users, filter by their language OR ESL content
      if (contentAccess.canAccessESL) {
        // Complete plan: ESL (any language) + CLIL (user's language)
        query = query.or(
          `content_type.eq.esl,and(content_type.eq.clil,language_support.eq.${userProfile.language_support})`
        );
      } else {
        // CLIL only: Just user's language
        query = query.eq('language_support', userProfile.language_support);
      }
    }

    // Level filtering
    if (userProfile?.preferred_level && userProfile.preferred_level !== 'both') {
      query = query.eq('level', userProfile.preferred_level);
    }

    // Week number filtering (samples + progression limit)
    const maxWeek = Math.max(progressionData.current_week, 999); // Include samples
    query = query.lte('week_number', maxWeek);

    // Order: Regular lessons first (newest), then samples
    query = query.order('week_number', { ascending: false });

    const { data, error } = await query;

    if (error) throw error;

    let lessons = data || [];

    // Apply progression limits to regular lessons only
    const regularLessons = lessons.filter(l => l.week_number !== 999);
    const samples = lessons.filter(l => l.week_number === 999);
    
    // Limit regular lessons by progression
    const limitedRegular = regularLessons
      .sort((a, b) => a.week_number - b.week_number) // Oldest first for progression
      .slice(0, progressionData.available_lessons);

    // Combine limited regular + all samples
    return [...limitedRegular, ...samples];

  } catch (error) {
    console.error('Error loading lessons for user:', error);
    return [];
  }
};

/**
 * Main filtering function - applies all business logic for lesson visibility
 */
export const filterLessonsForUser = (
  allLessons: Lesson[],
  userProfile: UserProfile | null,
  contentAccess: ContentAccess,
  progressionData: ProgressionData,
  admin: boolean = false,
  manualFilters: FilterOptions = {}
): Lesson[] => {
  let filteredLessons = [...allLessons];

  // ADMIN MODE: Skip all filtering
  if (admin) {
    return applyManualFilters(filteredLessons, manualFilters);
  }

  // STEP 1: Apply subscription-based filtering
  if (!contentAccess.canAccessESL && !contentAccess.canAccessCLIL) {
    // Free plan - show ALL samples (999 week_number) regardless of content type/level
    filteredLessons = filteredLessons.filter(lesson => lesson.week_number === 999);
  } else {
    // Paid users - filter by subscription + separate samples from regular lessons
    const sampleLessons = filteredLessons.filter(lesson => lesson.week_number === 999);
    const regularLessons = filteredLessons.filter(lesson => lesson.week_number !== 999);

    // Filter regular lessons by subscription
    let allowedRegularLessons = regularLessons;
    if (contentAccess.canAccessESL && contentAccess.canAccessCLIL) {
      // Complete plan - show ESL + CLIL with language filtering
      const userLanguageSupport = userProfile?.language_support || 'en';
      allowedRegularLessons = regularLessons.filter(lesson => {
        if (lesson.content_type === 'esl') {
          return true; // Always show ESL
        } else if (lesson.content_type === 'clil') {
          return lesson.language_support === userLanguageSupport; // Filter CLIL by language
        }
        return false;
      });
    } else if (contentAccess.canAccessESL) {
      // ESL only
      allowedRegularLessons = regularLessons.filter(l => l.content_type === 'esl');
    } else if (contentAccess.canAccessCLIL) {
      // CLIL Plus - filter by user's language support
      const userLanguageSupport = userProfile?.language_support || 'en';
      allowedRegularLessons = regularLessons.filter(l => 
        l.content_type === 'clil' && l.language_support === userLanguageSupport
      );
    }

    // Apply progression limits only to regular lessons
    const limitedRegularLessons = allowedRegularLessons
      .sort((a, b) => a.week_number - b.week_number)
      .slice(0, progressionData.available_lessons);

    // For samples: keep ALL languages for marketing, but they'll be level-filtered later
    // Combine samples + limited regular lessons
    filteredLessons = [...sampleLessons, ...limitedRegularLessons];
  }

  // STEP 2: Apply level filtering for ALL users (including samples)
  if (userProfile?.preferred_level && userProfile.preferred_level !== 'both') {
    filteredLessons = filteredLessons.filter(l => l.level === userProfile.preferred_level);
  }

  // STEP 3: Apply manual filters (but respect subscription limits)
  filteredLessons = applyManualFilters(filteredLessons, manualFilters);

  // STEP 4: Sort - Regular lessons first (newest to oldest), then samples at bottom
  filteredLessons.sort((a, b) => {
    const aIsSample = a.week_number === 999;
    const bIsSample = b.week_number === 999;
    
    // Regular lessons come first
    if (!aIsSample && bIsSample) return -1;
    if (aIsSample && !bIsSample) return 1;
    
    // Both regular lessons: sort by week descending (newest first)
    if (!aIsSample && !bIsSample) return b.week_number - a.week_number;
    
    // Both samples: maintain existing order
    return 0;
  });

  return filteredLessons;
};

/**
 * Get available filter options based on user's subscription
 */
export const getAvailableFilterOptions = (
  contentAccess: ContentAccess,
  admin: boolean = false
) => {
  if (admin) {
    return {
      contentTypes: ['all', 'esl', 'clil'],
      levels: ['all', 'beginner', 'intermediate'],
      languages: ['all', 'english', 'czech', 'german', 'french', 'spanish', 'polish']
    };
  }

  if (!contentAccess) {
    return { contentTypes: ['all'], levels: ['all'], languages: ['all'] };
  }

  const options = {
    contentTypes: ['all'],
    levels: ['all', 'beginner', 'intermediate'],
    languages: ['all']
  };

  // Content type options based on subscription
  if (contentAccess.canAccessESL && contentAccess.canAccessCLIL) {
    options.contentTypes = ['all', 'esl', 'clil'];
    options.languages = ['all', 'english', 'czech', 'german', 'french', 'spanish', 'polish'];
  } else if (contentAccess.canAccessESL) {
    options.contentTypes = ['all', 'esl'];
    options.languages = ['all', 'english'];
  } else if (contentAccess.canAccessCLIL) {
    options.contentTypes = ['all', 'clil'];
    options.languages = ['all', 'czech', 'german', 'french', 'spanish', 'polish'];
  } else {
    // Free users see all sample content
    options.contentTypes = ['all', 'esl', 'clil'];
    options.languages = ['all', 'english', 'czech', 'german', 'french', 'spanish', 'polish'];
  }

  return options;
};

/**
 * Debug logging helper for filtering results
 */
export const logFilteringDebug = (
  userProfile: UserProfile | null,
  contentAccess: ContentAccess,
  allLessons: Lesson[],
  filteredLessons: Lesson[],
  progressionData: ProgressionData,
  component: string = 'Unknown'
) => {
  console.log(`🔍 ${component} filtering debug:`, {
    userProfile: {
      subscription_tier: userProfile?.subscription_tier,
      language_support: userProfile?.language_support,
      preferred_level: userProfile?.preferred_level
    },
    access: contentAccess,
    totalLessons: allLessons.length,
    filteredCount: filteredLessons.length,
    samples: filteredLessons.filter(l => l.week_number === 999).length,
    regular: filteredLessons.filter(l => l.week_number !== 999).length,
    progressionLimit: progressionData.available_lessons,
    samplePreview: filteredLessons.filter(l => l.week_number === 999).slice(0, 3).map(l => ({
      title: l.title.substring(0, 30) + '...',
      content_type: l.content_type,
      language_support: l.language_support,
      level: l.level
    }))
  });
};

/**
 * Apply manual filter selections (dropdowns on lessons page)
 */
export const applyManualFilters = (
  lessons: Lesson[], 
  filters: FilterOptions
): Lesson[] => {
  let filtered = [...lessons];

  if (filters.contentType && filters.contentType !== 'all') {
    filtered = filtered.filter(l => l.content_type === filters.contentType);
  }

  if (filters.level && filters.level !== 'all') {
    filtered = filtered.filter(l => l.level === filters.level);
  }

  if (filters.language && filters.language !== 'all') {
    const languageMap: { [key: string]: string } = {
      'english': 'English',
      'czech': 'Czech',
      'german': 'German',
      'french': 'French',
      'spanish': 'Spanish',
      'polish': 'Polish'
    };
    const targetLanguage = languageMap[filters.language] || filters.language;
    filtered = filtered.filter(l => l.language_support === targetLanguage);
  }

  return filtered;
};