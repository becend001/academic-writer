"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import { FileUpload } from "@/components/ui/FileUpload";
import { Navbar } from "@/components/ui/Navbar";
import { Onboarding, shouldShowOnboarding } from "@/components/ui/Onboarding";
import { useToast } from "@/components/ui/Toast";
import { copyToClipboard } from "@/lib/utils/clipboard";

export default function WorkspacePage() {
  const [user, setUser] = useState<any>(null);
  const [inputText, setInputText] = useState("");
  const [outputText, setOutputText] = useState("");
  const [originalText, setOriginalText] = useState("");
  const [changes, setChanges] = useState<any[]>([]);
  const [showComparison, setShowComparison] = useState(false);
  const [documents, setDocuments] = useState<any[]>([]);
  const [currentDocId, setCurrentDocId] = useState<string | null>(null);
  const [docTitle, setDocTitle] = useState("未命名文档");
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [todayUsage, setTodayUsage] = useState(0);
  const [whitelisted, setWhitelisted] = useState(false);
  const usageLimit = 3;
  const { showToast } = useToast();
  // 文献搜索已移至独立页面 /literature
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    // 检查是否需要显示新手引导
    if (shouldShowOnboarding()) {
      setShowOnboarding(true);
    }
  }, []);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) { setUser(user); loadDocuments(); loadUsage(); }
      else { window.location.href = "/auth/login"; }
    });
  }, []);

  const loadDocuments = async () => {
    try {
      const res = await fetch("/api/works?limit=10");
      const data = await res.json();
      if (data.works) setDocuments(data.works);
    } catch {}
  };

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

  const executeAI = async (action: string, options?: any) => {
    if (!checkUsage() || !inputText.trim()) {
      if (!inputText.trim()) setError("请先输入文本");
      return;
    }
    setLoading(action);
    setError("");
    try {
      let endpoint = "";
      let body: any = { text: inputText };
      switch (action) {
        case "polish": endpoint = "/api/polish"; break;
        case "translate": endpoint = "/api/translate"; body.targetLang = options?.targetLang || "en"; break;
        case "abstract": endpoint = "/api/abstract"; body.language = options?.language || "zh"; break;
        case "keywords": endpoint = "/api/keywords"; body.count = options?.count || 5; break;
        case "grammar": endpoint = "/api/grammar"; break;
        default: return;
      }
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        let output = "";
        switch (action) {
          case "polish":
            output = data.polishedText || "";
            setOriginalText(inputText);
            setChanges(data.changes || []);
            setShowComparison(true);
            break;
          case "translate": output = data.translatedText || ""; break;
          case "abstract": output = `【摘要】\n${data.abstract}\n\n【关键词】\n${data.keywords?.join("、") || ""}`; break;
          case "keywords": output = data.keywords?.join("\n") || ""; break;
          case "grammar":
            const typeLabels: Record<string, string> = {
              grammar: "语法",
              punctuation: "标点",
              style: "表达"
            };
            output = `语法评分：${data.score}/100\n\n` +
              (data.errors?.map((e: any, i: number) =>
                `${i + 1}. [${typeLabels[e.type] || e.type}] ${e.original} → ${e.suggestion}\n   原因：${e.explanation}`
              ).join("\n\n") || "未发现语法问题");
            break;
        }
        setOutputText(output);
        // 向服务端记录使用量
        try {
          await fetch("/api/works", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title: `使用记录 - ${action}`, content: inputText.substring(0, 200), result: output.substring(0, 200), feature: action }),
          });
        } catch {}
        setTodayUsage((prev) => prev + 1);
      }
    } catch { setError("操作失败，请稍后重试"); }
    setLoading(null);
  };

  const handleSave = async () => {
    if (!inputText.trim()) { setError("没有内容可保存"); return; }
    try {
      const res = await fetch("/api/works", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: docTitle, content: inputText, result: outputText, feature: "document" }),
      });
      const data = await res.json();
      if (data.work) { setCurrentDocId(data.work.id); showToast("保存成功！"); loadDocuments(); }
    } catch { setError("保存失败"); }
  };

  const handleOpenDocument = (doc: any) => {
    setInputText(doc.content || "");
    setOutputText(doc.result || "");
    setDocTitle(doc.title || "未命名文档");
    setCurrentDocId(doc.id);
    setShowComparison(false);
  };

  const handleFileContent = (content: string, fileName: string) => {
    setInputText(content);
    setDocTitle(fileName.replace(/\.[^/.]+$/, ""));
    setError("");
  };

  const handleCopy = () => {
    copyToClipboard(outputText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-base)' }}>
        <div className="flex items-center gap-3" style={{ color: 'var(--gray-500)' }}>
          <div className="spinner" style={{ borderColor: 'var(--gray-300)', borderTopColor: 'var(--brand-500)' }}></div>
          <span>加载中...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg-base)' }}>
      <Navbar 
        activePage="workspace" 
        rightContent={
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl text-base" style={{ background: whitelisted ? '#EFF6FF' : todayUsage >= usageLimit ? '#FEE2E2' : '#DCFCE7', color: whitelisted ? '#1D4ED8' : todayUsage >= usageLimit ? '#DC2626' : '#16A34A' }}>
              <span>{whitelisted ? '种子用户' : '剩余'}</span>
              <span className="font-bold">{whitelisted ? '不限次数' : `${usageLimit - todayUsage}/${usageLimit}`}</span>
            </div>
            <Link href="/profile" className="w-10 h-10 rounded-full flex items-center justify-center text-base font-bold text-white transition-transform hover:scale-110" style={{ background: 'linear-gradient(135deg, #3B82F6, #1D4ED8)' }}>
              {user.email?.charAt(0).toUpperCase()}
            </Link>
          </div>
        }
      />

      {/* 主内容区 - 左右分栏 */}
      <div className="flex-1 flex" style={{ background: 'var(--bg-base)' }}>
        {/* 左侧：输入区 + 功能按钮 */}
        <div className="w-5/12 flex flex-col" style={{ borderRight: '1px solid var(--border)' }}>
          {/* 文档标题 */}
          <div className="px-6 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
            <input
              type="text"
              value={docTitle}
              onChange={(e) => setDocTitle(e.target.value)}
              className="text-xl font-bold border-none focus:outline-none focus:ring-0 w-full bg-transparent"
              style={{ color: 'var(--gray-900)' }}
              placeholder="文档标题"
            />
          </div>

          {/* 文件上传 + 输入框 */}
          <div className="flex-1 p-5 overflow-auto flex flex-col">
            {/* 文件上传 */}
            <div className="mb-4">
              <FileUpload onFileContent={handleFileContent} disabled={loading !== null} />
            </div>
            
            {/* 输入文本框 - 放大 */}
            <div className="flex-1 flex flex-col">
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-semibold" style={{ color: 'var(--gray-700)' }}>输入文本</label>
                <span className="text-sm" style={{ color: 'var(--gray-500)' }}>{inputText.length} / 5,000 字</span>
              </div>
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                maxLength={5000}
                className="textarea flex-1 text-base min-h-[200px]"
                placeholder="请粘贴或输入您要处理的文本..."
              />
            </div>

            {/* 错误提示 */}
            {error && (
              <div className="mt-3 p-3 rounded-xl text-sm font-medium flex items-center gap-2" style={{ background: 'var(--color-grant-light)', color: 'var(--color-grant-dark)' }}>
                <span>⚠️</span>
                <span>{error}</span>
              </div>
            )}

            {/* 功能按钮 - 精简版 */}
            <div className="mt-5">
              <div className="section-label">快速处理</div>
              <div className="grid grid-cols-3 gap-2.5">
                {[
                  { id: "polish", label: "润色", icon: "✍️", desc: "提升文本质量" },
                  { id: "translate", label: "翻译", icon: "🌐", desc: "中英互译" },
                  { id: "abstract", label: "摘要", icon: "📝", desc: "生成摘要+关键词" },
                ].map((btn) => (
                  <button 
                    key={btn.id} 
                    onClick={() => executeAI(btn.id)} 
                    disabled={loading !== null || !inputText.trim()} 
                    className="btn btn-primary disabled:opacity-50"
                    title={btn.desc}
                  >
                    {loading === btn.id ? (
                      <div className="spinner"></div>
                    ) : (
                      <>
                        <span>{btn.icon}</span>
                        <span>{btn.label}</span>
                      </>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* 操作按钮 */}
            <div className="mt-3 flex gap-3">
              <button onClick={handleSave} disabled={!inputText.trim()} className="btn btn-primary">
                <span>💾</span>
                <span>保存文档</span>
              </button>
              <button onClick={() => { setInputText(""); setOutputText(""); setShowComparison(false); setChanges([]); setDocTitle("未命名文档"); setCurrentDocId(null); }} className="btn btn-secondary">
                <span>🗑️</span>
                <span>清空</span>
              </button>
            </div>
          </div>
        </div>

        {/* 右侧：结果区 - 直接显示结果，不需要标签页 */}
        <div className="w-7/12 flex flex-col" style={{ background: 'var(--bg-surface)' }}>
          {/* 顶部标题 */}
          <div className="px-6 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
            <div className="flex items-center justify-between">
              <span className="text-lg font-semibold" style={{ color: 'var(--gray-900)' }}>
                {outputText ? '处理结果' : '等待处理'}
              </span>
              {outputText && (
                <span className="text-sm px-2 py-0.5 rounded" style={{ background: 'var(--gray-100)', color: 'var(--gray-500)' }}>
                  {outputText.length} 字
                </span>
              )}
            </div>
          </div>

          {/* 内容区 */}
          <div className="flex-1 p-6 overflow-auto">
            {outputText ? (
              <div className="space-y-4">
                {/* 修改后文本 */}
                <div className="p-4 rounded-xl text-base leading-relaxed" style={{ background: 'var(--gray-50)', border: '1px solid var(--border-subtle)', color: 'var(--gray-700)' }}>
                  <pre className="whitespace-pre-wrap font-sans">{outputText}</pre>
                </div>

                {/* 修改记录 */}
                {showComparison && changes.length > 0 && (
                  <div>
                    <div className="text-sm font-semibold mb-2" style={{ color: 'var(--gray-600)' }}>
                      修改记录（{changes.length}处）
                    </div>
                    <div className="space-y-2">
                      {changes.filter(c => c && c.original && c.suggested).map((change, index) => (
                        <div key={index} className="p-3 rounded-lg text-sm" style={{ background: 'var(--gray-50)', border: '1px solid var(--border-subtle)' }}>
                          <div className="flex items-center gap-2">
                            <span className="line-through" style={{ color: 'var(--color-grant)' }}>{change.original}</span>
                            <span style={{ color: 'var(--gray-400)' }}>→</span>
                            <span className="font-medium" style={{ color: 'var(--color-grammar)' }}>{change.suggested}</span>
                          </div>
                          {change.reason && (
                            <div className="mt-1 text-xs" style={{ color: 'var(--gray-500)' }}>
                              {change.reason}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="h-full flex items-center justify-center">
                <div className="text-center py-12 px-8">
                  <div className="w-20 h-20 mx-auto mb-6 rounded-2xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #EFF6FF, #DBEAFE)' }}>
                    <span className="text-4xl">📊</span>
                  </div>
                  <div className="text-xl font-semibold mb-3" style={{ color: 'var(--gray-700)' }}>处理结果将显示在这里</div>
                  <div className="text-sm mb-6" style={{ color: 'var(--gray-400)' }}>在左侧输入文本后，点击功能按钮即可处理</div>
                  
                  <div className="text-left max-w-sm mx-auto">
                    <div className="text-xs font-medium mb-2" style={{ color: 'var(--gray-500)' }}>支持的功能：</div>
                    <div className="grid grid-cols-1 gap-2 text-xs" style={{ color: 'var(--gray-400)' }}>
                      <div className="flex items-center gap-1.5">
                        <span style={{ color: 'var(--brand-500)' }}>●</span>
                        <span>润色 - 提升文本质量，检查语法</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span style={{ color: 'var(--brand-500)' }}>●</span>
                        <span>翻译 - 中英互译，学术级翻译</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span style={{ color: 'var(--brand-500)' }}>●</span>
                        <span>摘要 - 生成摘要+关键词</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 底部操作按钮 */}
          {outputText && (
            <div className="px-6 py-4 flex flex-wrap gap-2" style={{ borderTop: '1px solid var(--border)' }}>
              {showComparison && (
                <>
                  <button onClick={() => { setOutputText(""); setShowComparison(false); executeAI("polish"); }} disabled={loading !== null || (!whitelisted && todayUsage >= usageLimit)} className="btn btn-primary">
                    <span>🔄</span>
                    <span>再次润色</span>
                  </button>
                  <button onClick={() => { setInputText(originalText); setOutputText(""); setShowComparison(false); executeAI("polish"); }} disabled={loading !== null || (!whitelisted && todayUsage >= usageLimit)} className="btn btn-secondary">
                    <span>↩️</span>
                    <span>用原文重试</span>
                  </button>
                </>
              )}
              <button onClick={handleCopy} className={`btn ${copied ? 'btn-success' : 'btn-secondary'}`}>
                <span>{copied ? '✓' : '📋'}</span>
                <span>{copied ? '已复制' : '复制'}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 新手引导 */}
      {showOnboarding && (
        <Onboarding onComplete={() => setShowOnboarding(false)} />
      )}
    </div>
  );
}
