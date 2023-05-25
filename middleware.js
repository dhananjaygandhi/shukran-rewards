import { createMiddlewareSupabaseClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import _get from 'lodash/get';
import { supabaseConnection } from './utils/supabase';

export async function middleware(req) {
  const res = NextResponse.next();
  const supabase = createMiddlewareSupabaseClient({ req, res });
  const supabaseCon = supabaseConnection();
  const {data : {session}, error} = await supabase.auth.getSession();
  // console.log(session);
  if (!session) {
    if(req.nextUrl.pathname !== '/') {
     return NextResponse.redirect(new URL('/', req.url));
    }
  } else if(req.nextUrl.pathname === '/') {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }
  return res;
}

export const config = {
  matcher: [
    /*
      * Match all request paths except for the ones starting with:
      * - api (API routes)
      * - _next/static (static files)
      * - _next/image (image optimization files)
      * - favicon.ico (favicon file)
      */
    '/((?!api|_next/static|_next/image|favicon.ico|smt_bg.jpg).*)', '/',
  ],
}