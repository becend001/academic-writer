"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase/client";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [retryCount, setRetryCount] = useState(0);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const maxRetries = 2;
    let currentRetry = 0;

    const attemptLogin = async (): Promise<boolean> => {
      try {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          if (error.message.includes("Failed to fetch") && currentRetry < maxRetries) {
            currentRetry++;
            setRetryCount(currentRetry);
            await new Promise((resolve) => setTimeout(resolve, 1000));
            return attemptLogin();
          }
          setError(error.message);
          return false;
        }
        window.location.href = "/workspace";
        return true;
      } catch (err) {
        if (currentRetry < maxRetries) {
          currentRetry++;
          setRetryCount(currentRetry);
          await new Promise((resolve) => setTimeout(resolve, 1000));
          return attemptLogin();
        }
        setError("网络连接失败，请检查网络后重试");
        return false;
      }
    };

    await attemptLogin();
    setLoading(false);
    setRetryCount(0);
  };

  return (
    <form onSubmit={handleLogin} className="space-y-6">
      <div>
        <label className="block text-base font-semibold mb-3" style={{ color: 'var(--gray-700)' }}>邮箱</label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="input py-3.5 text-base"
          placeholder="请输入邮箱"
        />
      </div>

      <div>
        <label className="block text-base font-semibold mb-3" style={{ color: 'var(--gray-700)' }}>密码</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="input py-3.5 text-base"
          placeholder="请输入密码"
        />
      </div>

      {error && (
        <div className="p-4 rounded-xl text-base flex items-center gap-3" style={{ background: 'var(--color-grant-light)', color: 'var(--color-grant-dark)' }}>
          <span className="text-lg">⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {retryCount > 0 && (
        <div className="flex items-center gap-2 text-base" style={{ color: 'var(--gray-500)' }}>
          <div className="spinner" style={{ width: '16px', height: '16px', borderColor: 'var(--gray-300)', borderTopColor: 'var(--brand-500)' }}></div>
          <span>正在重试... ({retryCount}/2)</span>
        </div>
      )}

      <button 
        type="submit" 
        disabled={loading} 
        className="w-full py-4 text-lg font-bold rounded-xl transition-all"
        style={{ 
          background: 'linear-gradient(135deg, #2563EB, #1D4ED8)',
          color: '#FFFFFF',
          boxShadow: '0 4px 14px rgba(37, 99, 235, 0.4)'
        }}
      >
        {loading ? (
          <div className="flex items-center justify-center gap-3">
            <div className="spinner"></div>
            <span>登录中...</span>
          </div>
        ) : (
          '登录'
        )}
      </button>
    </form>
  );
}
