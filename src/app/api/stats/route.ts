import { NextRequest } from 'next/server'
import { createSupabaseServerClient, isSupabaseConfigured } from '@/lib/supabase/server'
import { apiSuccess, apiError, dbErrorMessage } from '@/lib/api-response'

export async function GET(_request: NextRequest) {
  try {
    if (!isSupabaseConfigured()) {
      return apiError('CONFIG_ERROR', 'Supabase is not configured', 500)
    }
    const supabase = await createSupabaseServerClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return apiError('UNAUTHENTICATED', 'Authentication required', 401)
    }

    const [profileRes, questsRes, completionsRes, soldiersRes] = await Promise.all([
      supabase.from('users_profile').select('*').eq('id', user.id).single(),
      supabase.from('quests').select('id,status,quest_type,xp_reward,gold_reward').eq('user_id', user.id),
      supabase
        .from('quest_completions')
        .select('xp_gained,gold_gained,completed_at,stat_gained')
        .eq('user_id', user.id)
        .order('completed_at', { ascending: false })
        .limit(500),
      supabase.from('shadow_soldiers').select('id').eq('user_id', user.id),
    ])

    if (profileRes.error) {
      console.error('GET /api/stats profile error:', profileRes.error)
      const mapped = dbErrorMessage(profileRes.error)
      return apiError(mapped.code, mapped.message, mapped.status)
    }
    if (questsRes.error) {
      const mapped = dbErrorMessage(questsRes.error)
      return apiError(mapped.code, mapped.message, mapped.status)
    }

    const profile = profileRes.data
    const quests = questsRes.data ?? []
    const completions = completionsRes.data ?? []

    const totalQuests = quests.length
    const completedQuests = quests.filter((q) => q.status === 'completed').length
    const pendingQuests = quests.filter((q) => q.status === 'active').length
    const abandonedQuests = quests.filter((q) => q.status === 'abandoned').length
    const totalXpEarned = completions.reduce((s, c) => s + (c.xp_gained ?? 0), 0)
    const totalGoldEarned = completions.reduce((s, c) => s + (c.gold_gained ?? 0), 0)

    // XP earned per day (last 14 days) for charts
    const byDay: Record<string, number> = {}
    for (const c of completions) {
      const day = new Date(c.completed_at).toISOString().slice(0, 10)
      byDay[day] = (byDay[day] ?? 0) + (c.xp_gained ?? 0)
    }

    const payload = {
      profile: {
        level: profile.level,
        xp: profile.xp,
        xp_to_next: profile.xp_to_next,
        rank: profile.rank,
        streak: profile.streak,
        gold: profile.gold,
        mana_crystals: profile.mana_crystals,
        stats: {
          str: profile.stat_str,
          agi: profile.stat_agi,
          vit: profile.stat_vit,
          int: profile.stat_int,
          per: profile.stat_per,
        },
      },
      totals: {
        totalQuests,
        completedQuests,
        pendingQuests,
        abandonedQuests,
        totalXpEarned,
        totalGoldEarned,
        completionCount: completions.length,
        soldiersUnlocked: soldiersRes.data?.length ?? 0,
      },
      xpByDay: byDay,
      recentCompletions: completions.slice(0, 10),
    }

    return apiSuccess(payload, { compat: { stats: payload } })
  } catch (err) {
    console.error('GET /api/stats unhandled:', err)
    return apiError('INTERNAL_ERROR', 'Internal server error', 500)
  }
}
