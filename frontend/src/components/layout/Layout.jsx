import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

export default function Layout() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex min-h-screen bg-[var(--bg-primary)]">
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      
      <main
        className={`flex-1 min-w-0 transition-all duration-200 ease-in-out relative
          ${collapsed ? 'md:ml-[60px]' : 'md:ml-[220px]'}
          ml-0
        `}
      >
        <div className="ambient-bg" />
        <Outlet />
      </main>
    </div>
  );
}
