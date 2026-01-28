import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  LayoutDashboard,
  Beaker,
  CalendarDays,
  LogOut,
  Flame,
  FileText,
  Brain,
  MessageSquare,
  Timer,
  Sparkles,
  Trophy
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useProfile } from "@/hooks/useProfile";

const navItems = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard", end: true },
  { to: "/dashboard/lab", icon: Beaker, label: "Questões" },
  { to: "/dashboard/essay", icon: FileText, label: "Redação", premium: true },
  { to: "/dashboard/flashcards", icon: Brain, label: "Flashcards", premium: true },
  { to: "/dashboard/chat", icon: MessageSquare, label: "Chat IA" },
  { to: "/dashboard/planner", icon: CalendarDays, label: "Agenda" },
  { to: "/dashboard/ranking", icon: Trophy, label: "Ranking" },
  { to: "/dashboard/focus", icon: Timer, label: "Focus Room" },
];

const Sidebar = () => {
  const location = useLocation();
  const { signOut, user } = useAuth();
  const { profile } = useProfile();

  return (
    <div className="glass h-full w-64 rounded-3xl p-5 flex flex-col">
      {/* Logo */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
          <Sparkles className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">Nexus Study</h1>
          <p className="text-xs text-muted-foreground">Plataforma Premium</p>
        </div>
      </div>

      {/* Streak Badge */}
      {profile && profile.streak_count !== undefined && profile.streak_count > 0 && (
        <div className="streak-badge mb-2 justify-center">
          <Flame className="h-5 w-5" />
          <span>{profile.streak_count} dias</span>
        </div>
      )}

      {/* XP Badge */}
      {profile && profile.xp !== undefined && profile.xp > 0 && (
        <div className="glass rounded-xl px-4 py-2 mb-4 text-center">
          <span className="text-sm text-muted-foreground">XP Total: </span>
          <span className="font-bold text-primary">{profile.xp}</span>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 space-y-0.5 overflow-y-auto min-h-0 pb-2 no-scrollbar">
        {navItems.map((item) => {
          const isActive = item.end
            ? location.pathname === item.to
            : location.pathname.startsWith(item.to);

          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={cn(
                "nav-item shrink-0 h-9",
                isActive && "nav-item-active"
              )}
            >
              <item.icon className="h-4 w-4" />
              <span className="flex-1 text-sm">{item.label}</span>
              {item.premium && !profile?.is_pro && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  PRO
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* User Info & Logout */}
      <div className="mt-auto pt-4 border-t border-white/10 shrink-0">
        <div className="flex items-center gap-3 mb-4 px-2">
          <div className="w-10 h-10 rounded-full bg-secondary/30 flex items-center justify-center shrink-0">
            <span className="text-sm font-medium text-foreground">
              {profile?.full_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "?"}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">
              {profile?.full_name || "Estudante"}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {profile?.is_pro ? "Nexus Pro ✨" : "Plano Gratuito"}
            </p>
          </div>
        </div>
        <button
          onClick={signOut}
          className="nav-item w-full text-destructive hover:bg-destructive/10"
        >
          <LogOut className="h-5 w-5" />
          <span>Sair</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
