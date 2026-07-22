"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import { Navbar } from "@/components/ui/Navbar";
import { useToast } from "@/components/ui/Toast";

const proposalSections = [
  { id: "abstract", title: "摘要", icon: "📝" },
  { id: "background", title: "立项依据", icon: "📚" },
  { id: "content", title: "研究内容", icon: "🎯" },
  { id: "methodology", title: "研究方案", icon: "🔬" },
  { id: "innovation", title: "特色与创新", icon: "💡" },
  { id: "plan", title: "年度计划", icon: "📅" },
  { id: "output", title: "预期成果", icon: "🏆" },
  { id: "budget", title: "经费预算", icon: "💰" },
];

export default function GrantPage() {
  const [user, setUser] = useState<any>(null);
  const [projectTitle, setProjectTitle] = useState("");
  const [projectField, setProjectField] = useState("");
  const [projectKeywords, setProjectKeywords] = useState("");
  const [projectType, setProjectType] = useState("国家自然科学基金面上项目");
  const [currentStep, setCurrentStep] = useState<"topic" | "framework" | "edit">("topic");
  const [activeSection, setActiveSection] = useState("abstract");
  const [topicLoading, setTopicLoading] = useState(false);
  const [topicSuggestions, setTopicSuggestions] = useState<any[]>([]);
  const [sections, setSections] = useState<Record<string, string>>({});
  const [sectionLoading, setSectionLoading] = useState<string | null>(null);
  const [budgetItems, setBudgetItems] = useState<any[]>([]);
  const [budgetTotal, setBudgetTotal] = useState(50);
  const [innovations, setInnovations] = useState<any[]>([]);
  const { showToast } = useToast();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUser(user);
      else window.location.href = "/auth/login";
    });
  }, []);

  const handleGenerateTopics = async () => {
    if (!projectField && !projectKeywords) return;
    setTopicLoading(true);
    try {
      const res = await fetch("/api/grant/topic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ field: projectField, keywords: projectKeywords, projectType }),
      });
      const data = await res.json();
      setTopicSuggestions(data.suggestions || []);
    } catch { showToast("生成选题建议失败", "error"); }
    setTopicLoading(false);
  };

  const handleSelectTopic = (topic: any) => {
    setProjectTitle(topic.title);
    setCurrentStep("framework");
  };

  const handleGenerateSection = async (sectionId: string) => {
    if (!projectTitle) return;
    setSectionLoading(sectionId);
    try {
      const res = await fetch("/api/grant/section", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: projectTitle, field: projectField, section: sectionId, projectType }),
      });
      const data = await res.json();
      if (data.error) { showToast(data.error, "error"); }
      else if (data.content) {
        let content = "";
        if (typeof data.content === "string") content = data.content;
        else if (data.content.zhAbstract) content = `【中文摘要】\n${data.content.zhAbstract}\n\n【英文摘要】\n${data.content.enAbstract}`;
        else if (data.content.innovations) {
          setInnovations(data.content.innovations);
          content = data.content.innovations.map((i: any, idx: number) => `${idx + 1}. ${i.title}\n   描述：${i.description}\n   区别：${i.difference}\n   价值：${i.value}`).join("\n\n");
        } else if (data.content.items) {
          setBudgetItems(data.content.items);
          setBudgetTotal(data.content.totalBudget || 50);
          content = `总预算：${data.content.totalBudget}万元\n\n` + data.content.items.map((item: any) => `${item.category}：${item.amount}万元\n  说明：${item.description}\n  依据：${item.basis}`).join("\n\n");
        } else { content = JSON.stringify(data.content, null, 2); }
        setSections((prev) => ({ ...prev, [sectionId]: content }));
      }
    } catch { showToast("生成失败", "error"); }
    setSectionLoading(null);
  };

  const handleExport = (format: "txt" | "md") => {
    const allContent = proposalSections.map((s) => `## ${s.title}\n\n${sections[s.id] || ""}`).join("\n\n---\n\n");
    const header = `# ${projectTitle || "课题申报书"}\n\n**研究领域**：${projectField || "未指定"}\n**关键词**：${projectKeywords || "未指定"}\n**项目类型**：${projectType}\n\n---\n\n`;
    const fullContent = header + allContent;
    const blob = new Blob([format === "md" ? fullContent : fullContent.replace(/[#*`\-\n]{3,}/g, "\n")], { type: format === "md" ? "text/markdown" : "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${projectTitle || "申报书"}.${format === "md" ? "md" : "txt"}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!user) return <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-base)' }}><div className="flex items-center gap-3" style={{ color: 'var(--gray-600)' }}><div className="spinner" style={{ borderColor: 'var(--gray-300)', borderTopColor: 'var(--brand-500)' }}></div><span>加载中...</span></div></div>;

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-base)' }}>
      <Navbar activePage="grant" rightContent={
        <div className="text-base" style={{ color: 'var(--gray-500)' }}>{user?.email}</div>
      } />

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* 标题栏 */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, var(--color-grant), var(--color-grant-dark))', boxShadow: '0 2px 8px rgba(220, 38, 38, 0.3)' }}>
              <span className="text-xl">🎯</span>
            </div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--gray-900)', letterSpacing: '-0.02em' }}>课题申报辅助</h1>
          </div>
          <div className="flex gap-3">
            <Link href="/literature" className="btn btn-secondary">
              <span>📚</span>
              <span>文献搜索</span>
            </Link>
            {currentStep === "edit" && (
              <>
                <button onClick={() => handleExport("md")} className="btn btn-secondary">
                  <span>📄</span>
                  <span>导出 Markdown</span>
                </button>
                <button onClick={() => handleExport("txt")} className="btn btn-primary">
                  <span>📋</span>
                  <span>导出文本</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* 步骤导航 */}
        <div className="flex items-center gap-4 mb-8">
          {[
            { step: "topic", label: "选题建议", num: "1" },
            { step: "framework", label: "填写信息", num: "2" },
            { step: "edit", label: "撰写申报书", num: "3" },
          ].map((s, i) => (
            <div key={s.step} className="flex items-center gap-4">
              <div className="flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-base font-semibold transition-all" style={{
                background: currentStep === s.step ? 'var(--brand-600)' : 'var(--gray-100)',
                color: currentStep === s.step ? 'white' : 'var(--gray-600)',
                boxShadow: currentStep === s.step ? '0 2px 8px rgba(37, 99, 235, 0.3)' : 'none'
              }}>
                <span className="w-6 h-6 rounded-full flex items-center justify-center text-sm" style={{
                  background: currentStep === s.step ? 'rgba(255,255,255,0.2)' : 'var(--gray-200)',
                  color: currentStep === s.step ? 'white' : 'var(--gray-600)'
                }}>{s.num}</span>
                <span>{s.label}</span>
              </div>
              {i < 2 && <div className="w-10 h-0.5 rounded-full" style={{ background: 'var(--gray-300)' }} />}
            </div>
          ))}
        </div>

        {/* 步骤1：选题建议 */}
        {currentStep === "topic" && (
          <div className="card card-elevated p-8">
            <div className="flex items-center gap-3 mb-3">
              <span style={{ fontSize: '24px' }}>💡</span>
              <h2 className="text-2xl font-bold" style={{ color: 'var(--gray-900)' }}>获取选题建议</h2>
            </div>
            <p className="mb-8" style={{ color: 'var(--gray-600)', fontSize: '16px' }}>输入研究领域和关键词，AI将为您推荐合适的课题选题</p>

            <div className="grid grid-cols-2 gap-5 mb-8">
              <div>
                <label className="block text-base font-semibold mb-3" style={{ color: 'var(--gray-700)' }}>研究领域</label>
                <input type="text" value={projectField} onChange={(e) => setProjectField(e.target.value)} className="input py-3.5 text-base" placeholder="如：人工智能、医学影像" />
              </div>
              <div>
                <label className="block text-base font-semibold mb-3" style={{ color: 'var(--gray-700)' }}>关键词</label>
                <input type="text" value={projectKeywords} onChange={(e) => setProjectKeywords(e.target.value)} className="input py-3.5 text-base" placeholder="如：深度学习、诊断、准确率" />
              </div>
            </div>

            <div className="mb-8">
              <label className="block text-base font-semibold mb-3" style={{ color: 'var(--gray-700)' }}>项目类型</label>
              <select value={projectType} onChange={(e) => setProjectType(e.target.value)} className="input">
                <optgroup label="国家自然科学基金">
                  <option value="国家自然科学基金面上项目">国家自然科学基金面上项目</option>
                  <option value="国家自然科学基金青年项目">国家自然科学基金青年项目</option>
                  <option value="国家自然科学基金地区项目">国家自然科学基金地区项目</option>
                  <option value="国家自然科学基金重点项目">国家自然科学基金重点项目</option>
                  <option value="国家自然科学基金重大项目">国家自然科学基金重大项目</option>
                  <option value="国家自然科学基金重大研究计划">国家自然科学基金重大研究计划</option>
                  <option value="国家自然科学基金国际(地区)合作研究项目">国家自然科学基金国际合作项目</option>
                </optgroup>
                <optgroup label="国家社会科学基金">
                  <option value="国家社科基金一般项目">国家社科基金一般项目</option>
                  <option value="国家社科基金青年项目">国家社科基金青年项目</option>
                  <option value="国家社科基金重点项目">国家社科基金重点项目</option>
                  <option value="国家社科基金重大项目">国家社科基金重大项目</option>
                </optgroup>
                <optgroup label="科技部项目">
                  <option value="科技部重点研发计划">科技部重点研发计划</option>
                  <option value="科技部重大专项">科技部重大专项</option>
                </optgroup>
                <optgroup label="教育部项目">
                  <option value="教育部人文社科一般项目">教育部人文社科一般项目</option>
                  <option value="教育部人文社科青年项目">教育部人文社科青年项目</option>
                  <option value="教育部人文社科重点项目">教育部人文社科重点项目</option>
                </optgroup>
                <optgroup label="省部级项目">
                  <option value="省自然科学基金面上项目">省自然科学基金面上项目</option>
                  <option value="省自然科学基金青年项目">省自然科学基金青年项目</option>
                  <option value="省社科基金一般项目">省社科基金一般项目</option>
                  <option value="省社科基金青年项目">省社科基金青年项目</option>
                  <option value="省教育厅项目">省教育厅项目</option>
                  <option value="省科技厅项目">省科技厅项目</option>
                </optgroup>
                <optgroup label="其他">
                  <option value="市厅级项目">市厅级项目</option>
                  <option value="横向课题（企业合作）">横向课题（企业合作）</option>
                  <option value="校级科研项目">校级科研项目</option>
                  <option value="博士后科学基金">博士后科学基金</option>
                </optgroup>
              </select>
            </div>

            <button onClick={handleGenerateTopics} disabled={topicLoading || (!projectField && !projectKeywords)} className="btn btn-primary">
              {topicLoading ? <><div className="spinner"></div><span>生成中...</span></> : <><span>🎯</span><span>AI推荐选题</span></>}
            </button>

            {topicSuggestions.length > 0 && (
              <div className="mt-6 space-y-4">
                <div className="section-label">AI推荐的选题</div>
                {topicSuggestions.map((topic, index) => (
                  <div key={index} className="card card-hover p-5">
                    <h4 className="font-semibold mb-3" style={{ color: 'var(--gray-900)' }}>{topic.title}</h4>
                    <div className="space-y-2 text-sm" style={{ color: 'var(--gray-600)' }}>
                      <p><span className="font-medium" style={{ color: 'var(--gray-700)' }}>研究意义：</span>{topic.significance}</p>
                      <p><span className="font-medium" style={{ color: 'var(--gray-700)' }}>创新点：</span>{topic.innovation}</p>
                      <p><span className="font-medium" style={{ color: 'var(--gray-700)' }}>可行性：</span>{topic.feasibility}</p>
                      <p><span className="font-medium" style={{ color: 'var(--gray-700)' }}>预期成果：</span>{topic.expectedOutput}</p>
                    </div>
                    <button onClick={() => handleSelectTopic(topic)} className="mt-4 btn btn-primary">
                      <span>✓</span>
                      <span>选择此选题</span>
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-6 pt-4" style={{ borderTop: '1px solid var(--border-subtle)' }}>
              <button onClick={() => setCurrentStep("framework")} className="text-sm font-medium" style={{ color: 'var(--brand-600)' }}>已有选题？直接填写项目信息 →</button>
            </div>
          </div>
        )}

        {/* 步骤2：填写项目信息 */}
        {currentStep === "framework" && (
          <div className="card card-elevated p-8">
            <h2 className="text-2xl font-bold mb-6" style={{ color: 'var(--gray-900)' }}>填写项目信息</h2>
            <div className="space-y-5 mb-8">
              <div>
                <label className="block text-base font-semibold mb-3" style={{ color: 'var(--gray-700)' }}>项目名称 *</label>
                <input type="text" value={projectTitle} onChange={(e) => setProjectTitle(e.target.value)} className="input py-3.5 text-base" placeholder="请输入项目名称" />
              </div>
              <div>
                <label className="block text-base font-semibold mb-3" style={{ color: 'var(--gray-700)' }}>研究领域</label>
                <input type="text" value={projectField} onChange={(e) => setProjectField(e.target.value)} className="input py-3.5 text-base" placeholder="如：人工智能、医学影像" />
              </div>
              <div>
                <label className="block text-base font-semibold mb-3" style={{ color: 'var(--gray-700)' }}>关键词</label>
                <input type="text" value={projectKeywords} onChange={(e) => setProjectKeywords(e.target.value)} className="input py-3.5 text-base" placeholder="如：深度学习、诊断、准确率" />
              </div>
            </div>
            <div className="flex gap-4">
              <button onClick={() => setCurrentStep("topic")} className="btn btn-secondary">返回</button>
              <button onClick={() => setCurrentStep("edit")} disabled={!projectTitle} className="btn btn-primary">开始撰写申报书</button>
            </div>
          </div>
        )}

        {/* 步骤3：撰写申报书 */}
        {currentStep === "edit" && (
          <div className="flex gap-8">
            {/* 左侧：章节导航 */}
            <div className="w-72 flex-shrink-0">
              <div className="card card-elevated p-5 sticky top-8">
                <div className="section-label">申报书章节</div>
                <nav className="space-y-2">
                  {proposalSections.map((section) => (
                    <button key={section.id} onClick={() => setActiveSection(section.id)} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left text-base font-medium transition-all" style={{
                      background: activeSection === section.id ? 'var(--brand-50)' : 'transparent',
                      color: activeSection === section.id ? 'var(--brand-600)' : 'var(--gray-600)',
                      border: activeSection === section.id ? '1px solid var(--brand-200)' : '1px solid transparent'
                    }}>
                      <span className="text-lg">{section.icon}</span>
                      <span className="flex-1">{section.title}</span>
                      {sections[section.id] && <div className="w-2.5 h-2.5 rounded-full" style={{ background: 'var(--color-grammar)' }} />}
                    </button>
                  ))}
                </nav>
                <div className="mt-5 pt-4" style={{ borderTop: '1px solid var(--border-subtle)' }}>
                  <button onClick={() => handleExport("md")} className="w-full btn btn-secondary text-sm mb-2">📄 导出 Markdown</button>
                  <button onClick={() => handleExport("txt")} className="w-full btn btn-primary text-sm">📋 导出文本</button>
                </div>
              </div>
            </div>

            {/* 右侧：内容编辑区 */}
            <div className="flex-1">
              <div className="card card-elevated p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span style={{ fontSize: '24px' }}>{proposalSections.find((s) => s.id === activeSection)?.icon}</span>
                    <h2 className="text-2xl font-bold" style={{ color: 'var(--gray-900)' }}>{proposalSections.find((s) => s.id === activeSection)?.title}</h2>
                  </div>
                  <button onClick={() => handleGenerateSection(activeSection)} disabled={sectionLoading === activeSection || !projectTitle} className="btn btn-primary">
                    {sectionLoading === activeSection ? <><div className="spinner"></div><span>生成中...</span></> : <><span>✨</span><span>AI生成</span></>}
                  </button>
                </div>

                {/* 预算特殊UI */}
                {activeSection === "budget" && budgetItems.length > 0 && (
                  <div className="mb-5 p-5 rounded-xl" style={{ background: 'var(--color-grammar-light)', border: '1px solid rgba(5, 150, 105, 0.2)' }}>
                    <div className="font-bold text-base mb-4" style={{ color: 'var(--color-grammar-dark)' }}>💰 预算明细（总计 {budgetTotal} 万元）</div>
                    <div className="space-y-3">
                      {budgetItems.map((item, i) => (
                        <div key={i} className="flex items-center justify-between p-3 rounded-xl" style={{ background: 'white', border: '1px solid rgba(5, 150, 105, 0.1)' }}>
                          <div><span className="font-semibold text-base" style={{ color: 'var(--gray-900)' }}>{item.category}</span><span className="font-medium ml-3" style={{ color: 'var(--gray-600)', fontSize: '16px' }}>{item.amount}万元</span></div>
                          <span className="font-medium" style={{ color: 'var(--gray-500)', fontSize: '15px' }}>{item.description}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 创新点特殊UI */}
                {activeSection === "innovation" && innovations.length > 0 && (
                  <div className="mb-5 p-5 rounded-xl" style={{ background: 'var(--color-literature-light)', border: '1px solid rgba(124, 58, 237, 0.2)' }}>
                    <div className="font-bold text-base mb-4" style={{ color: 'var(--color-literature-dark)' }}>💡 创新点（共{innovations.length}个）</div>
                    <div className="space-y-3">
                      {innovations.map((item, i) => (
                        <div key={i} className="p-4 rounded-xl" style={{ background: 'white', border: '1px solid rgba(124, 58, 237, 0.1)' }}>
                          <div className="font-semibold text-base mb-2" style={{ color: 'var(--gray-900)' }}>{i + 1}. {item.title}</div>
                          <div className="space-y-1.5" style={{ color: 'var(--gray-600)', fontSize: '16px' }}>
                            <p><span className="font-medium" style={{ color: 'var(--color-literature)' }}>描述：</span>{item.description}</p>
                            <p><span className="font-medium" style={{ color: 'var(--color-literature)' }}>区别：</span>{item.difference}</p>
                            <p><span className="font-medium" style={{ color: 'var(--color-literature)' }}>价值：</span>{item.value}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <textarea value={sections[activeSection] || ""} onChange={(e) => setSections((prev) => ({ ...prev, [activeSection]: e.target.value }))} className="textarea h-[500px] text-base" placeholder={`点击"AI生成"按钮自动生成内容，或手动输入...`} />

                <div className="mt-5 flex items-center justify-between" style={{ color: 'var(--gray-500)', fontSize: '16px' }}>
                  <span>{sections[activeSection]?.length || 0} 字</span>
                  <button onClick={() => { navigator.clipboard.writeText(sections[activeSection] || ""); showToast("已复制"); }} className="font-semibold" style={{ color: 'var(--brand-600)' }}>复制内容</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
