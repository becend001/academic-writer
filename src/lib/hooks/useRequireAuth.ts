"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

/**
 * 页面级认证 hook — 检查登录状态，未登录则跳转
 * 返回 { user, loading }
 */
export function useRequireAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUser(user);
      } else {
        window.location.href = "/auth/login";
      }
      setLoading(false);
    });
  }, []);

  return { user, loading };
}
