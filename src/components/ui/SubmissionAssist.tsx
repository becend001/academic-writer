"use client";

import { useState } from "react";
import { useToast } from "@/components/ui/Toast";
import { copyToClipboard } from "@/lib/utils/clipboard";

interface SubmissionAssistProps {
  todayUsage?: number;
  usageLimit?: number;
  whitelisted?: boolean;
  onUsageConsumed?: () => void;
}

type AssistTab = "cover-letter" | "format-check" | "rebuttal";

export default function SubmissionAssist({
  todayUsage = 0,
  usageLimit = 3,
  whitelisted = false,
  onUsageConsumed,
}: SubmissionAssistProps) {
  const [activeTab, setActiveTab] = useState<AssistTab>("cover-letter");
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  // 投稿信状态
  const [coverLetterData, setCoverLetterData] = useState({
    title: "",
    abstract: "",
    keywords: "",
    field: "",
    journalName: "",
    authorName: "",
    affiliation: "",
    email: "",
  });
  const [coverLetterResult, setCoverLetterResult] = useState("");

  // 格式检查状态
  const [formatCheckData, setFormatCheckData] = useState({
    title: "",
    abstract: "",
    keywords: "",
    content: "",
    journalName: "",
  });
  const [formatCheckResult, setFormatCheckResult] = useState<any>(null);

  // 审稿回复状态
  const [rebuttalData, setRebuttalData] = useState({
    title: "",
    reviewerComments: "",
    originalContent: "",
    authorResponses: "",
  });
  const [rebuttalResult, setRebuttalResult] = useState("");

  const checkUsage = () => {
    if (whitelisted) return true;
    if (todayUsage >= usageLimit) {
      showToast(`今日免费次数已用完（${usageLimit}次），请升级Pro版`, "error");
      return false;
    }
    return true;
  };

  // 生成投稿信
  const handleGenerateCoverLetter = async () => {
    if (!checkUsage()) return;
    if (!coverLetterData.title) {
      showToast("请提供论文标题", "error");
      return;
    }

    setLoading(true);
    setCoverLetterResult("");

    try {
      const res = await fetch("/api/academic/cover-letter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: coverLetterData.title,
          abstract: coverLetterData.abstract,
          keywords: coverLetterData.keywords.split(/[,，]/).map((k) => k.trim()).filter(Boolean),
          field: coverLetterData.field,
          journalName: coverLetterData.journalName,
          authorName: coverLetterData.authorName,
          affiliation: coverLetterData.affiliation,
          email: coverLetterData.email,
        }),
      });

      const data = await res.json();
      if (data.error) {
        showToast(data.error, "error");
      } else if (data.coverLetter) {
        setCoverLetterResult(data.coverLetter);
        onUsageConsumed?.();
        showToast("投稿信生成成功", "success");
      }
    } catch (err) {
      showToast("生成失败，请重试", "error");
    } finally {
      setLoading(false);
    }
  };

  // 格式检查
  const handleFormatCheck = async () => {
    if (!checkUsage()) return;
    if (!formatCheckData.content && !formatCheckData.title) {
      showToast("请提供论文内容", "error");
      return;
    }

    setLoading(true);
    setFormatCheckResult(null);

    try {
      const res = await fetch("/api/academic/format-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formatCheckData.title,
          abstract: formatCheckData.abstract,
          keywords: formatCheckData.keywords.split(/[,，]/).map((k) => k.trim()).filter(Boolean),
          content: formatCheckData.content,
          journalName: formatCheckData.journalName,
        }),
      });

      const data = await res.json();
      if (data.error) {
        showToast(data.error, "error");
      } else {
        setFormatCheckResult(data);
        onUsageConsumed?.();
        showToast("格式检查完成", "success");
      }
    } catch (err) {
      showToast("检查失败，请重试", "error");
    } finally {
      setLoading(false);
    }
  };

  // 生成审稿回复
  const handleGenerateRebuttal = async () => {
    if (!checkUsage()) return;
    if (!rebuttalData.reviewerComments) {
      showToast("请提供审稿人意见", "error");
      return;
    }

    setLoading(true);
    setRebuttalResult("");

    try {
      const res = await fetch("/api/academic/rebuttal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: rebuttalData.title,
          reviewerComments: rebuttalData.reviewerComments,
          originalContent: rebuttalData.originalContent,
          authorResponses: rebuttalData.authorResponses,
        }),
      });

      const data = await res.json();
      if (data.error) {
        showToast(data.error, "error");
      } else if (data.rebuttal) {
        setRebuttalResult(data.rebuttal);
        onUsageConsumed?.();
        showToast("审稿回复生成成功", "success");
      }
    } catch (err) {
      showToast("生成失败，请重试", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text: string) => {
    copyToClipboard(text);
    showToast("已复制到剪贴板", "success");
  };

  // 获取问题类型颜色
  const getIssueColor = (type: string) => {
    switch (type) {
      case "error":
        return "#EF4444";
      case "warning":
        return "#F59E0B";
      default:
        return "#3B82F6";
    }
  };

  return (
    <div className="space-y-6">
      {/* 标题 */}
      <div className="card card-elevated p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #10B981, #059669)" }}>
            <span className="text-xl">📝</span>
          </div>
          <div>
            <h2 className="text-xl font-bold" style={{ color: "var(--gray-900)" }}>投稿辅助</h2>
            <p className="text-sm" style={{ color: "var(--gray-500)" }}>从投稿到修回的全流程支持</p>
          </div>
        </div>

        {/* Tab 导航 */}
        <div className="flex gap-2 border-b" style={{ borderColor: "var(--border)" }}>
          {[
            { key: "cover-letter", label: "投稿信生成", icon: "✉️" },
            { key: "format-check", label: "格式检查", icon: "✅" },
            { key: "rebuttal", label: "审稿回复", icon: "💬" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as AssistTab)}
              className="px-4 py-3 text-sm font-medium transition-colors flex items-center gap-2"
              style={{
                color: activeTab === tab.key ? "var(--brand-600)" : "var(--gray-500)",
                borderBottom: activeTab === tab.key ? "2px solid var(--brand-600)" : "2px solid transparent",
              }}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 投稿信生成 */}
      {activeTab === "cover-letter" && (
        <div className="card card-elevated p-6">
          <h3 className="text-lg font-bold mb-4" style={{ color: "var(--gray-900)" }}>✉️ 生成投稿信</h3>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: "var(--gray-700)" }}>
                  论文标题 <span style={{ color: "var(--gray-400)" }}>*</span>
                </label>
                <input
                  type="text"
                  value={coverLetterData.title}
                  onChange={(e) => setCoverLetterData({ ...coverLetterData, title: e.target.value })}
                  className="input"
                  placeholder="请输入论文标题"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: "var(--gray-700)" }}>
                  目标期刊
                </label>
                <input
                  type="text"
                  value={coverLetterData.journalName}
                  onChange={(e) => setCoverLetterData({ ...coverLetterData, journalName: e.target.value })}
                  className="input"
                  placeholder="如：Nature Medicine"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: "var(--gray-700)" }}>
                摘要
              </label>
              <textarea
                value={coverLetterData.abstract}
                onChange={(e) => setCoverLetterData({ ...coverLetterData, abstract: e.target.value })}
                className="textarea h-24"
                placeholder="请输入论文摘要"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: "var(--gray-700)" }}>
                  通讯作者
                </label>
                <input
                  type="text"
                  value={coverLetterData.authorName}
                  onChange={(e) => setCoverLetterData({ ...coverLetterData, authorName: e.target.value })}
                  className="input"
                  placeholder="姓名"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: "var(--gray-700)" }}>
                  单位
                </label>
                <input
                  type="text"
                  value={coverLetterData.affiliation}
                  onChange={(e) => setCoverLetterData({ ...coverLetterData, affiliation: e.target.value })}
                  className="input"
                  placeholder="单位名称"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: "var(--gray-700)" }}>
                  邮箱
                </label>
                <input
                  type="email"
                  value={coverLetterData.email}
                  onChange={(e) => setCoverLetterData({ ...coverLetterData, email: e.target.value })}
                  className="input"
                  placeholder="email@example.com"
                />
              </div>
            </div>

            <button
              onClick={handleGenerateCoverLetter}
              disabled={loading || !coverLetterData.title}
              className="btn btn-primary"
            >
              {loading ? (
                <><div className="spinner"></div><span>生成中...</span></>
              ) : (
                <><span>✉️</span><span>生成投稿信</span></>
              )}
            </button>
          </div>

          {/* 结果展示 */}
          {coverLetterResult && (
            <div className="mt-6 p-4 rounded-xl" style={{ background: "var(--gray-50)", border: "1px solid var(--border)" }}>
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold" style={{ color: "var(--gray-900)" }}>投稿信</h4>
                <button
                  onClick={() => handleCopy(coverLetterResult)}
                  className="btn btn-secondary text-sm"
                >
                  📋 复制
                </button>
              </div>
              <div className="whitespace-pre-wrap text-sm leading-relaxed" style={{ color: "var(--gray-700)" }}>
                {coverLetterResult}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 格式检查 */}
      {activeTab === "format-check" && (
        <div className="card card-elevated p-6">
          <h3 className="text-lg font-bold mb-4" style={{ color: "var(--gray-900)" }}>✅ 格式检查</h3>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: "var(--gray-700)" }}>
                  论文标题
                </label>
                <input
                  type="text"
                  value={formatCheckData.title}
                  onChange={(e) => setFormatCheckData({ ...formatCheckData, title: e.target.value })}
                  className="input"
                  placeholder="请输入论文标题"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: "var(--gray-700)" }}>
                  目标期刊
                </label>
                <input
                  type="text"
                  value={formatCheckData.journalName}
                  onChange={(e) => setFormatCheckData({ ...formatCheckData, journalName: e.target.value })}
                  className="input"
                  placeholder="如：Nature Medicine"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: "var(--gray-700)" }}>
                摘要
              </label>
              <textarea
                value={formatCheckData.abstract}
                onChange={(e) => setFormatCheckData({ ...formatCheckData, abstract: e.target.value })}
                className="textarea h-20"
                placeholder="请输入论文摘要"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: "var(--gray-700)" }}>
                正文内容 <span style={{ color: "var(--gray-400)" }}>*</span>
              </label>
              <textarea
                value={formatCheckData.content}
                onChange={(e) => setFormatCheckData({ ...formatCheckData, content: e.target.value })}
                className="textarea h-40"
                placeholder="请粘贴论文正文内容"
              />
            </div>

            <button
              onClick={handleFormatCheck}
              disabled={loading || (!formatCheckData.content && !formatCheckData.title)}
              className="btn btn-primary"
            >
              {loading ? (
                <><div className="spinner"></div><span>检查中...</span></>
              ) : (
                <><span>✅</span><span>开始检查</span></>
              )}
            </button>
          </div>

          {/* 结果展示 */}
          {formatCheckResult && (
            <div className="mt-6 space-y-4">
              {/* 评分 */}
              <div className="flex items-center gap-4 p-4 rounded-xl" style={{ background: "var(--gray-50)" }}>
                <div className="text-center">
                  <div className="text-4xl font-bold" style={{ color: getIssueColor(formatCheckResult.score >= 80 ? "info" : formatCheckResult.score >= 60 ? "warning" : "error") }}>
                    {formatCheckResult.score}
                  </div>
                  <div className="text-sm" style={{ color: "var(--gray-500)" }}>/ 100</div>
                </div>
                <div className="flex-1">
                  <div className="font-semibold" style={{ color: "var(--gray-900)" }}>
                    {formatCheckResult.level || "检查完成"}
                  </div>
                  <div className="text-sm" style={{ color: "var(--gray-600)" }}>
                    {formatCheckResult.summary}
                  </div>
                </div>
              </div>

              {/* 问题列表 */}
              {formatCheckResult.issues && formatCheckResult.issues.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-semibold" style={{ color: "var(--gray-900)" }}>检查结果</h4>
                  {formatCheckResult.issues.map((issue: any, index: number) => (
                    <div
                      key={index}
                      className="p-3 rounded-lg flex items-start gap-3"
                      style={{ background: `${getIssueColor(issue.type)}10`, border: `1px solid ${getIssueColor(issue.type)}20` }}
                    >
                      <span
                        className="px-2 py-0.5 rounded text-xs font-semibold text-white"
                        style={{ background: getIssueColor(issue.type) }}
                      >
                        {issue.type === "error" ? "必须" : issue.type === "warning" ? "建议" : "参考"}
                      </span>
                      <div className="flex-1">
                        <div className="font-medium" style={{ color: "var(--gray-900)" }}>
                          [{issue.category}] {issue.description}
                        </div>
                        <div className="text-sm mt-1" style={{ color: "var(--gray-600)" }}>
                          {issue.suggestion}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 审稿回复 */}
      {activeTab === "rebuttal" && (
        <div className="card card-elevated p-6">
          <h3 className="text-lg font-bold mb-4" style={{ color: "var(--gray-900)" }}>💬 生成审稿回复</h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: "var(--gray-700)" }}>
                论文标题
              </label>
              <input
                type="text"
                value={rebuttalData.title}
                onChange={(e) => setRebuttalData({ ...rebuttalData, title: e.target.value })}
                className="input"
                placeholder="请输入论文标题"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: "var(--gray-700)" }}>
                审稿人意见 <span style={{ color: "var(--gray-400)" }}>*</span>
              </label>
              <textarea
                value={rebuttalData.reviewerComments}
                onChange={(e) => setRebuttalData({ ...rebuttalData, reviewerComments: e.target.value })}
                className="textarea h-40"
                placeholder="请粘贴审稿人意见（可以是多个审稿人的意见）"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: "var(--gray-700)" }}>
                原始内容（关键段落）
              </label>
              <textarea
                value={rebuttalData.originalContent}
                onChange={(e) => setRebuttalData({ ...rebuttalData, originalContent: e.target.value })}
                className="textarea h-24"
                placeholder="请粘贴与审稿意见相关的论文原文段落"
              />
            </div>

            <button
              onClick={handleGenerateRebuttal}
              disabled={loading || !rebuttalData.reviewerComments}
              className="btn btn-primary"
            >
              {loading ? (
                <><div className="spinner"></div><span>生成中...</span></>
              ) : (
                <><span>💬</span><span>生成审稿回复</span></>
              )}
            </button>
          </div>

          {/* 结果展示 */}
          {rebuttalResult && (
            <div className="mt-6 p-4 rounded-xl" style={{ background: "var(--gray-50)", border: "1px solid var(--border)" }}>
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold" style={{ color: "var(--gray-900)" }}>审稿回复</h4>
                <button
                  onClick={() => handleCopy(rebuttalResult)}
                  className="btn btn-secondary text-sm"
                >
                  📋 复制
                </button>
              </div>
              <div className="whitespace-pre-wrap text-sm leading-relaxed" style={{ color: "var(--gray-700)" }}>
                {rebuttalResult}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
