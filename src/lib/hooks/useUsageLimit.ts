"use client";

import { useState, useEffect, useCallback } from "react";
import { DAILY_USAGE_LIMIT } from "@/lib/config";

/**
 * 使用量限制 hook — 加载、检查、展示
 */
export function useUsageLimit() {
  const [todayUsage, setTodayUsage] = useState(0);
  const [whitelisted, setWhitelisted] = useState(false);

  const loadUsage = useCallback(async () => {
    try {
      const res = await fetch("/api/usage");
      const data = await res.json();
      if (data.whitelisted) {
        setWhitelisted(true);
        return;
      }
      if (data.today !== undefined) setTodayUsage(data.today);
    } catch {}
  }, []);

  useEffect(() => {
    loadUsage();
  }, [loadUsage]);

  const checkUsage = useCallback(() => {
    if (whitelisted) return true;
    if (todayUsage >= DAILY_USAGE_LIMIT) return false;
    return true;
  }, [whitelisted, todayUsage]);

  const incrementUsage = useCallback(() => {
    setTodayUsage((prev) => prev + 1);
  }, []);

  return {
    todayUsage,
    whitelisted,
    usageLimit: DAILY_USAGE_LIMIT,
    checkUsage,
    incrementUsage,
    loadUsage,
  };
}
