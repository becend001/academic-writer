"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/Toast";

export default function ResetPasswordPage() {
  const { showToast } = useToast();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Supabase 重置密码链接会带 token，检查是否已验证
    supabase.auth.getUser().then(({ data: { user } }) => {
      setReady(true);
      if (!user) {
        // 如果没有session，说明token无效或已过期
        setError("链接无效或已过期，请重新申请重置密码");
      }
    });
  }, []);

  const handleReset = async () => {
    setError("");
    if (password.length < 6) {
      setError("密码至少6个字符");
      return;
    }
    if (password !== confirmPassword) {
      setError("两次输入的密码不一致");
      return;
    }
    setLoading(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) {
        setError(updateError.message || "修改失败，请重新申请");
      } else {
        setSuccess(true);
        showToast("密码修改成功！");
      }
    } catch {
      setError("修改失败，请稍后重试");
    }
    setLoading(false);
  };

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-base)' }}>
        <div className="text-gray-500">加载中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-base)' }}>
      <div className="w-full max-w-md mx-4">
        <div className="card-premium p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: 'linear-gradient(135deg, var(--brand-500), var(--brand-700))' }}>
              <span className="text-white font-bold text-3xl">A</span>
            </div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--gray-900)' }}>重置密码</h1>
            <p className="text-base mt-2" style={{ color: 'var(--gray-500)' }}>
              {success ? "您的密码已成功修改" : "请输入您的新密码"}
            </p>
          </div>

          {success ? (
            <div className="text-center">
              <div className="p-4 rounded-xl text-sm mb-6" style={{ background: '#DCFCE7', color: '#16A34A' }}>
                密码修改成功！请使用新密码登录。
              </div>
              <Link href="/auth/login" className="btn btn-primary w-full py-3 text-base">
                去登录
              </Link>
            </div>
          ) : error && !password ? (
            <div className="text-center">
              <div className="p-4 rounded-xl text-sm mb-6" style={{ background: '#FEE2E2', color: '#DC2626' }}>
                {error}
              </div>
              <Link href="/auth/login" className="btn btn-secondary w-full py-3 text-base">
                返回登录
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-4">
                <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--gray-700)' }}>新密码</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input py-3 w-full"
                  placeholder="请输入新密码（至少6个字符）"
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--gray-700)' }}>确认新密码</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleReset()}
                  className="input py-3 w-full"
                  placeholder="请再次输入新密码"
                />
              </div>

              {error && (
                <div className="mb-4 p-3 rounded-xl text-sm" style={{ background: '#FEE2E2', color: '#DC2626' }}>
                  {error}
                </div>
              )}

              <button
                onClick={handleReset}
                disabled={loading || !password || !confirmPassword}
                className="btn btn-primary w-full py-3 text-base"
              >
                {loading ? "修改中..." : "确认修改"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
