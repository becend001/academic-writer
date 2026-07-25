"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import { Navbar } from "@/components/ui/Navbar";
import { DAILY_USAGE_LIMIT } from "@/lib/config";
import { csrfFetch } from "@/lib/utils/csrf-fetch";

const PROJECT_TYPES = [
  "国家自然科学基金面上项目",
  "国家自然科学基金青年项目",
  "国家自然科学基金重点项目",
  "国家自然科学基金重大项目",
  "国家社科基金一般项目",
  "国家社科基金青年项目",
  "国家社科基金重点项目",
  "教育部人文社科一般项目",
  "教育部人文社科青年项目",
  "省自然科学基金面上项目",
  "省自然科学基金青年项目",
  "省社科基金一般项目",
  "省社科基金青年项目",
  "市厅级项目",
  "横向课题（企业合作）",
  "校级科研项目",
  "博士后科学基金",
];

const workflows = [
  {
    id: "polish-full",
    name: "论文润色全流程",
    icon: "📝",
    description: "上传论文 → 润色 → 翻译 → 摘要 → 导出",
    scenario: "写完论文后需要润色、翻译、生成摘要",
    color: "var(--color-polish)",
  },
  {
    id: "grant-full",
    name: "课题申报全流程",
    icon: "🎯",
    description: "输入想法 → 选题 → 大纲 → 各章节 → 导出",
    scenario: "准备申请课题，需要完整申报书",
    color: "var(--color-grant)",
  },
  {
    id: "review-full",
    name: "文献综述全流程",
    icon: "📚",
    description: "输入主题 → 搜索文献 → 生成综述 → 导出",
    scenario: "需要撰写文献综述部分",
    color: "var(--color-literature)",
  },
];

type WorkflowType = "polish-full" | "grant-full" | "review-full" | null;

interface WorkflowResult {
  polish?: { text: string; original: string };
  translate?: { text: string };
  abstract?: { text: string; keywords: string[] };
  topics?: any[];
  outline?: any;
  points?: any;
  keywords?: string[];
  papers?: any[];
  framework?: any;
}

const TAB_CONFIG: Record<string, { icon: string; label: string; guide: string }[]> = {
  "polish-full": [
    { icon: "✨", label: "润色结果", guide: "AI已完成学术化润色，修正了语法错误并提升了表达的专业性。以下是润色后的文本，您可以对比原文查看修改效果。" },
    { icon: "🌐", label: "英文翻译", guide: "润色后的文本已翻译为学术英语，保留了原文的逻辑结构和专业术语。" },
    { icon: "📄", label: "摘要生成", guide: "AI根据论文内容自动生成了中英文摘要和关键词，可直接用于论文投稿。" },
  ],
  "grant-full": [
    { icon: "🎯", label: "选题推荐", guide: "AI根据您的研究领域推荐了3个选题方向，每个选题包含研究意义、创新点、可行性和预期成果，请选择最适合的选题。" },
    { icon: "📋", label: "写作大纲", guide: "基于选题生成了标准的课题申报书大纲，涵盖立项依据、研究内容、研究方案等核心章节。" },
    { icon: "📝", label: "章节要点", guide: "为每个章节提供了详细的写作要点和建议字数，帮助您高效完成申报书的撰写。" },
  ],
  "review-full": [
    { icon: "🔍", label: "关键词与文献", guide: "AI根据您的研究主题生成了英文检索关键词，并从学术数据库中搜索到相关文献，包含标题、作者、期刊和引用数。" },
    { icon: "📋", label: "综述框架", guide: "基于搜索到的文献，AI生成了文献综述的写作框架，按主题分类组织文献。" },
    { icon: "📝", label: "写作要点", guide: "为综述的每个部分提供了写作要点和建议字数，确保综述结构完整、内容充实。" },
  ],
};

