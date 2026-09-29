"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import { Navbar } from "@/components/ui/Navbar";
import { useToast } from "@/components/ui/Toast";

type TabType = "stats" | "settings" | "admin";

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState({ today: 0, total: 0 });
  const [documents, setDocuments] = useState<any[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("stats");
  const { showToast } = useToast();

  // 密码修改
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);

  // 白名单管理
  const [whitelistEmail, setWhitelistEmail] = useState("");
  const [whitelistList, setWhitelistList] = useState<any[]>([]);
  const [whitelistError, setWhitelistError] = useState("");
  const [whitelistLoading, setWhitelistLoading] = useState(false);

  // 用户管理
  const [adminUsers, setAdminUsers] = useState<any[]>([]);
  const [adminUsersLoading, setAdminUsersLoading] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [editLevel, setEditLevel] = useState("free");
  const [editExpires, setEditExpires] = useState("");
  const [userManageError, setUserManageError] = useState("");
  const [userManageSuccess, setUserManageSuccess] = useState("");
  const [adminStats, setAdminStats] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUser(user);
        loadStats();
        loadDocuments();
        loadWhitelist();
        checkAdmin();
        loadUserProfile();
      } else {
        window.location.href = "/auth/login";
      }
    });
  }, []);

  const loadUserProfile = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || "";
      const res = await fetch("/api/user/profile", {
        headers: { "Authorization": `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.profile) setUserProfile(data.profile);
    } catch {}
  };

  const checkAdmin = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || "";
      const res = await fetch("/api/admin/check", {
        headers: { "Authorization": `Bearer ${token}` },
      });
      const data = await res.json();
      setIsAdmin(data.isAdmin || false);
    } catch {}
  };

  const loadStats = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || "";
      const res = await fetch("/api/usage", {
        headers: { "Authorization": `Bearer ${token}` },
      });
      const data = await res.json();
      setStats(data || { today: 0, total: 0 });
    } catch {}
  };

  const loadDocuments = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || "";
      const res = await fetch("/api/works?limit=5", {
        headers: { "Authorization": `Bearer ${token}` },
      });
      const data = await res.json();
      setDocuments(data.works || []);
    } catch {}
  };

  const loadWhitelist = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || "";
      const res = await fetch("/api/admin/whitelist", {
        headers: { "Authorization": `Bearer ${token}` },
      });
      const data = await res.json();
      setWhitelistList(data.list || []);
    } catch {}
  };

  const loadAdminUsers = async () => {
    setAdminUsersLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || "";
      const res = await fetch("/api/admin/users", {
        headers: { "Authorization": `Bearer ${token}` },
      });
      const data = await res.json();
      setAdminUsers(data.users || []);
    } catch {}
    setAdminUsersLoading(false);
  };

  const loadAdminStats = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || "";
      const res = await fetch("/api/admin/stats", {
        headers: { "Authorization": `Bearer ${token}` },
      });
      const data = await res.json();
      setAdminStats(data);
    } catch {}
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  const handlePasswordChange = async () => {
    setPasswordError("");
    if (newPassword.length < 6) { setPasswordError("密码至少6个字符"); return; }
    if (newPassword !== confirmPassword) { setPasswordError("两次输入的密码不一致"); return; }
    setPasswordLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        setPasswordError(error.message || "修改失败");
      } else {
        showToast("密码修改成功！");
        setNewPassword("");
        setConfirmPassword("");
        setTimeout(() => setShowPasswordModal(false), 1500);
      }
    } catch {
      setPasswordError("修改失败，请稍后重试");
    }
    setPasswordLoading(false);
  };

  const handleAddWhitelist = async () => {
    if (!whitelistEmail.trim()) return;
    setWhitelistError("");
    setWhitelistLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || "";
      const res = await fetch("/api/admin/whitelist", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ email: whitelistEmail.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setWhitelistError(data.error); }
      else { setWhitelistEmail(""); loadWhitelist(); showToast("添加成功"); }
    } catch { setWhitelistError("添加失败"); }
    setWhitelistLoading(false);
  };

  const handleRemoveWhitelist = async (id: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || "";
      await fetch(`/api/admin/whitelist?id=${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` },
      });
      loadWhitelist();
    } catch {}
  };

  const handleUpdateUser = async () => {
    if (!editingUser) return;
    setUserManageError("");
    setUserManageSuccess("");
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || "";
      const res = await fetch("/api/admin/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({
          userId: editingUser.user_id,
          membershipLevel: editLevel,
          isPaid: editLevel !== "free",
          expiresAt: editExpires ? new Date(editExpires).toISOString() : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setUserManageError(data.error); }
      else {
        setUserManageSuccess("更新成功！");
        setEditingUser(null);
        loadAdminUsers();
        setTimeout(() => setUserManageSuccess(""), 2000);
      }
    } catch { setUserManageError("更新失败"); }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-base)' }}>
        <div className="text-gray-500">加载中...</div>
      </div>
    );
  }

  const tabs: { id: TabType; label: string; icon: string }[] = [
    { id: "stats", label: "使用统计", icon: "📊" },
    { id: "settings", label: "账号设置", icon: "⚙️" },
    ...(isAdmin ? [{ id: "admin" as TabType, label: "管理后台", icon: "🔧" }] : []),
  ];

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-base)' }}>
      <Navbar activePage="profile" rightContent={<div className="text-base" style={{ color: 'var(--gray-500)' }}>{user.email}</div>} />

      <div className="max-w-6xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold mb-8" style={{ color: 'var(--gray-900)' }}>个人中心</h1>

        <div className="flex gap-6">
          {/* 左侧：用户信息卡 */}
          <div className="w-80 flex-shrink-0">
            <div className="card-premium p-6">
              <div className="text-center mb-6">
                <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-3xl font-bold text-white mx-auto mb-4" style={{ background: 'linear-gradient(135deg, var(--brand-500), var(--brand-700))' }}>
                  {user.email?.charAt(0).toUpperCase()}
                </div>
                <h2 className="text-lg font-bold" style={{ color: 'var(--gray-900)' }}>{user.email}</h2>
                <div className="flex items-center justify-center gap-2 mt-2">
                  <span
                    className="px-3 py-1 rounded-full text-xs font-semibold"
                    style={{
                      background: userProfile?.membership_level === 'professional' ? '#EDE9FE' : userProfile?.membership_level === 'teacher' ? '#DBEAFE' : 'var(--color-grammar-light)',
                      color: userProfile?.membership_level === 'professional' ? '#7C3AED' : userProfile?.membership_level === 'teacher' ? '#1D4ED8' : 'var(--color-grammar-dark)',
                    }}
                  >
                    {userProfile?.membership_level === 'professional' ? '专业版' : userProfile?.membership_level === 'teacher' ? '教师版' : '免费版'}
                  </span>
                  {userProfile?.is_paid && userProfile?.expires_at && (
                    <span className="text-xs" style={{ color: 'var(--gray-400)' }}>
                      有效期至 {new Date(userProfile.expires_at).toLocaleDateString("zh-CN")}
                    </span>
                  )}
                </div>
                <div className="text-sm mt-2" style={{ color: 'var(--gray-400)' }}>
                  注册时间：{user.created_at ? new Date(user.created_at).toLocaleDateString("zh-CN") : "-"}
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => setShowPasswordModal(true)}
                  className="w-full py-2.5 rounded-lg text-sm font-medium transition-colors"
                  style={{ background: 'var(--gray-100)', color: 'var(--gray-700)' }}
                >
                  🔒 修改密码
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full py-2.5 rounded-lg text-sm font-medium transition-colors"
                  style={{ background: '#FEE2E2', color: '#DC2626' }}
                >
                  🚪 退出登录
                </button>
              </div>
            </div>
          </div>

          {/* 右侧：Tab内容 */}
          <div className="flex-1">
            {/* Tab导航 */}
            <div className="flex gap-1 p-1 rounded-xl mb-6" style={{ background: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', border: '1px solid var(--border-subtle)' }}>
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => { setActiveTab(tab.id); if (tab.id === "admin" && isAdmin) { loadAdminStats(); } }}
                  className="flex-1 py-3 px-4 rounded-lg text-base font-semibold transition-all"
                  style={{
                    background: activeTab === tab.id ? 'var(--brand-50)' : 'transparent',
                    color: activeTab === tab.id ? 'var(--brand-700)' : 'var(--gray-500)',
                    boxShadow: activeTab === tab.id ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                  }}
                >
                  {tab.icon} {tab.label}
                </button>
              ))}
            </div>

            {/* Tab 1: 使用统计 */}
            {activeTab === "stats" && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="card-premium p-6">
                    <div className="text-sm font-medium mb-2" style={{ color: 'var(--gray-500)' }}>今日使用</div>
                    <div className="text-3xl font-bold" style={{ color: 'var(--gray-900)' }}>{stats.today}/3</div>
                    <div className="mt-3 h-2 rounded-full overflow-hidden" style={{ background: 'var(--gray-200)' }}>
                      <div className="h-full rounded-full transition-all" style={{ width: `${Math.min((stats.today / 3) * 100, 100)}%`, background: stats.today >= 3 ? 'var(--color-grant)' : 'var(--color-grammar)' }}></div>
                    </div>
                  </div>
                  <div className="card-premium p-6">
                    <div className="text-sm font-medium mb-2" style={{ color: 'var(--gray-500)' }}>累计使用</div>
                    <div className="text-3xl font-bold" style={{ color: 'var(--gray-900)' }}>{stats.total}</div>
                    <div className="mt-3 text-sm" style={{ color: 'var(--gray-400)' }}>次</div>
                  </div>
                </div>

                <div className="card-premium p-6">
                  <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--gray-900)' }}>当前套餐</h3>
                  <div className="flex items-center justify-between p-4 rounded-xl" style={{ background: 'var(--gray-50)' }}>
                    <div>
                      <div className="text-lg font-bold" style={{ color: 'var(--gray-900)' }}>
                        {userProfile?.membership_level === 'professional' ? '专业版' : userProfile?.membership_level === 'teacher' ? '教师版' : '免费版'}
                      </div>
                      <div className="text-sm" style={{ color: 'var(--gray-500)' }}>
                        {userProfile?.is_paid
                          ? `有效期至 ${userProfile?.expires_at ? new Date(userProfile.expires_at).toLocaleDateString("zh-CN") : "长期"}`
                          : "每天3次使用"}
                      </div>
                    </div>
                    {!userProfile?.is_paid && <Link href="/#pricing" className="btn btn-primary text-sm px-4 py-2">升级套餐</Link>}
                  </div>
                </div>

                <div className="card-premium p-6">
                  <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--gray-900)' }}>最近文档</h3>
                  {documents.length === 0 ? (
                    <div className="text-center py-8" style={{ color: 'var(--gray-400)' }}>
                      <div style={{ fontSize: '32px', marginBottom: '8px' }}>📄</div>
                      <div>暂无文档</div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {documents.map((doc) => (
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
              </div>
            )}

            {/* Tab 2: 账号设置 */}
            {activeTab === "settings" && (
              <div className="space-y-6">
                <div className="card-premium p-6">
                  <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--gray-900)' }}>账号信息</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 rounded-xl" style={{ background: 'var(--gray-50)' }}>
                      <div>
                        <div className="text-sm font-medium" style={{ color: 'var(--gray-900)' }}>邮箱</div>
                        <div className="text-sm" style={{ color: 'var(--gray-500)' }}>{user.email}</div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-4 rounded-xl" style={{ background: 'var(--gray-50)' }}>
                      <div>
                        <div className="text-sm font-medium" style={{ color: 'var(--gray-900)' }}>修改密码</div>
                        <div className="text-xs" style={{ color: 'var(--gray-400)' }}>更新您的登录密码</div>
                      </div>
                      <button onClick={() => setShowPasswordModal(true)} className="text-sm font-medium" style={{ color: 'var(--brand-600)' }}>修改</button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 3: 管理后台（仅管理员） */}
            {activeTab === "admin" && isAdmin && (
              <div className="space-y-6">
                {/* 数据仪表盘 */}
                {adminStats && (
                  <div className="card-premium p-6">
                    <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--gray-900)' }}>📊 数据概览</h3>
                    <div className="grid grid-cols-3 gap-4 mb-6">
                      <div className="p-4 rounded-xl" style={{ background: 'var(--gray-50)' }}>
                        <div className="text-sm" style={{ color: 'var(--gray-500)' }}>总用户数</div>
                        <div className="text-2xl font-bold" style={{ color: 'var(--gray-900)' }}>{adminStats.totalUsers}</div>
                      </div>
                      <div className="p-4 rounded-xl" style={{ background: 'var(--gray-50)' }}>
                        <div className="text-sm" style={{ color: 'var(--gray-500)' }}>今日活跃</div>
                        <div className="text-2xl font-bold" style={{ color: 'var(--brand-600)' }}>{adminStats.todayActiveUsers}</div>
                      </div>
                      <div className="p-4 rounded-xl" style={{ background: 'var(--gray-50)' }}>
                        <div className="text-sm" style={{ color: 'var(--gray-500)' }}>今日AI调用</div>
                        <div className="text-2xl font-bold" style={{ color: 'var(--brand-600)' }}>{adminStats.todayCallCount}</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="p-4 rounded-xl" style={{ background: '#DCFCE7' }}>
                        <div className="text-sm" style={{ color: '#16A34A' }}>付费用户</div>
                        <div className="text-2xl font-bold" style={{ color: '#16A34A' }}>{adminStats.paidUsers}</div>
                      </div>
                      <div className="p-4 rounded-xl" style={{ background: 'var(--gray-50)' }}>
                        <div className="text-sm" style={{ color: 'var(--gray-500)' }}>免费用户</div>
                        <div className="text-2xl font-bold" style={{ color: 'var(--gray-700)' }}>{adminStats.freeUsers}</div>
                      </div>
                    </div>

                    {adminStats.recentUsers?.length > 0 && (
                      <div>
                        <div className="text-sm font-semibold mb-2" style={{ color: 'var(--gray-600)' }}>最近注册</div>
                        <div className="space-y-2">
                          {adminStats.recentUsers.map((u: any, i: number) => (
                            <div key={i} className="flex items-center justify-between p-2 rounded-lg" style={{ background: 'var(--gray-50)' }}>
                              <span className="text-sm" style={{ color: 'var(--gray-900)' }}>{u.email}</span>
                              <div className="flex items-center gap-2">
                                <span className="text-xs" style={{ color: 'var(--gray-400)' }}>{new Date(u.created_at).toLocaleDateString("zh-CN")}</span>
                                {u.is_paid && <span className="px-2 py-0.5 rounded text-xs" style={{ background: '#DCFCE7', color: '#16A34A' }}>付费</span>}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* 白名单管理 */}
                <div className="card-premium p-6">
                  <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--gray-900)' }}>🔑 白名单管理</h3>
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
                    <button onClick={handleAddWhitelist} disabled={whitelistLoading || !whitelistEmail.trim()} className="btn btn-primary px-6 py-2.5">
                      {whitelistLoading ? "添加中..." : "添加"}
                    </button>
                  </div>

                  {whitelistError && <div className="mb-3 p-2 rounded-lg text-sm" style={{ background: '#FEE2E2', color: '#DC2626' }}>{whitelistError}</div>}

                  {whitelistList.length === 0 ? (
                    <div className="text-center py-4" style={{ color: 'var(--gray-400)' }}>暂无白名单用户</div>
                  ) : (
                    <div className="space-y-2">
                      {whitelistList.map((item) => (
                        <div key={item.id} className="flex items-center justify-between p-3 rounded-xl" style={{ background: 'var(--gray-50)' }}>
                          <div className="flex items-center gap-3">
                            <span className="px-2 py-0.5 rounded text-xs font-semibold" style={{ background: '#DCFCE7', color: '#16A34A' }}>不限次数</span>
                            <span className="text-sm" style={{ color: 'var(--gray-900)' }}>{item.email}</span>
                          </div>
                          <button onClick={() => handleRemoveWhitelist(item.id)} className="text-sm font-medium" style={{ color: 'var(--color-grant)' }}>移除</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 用户管理 */}
                <div className="card-premium p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold" style={{ color: 'var(--gray-900)' }}>👥 用户管理</h3>
                    <button onClick={loadAdminUsers} className="btn btn-secondary px-4 py-2 text-sm">
                      {adminUsersLoading ? "加载中..." : "刷新列表"}
                    </button>
                  </div>

                  {userManageError && <div className="mb-3 p-2 rounded-lg text-sm" style={{ background: '#FEE2E2', color: '#DC2626' }}>{userManageError}</div>}
                  {userManageSuccess && <div className="mb-3 p-2 rounded-lg text-sm" style={{ background: '#DCFCE7', color: '#16A34A' }}>{userManageSuccess}</div>}

                  {adminUsers.length === 0 ? (
                    <div className="text-center py-6" style={{ color: 'var(--gray-400)' }}>
                      {adminUsersLoading ? "加载中..." : "暂无数据，点击\"刷新列表\"加载"}
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr style={{ background: 'var(--gray-50)' }}>
                            <th className="px-3 py-2.5 text-left font-semibold" style={{ color: 'var(--gray-600)' }}>邮箱</th>
                            <th className="px-3 py-2.5 text-center font-semibold" style={{ color: 'var(--gray-600)' }}>注册时间</th>
                            <th className="px-3 py-2.5 text-center font-semibold" style={{ color: 'var(--gray-600)' }}>今日用量</th>
                            <th className="px-3 py-2.5 text-center font-semibold" style={{ color: 'var(--gray-600)' }}>累计用量</th>
                            <th className="px-3 py-2.5 text-center font-semibold" style={{ color: 'var(--gray-600)' }}>会员等级</th>
                            <th className="px-3 py-2.5 text-center font-semibold" style={{ color: 'var(--gray-600)' }}>付费状态</th>
                            <th className="px-3 py-2.5 text-center font-semibold" style={{ color: 'var(--gray-600)' }}>有效期</th>
                            <th className="px-3 py-2.5 text-center font-semibold" style={{ color: 'var(--gray-600)' }}>操作</th>
                          </tr>
                        </thead>
                        <tbody>
                          {adminUsers.map((u) => (
                            <tr key={u.user_id} className="border-t" style={{ borderColor: 'var(--border-subtle)' }}>
                              <td className="px-3 py-2.5" style={{ color: 'var(--gray-900)' }}>{u.email}</td>
                              <td className="px-3 py-2.5 text-center" style={{ color: 'var(--gray-500)' }}>{u.created_at ? new Date(u.created_at).toLocaleDateString("zh-CN") : "-"}</td>
                              <td className="px-3 py-2.5 text-center" style={{ color: 'var(--gray-700)' }}>{u.todayUsage || 0}</td>
                              <td className="px-3 py-2.5 text-center" style={{ color: 'var(--gray-700)' }}>{u.totalUsage || 0}</td>
                              <td className="px-3 py-2.5 text-center">
                                <span className="px-2 py-0.5 rounded text-xs font-semibold" style={{
                                  background: u.membership_level === 'professional' ? '#EDE9FE' : u.membership_level === 'teacher' ? '#DBEAFE' : '#F3F4F6',
                                  color: u.membership_level === 'professional' ? '#7C3AED' : u.membership_level === 'teacher' ? '#1D4ED8' : '#6B7280',
                                }}>
                                  {u.membership_level === 'professional' ? '专业版' : u.membership_level === 'teacher' ? '教师版' : '免费'}
                                </span>
                              </td>
                              <td className="px-3 py-2.5 text-center">
                                <span className="px-2 py-0.5 rounded text-xs font-semibold" style={{
                                  background: u.is_paid ? '#DCFCE7' : '#F3F4F6',
                                  color: u.is_paid ? '#16A34A' : '#6B7280',
                                }}>
                                  {u.is_paid ? '已付费' : '未付费'}
                                </span>
                              </td>
                              <td className="px-3 py-2.5 text-center" style={{ color: 'var(--gray-500)' }}>{u.expires_at ? new Date(u.expires_at).toLocaleDateString("zh-CN") : "-"}</td>
                              <td className="px-3 py-2.5 text-center">
                                <button onClick={() => { setEditingUser(u); setEditLevel(u.membership_level || "free"); setEditExpires(u.expires_at ? u.expires_at.substring(0, 10) : ""); }} className="text-sm font-medium" style={{ color: 'var(--brand-600)' }}>
                                  编辑
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 密码修改弹窗 */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.5)' }} onClick={() => setShowPasswordModal(false)}>
          <div className="w-full max-w-md mx-4 p-8 rounded-2xl" style={{ background: 'white', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }} onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold mb-6" style={{ color: 'var(--gray-900)' }}>修改密码</h3>
            <div className="mb-4">
              <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--gray-700)' }}>新密码</label>
              <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="input py-3 w-full" placeholder="请输入新密码（至少6个字符）" />
            </div>
            <div className="mb-6">
              <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--gray-700)' }}>确认新密码</label>
              <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="input py-3 w-full" placeholder="请再次输入新密码" />
            </div>
            {passwordError && <div className="mb-4 p-3 rounded-xl text-sm" style={{ background: '#FEE2E2', color: '#DC2626' }}>{passwordError}</div>}
            <div className="flex gap-3">
              <button onClick={() => setShowPasswordModal(false)} className="btn btn-secondary flex-1 py-3">取消</button>
              <button onClick={handlePasswordChange} disabled={passwordLoading} className="btn btn-primary flex-1 py-3">
                {passwordLoading ? "修改中..." : "确认修改"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 会员编辑弹窗 */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.5)' }} onClick={() => setEditingUser(null)}>
          <div className="w-full max-w-md mx-4 p-8 rounded-2xl" style={{ background: 'white', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }} onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--gray-900)' }}>编辑会员信息</h3>
            <p className="text-sm mb-6" style={{ color: 'var(--gray-500)' }}>{editingUser.email}</p>
            <div className="mb-4">
              <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--gray-700)' }}>会员等级</label>
              <select value={editLevel} onChange={(e) => setEditLevel(e.target.value)} className="input py-3 w-full">
                <option value="free">免费版</option>
                <option value="teacher">教师版</option>
                <option value="professional">专业版</option>
              </select>
            </div>
            <div className="mb-6">
              <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--gray-700)' }}>有效期至</label>
              <input type="date" value={editExpires} onChange={(e) => setEditExpires(e.target.value)} className="input py-3 w-full" />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setEditingUser(null)} className="btn btn-secondary flex-1 py-3">取消</button>
              <button onClick={handleUpdateUser} className="btn btn-primary flex-1 py-3">保存</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
