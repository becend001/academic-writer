"use client";

import Link from "next/link";

interface NavbarProps {
  activePage?: string;
  rightContent?: React.ReactNode;
}

export function Navbar({ activePage, rightContent }: NavbarProps) {
  const navItems = [
    { href: "/workspace", label: "写作工具", icon: "✏️", id: "workspace" },
    { href: "/workflow", label: "全流程", icon: "⚡", id: "workflow" },
    { href: "/guide", label: "写作引导", icon: "🧠", id: "guide" },
    { href: "/literature", label: "文献搜索", icon: "📚", id: "literature" },
    { href: "/grant", label: "课题申报", icon: "🎯", id: "grant" },
  ];

  return (
    <header style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)' }}>
      <div className="max-w-[1400px] mx-auto px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-16">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #3B82F6, #1D4ED8)', boxShadow: '0 2px 8px rgba(59, 130, 246, 0.3)' }}>
              <span className="text-white font-bold text-xl">A</span>
            </div>
            <span className="text-2xl font-bold" style={{ color: 'var(--gray-900)' }}>学术写作助手</span>
          </Link>

          <nav className="flex items-center gap-1 p-1.5 rounded-xl" style={{ background: 'rgba(99, 102, 241, 0.08)' }}>
            {navItems.map((item) => {
              const isActive = activePage === item.id;
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className="relative flex items-center gap-2 px-5 py-2.5 rounded-lg transition-all"
                  style={{
                    background: isActive ? 'white' : 'transparent',
                    color: isActive ? 'var(--brand-600)' : '#64748B',
                    boxShadow: isActive ? '0 2px 8px rgba(99, 102, 241, 0.2)' : 'none',
                    fontSize: '16px',
                    fontWeight: isActive ? '600' : '500',
                  }}
                >
                  <span style={{ fontSize: '18px' }}>{item.icon}</span>
                  <span>{item.label}</span>
                  {isActive && (
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full" style={{ background: 'var(--brand-600)' }} />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {rightContent && (
          <div className="flex items-center gap-6">
            {rightContent}
          </div>
        )}
      </div>
    </header>
  );
}
