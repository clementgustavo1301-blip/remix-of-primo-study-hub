import { NavLink, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  Beaker, 
  CalendarDays, 
  FileText, 
  Brain, 
  MessageSquare, 
  Timer,
  Menu
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useProfile } from "@/hooks/useProfile";

const mainNavItems = [
  { to: "/", icon: LayoutDashboard, label: "Home", end: true },
  { to: "/lab", icon: Beaker, label: "Questões" },
  { to: "/focus", icon: Timer, label: "Foco" },
];

const allNavItems = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard", end: true },
  { to: "/lab", icon: Beaker, label: "Questões" },
  { to: "/essay", icon: FileText, label: "Redação", premium: true },
  { to: "/flashcards", icon: Brain, label: "Flashcards", premium: true },
  { to: "/chat", icon: MessageSquare, label: "Chat IA" },
  { to: "/planner", icon: CalendarDays, label: "Agenda" },
  { to: "/focus", icon: Timer, label: "Focus Room" },
];

const MobileNav = () => {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const { profile } = useProfile();

  return (
    <div className="lg:hidden fixed bottom-4 left-4 right-4 z-50">
      <nav className="glass rounded-2xl p-2 flex justify-around items-center">
        {mainNavItems.map((item) => {
          const isActive = item.end 
            ? location.pathname === item.to 
            : location.pathname.startsWith(item.to);
          
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={cn(
                "flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all duration-300",
                isActive 
                  ? "bg-primary/20 text-primary" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <item.icon className="h-5 w-5" />
              <span className="text-xs font-medium">{item.label}</span>
            </NavLink>
          );
        })}
        
        {/* More menu */}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <button className="flex flex-col items-center gap-1 px-4 py-2 rounded-xl text-muted-foreground hover:text-foreground transition-all">
              <Menu className="h-5 w-5" />
              <span className="text-xs font-medium">Mais</span>
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="glass-strong border-white/20 rounded-t-3xl">
            <nav className="grid grid-cols-3 gap-3 pt-4">
              {allNavItems.map((item) => {
                const isActive = item.end 
                  ? location.pathname === item.to 
                  : location.pathname.startsWith(item.to);
                
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex flex-col items-center gap-2 p-4 rounded-2xl transition-all",
                      isActive 
                        ? "bg-primary/20 text-primary border border-primary/30" 
                        : "bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-foreground"
                    )}
                  >
                    <item.icon className="h-6 w-6" />
                    <span className="text-xs font-medium text-center">{item.label}</span>
                    {item.premium && !profile?.is_pro && (
                      <span className="text-[8px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                        PRO
                      </span>
                    )}
                  </NavLink>
                );
              })}
            </nav>
          </SheetContent>
        </Sheet>
      </nav>
    </div>
  );
};

export default MobileNav;