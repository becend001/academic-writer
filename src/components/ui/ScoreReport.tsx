"use client";

import { useState } from "react";

interface ScoreData {
  totalScore: number;
  level: string;
  dimensions: {
    innovation: number;
    feasibility: number;
    literature: number;
    output: number;
    budget: number;
  };
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
}

interface ScoreReportProps {
  score: ScoreData;
  onClose: () => void;
}

// 维度配置
const DIMENSIONS_CONFIG = [
  { key: "innovation", label: "选题创新性", max: 25, icon: "💡", color: "#8B5CF6" },
  { key: "feasibility", label: "研究方案可行性", max: 25, icon: "🔬", color: "#3B82F6" },
  { key: "literature", label: "文献综述质量", max: 20, icon: "📚", color: "#10B981" },
  { key: "output", label: "预期成果明确性", max: 15, icon: "🏆", color: "#F59E0B" },
  { key: "budget", label: "经费预算合理性", max: 15, icon: "💰", color: "#EF4444" },
];

// 获取评分等级颜色
function getLevelColor(score: number): string {
  if (score >= 85) return "#10B981"; // 优秀-绿色
  if (score >= 70) return "#3B82F6"; // 良好-蓝色
  if (score >= 60) return "#F59E0B"; // 合格-黄色
  return "#EF4444"; // 需改进-红色
}

// 获取星级
function getStars(score: number): number {
  if (score >= 90) return 5;
  if (score >= 80) return 4;
  if (score >= 70) return 3;
  if (score >= 60) return 2;
  return 1;
}

export default function ScoreReport({ score, onClose }: ScoreReportProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "details" | "suggestions">("overview");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)" }}>
      <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden shadow-2xl">
        {/* 头部 */}
        <div className="p-6 border-b" style={{ borderColor: "var(--border)" }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #3B82F6, #1D4ED8)" }}>
                <span className="text-xl">📊</span>
              </div>
              <h2 className="text-2xl font-bold" style={{ color: "var(--gray-900)" }}>申报书评分报告</h2>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors">
              <span style={{ color: "var(--gray-500)" }}>✕</span>
            </button>
          </div>
        </div>

        {/* 总分展示 */}
        <div className="p-6" style={{ background: "linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)" }}>
          <div className="flex items-center justify-center gap-8">
            {/* 总分 */}
            <div className="text-center">
              <div className="text-6xl font-bold mb-2" style={{ color: getLevelColor(score.totalScore) }}>
                {score.totalScore}
              </div>
              <div className="text-lg" style={{ color: "var(--gray-600)" }}>/ 100分</div>
            </div>

            {/* 星级和等级 */}
            <div className="text-center">
              <div className="flex gap-1 mb-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <span key={star} className={`text-2xl ${star <= getStars(score.totalScore) ? "text-yellow-400" : "text-gray-300"}`}>
                    ★
                  </span>
                ))}
              </div>
              <div className="px-4 py-2 rounded-full text-lg font-semibold" style={{ 
                background: `${getLevelColor(score.totalScore)}20`,
                color: getLevelColor(score.totalScore)
              }}>
                {score.level}
              </div>
            </div>
          </div>
        </div>

        {/* Tab 导航 */}
        <div className="flex border-b" style={{ borderColor: "var(--border)" }}>
          {[
            { key: "overview", label: "维度得分" },
            { key: "details", label: "优劣势分析" },
            { key: "suggestions", label: "改进建议" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className="flex-1 py-3 text-center font-semibold transition-colors"
              style={{
                color: activeTab === tab.key ? "var(--brand-600)" : "var(--gray-500)",
                borderBottom: activeTab === tab.key ? "2px solid var(--brand-600)" : "2px solid transparent",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* 内容区域 */}
        <div className="p-6 overflow-y-auto" style={{ maxHeight: "400px" }}>
          {/* 维度得分 */}
          {activeTab === "overview" && (
            <div className="space-y-4">
              {DIMENSIONS_CONFIG.map((dim) => {
                const scoreValue = score.dimensions[dim.key as keyof typeof score.dimensions];
                const percentage = (scoreValue / dim.max) * 100;
                return (
                  <div key={dim.key} className="p-4 rounded-xl" style={{ background: "var(--gray-50)" }}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{dim.icon}</span>
                        <span className="font-semibold" style={{ color: "var(--gray-900)" }}>{dim.label}</span>
                      </div>
                      <span className="font-bold" style={{ color: dim.color }}>
                        {scoreValue} / {dim.max}
                      </span>
                    </div>
                    <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--gray-200)" }}>
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%`, background: dim.color }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* 优劣势分析 */}
          {activeTab === "details" && (
            <div className="space-y-6">
              {/* 优势 */}
              <div>
                <h3 className="flex items-center gap-2 text-lg font-bold mb-3" style={{ color: "#10B981" }}>
                  <span>💪</span> 优势
                </h3>
                <div className="space-y-2">
                  {score.strengths.map((item, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 rounded-lg" style={{ background: "#ECFDF5" }}>
                      <span className="text-green-500 mt-0.5">✓</span>
                      <span style={{ color: "var(--gray-700)" }}>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 不足 */}
              <div>
                <h3 className="flex items-center gap-2 text-lg font-bold mb-3" style={{ color: "#F59E0B" }}>
                  <span>⚠️</span> 不足
                </h3>
                <div className="space-y-2">
                  {score.weaknesses.map((item, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 rounded-lg" style={{ background: "#FFFBEB" }}>
                      <span className="text-yellow-500 mt-0.5">!</span>
                      <span style={{ color: "var(--gray-700)" }}>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 改进建议 */}
          {activeTab === "suggestions" && (
            <div className="space-y-3">
              {score.suggestions.map((item, index) => (
                <div key={index} className="flex items-start gap-3 p-4 rounded-xl" style={{ background: "var(--brand-50)", border: "1px solid var(--brand-100)" }}>
                  <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "var(--brand-600)" }}>
                    <span className="text-white text-sm font-bold">{index + 1}</span>
                  </div>
                  <span style={{ color: "var(--gray-700)" }}>{item}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 底部按钮 */}
        <div className="p-6 border-t flex justify-end gap-3" style={{ borderColor: "var(--border)" }}>
          <button onClick={onClose} className="px-6 py-2 rounded-lg font-semibold" style={{ background: "var(--gray-100)", color: "var(--gray-700)" }}>
            关闭
          </button>
          <button
            onClick={() => {
              const reportText = `申报书评分报告\n\n总分：${score.totalScore}/100 (${score.level})\n\n维度得分：\n- 选题创新性：${score.dimensions.innovation}/25\n- 研究方案可行性：${score.dimensions.feasibility}/25\n- 文献综述质量：${score.dimensions.literature}/20\n- 预期成果明确性：${score.dimensions.output}/15\n- 经费预算合理性：${score.dimensions.budget}/15\n\n优势：\n${score.strengths.map((s, i) => `${i + 1}. ${s}`).join("\n")}\n\n不足：\n${score.weaknesses.map((w, i) => `${i + 1}. ${w}`).join("\n")}\n\n改进建议：\n${score.suggestions.map((s, i) => `${i + 1}. ${s}`).join("\n")}`;
              navigator.clipboard.writeText(reportText);
              alert("报告已复制到剪贴板");
            }}
            className="px-6 py-2 rounded-lg font-semibold text-white"
            style={{ background: "var(--brand-600)" }}
          >
            复制报告
          </button>
        </div>
      </div>
    </div>
  );
}
