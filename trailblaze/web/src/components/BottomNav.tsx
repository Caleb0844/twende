import { Link, useLocation } from "react-router-dom";
import { Compass, Trophy, User, Plus } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export function BottomNav() {
  const { pathname } = useLocation();
  const { user } = useAuth();

  return (
    <nav className="fixed bottom-0 left-1/2 z-40 w-full max-w-[480px] -translate-x-1/2 border-t border-border bg-background/95 backdrop-blur">
      <div className="relative grid h-16 grid-cols-4 items-center px-2">
        <NavItem to="/" label="Explore" active={pathname === "/"} icon={<Compass className="h-5 w-5" />} />
        <NavItem to="/rankings" label="Rankings" active={pathname === "/rankings"} icon={<Trophy className="h-5 w-5" />} />
        <div />
        <NavItem
          to={user ? "/profile" : "/login"}
          label={user ? "Profile" : "Sign In"}
          active={pathname === "/profile" || pathname === "/login"}
          icon={<User className="h-5 w-5" />}
        />
        <Link
          to="/add"
          aria-label="Add place"
          className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 flex h-14 w-14 items-center justify-center rounded-full bg-accent text-accent-foreground shadow-lg shadow-accent/30 ring-4 ring-background transition-transform active:scale-95"
        >
          <Plus className="h-7 w-7" strokeWidth={2.5} />
        </Link>
      </div>
    </nav>
  );
}

function NavItem({ to, label, icon, active }: { to: string; label: string; icon: React.ReactNode; active: boolean }) {
  return (
    <Link
      to={to}
      className={`flex flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors ${
        active ? "text-primary" : "text-muted-foreground"
      }`}
    >
      {icon}
      <span>{label}</span>
    </Link>
  );
}
