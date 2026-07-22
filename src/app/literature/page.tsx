"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import { LiteratureSearch } from "@/components/ui/LiteratureSearch";
import { Navbar } from "@/components/ui/Navbar";

export default function LiteraturePage() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUser(user);
      else window.location.href = "/auth/login";
    });
  }, []);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-base)' }}>
        <div className="text-gray-500">加载中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-base)' }}>
      <Navbar activePage="literature" rightContent={
        <div className="text-base" style={{ color: 'var(--gray-500)' }}>{user?.email}</div>
      } />

      {/* 内容区 */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <LiteratureSearch />
      </div>
    </div>
  );
}
