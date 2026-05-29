import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { Database } from '@/types/database'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session — required for Server Components to read auth state
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // Public paths that don't require auth
  const publicPaths = ['/login', '/api/auth', '/api/webhook', '/auth']
  const isPublic = publicPaths.some((p) => pathname.startsWith(p))

  if (!user && !isPublic) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/login'
    loginUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Admin routes require organizer or manager role in an approved community
  if (user && pathname.startsWith('/admin')) {
    const { data: membership } = await supabase
      .from('community_members')
      .select('role, status')
      .eq('user_id', user.id)
      .in('role', ['organizer', 'manager'])
      .eq('status', 'approved')
      .limit(1)
      .single()

    if (!membership) {
      return NextResponse.redirect(new URL('/profile', request.nextUrl))
    }
  }

  // Referee routes require approved community membership
  if (user && (pathname.startsWith('/profile') || pathname.startsWith('/availability') || pathname.startsWith('/history') || pathname.startsWith('/join'))) {
    // Profile and join pages are always accessible to authenticated users (no membership required)
    if (pathname === '/profile' || pathname === '/join') {
      return supabaseResponse
    }

    const { data: membership } = await supabase
      .from('community_members')
      .select('status')
      .eq('user_id', user.id)
      .eq('status', 'approved')
      .limit(1)
      .single()

    if (!membership) {
      return NextResponse.redirect(new URL('/join', request.nextUrl))
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
