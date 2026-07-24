"use client";

import { useState } from "react";
import { useToast } from "@/components/ui/Toast";

interface Journal {
  name: string;
  publisher: string;
  impactFactor: number;
  quartile: string;
  chinesePartition: string;
  acceptanceRate: number;
  reviewTime: string;
  openAccess: boolean;
  matchScore: number;
  matchReason: string;
}

interface JournalRecommendationProps {
  todayUsage?: number;
  usageLimit?: number;
  whitelisted?: boolean;
  onUsageConsumed?: () => void;
}

// 获取分区颜色
function getQuartileColor(quartile: string): string {
  switch (quartile) {
    case "Q1":
      return "#10B981";
    case "Q2":
      return "#3B82F6";
    case "Q3":
      return "#F59E0B";
    case "Q4":
      return "#EF4444";
    default:
      return "#6B7280";
  }
}

// 获取匹配度颜色
function getMatchColor(score: number): string {
  if (score >= 90) return "#10B981";
  if (score >= 70) return "#3B82F6";
  if (score >= 50) return "#F59E0B";
  return "#EF4444";
}

export default function JournalRecommendation({
  todayUsage = 0,
  usageLimit = 3,
  whitelisted = false,
  onUsageConsumed,
}: JournalRecommendationProps) {
  const [title, setTitle] = useState("");
  const [abstract, setAbstract] = useState("");
  const [keywords, setKeywords] = useState("");
  const [field, setField] = useState("");
  const [targetIF, setTargetIF] = useState("");
  const [targetQuartile, setTargetQuartile] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Journal[]>([]);
  const [error, setError] = useState("");
  const { showToast } = useToast();

  const checkUsage = () => {
    if (whitelisted) return true;
    if (todayUsage >= usageLimit) {
      showToast(`今日免费次数已用完（${usageLimit}次），请升级Pro版`, "error");
      return false;
    }
    return true;
  };

  const handleSearch = async () => {
    if (!checkUsage()) return;

    if (!title && !abstract) {
      showToast("请提供论文标题或摘要", "error");
      return;
    }

    setLoading(true);
    setError("");
    setResults([]);

    try {
      const res = await fetch("/api/academic/journal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          abstract,
          keywords: keywords.split(/[,，]/).map((k) => k.trim()).filter(Boolean),
          field,
          targetIF: targetIF ? parseFloat(targetIF) : undefined,
          targetQuartile: targetQuartile || undefined,
        }),
      });

      const data = await res.json();

      if (data.error) {
        setError(data.error);
        showToast(data.error, "error");
      } else if (data.recommendations) {
        setResults(data.recommendations);
        onUsageConsumed?.();
        if (data.recommendations.length === 0) {
          setError("未找到合适的期刊，请尝试调整搜索条件");
        }
      }
    } catch (err) {
      setError("搜索失败，请重试");
      showToast("搜索失败，请重试", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyJournal = (journal: Journal) => {
    const text = `${journal.name} | IF: ${journal.impactFactor} | ${journal.quartile} | ${journal.chinesePartition}`;
    navigator.clipboard.writeText(text);
    showToast("已复制期刊信息", "success");
  };

  return (
    <div className="space-y-6">
      {/* 搜索表单 */}
      <div className="card card-elevated p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #8B5CF6, #6D28D9)" }}>
            <span className="text-xl">📚</span>
          </div>
          <div>
            <h2 className="text-xl font-bold" style={{ color: "var(--gray-900)" }}>期刊推荐</h2>
            <p className="text-sm" style={{ color: "var(--gray-500)" }}>根据论文内容推荐合适的投稿期刊</p>
          </div>
        </div>

        <div className="space-y-4">
          {/* 论文标题 */}
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: "var(--gray-700)" }}>
              论文标题 <span style={{ color: "var(--gray-400)" }}>*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input"
              placeholder="请输入论文标题"
            />
          </div>

          {/* 摘要 */}
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: "var(--gray-700)" }}>
              摘要
            </label>
            <textarea
              value={abstract}
              onChange={(e) => setAbstract(e.target.value)}
              className="textarea h-24"
              placeholder="请输入论文摘要（可选）"
            />
          </div>

          {/* 关键词和研究领域 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: "var(--gray-700)" }}>
                关键词
              </label>
              <input
                type="text"
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                className="input"
                placeholder="用逗号分隔，如：深度学习,医学影像"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: "var(--gray-700)" }}>
                研究领域
              </label>
              <input
                type="text"
                value={field}
                onChange={(e) => setField(e.target.value)}
                className="input"
                placeholder="如：计算机科学、医学"
              />
            </div>
          </div>

          {/* 筛选条件 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: "var(--gray-700)" }}>
                目标影响因子（可选）
              </label>
              <input
                type="number"
                value={targetIF}
                onChange={(e) => setTargetIF(e.target.value)}
                className="input"
                placeholder="如：3.0"
                step="0.1"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: "var(--gray-700)" }}>
                目标分区（可选）
              </label>
              <select
                value={targetQuartile}
                onChange={(e) => setTargetQuartile(e.target.value)}
                className="input"
              >
                <option value="">不限</option>
                <option value="Q1">Q1</option>
                <option value="Q2">Q2</option>
                <option value="Q3">Q3</option>
                <option value="Q4">Q4</option>
              </select>
            </div>
          </div>

          {/* 搜索按钮 */}
          <button
            onClick={handleSearch}
            disabled={loading || (!title && !abstract)}
            className="btn btn-primary w-full"
          >
            {loading ? (
              <>
                <div className="spinner"></div>
                <span>推荐中...</span>
              </>
            ) : (
              <>
                <span>🔍</span>
                <span>获取期刊推荐</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="p-4 rounded-xl" style={{ background: "#FEE2E2", color: "#DC2626" }}>
          {error}
        </div>
      )}

      {/* 结果列表 */}
      {results.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold" style={{ color: "var(--gray-900)" }}>
              推荐结果（共 {results.length} 个）
            </h3>
          </div>

          {results.map((journal, index) => (
            <div
              key={index}
              className="card card-elevated p-5 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-lg font-bold" style={{ color: "var(--gray-900)" }}>
                      {journal.name}
                    </h4>
                    {journal.openAccess && (
                      <span className="px-2 py-0.5 rounded text-xs font-semibold" style={{ background: "#ECFDF5", color: "#10B981" }}>
                        OA
                      </span>
                    )}
                  </div>
                  <p className="text-sm" style={{ color: "var(--gray-500)" }}>
                    {journal.publisher}
                  </p>
                </div>

                {/* 匹配度 */}
                <div className="flex items-center gap-2">
                  <span className="text-sm" style={{ color: "var(--gray-500)" }}>匹配度</span>
                  <span
                    className="text-2xl font-bold"
                    style={{ color: getMatchColor(journal.matchScore) }}
                  >
                    {journal.matchScore}%
                  </span>
                </div>
              </div>

              {/* 期刊指标 */}
              <div className="grid grid-cols-4 gap-3 mb-3">
                <div className="p-2 rounded-lg" style={{ background: "var(--gray-50)" }}>
                  <div className="text-xs" style={{ color: "var(--gray-500)" }}>影响因子</div>
                  <div className="font-bold" style={{ color: "var(--gray-900)" }}>
                    {journal.impactFactor || "N/A"}
                  </div>
                </div>
                <div className="p-2 rounded-lg" style={{ background: "var(--gray-50)" }}>
                  <div className="text-xs" style={{ color: "var(--gray-500)" }}>JCR分区</div>
                  <div className="font-bold" style={{ color: getQuartileColor(journal.quartile) }}>
                    {journal.quartile || "N/A"}
                  </div>
                </div>
                <div className="p-2 rounded-lg" style={{ background: "var(--gray-50)" }}>
                  <div className="text-xs" style={{ color: "var(--gray-500)" }}>中科院分区</div>
                  <div className="font-bold" style={{ color: "var(--gray-900)" }}>
                    {journal.chinesePartition || "N/A"}
                  </div>
                </div>
                <div className="p-2 rounded-lg" style={{ background: "var(--gray-50)" }}>
                  <div className="text-xs" style={{ color: "var(--gray-500)" }}>录用率</div>
                  <div className="font-bold" style={{ color: "var(--gray-900)" }}>
                    {journal.acceptanceRate ? `${journal.acceptanceRate}%` : "N/A"}
                  </div>
                </div>
              </div>

              {/* 审稿周期 */}
              <div className="text-sm mb-3" style={{ color: "var(--gray-600)" }}>
                <span className="font-medium">审稿周期：</span>
                {journal.reviewTime || "未知"}
              </div>

              {/* 推荐理由 */}
              <div className="p-3 rounded-lg mb-3" style={{ background: "var(--brand-50)", border: "1px solid var(--brand-100)" }}>
                <p className="text-sm" style={{ color: "var(--gray-700)" }}>
                  <span className="font-medium" style={{ color: "var(--brand-600)" }}>推荐理由：</span>
                  {journal.matchReason}
                </p>
              </div>

              {/* 操作按钮 */}
              <div className="flex gap-2">
                <button
                  onClick={() => handleCopyJournal(journal)}
                  className="btn btn-secondary text-sm"
                >
                  📋 复制信息
                </button>
                <a
                  href={`https://www.google.com/search?q=${encodeURIComponent(journal.name + " official site")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary text-sm"
                >
                  🔗 查看官网
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
