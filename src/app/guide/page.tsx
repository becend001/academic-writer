"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import { Navbar } from "@/components/ui/Navbar";
import { useToast } from "@/components/ui/Toast";
import { copyToClipboard } from "@/lib/utils/clipboard";

export default function GuidePage() {
  const [user, setUser] = useState<any>(null);
  const [field, setField] = useState("");
  const [keywords, setKeywords] = useState("");
  const [idea, setIdea] = useState("");
  const [projectType, setProjectType] = useState("国家自然科学基金面上项目");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");
  const [todayUsage, setTodayUsage] = useState(0);
  const [whitelisted, setWhitelisted] = useState(false);
  const usageLimit = 3;
  const { showToast } = useToast();

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
      const res = await fetch("/api/usage");
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

  const handleGenerate = async () => {
    if (!checkUsage()) return;
    if (!field.trim()) {
      setError("请输入研究领域");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch("/api/grant/guide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          field,
          keywords,
          idea,
          projectType,
          outputType: ["topics", "outline", "points"],
        }),
      });

      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setResult(data);
        setTodayUsage((prev) => prev + 1);
        try {
          await fetch("/api/works", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title: `智能写作引导 - ${field}`, content: field.substring(0, 200), result: JSON.stringify(data).substring(0, 200), feature: "guide" }),
          });
        } catch {}
      }
    } catch {
      setError("生成失败，请稍后重试");
    }

    setLoading(false);
  };

  const handleCopyAll = () => {
    if (!result) return;

    let text = "智能写作引导方案\n\n";

    // 选题
    if (result.topics && result.topics.length > 0) {
      text += "📌 推荐选题\n\n";
      result.topics.forEach((topic: any, i: number) => {
        text += `${i + 1}. ${topic.title}\n`;
        text += `   研究意义：${topic.significance}\n`;
        text += `   创新点：${topic.innovation}\n`;
        text += `   可行性：${topic.feasibility}\n`;
        text += `   预期成果：${topic.expectedOutput}\n\n`;
      });
    }

    // 大纲
    if (result.outline && result.outline.sections) {
      text += "📋 写作大纲\n\n";
      result.outline.sections.forEach((section: any) => {
        text += `${section.title}\n`;
        if (section.subsections) {
          section.subsections.forEach((sub: any) => {
            text += `  ${sub.title}\n`;
          });
        }
        text += "\n";
      });
    }

    // 要点
    if (result.points) {
      text += "📝 各章节要点\n\n";
      Object.entries(result.points).forEach(([key, value]: [string, any]) => {
        text += `【${value.title}】\n`;
        value.items?.forEach((item: any, i: number) => {
          text += `  ${i + 1}. ${item.point}：${item.description}\n`;
        });
        text += `  建议字数：${value.suggestedWords}字\n\n`;
      });
    }

    copyToClipboard(text);
    showToast("已复制到剪贴板");
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
      <Navbar activePage="guide" rightContent={
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm" style={{ background: whitelisted ? '#EFF6FF' : todayUsage >= usageLimit ? '#FEE2E2' : '#DCFCE7', color: whitelisted ? '#1D4ED8' : todayUsage >= usageLimit ? '#DC2626' : '#16A34A' }}>
            <span>{whitelisted ? '种子用户' : '剩余'}</span>
            <span className="font-bold">{whitelisted ? '不限次数' : `${usageLimit - todayUsage}/${usageLimit}`}</span>
          </div>
          <div className="text-base" style={{ color: 'var(--gray-500)' }}>{user?.email}</div>
        </div>
      } />

      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* 标题 */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, var(--color-literature), var(--color-literature-dark))', boxShadow: '0 2px 8px rgba(124, 58, 237, 0.3)' }}>
            <span className="text-xl">🧠</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--gray-900)' }}>智能写作引导</h1>
            <p className="text-sm" style={{ color: 'var(--gray-500)' }}>从研究想法到完整写作方案，一键生成</p>
          </div>
        </div>

        {/* 输入表单 */}
        <div className="card-premium p-6 mb-6">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-base font-semibold mb-2" style={{ color: 'var(--gray-700)' }}>研究领域 *</label>
              <input
                type="text"
                value={field}
                onChange={(e) => setField(e.target.value)}
                className="input py-3"
                placeholder="如：人工智能、医学影像"
              />
            </div>
            <div>
              <label className="block text-base font-semibold mb-2" style={{ color: 'var(--gray-700)' }}>关键词</label>
              <input
                type="text"
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                className="input py-3"
                placeholder="如：深度学习、诊断、准确率"
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-base font-semibold mb-2" style={{ color: 'var(--gray-700)' }}>研究想法（选填）</label>
            <textarea
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
              className="textarea h-24"
              placeholder="请描述您的研究想法，AI将为您生成完整的写作方案..."
            />
          </div>

          <div className="mb-4">
            <label className="block text-base font-semibold mb-2" style={{ color: 'var(--gray-700)' }}>项目类型</label>
            <select
              value={projectType}
              onChange={(e) => setProjectType(e.target.value)}
              className="input py-3"
            >
              <optgroup label="国家自然科学基金">
                <option>国家自然科学基金面上项目</option>
                <option>国家自然科学基金青年项目</option>
                <option>国家自然科学基金重点项目</option>
                <option>国家自然科学基金重大项目</option>
              </optgroup>
              <optgroup label="国家社会科学基金">
                <option>国家社科基金一般项目</option>
                <option>国家社科基金青年项目</option>
                <option>国家社科基金重点项目</option>
              </optgroup>
              <optgroup label="教育部项目">
                <option>教育部人文社科一般项目</option>
                <option>教育部人文社科青年项目</option>
              </optgroup>
              <optgroup label="省部级项目">
                <option>省自然科学基金面上项目</option>
                <option>省自然科学基金青年项目</option>
                <option>省社科基金一般项目</option>
                <option>省社科基金青年项目</option>
              </optgroup>
              <optgroup label="其他">
                <option>市厅级项目</option>
                <option>横向课题（企业合作）</option>
                <option>校级科研项目</option>
                <option>博士后科学基金</option>
              </optgroup>
            </select>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl text-sm font-medium flex items-center gap-2" style={{ background: 'var(--color-grant-light)', color: 'var(--color-grant-dark)' }}>
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <button
            onClick={handleGenerate}
            disabled={loading || !field.trim()}
            className="btn btn-primary"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <div className="spinner"></div>
                <span>生成中...</span>
              </span>
            ) : (
              <>
                <span>🧠</span>
                <span>生成写作方案</span>
              </>
            )}
          </button>
        </div>

        {/* 结果展示 */}
        {result && (
          <div className="space-y-6">
            {/* 推荐选题 */}
            {result.topics && result.topics.length > 0 && (
              <div className="card-premium p-6">
                <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--gray-900)' }}>📌 推荐选题</h2>
                <div className="space-y-4">
                  {result.topics.map((topic: any, i: number) => (
                    <div key={i} className="p-4 rounded-xl" style={{ background: 'var(--gray-50)', border: '1px solid var(--border-subtle)' }}>
                      <div className="font-semibold mb-2" style={{ color: 'var(--gray-900)' }}>{i + 1}. {topic.title}</div>
                      <div className="text-sm space-y-1" style={{ color: 'var(--gray-600)' }}>
                        <p><span className="font-medium">研究意义：</span>{topic.significance}</p>
                        <p><span className="font-medium">创新点：</span>{topic.innovation}</p>
                        <p><span className="font-medium">可行性：</span>{topic.feasibility}</p>
                        <p><span className="font-medium">预期成果：</span>{topic.expectedOutput}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 写作大纲 */}
            {result.outline && result.outline.sections && (
              <div className="card-premium p-6">
                <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--gray-900)' }}>📋 写作大纲</h2>
                <div className="space-y-3">
                  {result.outline.sections.map((section: any, i: number) => (
                    <div key={i}>
                      <div className="font-semibold mb-1" style={{ color: 'var(--gray-900)' }}>{section.title}</div>
                      {section.subsections && (
                        <div className="ml-4 space-y-1">
                          {section.subsections.map((sub: any, j: number) => (
                            <div key={j} className="text-sm" style={{ color: 'var(--gray-600)' }}>
                              {sub.title}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 各章节要点 */}
            {result.points && Object.keys(result.points).length > 0 && (
              <div className="card-premium p-6">
                <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--gray-900)' }}>📝 各章节要点</h2>
                <div className="space-y-4">
                  {Object.entries(result.points).map(([key, value]: [string, any]) => (
                    <div key={key} className="p-4 rounded-xl" style={{ background: 'var(--gray-50)', border: '1px solid var(--border-subtle)' }}>
                      <div className="font-semibold mb-2" style={{ color: 'var(--gray-900)' }}>{value.title}</div>
                      <div className="space-y-1 mb-2">
                        {value.items?.map((item: any, i: number) => (
                          <div key={i} className="text-sm" style={{ color: 'var(--gray-600)' }}>
                            {i + 1}. {item.point}：{item.description}
                          </div>
                        ))}
                      </div>
                      <div className="text-xs" style={{ color: 'var(--gray-400)' }}>
                        建议字数：{value.suggestedWords}字
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 操作按钮 */}
            <div className="flex gap-4">
              <button onClick={handleCopyAll} className="btn btn-secondary">
                <span>📋</span>
                <span>复制全部</span>
              </button>
              <Link href="/grant" className="btn btn-primary">
                <span>✍️</span>
                <span>基于此方案开始撰写</span>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
