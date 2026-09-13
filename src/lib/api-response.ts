import { NextResponse } from 'next/server'

export type ApiErrorCode =
  | 'UNAUTHENTICATED'
  | 'UNAUTHORIZED'
  | 'VALIDATION_ERROR'
  | 'NOT_FOUND'
  | 'ALREADY_COMPLETED'
  | 'ALREADY_OWNED'
  | 'INSUFFICIENT_BALANCE'
  | 'INVALID_ITEM'
  | 'DATABASE_ERROR'
  | 'CONFIG_ERROR'
  | 'INTERNAL_ERROR'

/**
 * Success envelope required by spec:
 * { success: true, data: {} }
 * Extra top-level fields may be spread for backwards compatibility
 * with the existing frontend (e.g. { quests }, { profile }).
 */
export function apiSuccess<T extends Record<string, unknown> | unknown[] | unknown>(
  data: T,
  init?: { status?: number; compat?: Record<string, unknown> }
) {
  const body: Record<string, unknown> = {
    success: true,
    data,
    ...(init?.compat ?? {}),
  }
  return NextResponse.json(body, { status: init?.status ?? 200 })
}

export function apiError(
  code: ApiErrorCode,
  message: string,
  status = 500,
  details?: unknown
) {
  return NextResponse.json(
    {
      success: false,
      error: {
        code,
        message,
        ...(details !== undefined ? { details } : {}),
      },
      // legacy compat so old `err.error` string reads still work
      errorMessage: message,
    },
    { status }
  )
}

/** Map Supabase/PostgREST errors to spec error codes */
export function dbErrorMessage(error: { message?: string; code?: string } | null): {
  code: ApiErrorCode
  message: string
  status: number
} {
  const msg = error?.message ?? 'Database error'
  if (msg.includes('not found or already completed')) {
    return { code: 'ALREADY_COMPLETED', message: 'Quest not found or already completed', status: 404 }
  }
  if (msg.includes('already purchased') || msg.includes('already owned') || msg.includes('duplicate key')) {
    return { code: 'ALREADY_OWNED', message: 'Item already owned', status: 409 }
  }
  if (msg.includes('Insufficient')) {
    return { code: 'INSUFFICIENT_BALANCE', message: msg, status: 402 }
  }
  if (msg.includes('Could not find the table') || msg.includes('schema cache')) {
    return {
      code: 'CONFIG_ERROR',
      message: 'Database tables not found. Run supabase/migrations/001_initial_schema.sql in your Supabase SQL Editor.',
      status: 500,
    }
  }
  return { code: 'DATABASE_ERROR', message: 'Database operation failed', status: 500 }
}
