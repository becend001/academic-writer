"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";

// 通用的带token的fetch
async function authFetch(url: string, options: RequestInit = {}) {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token || "";
  return fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      "Authorization": `Bearer ${token}`,
    },
  });
}

export { authFetch };
