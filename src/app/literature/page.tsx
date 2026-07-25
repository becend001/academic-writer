"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import { LiteratureSearch } from "@/components/ui/LiteratureSearch";
import { Navbar } from "@/components/ui/Navbar";
import { DAILY_USAGE_LIMIT } from "@/lib/config";
import { csrfFetch } from "@/lib/utils/csrf-fetch";

export default function LiteraturePage() {
  const [user, setUser] = useState<any>(null);
  const [todayUsage, setTodayUsage] = useState(0);
  const [whitelisted, setWhitelisted] = useState(false);
  const usageLimit = DAILY_USAGE_LIMIT;

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUser(user);
        loadUsage();
      } else {
        window.location.href = "/auth/login";
      }
    });
  }, []);

  const loadUsage = async () => {
    try {
      const res = await csrfFetch("/api/usage");
      const data = await res.json();
      if (data.whitelisted) { setWhitelisted(true); return; }
      if (data.today !== undefined) setTodayUsage(data.today);
    } catch {}
  };

  const handleUsageConsumed = () => {
    setTodayUsage((prev) => prev + 1);
  };

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
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm" style={{ background: whitelisted ? '#EFF6FF' : todayUsage >= usageLimit ? '#FEE2E2' : '#DCFCE7', color: whitelisted ? '#1D4ED8' : todayUsage >= usageLimit ? '#DC2626' : '#16A34A' }}>
            <span>{whitelisted ? '种子用户' : '剩余'}</span>
            <span className="font-bold">{whitelisted ? '不限次数' : `${usageLimit - todayUsage}/${usageLimit}`}</span>
          </div>
          <div className="text-base" style={{ color: 'var(--gray-500)' }}>{user?.email}</div>
        </div>
      } />

      {/* 内容区 */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <LiteratureSearch
          todayUsage={todayUsage}
          usageLimit={usageLimit}
          whitelisted={whitelisted}
          onUsageConsumed={handleUsageConsumed}
        />
      </div>
    </div>
  );
}
