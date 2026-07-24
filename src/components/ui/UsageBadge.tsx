"use client";

import { DAILY_USAGE_LIMIT } from "@/lib/config";

interface UsageBadgeProps {
  todayUsage: number;
  whitelisted: boolean;
}

export function UsageBadge({ todayUsage, whitelisted }: UsageBadgeProps) {
  return (
    <div
      className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm"
      style={{
        background: whitelisted ? "#EFF6FF" : todayUsage >= DAILY_USAGE_LIMIT ? "#FEE2E2" : "#DCFCE7",
        color: whitelisted ? "#1D4ED8" : todayUsage >= DAILY_USAGE_LIMIT ? "#DC2626" : "#16A34A",
      }}
    >
      <span>{whitelisted ? "种子用户" : "剩余"}</span>
      <span className="font-bold">
        {whitelisted ? "不限次数" : `${DAILY_USAGE_LIMIT - todayUsage}/${DAILY_USAGE_LIMIT}`}
      </span>
    </div>
  );
}
