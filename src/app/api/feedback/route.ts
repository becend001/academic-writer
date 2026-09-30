import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function POST(request: Request) {
  try {
    const { type, content, contact } = await request.json();

    if (!content || typeof content !== "string") {
      return NextResponse.json({ error: "请填写反馈内容" }, { status: 400 });
    }

    // 获取用户信息（可选，未登录也可提交）
    const authHeader = request.headers.get("authorization") || "";
    const token = authHeader.replace("Bearer ", "").trim();

    let userId = null;
    let userEmail = "";

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: token ? { headers: { Authorization: `Bearer ${token}` } } : {},
    });

    if (token) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        userId = user.id;
        userEmail = user.email || "";
      }
    }

    // 存储反馈到 user_feedback 表
    const { error } = await supabase
      .from("user_feedback")
      .insert({
        user_id: userId,
        email: userEmail,
        type: type || "suggestion",
        content: content.trim(),
        contact: contact?.trim() || null,
      });

    if (error) {
      console.error("Feedback insert error:", error);
      return NextResponse.json({ error: "提交失败，请稍后重试" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Feedback API error:", error);
    return NextResponse.json({ error: "提交失败，请稍后重试" }, { status: 500 });
  }
}
