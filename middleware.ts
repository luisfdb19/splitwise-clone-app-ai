import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const isPublicRoute = createRouteMatcher(['/sign-in(.*)', '/sign-up(.*)']);

export default clerkMiddleware((auth, request) => {
  const { userId } = auth();

  if (!isPublicRoute(request)) {
    if (!userId) {
      auth().protect();
      return;
    }
  }

  // Redirect authenticated users from root "/" to "/groups"
  if (userId && request.nextUrl.pathname === '/') {
    const groupsUrl = new URL('/groups', request.url);
    return NextResponse.redirect(groupsUrl);
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
