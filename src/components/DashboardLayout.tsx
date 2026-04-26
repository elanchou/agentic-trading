import { ReactNode } from "react";
import { Activity, LayoutDashboard, Settings, TerminalSquare, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface LayoutProps {
  children: ReactNode;
  activePath?: string;
  rightSidebar?: ReactNode;
  onNavigate?: (path: string) => void;
}

export function DashboardLayout({ children, activePath = "dashboard", rightSidebar, onNavigate }: LayoutProps) {
  const navItems = [
    { id: "dashboard", icon: LayoutDashboard, label: "Overview" },
    { id: "trades", icon: Activity, label: "Live Trades" },
    { id: "logs", icon: TerminalSquare, label: "Agent" },
    { id: "settings", icon: Settings, label: "Settings" },
  ];

  return (
    <div className="layout-grid bg-dash-bg text-dash-text overflow-hidden font-sans">
      {/* Sidebar layout with Editorial feel */}
      <aside className="border-r border-dash-border flex-col items-center py-6 justify-between hidden md:flex">
        <div className="w-full flex flex-col items-center gap-8">
          <div className="text-2xl font-bold tracking-tighter">A.</div>
          
          <nav className="flex flex-col gap-4">
            {navItems.map((item) => (
              <button
                key={item.id}
                title={item.label}
                className={cn(
                  "nav-icon group",
                  activePath === item.id 
                    ? "border-dash-accent text-dash-accent" 
                    : "text-dash-muted"
                )}
                onClick={() => onNavigate?.(item.id)}
              >
                <item.icon className="w-4 h-4" />
              </button>
            ))}
          </nav>
        </div>
        
        <div 
          className="text-[10px] tracking-[0.2em] text-dash-muted uppercase" 
          style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
        >
          SYSTEM READY // {(new Date()).getFullYear()}
        </div>
      </aside>

      {/* Main Content */}
      <main className="p-6 md:p-10 border-r border-dash-border flex flex-col h-full overflow-y-auto relative">
        {children}
      </main>

      {/* Right Sidebar (Agent Stream) */}
      <aside className="p-6 bg-dash-card h-full overflow-y-auto hidden lg:block">
        {rightSidebar}
      </aside>
    </div>
  );
}
