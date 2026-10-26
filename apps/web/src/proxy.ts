import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { ROLE_HOME, isUserRole, rolesFor } from "./lib/roles";

/**
 * Optimistic route guard (Next.js 16 proxy). Refreshes the Supabase session cookie and
 * redirects by role. The role is read from the verified JWT's app_metadata, which the
 * database mirrors from profiles.role and users cannot write. Real authorisation is
 * enforced by the API (role from profiles) and by Postgres RLS.
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const allowed = rolesFor(request.nextUrl.pathname);
  if (!url || !key) {
    // Misconfigured: never show protected pages without a session check.
    return allowed ? NextResponse.redirect(new URL("/auth/login", request.url)) : response;
  }

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  // Verifies the JWT (locally against the project's JWKS) and refreshes it if needed.
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  const appRole = (claims?.app_metadata as { role?: unknown } | undefined)?.role;
  const role = isUserRole(appRole) ? appRole : null;

  if (allowed) {
    if (!claims) {
      const login = new URL("/auth/login", request.url);
      login.searchParams.set("next", request.nextUrl.pathname);
      return NextResponse.redirect(login);
    }
    if (!role || !allowed.includes(role)) {
      return NextResponse.redirect(new URL(role ? ROLE_HOME[role] : "/auth/login", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
