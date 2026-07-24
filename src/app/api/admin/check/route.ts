import { NextResponse } from "next/server";
import { createClientFromRequest } from "@/lib/supabase/api";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "xiangbow@126.com";

export async function GET(request: Request) {
  const supabase = createClientFromRequest(request);
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.json({ isAdmin: false });
  }

  const isAdmin = user.email?.toLowerCase().trim() === ADMIN_EMAIL;
  return NextResponse.json({ isAdmin });
}
