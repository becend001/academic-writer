"use client";

import Link from "next/link";
import { useState } from "react";
import { LoginForm } from "@/components/auth/LoginForm";
import { useToast } from "@/components/ui/Toast";
import { supabase } from "@/lib/supabase/client";

export default function LoginPage() {
  const { showToast } = useToast();
  const [showReset, setShowReset] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const handleResetPassword = async () => {
    if (!resetEmail.trim()) return;
    setResetLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail.trim(), {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });
      if (error) {
        showToast(error.message, "error");
      } else {
        setResetSent(true);
      }
    } catch {
      showToast("发送失败，请稍后重试", "error");
    }
    setResetLoading(false);
  };

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--bg-base)' }}>
      {/* 左侧：品牌展示 */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, var(--brand-600) 0%, var(--brand-800) 100%)' }}>
        <div className="absolute inset-0" style={{ background: 'radial-gradient(circle at 30% 50%, rgba(255,255,255,0.1) 0%, transparent 50%)' }}></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full opacity-20" style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%)' }}></div>
        
        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-20">
          <div className="flex items-center gap-4 mb-10">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.3)' }}>
              <span className="text-white font-bold text-3xl">A</span>
            </div>
            <span className="text-3xl font-bold text-white">学术写作助手</span>
          </div>
          
          <h1 className="text-4xl xl:text-5xl font-bold text-white mb-6" style={{ letterSpacing: '-0.02em', lineHeight: '1.2' }}>
            专为中国高校教师设计的<br />AI学术写作平台
          </h1>
          
          <p className="text-xl mb-10" style={{ color: 'rgba(255,255,255,0.9)', lineHeight: '1.8' }}>
            润色 · 翻译 · 摘要 · 关键词 · 语法检查 · 文献搜索 · 课题申报
          </p>
          
          <div className="space-y-5">
            {[
              { text: "一键提升论文表达质量" },
              { text: "中英互译，术语精准" },
              { text: "智能生成结构化摘要" },
              { text: "课题申报辅助（独家）" },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.25)', border: '1px solid rgba(255,255,255,0.3)' }}>
                  <span className="text-lg font-bold" style={{ color: 'white' }}>✓</span>
                </div>
                <span className="text-lg font-semibold" style={{ color: 'white' }}>{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 右侧：登录表单 */}
      <div className="flex-1 flex flex-col justify-center px-6 py-12 sm:px-12 lg:px-16 xl:px-24">
        <div className="mx-auto w-full max-w-lg">
          {/* Logo（移动端显示） */}
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, var(--brand-500), var(--brand-700))', boxShadow: '0 4px 12px rgba(37, 99, 235, 0.35)' }}>
              <span className="text-white font-bold text-2xl">A</span>
            </div>
            <span className="text-2xl font-bold" style={{ color: 'var(--gray-900)' }}>学术写作助手</span>
          </div>

          <h2 className="text-4xl font-bold mb-3" style={{ color: 'var(--gray-900)', letterSpacing: '-0.02em' }}>欢迎回来</h2>
          <p className="mb-10" style={{ color: 'var(--gray-600)', fontSize: '18px' }}>
            还没有账号？{" "}
            <Link href="/auth/register" className="font-semibold" style={{ color: 'var(--brand-600)' }}>免费注册</Link>
          </p>

          <LoginForm />

          <div className="text-right mt-3">
            <button
              type="button"
              onClick={() => { setShowReset(true); setResetSent(false); setResetEmail(""); }}
              className="text-sm font-medium"
              style={{ color: 'var(--brand-600)' }}
            >
              忘记密码？
            </button>
          </div>

          <div className="mt-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full" style={{ borderTop: '1px solid var(--border-default)' }} />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 font-medium" style={{ background: 'var(--bg-base)', color: 'var(--gray-500)', fontSize: '15px' }}>或</span>
              </div>
            </div>

            <div className="mt-8">
              <button type="button" onClick={() => showToast("微信登录功能即将上线", "info")} className="w-full btn btn-secondary py-3.5 text-base">
                <span className="text-lg">📱</span>
                <span>微信登录</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 忘记密码弹窗 */}
      {showReset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.5)' }} onClick={() => setShowReset(false)}>
          <div className="w-full max-w-md mx-4 p-8 rounded-2xl" style={{ background: 'white', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }} onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--gray-900)' }}>重置密码</h3>
            <p className="text-sm mb-6" style={{ color: 'var(--gray-500)' }}>
              {resetSent ? "重置邮件已发送，请查收邮箱" : "输入您的注册邮箱，我们将发送重置密码链接"}
            </p>

            {resetSent ? (
              <div className="p-4 rounded-xl text-sm" style={{ background: '#DCFCE7', color: '#16A34A' }}>
                请检查您的邮箱（包括垃圾邮件箱），点击邮件中的链接重置密码。
              </div>
            ) : (
              <>
                <div className="mb-6">
                  <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--gray-700)' }}>邮箱</label>
                  <input
                    type="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleResetPassword()}
                    className="input py-3 w-full"
                    placeholder="请输入注册邮箱"
                  />
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setShowReset(false)} className="btn btn-secondary flex-1 py-3">
                    取消
                  </button>
                  <button
                    onClick={handleResetPassword}
                    disabled={resetLoading || !resetEmail.trim()}
                    className="btn btn-primary flex-1 py-3"
                  >
                    {resetLoading ? "发送中..." : "发送重置链接"}
                  </button>
                </div>
              </>
            )}

            {resetSent && (
              <button onClick={() => setShowReset(false)} className="btn btn-secondary w-full py-3 mt-4">
                知道了
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
