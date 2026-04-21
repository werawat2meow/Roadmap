import { supabase } from "@/lib/supabaseClient";

export async function getCurrentUserProfile() {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) return null;

  const { data, error } = await supabase
    .from("user_accounts")
    .select(`
      id,
      username,
      is_active,
      employee_id,
      user_role_assignments (
        roles (
          role_code,
          role_name
        )
      )
    `)
    .eq("auth_user_id", user.id)
    .single();

  if (error) return null;

  return {
    authUser: user,
    profile: data,
  };
}