export default function WorkflowPage() {
  const [user, setUser] = useState<any>(null);
  const [selectedWorkflow, setSelectedWorkflow] = useState<WorkflowType>(null);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<WorkflowResult | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [error, setError] = useState("");
  const [grantKeywords, setGrantKeywords] = useState("");
  const [grantType, setGrantType] = useState(PROJECT_TYPES[0]);
  const [reviewField, setReviewField] = useState("");
  const [activeResultTab, setActiveResultTab] = useState(0);
  const [todayUsage, setTodayUsage] = useState(0);
  const [whitelisted, setWhitelisted] = useState(false);
  const usageLimit = DAILY_USAGE_LIMIT;

  const getSteps = () => {
    switch (selectedWorkflow) {
      case "polish-full": return ["润色", "翻译", "摘要", "完成"];
      case "grant-full": return ["选题", "大纲", "要点", "完成"];
      case "review-full": return ["关键词", "框架", "要点", "完成"];
      default: return ["步骤1", "步骤2", "步骤3", "完成"];
    }
  };

  const steps = getSteps();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUser(user);
        loadUsage();
      } else {
        window.location.href = "/auth/login";
      }
    });
  }, []);

  const loadUsage = async () => {
    try {
      const res = await csrfFetch("/api/usage");
      const data = await res.json();
      if (data.whitelisted) { setWhitelisted(true); return; }
      if (data.today !== undefined) setTodayUsage(data.today);
    } catch {}
  };

  const checkUsage = () => {
    if (whitelisted) return true;
    if (todayUsage >= usageLimit) {
      setError(`今日免费次数已用完（${usageLimit}次），请升级Pro版`);
      return false;
    }
    return true;
  };

  const handleStartWorkflow = async () => {
    if (!checkUsage()) return;
    if (selectedWorkflow !== "review-full" && !inputText.trim()) {
      setError("请输入内容");
      return;
    }
    if (selectedWorkflow === "review-full" && !inputText.trim()) {
      setError("请输入研究主题");
      return;
    }

    setLoading(true);
    setError("");
    setCurrentStep(0);
    setActiveResultTab(0);

    try {
      const stepProgress = async (step: number) => {
        setCurrentStep(step);
        await new Promise((resolve) => setTimeout(resolve, 500));
      };

      await stepProgress(0);

      let endpoint = "";
      let body: any = {};

      switch (selectedWorkflow) {
        case "polish-full":
          endpoint = "/api/workflow/polish-full";
          body = { text: inputText };
          break;
        case "grant-full":
          endpoint = "/api/workflow/grant-full";
          body = {
            field: inputText,
            keywords: grantKeywords,
            projectType: grantType,
          };
          break;
        case "review-full":
          endpoint = "/api/workflow/review-full";
          body = {
            topic: inputText,
            field: reviewField,
          };
          break;
        default:
          setError("未知的工作流类型");
          setLoading(false);
          return;
      }

      await stepProgress(1);

      const res = await csrfFetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setResult(data);
        setTodayUsage((prev) => prev + 1);
        // 记录使用量
        try {
          await csrfFetch("/api/works", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title: `全流程 - ${selectedWorkflow}`, content: inputText.substring(0, 200), result: JSON.stringify(data).substring(0, 200), feature: selectedWorkflow || "workflow" }),
          });
        } catch {}
        await stepProgress(2);
        await stepProgress(3);
      }
    } catch {
      setError("处理失败，请稍后重试");
    }

    setLoading(false);
  };

  const handleExport = (format: "txt" | "md") => {
    if (!result) return;

    let content = "";
    let filename = "";

    switch (selectedWorkflow) {
      case "polish-full":
        content = "# 论文处理结果\n\n";
        if (result.polish) {
          content += "## 润色结果\n\n" + result.polish.text + "\n\n";
        }
        if (result.translate) {
          content += "## 翻译结果\n\n" + result.translate.text + "\n\n";
        }
        if (result.abstract) {
          content += "## 摘要\n\n" + result.abstract.text + "\n\n";
          content += "## 关键词\n\n" + result.abstract.keywords.join("、") + "\n\n";
        }
        filename = "论文处理结果";
        break;

      case "grant-full":
        content = "# 课题申报方案\n\n";
        if (result.topics && result.topics.length > 0) {
          content += "## 推荐选题\n\n";
          result.topics.forEach((topic: any, i: number) => {
            content += `${i + 1}. ${topic.title}\n`;
            content += `   研究意义：${topic.significance}\n`;
            content += `   创新点：${topic.innovation}\n`;
            content += `   可行性：${topic.feasibility}\n`;
            content += `   预期成果：${topic.expectedOutput}\n\n`;
          });
        }
        if (result.outline) {
          content += "## 写作大纲\n\n";
          result.outline.sections?.forEach((section: any) => {
            content += `${section.title}\n`;
            section.subsections?.forEach((sub: string) => {
              content += `  ${sub}\n`;
            });
            content += "\n";
          });
        }
        if (result.points && result.points.points) {
          content += "## 章节要点\n\n";
          Object.values(result.points.points).forEach((section: any) => {
            content += `### ${section.title}（建议${section.suggestedWords}字）\n`;
            section.items?.forEach((item: any) => {
              content += `- ${item.point}：${item.description}\n`;
            });
            content += "\n";
          });
        }
        filename = "课题申报方案";
        break;

      case "review-full":
        content = "# 文献综述方案\n\n";
        if (result.keywords && result.keywords.length > 0) {
          content += "## 搜索关键词\n\n" + result.keywords.join("、") + "\n\n";
        }
        if (result.papers && result.papers.length > 0) {
          content += "## 搜索到的文献\n\n";
          result.papers.forEach((paper: any, i: number) => {
            content += `${i + 1}. ${paper.title}\n`;
            content += `   作者：${paper.authors?.join(", ")}\n`;
            content += `   期刊：${paper.journal} (${paper.year})\n`;
            content += `   引用：${paper.citationCount}\n`;
            content += `   链接：${paper.url}\n\n`;
          });
        }
        if (result.framework) {
          content += "## 综述框架\n\n";
          result.framework.sections?.forEach((section: any) => {
            content += `${section.title}\n`;
            section.subsections?.forEach((sub: string) => {
              content += `  ${sub}\n`;
            });
            content += "\n";
          });
        }
        if (result.points && result.points.points) {
          content += "## 写作要点\n\n";
          Object.values(result.points.points).forEach((section: any) => {
            content += `### ${section.title}（建议${section.suggestedWords}字）\n`;
            section.items?.forEach((item: any) => {
              content += `- ${item.point}：${item.description}\n`;
            });
            content += "\n";
          });
        }
        filename = "文献综述方案";
        break;
    }

    if (format === "txt") {
      content = content.replace(/#/g, "").replace(/\*\*/g, "");
    }

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename}.${format === "md" ? "md" : "txt"}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-base)' }}>
        <div className="text-gray-500">加载中...</div>
      </div>
    );
  }

  if (!selectedWorkflow) {
    return (
      <div className="min-h-screen" style={{ background: 'var(--bg-base)' }}>
        <Navbar activePage="workflow" rightContent={
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm" style={{ background: whitelisted ? '#EFF6FF' : todayUsage >= usageLimit ? '#FEE2E2' : '#DCFCE7', color: whitelisted ? '#1D4ED8' : todayUsage >= usageLimit ? '#DC2626' : '#16A34A' }}>
              <span>{whitelisted ? '种子用户' : '剩余'}</span>
              <span className="font-bold">{whitelisted ? '不限次数' : `${usageLimit - todayUsage}/${usageLimit}`}</span>
            </div>
            <div className="text-base" style={{ color: 'var(--gray-500)' }}>{user?.email}</div>
          </div>
        } />
        <div className="max-w-5xl mx-auto px-6 py-12">
          <div className="flex items-center gap-4 mb-10">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #F59E0B, #D97706)', boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)' }}>
              <span className="text-2xl">⚡</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold" style={{ color: 'var(--gray-900)' }}>一键全流程</h1>
              <p className="text-base" style={{ color: 'var(--gray-500)' }}>选择工作流，自动完成多个处理步骤</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {workflows.map((workflow) => (
              <div
                key={workflow.id}
                onClick={() => setSelectedWorkflow(workflow.id as any)}
                className="p-6 cursor-pointer group"
                style={{
                  background: 'white',
                  borderRadius: '16px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.04)',
                  border: '1px solid #E5E7EB',
                  transition: 'all 0.25s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.12)';
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.borderColor = workflow.color;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.04)';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.borderColor = '#E5E7EB';
                }}
              >
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5 transition-transform group-hover:scale-110"
                  style={{ background: `${workflow.color}15` }}
                >
                  <span className="text-3xl">{workflow.icon}</span>
                </div>
                <h3 className="text-xl font-bold mb-3" style={{ color: 'var(--gray-900)' }}>
                  {workflow.name}
                </h3>
                <p className="text-base mb-4" style={{ color: 'var(--gray-600)' }}>
                  {workflow.description}
                </p>
                <div className="text-sm" style={{ color: 'var(--gray-400)' }}>
                  适用场景：{workflow.scenario}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const tabs = TAB_CONFIG[selectedWorkflow] || [];

  // 计算课题申报的步骤数（根据是否有points动态调整）
  const hasGrantPoints = result?.points?.points && Object.keys(result.points.points).length > 0;
  const grantTabs = hasGrantPoints ? tabs : tabs.slice(0, 2);

  const hasReviewPoints = result?.points?.points && Object.keys(result.points.points).length > 0;
  const reviewTabs = hasReviewPoints ? tabs : tabs.slice(0, 2);

  const activeTabs = selectedWorkflow === "grant-full" ? grantTabs
    : selectedWorkflow === "review-full" ? reviewTabs
    : tabs;

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-base)' }}>
      <header style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border-subtle)' }}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, var(--brand-500), var(--brand-700))' }}>
                <span className="text-white font-bold text-xl">A</span>
              </div>
              <span className="text-xl font-bold" style={{ color: 'var(--gray-900)' }}>学术写作助手</span>
            </Link>
            <button onClick={() => { setSelectedWorkflow(null); setResult(null); setInputText(""); setGrantKeywords(""); setReviewField(""); setActiveResultTab(0); }} className="text-base font-medium" style={{ color: 'var(--gray-600)' }}>
              ← 返回选择
            </button>
          </div>
          {result && (
            <div className="flex gap-2">
              <button onClick={() => handleExport("md")} className="btn btn-secondary px-4 py-2 text-sm">
                📄 导出Markdown
              </button>
              <button onClick={() => handleExport("txt")} className="btn btn-secondary px-4 py-2 text-sm">
                📄 导出文本
              </button>
            </div>
          )}
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* 步骤进度 */}
        <div className="card-premium p-6 mb-6">
          <div className="flex items-center justify-between">
            {steps.map((step, i) => (
              <div key={i} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
                    style={{
                      background: i < currentStep ? "var(--color-grammar)" : i === currentStep ? "var(--brand-500)" : "var(--gray-200)",
                      color: i <= currentStep ? "white" : "var(--gray-500)",
                    }}
                  >
                    {i < currentStep ? "✓" : i + 1}
                  </div>
                  <span className="text-xs mt-1" style={{ color: i <= currentStep ? "var(--gray-900)" : "var(--gray-400)" }}>
                    {step}
                  </span>
                </div>
                {i < steps.length - 1 && (
                  <div className="w-16 h-0.5 mx-2" style={{ background: i < currentStep ? "var(--color-grammar)" : "var(--gray-200)" }} />
                )}
              </div>
            ))}
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl text-sm font-medium flex items-center gap-2" style={{ background: 'var(--color-grant-light)', color: 'var(--color-grant-dark)' }}>
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* ========== 输入区 ========== */}
        {!result && (
          <div className="card-premium p-6 mb-6">
            {/* 论文润色输入 */}
            {selectedWorkflow === "polish-full" && (
              <>
                <div className="flex items-center gap-3 mb-2">
                  <span style={{ fontSize: '24px' }}>📝</span>
                  <h2 className="text-xl font-bold" style={{ color: 'var(--gray-900)' }}>论文润色全流程</h2>
                </div>
                <p className="text-base mb-6" style={{ color: 'var(--gray-500)' }}>
                  粘贴您的论文全文，AI将依次完成润色（修正语法、提升表达）→ 翻译为学术英语 → 生成中英文摘要
                </p>
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  className="textarea h-48 mb-4"
                  placeholder="请粘贴您的论文全文或摘要部分..."
                />
                <button
                  onClick={handleStartWorkflow}
                  disabled={loading || !inputText.trim()}
                  className="btn btn-primary"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <div className="spinner"></div>
                      <span>AI处理中...</span>
                    </span>
                  ) : (
                    "⚡ 开始润色"
                  )}
                </button>
              </>
            )}

            {/* 课题申报输入 */}
            {selectedWorkflow === "grant-full" && (
              <>
                <div className="flex items-center gap-3 mb-2">
                  <span style={{ fontSize: '24px' }}>🎯</span>
                  <h2 className="text-xl font-bold" style={{ color: 'var(--gray-900)' }}>课题申报 - 选题阶段</h2>
                </div>
                <p className="text-base mb-6" style={{ color: 'var(--gray-500)' }}>
                  输入研究领域和关键词，AI将为您推荐合适的课题选题，并生成完整的申报方案（选题 → 大纲 → 章节要点）
                </p>

                <div className="grid grid-cols-2 gap-4 mb-5">
                  <div>
                    <label className="block text-base font-semibold mb-2" style={{ color: 'var(--gray-700)' }}>研究领域 *</label>
                    <input
                      type="text"
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      className="input py-3"
                      placeholder="如：人工智能、医学影像、教育技术"
                    />
                  </div>
                  <div>
                    <label className="block text-base font-semibold mb-2" style={{ color: 'var(--gray-700)' }}>关键词（选填）</label>
                    <input
                      type="text"
                      value={grantKeywords}
                      onChange={(e) => setGrantKeywords(e.target.value)}
                      className="input py-3"
                      placeholder="如：深度学习、诊断、准确率"
                    />
                  </div>
                </div>

                <div className="mb-5">
                  <label className="block text-base font-semibold mb-2" style={{ color: 'var(--gray-700)' }}>项目类型</label>
                  <select
                    value={grantType}
                    onChange={(e) => setGrantType(e.target.value)}
                    className="input py-3"
                  >
                    <optgroup label="国家自然科学基金">
                      <option value="国家自然科学基金面上项目">国家自然科学基金面上项目</option>
                      <option value="国家自然科学基金青年项目">国家自然科学基金青年项目</option>
                      <option value="国家自然科学基金重点项目">国家自然科学基金重点项目</option>
                      <option value="国家自然科学基金重大项目">国家自然科学基金重大项目</option>
                    </optgroup>
                    <optgroup label="国家社会科学基金">
                      <option value="国家社科基金一般项目">国家社科基金一般项目</option>
                      <option value="国家社科基金青年项目">国家社科基金青年项目</option>
                      <option value="国家社科基金重点项目">国家社科基金重点项目</option>
                    </optgroup>
                    <optgroup label="教育部项目">
                      <option value="教育部人文社科一般项目">教育部人文社科一般项目</option>
                      <option value="教育部人文社科青年项目">教育部人文社科青年项目</option>
                    </optgroup>
                    <optgroup label="省部级项目">
                      <option value="省自然科学基金面上项目">省自然科学基金面上项目</option>
                      <option value="省自然科学基金青年项目">省自然科学基金青年项目</option>
                      <option value="省社科基金一般项目">省社科基金一般项目</option>
                      <option value="省社科基金青年项目">省社科基金青年项目</option>
                    </optgroup>
                    <optgroup label="其他">
                      <option value="市厅级项目">市厅级项目</option>
                      <option value="横向课题（企业合作）">横向课题（企业合作）</option>
                      <option value="校级科研项目">校级科研项目</option>
                      <option value="博士后科学基金">博士后科学基金</option>
                    </optgroup>
                  </select>
                </div>

                <button
                  onClick={handleStartWorkflow}
                  disabled={loading || !inputText.trim()}
                  className="btn btn-primary"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <div className="spinner"></div>
                      <span>AI分析中...</span>
                    </span>
                  ) : (
                    "🎯 生成选题方案"
                  )}
                </button>
              </>
            )}

            {/* 文献综述输入 */}
            {selectedWorkflow === "review-full" && (
              <>
                <div className="flex items-center gap-3 mb-2">
                  <span style={{ fontSize: '24px' }}>📚</span>
                  <h2 className="text-xl font-bold" style={{ color: 'var(--gray-900)' }}>文献综述 - 检索阶段</h2>
                </div>
                <p className="text-base mb-6" style={{ color: 'var(--gray-500)' }}>
                  输入研究主题，AI将自动生成英文关键词、从学术数据库搜索文献，并生成综述框架和写作要点
                </p>

                <div className="grid grid-cols-2 gap-4 mb-5">
                  <div>
                    <label className="block text-base font-semibold mb-2" style={{ color: 'var(--gray-700)' }}>研究主题 *</label>
                    <input
                      type="text"
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      className="input py-3"
                      placeholder="如：大语言模型在教育中的应用"
                    />
                  </div>
                  <div>
                    <label className="block text-base font-semibold mb-2" style={{ color: 'var(--gray-700)' }}>研究领域（选填）</label>
                    <input
                      type="text"
                      value={reviewField}
                      onChange={(e) => setReviewField(e.target.value)}
                      className="input py-3"
                      placeholder="如：教育技术、自然语言处理"
                    />
                  </div>
                </div>

                <button
                  onClick={handleStartWorkflow}
                  disabled={loading || !inputText.trim()}
                  className="btn btn-primary"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <div className="spinner"></div>
                      <span>AI检索中...</span>
                    </span>
                  ) : (
                    "📚 开始检索文献"
                  )}
                </button>
              </>
            )}
          </div>
        )}

        {/* ========== 结果展示 ========== */}
        {result && (
          <div className="space-y-4">
            {/* Tab导航 */}
            <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', border: '1px solid var(--border-subtle)' }}>
              {activeTabs.map((tab, i) => (
                <button
                  key={i}
                  onClick={() => setActiveResultTab(i)}
                  className="flex-1 py-3 px-4 rounded-lg text-base font-semibold transition-all"
                  style={{
                    background: activeResultTab === i ? 'var(--brand-50)' : 'transparent',
                    color: activeResultTab === i ? 'var(--brand-700)' : 'var(--gray-500)',
                    boxShadow: activeResultTab === i ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                  }}
                >
                  {tab.icon} {tab.label}
                </button>
              ))}
            </div>

            {/* 引导文字 */}
            <div className="p-4 rounded-xl text-base leading-relaxed" style={{ background: 'var(--brand-50)', border: '1px solid var(--brand-200)', color: 'var(--gray-700)' }}>
              💡 {activeTabs[activeResultTab]?.guide}
            </div>

            {/* ===== 论文润色结果 ===== */}
            {selectedWorkflow === "polish-full" && (
              <>
                {/* Tab 0: 润色 */}
                {activeResultTab === 0 && result.polish && (
                  <div className="card-premium p-6">
                    <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--gray-900)' }}>✨ 润色结果</h3>
                    {result.polish.original && (
                      <div className="mb-4">
                        <div className="text-sm font-semibold mb-2" style={{ color: 'var(--gray-500)' }}>原文</div>
                        <div className="p-4 rounded-xl text-sm leading-relaxed" style={{ background: 'var(--gray-50)', border: '1px solid var(--border-subtle)', color: 'var(--gray-500)', maxHeight: '200px', overflowY: 'auto' }}>
                          {result.polish.original}
                        </div>
                      </div>
                    )}
                    <div>
                      <div className="text-sm font-semibold mb-2" style={{ color: 'var(--brand-700)' }}>润色后</div>
                      <div className="p-4 rounded-xl text-sm leading-relaxed" style={{ background: 'var(--brand-50)', border: '1px solid var(--brand-200)', color: 'var(--gray-900)' }}>
                        {result.polish.text}
                      </div>
                    </div>
                  </div>
                )}

                {/* Tab 1: 翻译 */}
                {activeResultTab === 1 && result.translate && (
                  <div className="card-premium p-6">
                    <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--gray-900)' }}>🌐 英文翻译</h3>
                    <div className="p-4 rounded-xl text-sm leading-relaxed" style={{ background: 'var(--gray-50)', border: '1px solid var(--border-subtle)', color: 'var(--gray-700)' }}>
                      {result.translate.text}
                    </div>
                  </div>
                )}

                {/* Tab 2: 摘要 */}
                {activeResultTab === 2 && result.abstract && (
                  <div className="card-premium p-6">
                    <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--gray-900)' }}>📄 摘要</h3>
                    <div className="p-4 rounded-xl text-sm leading-relaxed mb-4" style={{ background: 'var(--gray-50)', border: '1px solid var(--border-subtle)', color: 'var(--gray-700)' }}>
                      {result.abstract.text}
                    </div>
                    {result.abstract.keywords && result.abstract.keywords.length > 0 && (
                      <div>
                        <span className="text-sm font-semibold" style={{ color: 'var(--gray-700)' }}>关键词：</span>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {result.abstract.keywords.map((kw: string, i: number) => (
                            <span key={i} className="px-3 py-1 rounded-full text-sm" style={{ background: 'var(--brand-100)', color: 'var(--brand-700)' }}>
                              {kw}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}

            {/* ===== 课题申报结果 ===== */}
            {selectedWorkflow === "grant-full" && (
              <>
                {/* Tab 0: 选题推荐 */}
                {activeResultTab === 0 && result.topics && result.topics.length > 0 && (
                  <div className="card-premium p-6">
                    <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--gray-900)' }}>🎯 推荐选题</h3>
                    <div className="space-y-4">
                      {result.topics.map((topic: any, i: number) => (
                        <div key={i} className="p-5 rounded-xl" style={{ background: 'var(--gray-50)', border: '1px solid var(--border-subtle)' }}>
                          <div className="font-bold text-lg mb-3" style={{ color: 'var(--gray-900)' }}>{i + 1}. {topic.title}</div>
                          <div className="grid grid-cols-2 gap-3">
                            {topic.significance && (
                              <div className="p-3 rounded-lg" style={{ background: 'white', border: '1px solid var(--border-subtle)' }}>
                                <div className="text-xs font-semibold mb-1" style={{ color: 'var(--brand-600)' }}>研究意义</div>
                                <div className="text-sm" style={{ color: 'var(--gray-700)' }}>{topic.significance}</div>
                              </div>
                            )}
                            {topic.innovation && (
                              <div className="p-3 rounded-lg" style={{ background: 'white', border: '1px solid var(--border-subtle)' }}>
                                <div className="text-xs font-semibold mb-1" style={{ color: 'var(--brand-600)' }}>创新点</div>
                                <div className="text-sm" style={{ color: 'var(--gray-700)' }}>{topic.innovation}</div>
                              </div>
                            )}
                            {topic.feasibility && (
                              <div className="p-3 rounded-lg" style={{ background: 'white', border: '1px solid var(--border-subtle)' }}>
                                <div className="text-xs font-semibold mb-1" style={{ color: 'var(--brand-600)' }}>可行性</div>
                                <div className="text-sm" style={{ color: 'var(--gray-700)' }}>{topic.feasibility}</div>
                              </div>
                            )}
                            {topic.expectedOutput && (
                              <div className="p-3 rounded-lg" style={{ background: 'white', border: '1px solid var(--border-subtle)' }}>
                                <div className="text-xs font-semibold mb-1" style={{ color: 'var(--brand-600)' }}>预期成果</div>
                                <div className="text-sm" style={{ color: 'var(--gray-700)' }}>{topic.expectedOutput}</div>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tab 1: 写作大纲 */}
                {activeResultTab === 1 && result.outline && (
                  <div className="card-premium p-6">
                    <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--gray-900)' }}>📋 写作大纲</h3>
                    <div className="space-y-3">
                      {result.outline.sections?.map((section: any, i: number) => (
                        <div key={i} className="p-4 rounded-xl" style={{ background: 'var(--gray-50)', border: '1px solid var(--border-subtle)' }}>
                          <div className="font-bold mb-2" style={{ color: 'var(--gray-900)' }}>{section.title}</div>
                          {section.subsections && (
                            <div className="space-y-1 ml-4">
                              {section.subsections.map((sub: string, j: number) => (
                                <div key={j} className="text-sm" style={{ color: 'var(--gray-600)' }}>• {sub}</div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tab 2: 章节要点 */}
                {activeResultTab === 2 && result.points?.points && (
                  <div className="card-premium p-6">
                    <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--gray-900)' }}>📝 章节要点</h3>
                    <div className="space-y-4">
                      {Object.values(result.points.points).map((section: any, i: number) => (
                        <div key={i} className="p-4 rounded-xl" style={{ background: 'var(--gray-50)', border: '1px solid var(--border-subtle)' }}>
                          <div className="flex items-center justify-between mb-3">
                            <div className="font-bold" style={{ color: 'var(--gray-900)' }}>{section.title}</div>
                            <span className="text-xs px-2 py-1 rounded-full" style={{ background: 'var(--brand-100)', color: 'var(--brand-700)' }}>
                              建议 {section.suggestedWords} 字
                            </span>
                          </div>
                          <div className="space-y-2">
                            {section.items?.map((item: any, j: number) => (
                              <div key={j} className="flex gap-2">
                                <span className="text-sm font-semibold" style={{ color: 'var(--brand-600)' }}>{j + 1}.</span>
                                <div>
                                  <span className="text-sm font-semibold" style={{ color: 'var(--gray-800)' }}>{item.point}</span>
                                  {item.description && (
                                    <span className="text-sm ml-1" style={{ color: 'var(--gray-500)' }}>— {item.description}</span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* ===== 文献综述结果 ===== */}
            {selectedWorkflow === "review-full" && (
              <>
                {/* Tab 0: 关键词与文献 */}
                {activeResultTab === 0 && (
                  <div className="space-y-4">
                    {result.keywords && result.keywords.length > 0 && (
                      <div className="card-premium p-6">
                        <h3 className="text-lg font-bold mb-3" style={{ color: 'var(--gray-900)' }}>🔍 检索关键词</h3>
                        <p className="text-sm mb-3" style={{ color: 'var(--gray-500)' }}>AI根据您的研究主题生成了以下英文检索关键词：</p>
                        <div className="flex flex-wrap gap-2">
                          {result.keywords.map((kw: string, i: number) => (
                            <span key={i} className="px-4 py-2 rounded-full text-sm font-medium" style={{ background: 'var(--brand-100)', color: 'var(--brand-700)' }}>
                              {kw}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {result.papers && result.papers.length > 0 && (
                      <div className="card-premium p-6">
                        <h3 className="text-lg font-bold mb-3" style={{ color: 'var(--gray-900)' }}>📚 搜索到的文献（{result.papers.length}篇）</h3>
                        <div className="space-y-3">
                          {result.papers.map((paper: any, i: number) => (
                            <div key={i} className="p-4 rounded-xl" style={{ background: 'var(--gray-50)', border: '1px solid var(--border-subtle)' }}>
                              <div className="font-medium text-sm mb-1" style={{ color: 'var(--gray-900)' }}>
                                {i + 1}. {paper.title}
                              </div>
                              <div className="text-xs" style={{ color: 'var(--gray-600)' }}>
                                {paper.authors?.slice(0, 3).join(", ")} · {paper.year} · {paper.journal}
                              </div>
                              <div className="text-xs mt-1" style={{ color: 'var(--gray-400)' }}>
                                引用: {paper.citationCount}
                                {paper.url && (
                                  <a href={paper.url} target="_blank" rel="noopener noreferrer" className="ml-2" style={{ color: 'var(--brand-600)' }}>
                                    查看原文
                                  </a>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Tab 1: 综述框架 */}
                {activeResultTab === 1 && result.framework && (
                  <div className="card-premium p-6">
                    <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--gray-900)' }}>📋 综述框架</h3>
                    <div className="space-y-3">
                      {result.framework.sections?.map((section: any, i: number) => (
                        <div key={i} className="p-4 rounded-xl" style={{ background: 'var(--gray-50)', border: '1px solid var(--border-subtle)' }}>
                          <div className="font-bold mb-2" style={{ color: 'var(--gray-900)' }}>{section.title}</div>
                          {section.subsections && (
                            <div className="space-y-1 ml-4">
                              {section.subsections.map((sub: string, j: number) => (
                                <div key={j} className="text-sm" style={{ color: 'var(--gray-600)' }}>• {sub}</div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tab 2: 写作要点 */}
                {activeResultTab === 2 && result.points?.points && (
                  <div className="card-premium p-6">
                    <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--gray-900)' }}>📝 写作要点</h3>
                    <div className="space-y-4">
                      {Object.values(result.points.points).map((section: any, i: number) => (
                        <div key={i} className="p-4 rounded-xl" style={{ background: 'var(--gray-50)', border: '1px solid var(--border-subtle)' }}>
                          <div className="flex items-center justify-between mb-3">
                            <div className="font-bold" style={{ color: 'var(--gray-900)' }}>{section.title}</div>
                            <span className="text-xs px-2 py-1 rounded-full" style={{ background: 'var(--brand-100)', color: 'var(--brand-700)' }}>
                              建议 {section.suggestedWords} 字
                            </span>
                          </div>
                          <div className="space-y-2">
                            {section.items?.map((item: any, j: number) => (
                              <div key={j} className="flex gap-2">
                                <span className="text-sm font-semibold" style={{ color: 'var(--brand-600)' }}>{j + 1}.</span>
                                <div>
                                  <span className="text-sm font-semibold" style={{ color: 'var(--gray-800)' }}>{item.point}</span>
                                  {item.description && (
                                    <span className="text-sm ml-1" style={{ color: 'var(--gray-500)' }}>— {item.description}</span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* 操作按钮 */}
            <div className="flex gap-3 pt-2">
              <button onClick={() => { setResult(null); setInputText(""); setGrantKeywords(""); setReviewField(""); setActiveResultTab(0); }} className="btn btn-secondary px-4 py-2 text-sm">
                🔄 重新开始
              </button>
              <button onClick={() => handleExport("md")} className="btn btn-secondary px-4 py-2 text-sm">
                📄 导出Markdown
              </button>
              <button onClick={() => handleExport("txt")} className="btn btn-secondary px-4 py-2 text-sm">
                📄 导出文本
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
