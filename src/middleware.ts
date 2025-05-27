import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // 개발 테스트를 위해 미들웨어 완전 비활성화
  return NextResponse.next()

  // let supabaseResponse = NextResponse.next({
  //   request,
  // })

  // const supabase = createServerClient(
  //   process.env.NEXT_PUBLIC_SUPABASE_URL!,
  //   process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  //   {
  //     cookies: {
  //       getAll() {
  //         return request.cookies.getAll()
  //       },
  //       setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
  //         cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value, options))
  //         supabaseResponse = NextResponse.next({
  //           request,
  //         })
  //         cookiesToSet.forEach(({ name, value, options }) =>
  //           supabaseResponse.cookies.set(name, value, options)
  //         )
  //       },
  //     },
  //   }
  // )

  // const {
  //   data: { user },
  // } = await supabase.auth.getUser()

  // // 임시로 인증 체크 비활성화 (개발 테스트용)
  // // if (
  // //   !user &&
  // //   !request.nextUrl.pathname.startsWith('/login') && // Assuming you will have a /login page
  // //   !request.nextUrl.pathname.startsWith('/auth') // For Supabase auth callback routes
  // // ) {
  // //   const url = request.nextUrl.clone()
  // //   url.pathname = '/login'
  // //   return NextResponse.redirect(url)
  // // }

  // return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - login (the login page itself)
     * - auth (Supabase auth routes like /auth/callback)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|login|auth|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
} 