"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase/client";

export function RegisterForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (password !== confirmPassword) {
      setError("两次输入的密码不一致");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("密码至少需要6位");
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.signUp({ email, password });

    if (error) {
      setError(error.message);
    } else {
      setSuccess(true);
    }

    setLoading(false);
  };

  if (success) {
    return (
      <div className="text-center py-12">
        <div className="w-20 h-20 mx-auto mb-6 rounded-2xl flex items-center justify-center" style={{ background: 'var(--color-grammar-light)' }}>
          <span className="text-4xl">✉️</span>
        </div>
        <h3 className="text-2xl font-bold mb-3" style={{ color: 'var(--gray-900)' }}>注册成功！</h3>
        <p className="text-lg" style={{ color: 'var(--gray-500)' }}>请检查您的邮箱，点击验证链接完成注册</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleRegister} className="space-y-6">
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
          placeholder="请输入密码（至少6位）"
        />
      </div>

      <div>
        <label className="block text-base font-semibold mb-3" style={{ color: 'var(--gray-700)' }}>确认密码</label>
        <input
          id="confirmPassword"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          className="input py-3.5 text-base"
          placeholder="请再次输入密码"
        />
      </div>

      {error && (
        <div className="p-4 rounded-xl text-base flex items-center gap-3" style={{ background: 'var(--color-grant-light)', color: 'var(--color-grant-dark)' }}>
          <span className="text-lg">⚠️</span>
          <span>{error}</span>
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
            <span>注册中...</span>
          </div>
        ) : (
          '注册'
        )}
      </button>
    </form>
  );
}
