import createIntlMiddleware from "next-intl/middleware";
import { type NextRequest, NextResponse } from "next/server";
import { routing } from "@/i18n/routing";
import { updateSession } from "@/lib/supabase/middleware";

const intlMiddleware = createIntlMiddleware(routing);

export async function middleware(request: NextRequest) {
  // Run next-intl locale detection first to get locale-aware response headers.
  const intlResponse = intlMiddleware(request);

  // Refresh the Supabase session on every request so auth stays alive.
  return updateSession(request, intlResponse ?? NextResponse.next());
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|icons|manifest.json).*)",
  ],
};
