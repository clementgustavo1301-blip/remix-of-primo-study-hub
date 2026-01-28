import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface Profile {
  id: string;
  full_name: string | null;
  target_course: string | null;
  current_year: string | null;
  streak_count: number | null;
  last_activity_date: string | null;
  avatar_url: string | null;
  is_pro: boolean | null;
  xp: number | null;
  level: number | null;
  email?: string | null;
  username?: string | null;
}

export function useProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        // Check for broken streak (Lazy Reset)
        const today = new Date();
        const lastActive = data.last_activity_date ? new Date(data.last_activity_date) : null;

        let currentData = { ...data };

        if (lastActive) {
          const diffTime = Math.abs(today.setHours(0, 0, 0, 0) - lastActive.setHours(0, 0, 0, 0));
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

          // If difference is > 1 day (missed yesterday), reset streak
          if (diffDays > 1 && data.streak_count > 0) {
            console.log("Streak broken! Resetting to 0.");

            // Update local state immediately
            currentData.streak_count = 0;

            // Update DB asynchronously
            supabase
              .from("profiles")
              .update({ streak_count: 0 })
              .eq("id", user.id)
              .then(({ error }) => {
                if (error) console.error("Error resetting streak in DB:", error);
              });
          }
        }

        setProfile(currentData as unknown as Profile);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return { error: new Error("Not authenticated") };

    try {
      const { error } = await supabase
        .from("profiles")
        .upsert({ id: user.id, ...updates })
        .eq("id", user.id);

      if (error) throw error;

      setProfile((prev) => prev ? { ...prev, ...updates } : null);
      toast.success("Perfil atualizado!");
      return { error: null };
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Erro ao atualizar perfil");
      return { error: error as Error };
    }
  };

  const addXP = async (amount: number) => {
    if (!user) return;

    console.log("Tentando adicionar XP:", amount);
    // @ts-ignore
    const { data, error } = await supabase.rpc('increment_xp', { amount });

    if (error) {
      console.error("Erro no Supabase RPC:", error);
      return null;
    } else {
      console.log("XP atualizado com sucesso!", data);
    }

    // Refresh profile to update UI
    fetchProfile();
    return true;
  };

  useEffect(() => {
    fetchProfile();

    const handleUpdate = () => {
      console.log("Profile update event received");
      fetchProfile();
    };

    window.addEventListener("profile_updated", handleUpdate);
    return () => window.removeEventListener("profile_updated", handleUpdate);
  }, [user]);

  return { profile, loading, updateProfile, refetch: fetchProfile, addXP };
}
