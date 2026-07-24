"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/Toast";

interface ProfileData {
  id: string;
  research_fields: string[];
  interests: string[];
  stats: {
    totalActivities: number;
    featureStats: Record<string, number>;
    monthlyActivity: Record<string, number>;
    paperCount: number;
  };
}

interface AcademicProfileProps {
  userId: string;
}

// 功能名称映射
const FEATURE_NAMES: Record<string, string> = {
  polish: "论文润色",
  translate: "学术翻译",
  abstract: "摘要生成",
  grant: "课题申报",
  "grant-topic": "选题建议",
  "grant-section": "章节生成",
  "grant-score": "申报书评分",
  literature: "文献搜索",
  "academic-recommend": "AI文献推荐",
  "academic-review": "文献综述",
  "academic-citation": "引用生成",
  "journal-search": "期刊搜索",
  "cover-letter": "投稿信",
  "format-check": "格式检查",
  rebuttal: "审稿回复",
};

export default function AcademicProfile({ userId }: AcademicProfileProps) {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [researchFields, setResearchFields] = useState("");
  const [interests, setInterests] = useState("");
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    loadProfile();
  }, [userId]);

  const loadProfile = async () => {
    try {
      const res = await fetch("/api/user/profile");
      const data = await res.json();
      if (data.success && data.profile) {
        setProfile(data.profile);
        setResearchFields((data.profile.research_fields || []).join("、"));
        setInterests((data.profile.interests || []).join("、"));
      }
    } catch (error) {
      console.error("加载档案失败:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          research_fields: researchFields.split(/[,，、]/).map((f) => f.trim()).filter(Boolean),
          interests: interests.split(/[,，、]/).map((i) => i.trim()).filter(Boolean),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setProfile(data.profile);
        setEditing(false);
        showToast("档案已更新", "success");
      }
    } catch (error) {
      showToast("更新失败", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleExport = async () => {
    try {
      const res = await fetch("/api/user/export");
      const data = await res.json();
      if (data.success) {
        const blob = new Blob([JSON.stringify(data.data, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `academic-writer-data-${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
        showToast("数据已导出", "success");
      }
    } catch (error) {
      showToast("导出失败", "error");
    }
  };

  if (loading) {
    return (
      <div className="card card-elevated p-6">
        <div className="flex items-center justify-center py-8">
          <div className="spinner"></div>
          <span className="ml-2" style={{ color: "var(--gray-500)" }}>加载中...</span>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="card card-elevated p-6">
        <div className="text-center py-8" style={{ color: "var(--gray-500)" }}>
          暂无档案数据
        </div>
      </div>
    );
  }

  // 计算总活动数
  const totalActivities = profile.stats?.totalActivities || 0;
  const featureStats = profile.stats?.featureStats || {};
  const paperCount = profile.stats?.paperCount || 0;

  // 排序功能使用次数
  const sortedFeatures = Object.entries(featureStats)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 6);

  return (
    <div className="space-y-6">
      {/* 学术档案卡片 */}
      <div className="card card-elevated p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #8B5CF6, #6D28D9)" }}>
              <span className="text-xl">👤</span>
            </div>
            <h3 className="text-lg font-bold" style={{ color: "var(--gray-900)" }}>我的学术档案</h3>
          </div>
          {!editing && (
            <button onClick={() => setEditing(true)} className="btn btn-secondary text-sm">
              ✏️ 编辑
            </button>
          )}
        </div>

        {editing ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: "var(--gray-700)" }}>
                研究领域（用顿号分隔）
              </label>
              <input
                type="text"
                value={researchFields}
                onChange={(e) => setResearchFields(e.target.value)}
                className="input"
                placeholder="如：人工智能、医学影像、深度学习"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: "var(--gray-700)" }}>
                兴趣标签（用顿号分隔）
              </label>
              <input
                type="text"
                value={interests}
                onChange={(e) => setInterests(e.target.value)}
                className="input"
                placeholder="如：论文写作、课题申报、文献综述"
              />
            </div>
            <div className="flex gap-2">
              <button onClick={handleSave} disabled={saving} className="btn btn-primary">
                {saving ? "保存中..." : "保存"}
              </button>
              <button onClick={() => setEditing(false)} className="btn btn-secondary">
                取消
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <div className="text-sm" style={{ color: "var(--gray-500)" }}>研究领域</div>
              <div className="flex flex-wrap gap-2 mt-1">
                {(profile.research_fields || []).length > 0 ? (
                  profile.research_fields.map((field, index) => (
                    <span key={index} className="px-3 py-1 rounded-full text-sm" style={{ background: "var(--brand-50)", color: "var(--brand-600)" }}>
                      {field}
                    </span>
                  ))
                ) : (
                  <span style={{ color: "var(--gray-400)" }}>未设置</span>
                )}
              </div>
            </div>
            <div>
              <div className="text-sm" style={{ color: "var(--gray-500)" }}>兴趣标签</div>
              <div className="flex flex-wrap gap-2 mt-1">
                {(profile.interests || []).length > 0 ? (
                  profile.interests.map((interest, index) => (
                    <span key={index} className="px-3 py-1 rounded-full text-sm" style={{ background: "#F3E8FF", color: "#7C3AED" }}>
                      {interest}
                    </span>
                  ))
                ) : (
                  <span style={{ color: "var(--gray-400)" }}>未设置</span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 使用统计卡片 */}
      <div className="card card-elevated p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #3B82F6, #1D4ED8)" }}>
            <span className="text-xl">📊</span>
          </div>
          <h3 className="text-lg font-bold" style={{ color: "var(--gray-900)" }}>使用统计</h3>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="p-4 rounded-xl text-center" style={{ background: "var(--gray-50)" }}>
            <div className="text-3xl font-bold" style={{ color: "var(--brand-600)" }}>
              {totalActivities}
            </div>
            <div className="text-sm" style={{ color: "var(--gray-500)" }}>总使用次数</div>
          </div>
          <div className="p-4 rounded-xl text-center" style={{ background: "var(--gray-50)" }}>
            <div className="text-3xl font-bold" style={{ color: "#8B5CF6" }}>
              {paperCount}
            </div>
            <div className="text-sm" style={{ color: "var(--gray-500)" }}>论文数</div>
          </div>
          <div className="p-4 rounded-xl text-center" style={{ background: "var(--gray-50)" }}>
            <div className="text-3xl font-bold" style={{ color: "#10B981" }}>
              {Object.keys(featureStats).length}
            </div>
            <div className="text-sm" style={{ color: "var(--gray-500)" }}>使用功能数</div>
          </div>
        </div>

        {/* 功能使用排行 */}
        {sortedFeatures.length > 0 && (
          <div>
            <div className="text-sm font-semibold mb-2" style={{ color: "var(--gray-700)" }}>常用功能</div>
            <div className="space-y-2">
              {sortedFeatures.map(([feature, count], index) => (
                <div key={feature} className="flex items-center gap-3">
                  <span className="text-sm font-medium" style={{ color: "var(--gray-600)", width: "80px" }}>
                    {FEATURE_NAMES[feature] || feature}
                  </span>
                  <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: "var(--gray-200)" }}>
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${(count / sortedFeatures[0][1]) * 100}%`,
                        background: index === 0 ? "var(--brand-600)" : index === 1 ? "#8B5CF6" : "#10B981",
                      }}
                    />
                  </div>
                  <span className="text-sm font-semibold" style={{ color: "var(--gray-700)", width: "40px" }}>
                    {count}次
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 数据导出 */}
      <div className="card card-elevated p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #10B981, #059669)" }}>
              <span className="text-xl">📤</span>
            </div>
            <div>
              <h3 className="text-lg font-bold" style={{ color: "var(--gray-900)" }}>数据导出</h3>
              <p className="text-sm" style={{ color: "var(--gray-500)" }}>导出您的所有学术数据</p>
            </div>
          </div>
          <button onClick={handleExport} className="btn btn-primary">
            📥 导出数据
          </button>
        </div>
      </div>
    </div>
  );
}
