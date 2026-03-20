import { ReactNode, useState, useEffect, useRef } from "react";
import { Sidebar } from "./Sidebar";

const SIDEBAR_STORAGE_KEY = "dashboard-sidebar-open";
const SWIPE_THRESHOLD = 50;
const EDGE_SWIPE_ZONE = 24;

interface DashboardLayoutProps {
  children: ReactNode;
  title?: string;
  showExport?: boolean;
}

export function DashboardLayout({ children, title, showExport }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem(SIDEBAR_STORAGE_KEY);
    if (stored !== null) setSidebarOpen(stored === "true");
  }, []);

  const toggleSidebar = () => {
    setSidebarOpen((prev) => {
      const next = !prev;
      localStorage.setItem(SIDEBAR_STORAGE_KEY, String(next));
      return next;
    });
  };

  const openSidebar = () => {
    if (!sidebarOpen) {
      setSidebarOpen(true);
      localStorage.setItem(SIDEBAR_STORAGE_KEY, "true");
    }
  };

  const closeSidebar = () => {
    if (sidebarOpen) {
      setSidebarOpen(false);
      localStorage.setItem(SIDEBAR_STORAGE_KEY, "false");
    }
  };

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const endX = e.changedTouches[0].clientX;
    const deltaX = endX - touchStartX.current;
    touchStartX.current = null;

    // Свайп влево — закрыть меню
    if (deltaX < -SWIPE_THRESHOLD) closeSidebar();
    // Свайп вправо от левого края — открыть меню
    if (deltaX > SWIPE_THRESHOLD && endX - deltaX < EDGE_SWIPE_ZONE) openSidebar();
  };

  return (
    <div className="min-h-screen bg-background flex w-full">
      <Sidebar isOpen={sidebarOpen} onToggle={toggleSidebar} />
      
      <main
        className={`flex-1 transition-[margin] duration-200 ${sidebarOpen ? "ml-[280px]" : "ml-0"}`}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {/* Top Header */}
        <header className="sticky top-0 z-10 px-8 py-5 border-b border-border bg-background/80 backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {title && (
                <h1 className="text-lg font-semibold text-foreground">{title}</h1>
              )}
            </div>
            
          </div>
        </header>

        {/* Content */}
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
