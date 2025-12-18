import { supabase } from "@/integrations/supabase/client";

export const updateStreak = async (userId: string): Promise<number> => {
    try {
        // 1. Fetch current streak info
        const { data: profile, error: fetchError } = await supabase
            .from("profiles")
            .select("streak_count, last_activity_date")
            .eq("id", userId)
            .single();

        if (fetchError || !profile) {
            console.error("Error fetching profile for streak:", fetchError);
            return 0;
        }

        const today = new Date();
        const todayStr = today.toISOString().split("T")[0];

        const lastActive = profile.last_activity_date ? new Date(profile.last_activity_date) : null;
        const lastActiveStr = lastActive ? lastActive.toISOString().split("T")[0] : null;

        let newStreak = profile.streak_count || 0;

        // Scenario 1: Already active today
        if (lastActiveStr === todayStr) {
            return newStreak;
        }

        // Calculate yesterday string
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split("T")[0];

        // Scenario 2: Active yesterday -> Increment
        // Scenario 3: Missed a day (or first time) -> Reset to 1
        if (lastActiveStr === yesterdayStr) {
            newStreak += 1;
        } else {
            // Reset to 1 if missed a day OR if it's the very first time
            newStreak = 1;
        }

        // 2. Update DB
        const { error: updateError } = await supabase
            .from("profiles")
            .update({
                streak_count: newStreak,
                last_activity_date: todayStr
            })
            .eq("id", userId);

        if (updateError) {
            console.error("Error updating streak:", updateError);
        }

        return newStreak;
    } catch (error) {
        console.error("Streak update failed:", error);
        return 0;
    }
};
