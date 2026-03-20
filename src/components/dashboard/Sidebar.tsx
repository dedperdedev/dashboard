import { 
  LayoutDashboard, 
  Users, 
  ArrowLeftRight, 
  TrendingUp, 
  ListTodo, 
  Settings,
  Wallet,
  UserPlus,
  PanelLeftClose,
  PanelLeft
} from "lucide-react";
import { NavLink } from "@/components/NavLink";

const navItems = [
  { title: "Дашборд", url: "/", icon: LayoutDashboard },
  { title: "Пользователи", url: "/users", icon: Users },
  { title: "Транзакции", url: "/transactions", icon: ArrowLeftRight },
  { title: "Позиции", url: "/positions", icon: TrendingUp },
  { title: "Задачи", url: "/tasks", icon: ListTodo },
  { title: "Рефералы", url: "/referrals", icon: UserPlus },
  { title: "Настройки", url: "/settings", icon: Settings },
];

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export function Sidebar({ isOpen, onToggle }: SidebarProps) {
  return (
    <>
      <aside
        className={`fixed left-0 top-0 h-screen bg-sidebar border-r border-sidebar-border flex flex-col z-20 transition-[width] duration-200 ease-in-out ${
          isOpen ? "w-[280px]" : "w-0 overflow-hidden"
        }`}
      >
        <div className="w-[280px] min-w-[280px] flex flex-col h-full">
          <div className="p-6 pb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20">
                <Wallet className="w-5 h-5 text-foreground" />
              </div>
              <span className="text-xl font-bold text-foreground tracking-tight">Dashboard</span>
            </div>
            <button
              type="button"
              onClick={onToggle}
              className="p-2 rounded-lg hover:bg-sidebar-accent text-muted-foreground hover:text-foreground"
              title="Скрыть меню"
            >
              <PanelLeftClose className="w-5 h-5" />
            </button>
          </div>

          <nav className="flex-1 px-3 overflow-y-auto">
            <ul className="space-y-1">
              {navItems.map((item) => (
                <li key={item.title}>
                  <NavLink 
                    to={item.url} 
                    end={item.url === "/"}
                    className="nav-item"
                    activeClassName="nav-item-active"
                  >
                    <item.icon className="w-5 h-5" />
                    <span className="text-[15px]">{item.title}</span>
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </aside>

      {!isOpen && (
        <button
          type="button"
          onClick={onToggle}
          className="fixed left-0 top-4 z-30 p-2 rounded-r-lg bg-sidebar border border-l-0 border-sidebar-border text-muted-foreground hover:text-foreground shadow-md"
          title="Показать меню"
        >
          <PanelLeft className="w-5 h-5" />
        </button>
      )}
    </>
  );
}
