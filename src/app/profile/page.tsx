"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import { Navbar } from "@/components/ui/Navbar";
import AcademicProfile from "@/components/ui/AcademicProfile";
import PaperTimeline from "@/components/ui/PaperTimeline";
import { csrfFetch } from "@/lib/utils/csrf-fetch";

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState({ today: 0, total: 0 });
  const [documents, setDocuments] = useState<any[]>([]);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [whitelistEmail, setWhitelistEmail] = useState("");
  const [whitelistList, setWhitelistList] = useState<any[]>([]);
  const [whitelistError, setWhitelistError] = useState("");
  const [whitelistLoading, setWhitelistLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUser(user);
        loadStats();
        loadDocuments();
        loadWhitelist();
        checkAdmin();
      } else {
        window.location.href = "/auth/login";
      }
    });
  }, []);

  const checkAdmin = async () => {
    try {
      const res = await csrfFetch("/api/admin/check");
      const data = await res.json();
      setIsAdmin(data.isAdmin || false);
    } catch {}
  };

  const loadStats = async () => {
    try {
      const res = await csrfFetch("/api/usage");
      const data = await res.json();
      setStats(data || { today: 0, total: 0 });
    } catch {}
  };

  const loadDocuments = async () => {
    try {
      const res = await csrfFetch("/api/works?limit=10");
      const data = await res.json();
      setDocuments(data.works || []);
    } catch {}
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  const handlePasswordChange = async () => {
    setPasswordError("");
    setPasswordSuccess("");
    if (newPassword.length < 6) {
      setPasswordError("密码至少6个字符");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("两次输入的密码不一致");
      return;
    }
    setPasswordLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        setPasswordError(error.message || "修改失败，请重新登录后再试");
      } else {
        setPasswordSuccess("密码修改成功！");
        setNewPassword("");
        setConfirmPassword("");
        setTimeout(() => { setShowPasswordModal(false); setPasswordSuccess(""); }, 1500);
      }
    } catch {
      setPasswordError("修改失败，请稍后重试");
    }
    setPasswordLoading(false);
  };

  const loadWhitelist = async () => {
    try {
      const res = await csrfFetch("/api/admin/whitelist");
      const data = await res.json();
      setWhitelistList(data.list || []);
    } catch {}
  };

  const handleAddWhitelist = async () => {
    if (!whitelistEmail.trim()) return;
    setWhitelistError("");
    setWhitelistLoading(true);
    try {
      const res = await csrfFetch("/api/admin/whitelist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: whitelistEmail.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setWhitelistError(data.error);
      } else {
        setWhitelistEmail("");
        loadWhitelist();
      }
    } catch {
      setWhitelistError("添加失败");
    }
    setWhitelistLoading(false);
  };

  const handleRemoveWhitelist = async (id: string) => {
    try {
      await csrfFetch(`/api/admin/whitelist?id=${id}`, {
        method: "DELETE",
      });
      loadWhitelist();
    } catch {}
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-base)' }}>
        <div className="text-gray-500">加载中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-base)' }}>
      <Navbar activePage="profile" rightContent={<div className="text-base" style={{ color: 'var(--gray-500)' }}>{user.email}</div>} />

      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--gray-900)' }}>个人中心</h1>
          <p className="text-base" style={{ color: 'var(--gray-500)' }}>管理您的账号信息和使用数据</p>
        </div>

        {/* 用户信息卡片 */}
        <div className="card-premium p-8 mb-6">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold text-white" style={{ background: 'linear-gradient(135deg, var(--brand-500), var(--brand-700))' }}>
              {user.email?.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-xl font-bold" style={{ color: 'var(--gray-900)' }}>{user.email}</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="px-3 py-1 rounded-full text-xs font-semibold" style={{ background: 'var(--color-grammar-light)', color: 'var(--color-grammar-dark)' }}>免费版</span>
                <span className="text-sm" style={{ color: 'var(--gray-500)' }}>注册时间：{new Date(user.created_at).toLocaleDateString("zh-CN")}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 使用统计 */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="card-premium p-6">
            <div className="text-sm font-medium mb-2" style={{ color: 'var(--gray-500)' }}>今日使用</div>
            <div className="text-3xl font-bold" style={{ color: 'var(--gray-900)' }}>{stats.today}/3</div>
            <div className="mt-3 h-2 rounded-full overflow-hidden" style={{ background: 'var(--gray-200)' }}>
              <div className="h-full rounded-full transition-all" style={{ width: `${(stats.today / 3) * 100}%`, background: stats.today >= 3 ? 'var(--color-grant)' : 'var(--color-grammar)' }}></div>
            </div>
          </div>
          <div className="card-premium p-6">
            <div className="text-sm font-medium mb-2" style={{ color: 'var(--gray-500)' }}>累计使用</div>
            <div className="text-3xl font-bold" style={{ color: 'var(--gray-900)' }}>{stats.total}</div>
            <div className="mt-3 text-sm" style={{ color: 'var(--gray-400)' }}>次</div>
          </div>
        </div>

        {/* 当前套餐 */}
        <div className="card-premium p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--gray-900)' }}>当前套餐</h3>
          <div className="flex items-center justify-between p-4 rounded-xl" style={{ background: 'var(--gray-50)' }}>
            <div>
              <div className="text-lg font-bold" style={{ color: 'var(--gray-900)' }}>免费版</div>
              <div className="text-sm" style={{ color: 'var(--gray-500)' }}>每天3次使用</div>
            </div>
            <Link href="/#pricing" className="btn btn-primary text-sm px-4 py-2">升级套餐</Link>
          </div>
        </div>

        {/* 最近文档 */}
        <div className="card-premium p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--gray-900)' }}>最近文档</h3>
          {documents.length === 0 ? (
            <div className="text-center py-8" style={{ color: 'var(--gray-400)' }}>
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>📄</div>
              <div>暂无文档</div>
            </div>
          ) : (
            <div className="space-y-3">
              {documents.slice(0, 5).map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-3 rounded-xl" style={{ background: 'var(--gray-50)' }}>
                  <div>
                    <div className="text-sm font-medium" style={{ color: 'var(--gray-900)' }}>{doc.title}</div>
                    <div className="text-xs" style={{ color: 'var(--gray-400)' }}>{new Date(doc.created_at).toLocaleString("zh-CN")}</div>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full" style={{ background: 'var(--brand-100)', color: 'var(--brand-700)' }}>
                    {doc.feature}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 学术档案 */}
        <div className="mb-6">
          <AcademicProfile userId={user.id} />
        </div>

        {/* 论文时间线 */}
        <div className="mb-6">
          <PaperTimeline />
        </div>

        {/* 账号设置 */}
        <div className="card-premium p-6">
          <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--gray-900)' }}>账号设置</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 rounded-xl" style={{ background: 'var(--gray-50)' }}>
              <div>
                <div className="text-sm font-medium" style={{ color: 'var(--gray-900)' }}>修改密码</div>
                <div className="text-xs" style={{ color: 'var(--gray-400)' }}>更新您的登录密码</div>
              </div>
              <button onClick={() => { setShowPasswordModal(true); setPasswordError(""); setPasswordSuccess(""); }} className="text-sm font-medium" style={{ color: 'var(--brand-600)' }}>修改</button>
            </div>
            <div className="flex items-center justify-between p-4 rounded-xl" style={{ background: 'var(--gray-50)' }}>
              <div>
                <div className="text-sm font-medium" style={{ color: 'var(--gray-900)' }}>退出登录</div>
                <div className="text-xs" style={{ color: 'var(--gray-400)' }}>退出当前账号</div>
              </div>
              <button onClick={handleLogout} className="text-sm font-medium" style={{ color: 'var(--color-grant)' }}>退出</button>
            </div>
          </div>
        </div>

        {/* 管理员：白名单管理 */}
        {isAdmin && (
          <div className="card-premium p-6 mt-6">
            <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--gray-900)' }}>🔑 用户白名单管理</h3>
            <p className="text-sm mb-4" style={{ color: 'var(--gray-500)' }}>白名单内的用户不受每日使用次数限制</p>

            <div className="flex gap-3 mb-4">
              <input
                type="email"
                value={whitelistEmail}
                onChange={(e) => setWhitelistEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddWhitelist()}
                className="input flex-1 py-2.5"
                placeholder="输入邮箱地址添加到白名单"
              />
              <button
                onClick={handleAddWhitelist}
                disabled={whitelistLoading || !whitelistEmail.trim()}
                className="btn btn-primary px-6 py-2.5"
              >
                {whitelistLoading ? "添加中..." : "添加"}
              </button>
            </div>

            {whitelistError && (
              <div className="mb-3 p-2 rounded-lg text-sm" style={{ background: '#FEE2E2', color: '#DC2626' }}>
                {whitelistError}
              </div>
            )}

            {whitelistList.length === 0 ? (
              <div className="text-center py-6" style={{ color: 'var(--gray-400)' }}>
                暂无白名单用户
              </div>
            ) : (
              <div className="space-y-2">
                {whitelistList.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 rounded-xl" style={{ background: 'var(--gray-50)' }}>
                    <div className="flex items-center gap-3">
                      <span className="px-2 py-0.5 rounded text-xs font-semibold" style={{ background: '#DCFCE7', color: '#16A34A' }}>不限次数</span>
                      <span className="text-sm" style={{ color: 'var(--gray-900)' }}>{item.email}</span>
                    </div>
                    <button
                      onClick={() => handleRemoveWhitelist(item.id)}
                      className="text-sm font-medium"
                      style={{ color: 'var(--color-grant)' }}
                    >
                      移除
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>

      {/* 密码修改弹窗 */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.5)' }} onClick={() => setShowPasswordModal(false)}>
          <div className="w-full max-w-md mx-4 p-8 rounded-2xl" style={{ background: 'white', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }} onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold mb-6" style={{ color: 'var(--gray-900)' }}>修改密码</h3>

            <div className="mb-4">
              <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--gray-700)' }}>新密码</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
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
                className="input py-3 w-full"
                placeholder="请再次输入新密码"
              />
            </div>

            {passwordError && (
              <div className="mb-4 p-3 rounded-xl text-sm font-medium" style={{ background: '#FEE2E2', color: '#DC2626' }}>
                {passwordError}
              </div>
            )}

            {passwordSuccess && (
              <div className="mb-4 p-3 rounded-xl text-sm font-medium" style={{ background: '#DCFCE7', color: '#16A34A' }}>
                {passwordSuccess}
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={() => setShowPasswordModal(false)} className="btn btn-secondary flex-1 py-3">
                取消
              </button>
              <button onClick={handlePasswordChange} disabled={passwordLoading} className="btn btn-primary flex-1 py-3">
                {passwordLoading ? "修改中..." : "确认修改"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
