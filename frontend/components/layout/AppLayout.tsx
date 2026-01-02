'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    setUser(userData);
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: '📊' },
    { name: 'Leads', path: '/leads', icon: '🎯' },
    { name: 'Clients', path: '/clients', icon: '👥' },
    { name: 'Calls', path: '/calls', icon: '📞' },
    { name: 'Emails', path: '/emails', icon: '📧' },
    { name: 'Proposals', path: '/proposals', icon: '📄' },
    { name: 'Pipelines', path: '/pipelines', icon: '⚡' },
    { name: 'Settings', path: '/settings', icon: '⚙️' },
  ];

  const styles = {
    container: {
      display: 'flex',
      minHeight: '100vh',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    },
    sidebar: {
      width: '250px',
      background: '#1f2937',
      color: 'white',
      display: 'flex',
      flexDirection: 'column' as const,
      position: 'fixed' as const,
      height: '100vh',
      overflowY: 'auto' as const,
    },
    logo: {
      padding: '24px',
      borderBottom: '1px solid rgba(255,255,255,0.1)',
    },
    logoText: {
      fontSize: '24px',
      fontWeight: 'bold',
      margin: 0,
    },
    nav: {
      flex: 1,
      padding: '16px 0',
    },
    navItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '12px 24px',
      cursor: 'pointer',
      transition: 'all 0.2s',
      textDecoration: 'none',
      color: 'white',
    },
    navItemActive: {
      background: 'rgba(99, 102, 241, 0.2)',
      borderLeft: '3px solid #6366f1',
    },
    navIcon: {
      fontSize: '20px',
    },
    main: {
      flex: 1,
      marginLeft: '250px',
      background: '#f9fafb',
    },
    header: {
      background: 'white',
      borderBottom: '1px solid #e5e7eb',
      padding: '16px 32px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    userInfo: {
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
    },
    userName: {
      fontSize: '14px',
      color: '#6b7280',
    },
    logoutBtn: {
      padding: '8px 16px',
      background: '#ef4444',
      color: 'white',
      border: 'none',
      borderRadius: '6px',
      cursor: 'pointer',
      fontSize: '14px',
    },
    content: {
      padding: '32px',
    },
  };

  if (!user) {
    return null;
  }

  return (
    <div style={styles.container}>
      <aside style={styles.sidebar}>
        <div style={styles.logo}>
          <h1 style={styles.logoText}>🏗️ PBK CRM</h1>
        </div>
        <nav style={styles.nav}>
          {navItems.map((item) => (
            <a
              key={item.path}
              href={item.path}
              style={{
                ...styles.navItem,
                ...(pathname === item.path ? styles.navItemActive : {}),
              }}
              onMouseOver={(e) => {
                if (pathname !== item.path) {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                }
              }}
              onMouseOut={(e) => {
                if (pathname !== item.path) {
                  e.currentTarget.style.background = 'transparent';
                }
              }}
            >
              <span style={styles.navIcon}>{item.icon}</span>
              <span>{item.name}</span>
            </a>
          ))}
        </nav>
      </aside>
      
      <main style={styles.main}>
        <header style={styles.header}>
          <h2 style={{ margin: 0, fontSize: '20px', color: '#1f2937' }}>
            {navItems.find(item => item.path === pathname)?.name || 'PBK CRM'}
          </h2>
          <div style={styles.userInfo}>
            <span style={styles.userName}>
              {user?.first_name} {user?.last_name} ({user?.role})
            </span>
            <button onClick={handleLogout} style={styles.logoutBtn}>
              Logout
            </button>
          </div>
        </header>
        <div style={styles.content}>
          {children}
        </div>
      </main>
    </div>
  );
}
