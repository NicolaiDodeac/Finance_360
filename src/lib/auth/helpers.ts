import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/** Returns the authenticated user or null. */
export async function getUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/** Redirects to login if no session. Use in protected layouts/pages. */
export async function requireAuth() {
  const user = await getUser();
  if (!user) {
    redirect("/login");
  }
  return user;
}

/** Redirects authenticated users away from auth pages. */
export async function redirectIfAuthenticated(destination = "/dashboard") {
  const user = await getUser();
  if (user) {
    redirect(destination);
  }
}
