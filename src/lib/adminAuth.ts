import { supabase } from "@/integrations/supabase/client";

export async function requireAdmin(): Promise<
  | { ok: true }
  | { ok: false; reason: "not_signed_in" | "not_admin" | "auth_error"; message?: string }
> {
  const { data, error } = await supabase.auth.getSession();
  if (error) return { ok: false, reason: "auth_error", message: error.message };
  if (!data.session) return { ok: false, reason: "not_signed_in" };

  const { data: isAdmin, error: adminError } = await supabase.rpc("is_admin");
  if (adminError) return { ok: false, reason: "auth_error", message: adminError.message };
  if (!isAdmin) return { ok: false, reason: "not_admin" };

  return { ok: true };
}

export async function signInAdmin(email: string, password: string): Promise<
  | { ok: true }
  | { ok: false; message: string }
> {
  const { error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  });

  if (error) return { ok: false, message: error.message };

  const check = await requireAdmin();
  if (!check.ok) {
    await supabase.auth.signOut();

    if (check.reason === "not_admin") {
      return { ok: false, message: "This account is not authorized for admin access." };
    }

    return {
      ok: false,
      message: check.message || "Admin verification failed. Please try again.",
    };
  }

  return { ok: true };
}
