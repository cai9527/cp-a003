import { useState, useEffect, useCallback } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

export default function MainLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) {
        setIsMobileSidebarOpen(false);
      }
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleToggleSidebar = useCallback(() => {
    if (isMobile) {
      setIsMobileSidebarOpen((prev) => !prev);
    } else {
      setCollapsed((prev) => !prev);
    }
  }, [isMobile]);

  const handleCloseMobileSidebar = useCallback(() => {
    setIsMobileSidebarOpen(false);
  }, []);

  const sidebarWidth = collapsed ? '4rem' : '16rem';

  return (
    <div className="min-h-screen bg-neutral-100 flex">
      <Sidebar
        collapsed={collapsed}
        onToggle={handleToggleSidebar}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={handleCloseMobileSidebar}
      />
      <div
        className="flex-1 min-w-0 transition-sidebar will-change-width"
        style={{
          marginLeft: isMobile ? '0' : sidebarWidth,
          width: isMobile ? '100%' : `calc(100% - ${sidebarWidth})`,
        }}
      >
        <Header onMenuToggle={handleToggleSidebar} />
        <main className="p-4 md:p-6 min-h-[calc(100vh-4rem)]">
          <div className="animate-fade-in max-w-full overflow-x-hidden">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
