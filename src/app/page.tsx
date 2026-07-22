"use client";

import Link from "next/link";

// 导航栏
function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50" style={{ background: 'rgba(250, 250, 249, 0.92)', backdropFilter: 'blur(16px)', borderBottom: '1px solid var(--border-subtle)' }}>
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-18" style={{ height: '72px' }}>
          <div className="flex items-center gap-10">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, var(--brand-500), var(--brand-700))', boxShadow: '0 4px 12px rgba(37, 99, 235, 0.35)' }}>
                <span className="text-white font-bold text-xl">A</span>
              </div>
              <span className="text-xl font-bold" style={{ color: 'var(--gray-900)' }}>学术写作助手</span>
            </Link>
            <div className="hidden md:flex items-center gap-2">
              <a href="#features" className="px-5 py-2.5 rounded-lg font-semibold transition-colors" style={{ color: 'var(--gray-700)', fontSize: '16px' }}>功能</a>
              <a href="#pricing" className="px-5 py-2.5 rounded-lg font-semibold transition-colors" style={{ color: 'var(--gray-700)', fontSize: '16px' }}>定价</a>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/auth/login" className="px-5 py-2.5 rounded-lg font-semibold transition-colors" style={{ color: 'var(--gray-700)', fontSize: '16px' }}>登录</Link>
            <Link href="/auth/register" className="btn btn-primary btn-lg">免费试用</Link>
          </div>
        </div>
      </div>
    </nav>
  );
}

// Hero区域 - 简洁有力
function Hero() {
  return (
    <section className="pt-28 pb-20 px-6 relative overflow-hidden" style={{ background: 'linear-gradient(180deg, #EFF6FF 0%, #DBEAFE 50%, var(--bg-base) 100%)' }}>
      {/* 装饰元素 - 简化 */}
      <div className="absolute top-20 right-0 w-96 h-96 rounded-full opacity-20" style={{ background: 'radial-gradient(circle, #93C5FD 0%, transparent 70%)' }}></div>

      <div className="max-w-5xl mx-auto relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* 左侧：文案 */}
          <div>
            {/* 标签 */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold mb-6" style={{ background: 'rgba(255,255,255,0.8)', color: 'var(--brand-700)', border: '1px solid rgba(59, 130, 246, 0.15)' }}>
              <span className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: 'var(--brand-500)' }}>
                <span className="text-white text-xs">✓</span>
              </span>
              <span>专为中国高校教师设计</span>
            </div>

            {/* 主标题 */}
            <h1 className="mb-6" style={{ fontSize: '44px', fontWeight: '800', lineHeight: '1.15', letterSpacing: '-0.03em', color: 'var(--gray-900)' }}>
              AI驱动的
              <br />
              <span style={{ background: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                学术写作平台
              </span>
            </h1>

            {/* 副标题 */}
            <p className="mb-8" style={{ color: 'var(--gray-500)', fontSize: '18px', lineHeight: '1.8' }}>
              从润色到翻译，从摘要到文献，一个平台满足您所有学术写作需求
            </p>

            {/* 功能标签 */}
            <div className="flex flex-wrap gap-2 mb-8">
              {[
                { icon: "✍️", text: "润色", color: "#8B5CF6" },
                { icon: "🌐", text: "翻译", color: "#0891B2" },
                { icon: "📝", text: "摘要", color: "#D97706" },
                { icon: "🎯", text: "课题申报", color: "#DC2626" },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium" style={{ background: `${item.color}10`, color: item.color, border: `1px solid ${item.color}20` }}>
                  <span>{item.icon}</span>
                  <span>{item.text}</span>
                </div>
              ))}
            </div>

            {/* 按钮 */}
            <div className="flex flex-wrap gap-3">
              <Link href="/auth/register" className="px-8 py-3 rounded-xl text-base font-bold text-white transition-all hover:scale-105" style={{ background: 'linear-gradient(135deg, #3B82F6, #1D4ED8)', boxShadow: '0 4px 12px rgba(59, 130, 246, 0.35)' }}>
                免费开始 →
              </Link>
              <a href="#features" className="px-8 py-3 rounded-xl text-base font-semibold transition-all hover:bg-white" style={{ background: 'rgba(255,255,255,0.8)', color: 'var(--gray-700)', border: '1px solid var(--border)' }}>
                了解更多
              </a>
            </div>

            {/* 社会证明 */}
            <div className="mt-8 flex items-center gap-6" style={{ color: 'var(--gray-500)', fontSize: '14px' }}>
              <div className="flex items-center gap-1.5">
                <span style={{ color: '#10B981' }}>✓</span>
                <span>免费试用</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span style={{ color: '#10B981' }}>✓</span>
                <span>无需信用卡</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span style={{ color: '#10B981' }}>✓</span>
                <span>30秒注册</span>
              </div>
            </div>
          </div>

          {/* 右侧：产品预览 */}
          <div className="hidden lg:block">
            <div className="rounded-2xl p-6" style={{ background: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.8)', boxShadow: '0 8px 32px rgba(0,0,0,0.08)' }}>
              {/* 模拟产品界面 */}
              <div className="rounded-xl overflow-hidden" style={{ background: 'white', boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}>
                {/* 顶部栏 */}
                <div className="px-4 py-3 flex items-center gap-2" style={{ background: 'var(--gray-50)', borderBottom: '1px solid var(--border)' }}>
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-400"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                    <div className="w-3 h-3 rounded-full bg-green-400"></div>
                  </div>
                  <span className="text-xs ml-2" style={{ color: 'var(--gray-400)' }}>学术写作助手</span>
                </div>
                {/* 内容区 */}
                <div className="p-4">
                  <div className="flex gap-3 mb-4">
                    <div className="px-3 py-1.5 rounded-lg text-xs font-medium" style={{ background: 'var(--brand-500)', color: 'white' }}>润色</div>
                    <div className="px-3 py-1.5 rounded-lg text-xs font-medium" style={{ background: 'var(--gray-100)', color: 'var(--gray-600)' }}>翻译</div>
                    <div className="px-3 py-1.5 rounded-lg text-xs font-medium" style={{ background: 'var(--gray-100)', color: 'var(--gray-600)' }}>摘要</div>
                  </div>
                  {/* 原文 */}
                  <div className="mb-3">
                    <div className="text-xs font-medium mb-1" style={{ color: 'var(--gray-400)' }}>原文</div>
                    <div className="h-16 rounded-lg p-3 text-xs" style={{ background: 'var(--gray-50)', color: 'var(--gray-600)' }}>
                      本研究通过使用深度学习的方法来对医学影像进行分析，目的是想提高诊断的准确率...
                    </div>
                  </div>
                  {/* 润色后 */}
                  <div>
                    <div className="text-xs font-medium mb-1" style={{ color: 'var(--gray-400)' }}>润色后</div>
                    <div className="h-16 rounded-lg p-3 text-xs" style={{ background: '#ECFDF5', color: 'var(--gray-700)' }}>
                      本研究采用深度学习技术对医学影像进行分析，旨在提升诊断准确率...
                    </div>
                  </div>
                </div>
              </div>
              {/* 评分 */}
              <div className="mt-4 flex items-center justify-center gap-2">
                <div className="flex gap-0.5">
                  {[1,2,3,4,5].map(i => <span key={i} className="text-yellow-400">★</span>)}
                </div>
                <span className="text-sm font-medium" style={{ color: 'var(--gray-600)' }}>4.9/5.0</span>
                <span className="text-xs" style={{ color: 'var(--gray-400)' }}>（1,280条评价）</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// 功能展示
function Features() {
  const coreFeatures = [
    { 
      title: "学术润色", 
      desc: "一键提升论文表达质量，让您的学术写作更专业、更流畅", 
      color: "var(--color-polish)", 
      bg: "linear-gradient(135deg, #EEF2FF, #E0E7FF)",
      icon: "✍️"
    },
    { 
      title: "智能翻译", 
      desc: "中英互译，保持专业术语准确，支持学术论文级翻译", 
      color: "var(--color-translate)", 
      bg: "linear-gradient(135deg, #ECFEFF, #CFFAFE)",
      icon: "🌐"
    },
    { 
      title: "摘要生成", 
      desc: "输入论文全文，一键生成结构化摘要，节省写作时间", 
      color: "var(--color-abstract)", 
      bg: "linear-gradient(135deg, #FFFBEB, #FEF3C7)",
      icon: "📝"
    },
  ];

  const specialFeatures = [
    { 
      title: "一键全流程", 
      desc: "上传论文，自动完成润色→翻译→摘要→导出", 
      color: "var(--color-abstract)", 
      bg: "linear-gradient(135deg, #FEF3C7, #FDE68A)",
      icon: "⚡"
    },
    { 
      title: "写作引导", 
      desc: "从研究想法到完整写作方案，AI一键生成", 
      color: "var(--color-literature)", 
      bg: "linear-gradient(135deg, #F5F3FF, #EDE9FE)",
      icon: "🧠"
    },
    { 
      title: "课题申报", 
      desc: "智能选题、申报书生成，提高申报成功率", 
      color: "var(--color-grant)", 
      bg: "linear-gradient(135deg, #FEF2F2, #FECACA)",
      icon: "🎯"
    },
  ];

  return (
    <section id="features" className="py-24 px-6" style={{ background: 'var(--bg-base)' }}>
      <div className="max-w-7xl mx-auto">
        {/* 核心功能 */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2.5 px-5 py-2 rounded-full font-semibold mb-5" style={{ background: 'var(--gray-100)', color: 'var(--gray-700)', fontSize: '15px' }}>
            <span>✨</span>
            <span>核心功能</span>
          </div>
          <h2 className="heading-lg mb-5">一站式学术写作解决方案</h2>
          <p className="max-w-2xl mx-auto" style={{ color: 'var(--gray-600)', fontSize: '18px', lineHeight: '1.7' }}>
            从润色到翻译，从摘要到文献，一个平台满足您所有学术写作需求
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {coreFeatures.map((f, i) => (
            <div key={i} className="card-premium p-8 group cursor-pointer relative overflow-hidden">
              {/* 装饰背景 */}
              <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-10" style={{ background: `radial-gradient(circle, ${f.color} 0%, transparent 70%)`, transform: 'translate(30%, -30%)' }}></div>
              
              <div className="relative z-10">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5 transition-all group-hover:scale-110" style={{ background: f.bg, boxShadow: `0 4px 12px ${f.color}25` }}>
                  <span className="text-2xl">{f.icon}</span>
                </div>
                <h3 className="text-xl font-bold mb-3" style={{ color: 'var(--gray-900)' }}>{f.title}</h3>
                <p className="leading-relaxed" style={{ color: 'var(--gray-500)', fontSize: '15px' }}>{f.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* 特色功能 */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2.5 px-5 py-2 rounded-full font-semibold mb-5" style={{ background: 'linear-gradient(135deg, #FEF3C7, #FDE68A)', color: 'var(--color-abstract-dark)', fontSize: '15px' }}>
            <span>🚀</span>
            <span>特色功能</span>
          </div>
          <h2 className="text-2xl font-bold mb-3" style={{ color: 'var(--gray-900)' }}>我们的独特优势</h2>
          <p className="text-base" style={{ color: 'var(--gray-500)' }}>
            DeepSeek做不到的，我们帮您做
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {specialFeatures.map((f, i) => (
            <div key={i} className="card-premium p-8 group cursor-pointer relative overflow-hidden">
              {/* 装饰背景 */}
              <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-10" style={{ background: `radial-gradient(circle, ${f.color} 0%, transparent 70%)`, transform: 'translate(30%, -30%)' }}></div>
              
              <div className="relative z-10">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5 transition-all group-hover:scale-110" style={{ background: f.bg, boxShadow: `0 4px 12px ${f.color}25` }}>
                  <span className="text-2xl">{f.icon}</span>
                </div>
                <h3 className="text-xl font-bold mb-3" style={{ color: 'var(--gray-900)' }}>{f.title}</h3>
                <p className="leading-relaxed" style={{ color: 'var(--gray-500)', fontSize: '15px' }}>{f.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <Link href="/auth/register" className="btn btn-primary text-base px-8 py-3">
            <span>免费注册</span>
            <span>→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}

// 用户评价 - 更真实的评价内容
function Testimonials() {
  const testimonials = [
    {
      name: "王教授",
      title: "清华大学 计算机系",
      content: "以前润色一篇SCI论文需要2-3小时反复修改，现在用这个工具5分钟就完成了初稿润色，而且翻译质量比DeepL更专业，术语更准确。节省的时间可以专注研究本身。",
      avatar: "W"
    },
    {
      name: "李老师",
      title: "北京大学 教育学院",
      content: "去年申请国自然时用了课题申报辅助功能，帮我生成了完整的申报书框架和各章节要点，最终成功获批30万经费。这个工具真的帮了大忙。",
      avatar: "L"
    },
    {
      name: "张教授",
      title: "复旦大学 医学院",
      content: "写完论文后直接用一键全流程，自动完成润色、翻译、摘要生成，以前需要分开操作3次，现在一次搞定，效率提升至少5倍。",
      avatar: "Z"
    },
  ];

  return (
    <section className="py-20 px-6" style={{ background: 'var(--bg-base)' }}>
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2.5 px-5 py-2 rounded-full font-semibold mb-5" style={{ background: 'var(--gray-100)', color: 'var(--gray-700)', fontSize: '15px' }}>
            <span>💬</span>
            <span>用户评价</span>
          </div>
          <h2 className="mb-3" style={{ fontSize: '32px', fontWeight: '700', color: 'var(--gray-900)' }}>听听用户怎么说</h2>
          <p style={{ color: 'var(--gray-500)', fontSize: '18px' }}>来自真实高校教师的反馈</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <div key={i} className="card-premium p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-white" style={{ background: 'linear-gradient(135deg, var(--brand-400), var(--brand-600))' }}>
                  {t.avatar}
                </div>
                <div>
                  <div className="font-semibold" style={{ color: 'var(--gray-900)' }}>{t.name}</div>
                  <div className="text-sm" style={{ color: 'var(--gray-500)' }}>{t.title}</div>
                </div>
              </div>
              <div className="flex gap-0.5 mb-3">
                {[1,2,3,4,5].map(i => <span key={i} className="text-yellow-400">★</span>)}
              </div>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--gray-600)' }}>"{t.content}"</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// 数据展示（放在页脚前）
function Stats() {
  const stats = [
    { num: "200万+", label: "高校教师用户", icon: "👥" },
    { num: "6项", label: "核心AI功能", icon: "🤖" },
    { num: "30秒", label: "快速注册", icon: "⚡" },
    { num: "99.9%", label: "服务可用性", icon: "🛡️" },
  ];

  return (
    <section className="py-20 px-6" style={{ background: 'linear-gradient(135deg, #1E3A5F 0%, #1E40AF 50%, #1D4ED8 100%)' }}>
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">值得信赖的学术写作平台</h2>
          <p className="text-lg" style={{ color: 'rgba(255,255,255,0.8)' }}>已帮助数十万高校教师提升写作效率</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
          {stats.map((s, i) => (
            <div key={i} className="text-center p-6 rounded-2xl transition-all hover:-translate-y-1" style={{ background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.12)' }}>
              <div className="text-2xl mb-3">{s.icon}</div>
              <div className="text-3xl md:text-4xl font-bold text-white mb-2">{s.num}</div>
              <div className="font-medium text-sm" style={{ color: 'rgba(255,255,255,0.8)' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// 定价
function Pricing() {
  const plans = [
    { 
      name: "免费版", 
      price: "¥0", 
      period: "", 
      features: ["每天3次使用", "基础润色/翻译/摘要", "文档保存"], 
      btn: "btn-secondary",
      gradient: "linear-gradient(135deg, #F8FAFC, #F1F5F9)",
      iconBg: "linear-gradient(135deg, #E2E8F0, #CBD5E1)",
      icon: "🆓",
      textColor: "var(--gray-900)",
      featureColor: "var(--gray-700)",
      checkColor: "#10B981"
    },
    { 
      name: "教师版",
      price: "¥299",
      period: "/月",
      features: ["无限使用所有功能", "润色/翻译/摘要", "文献搜索", "优先客服"], 
      btn: "btn-primary", 
      popular: true,
      gradient: "linear-gradient(135deg, #EFF6FF, #DBEAFE)",
      iconBg: "linear-gradient(135deg, #3B82F6, #1D4ED8)",
      icon: "👨‍🏫",
      textColor: "var(--gray-900)",
      featureColor: "var(--gray-700)",
      checkColor: "#10B981"
    },
    { 
      name: "专业版",
      price: "¥599",
      period: "/月",
      features: ["教师版所有功能", "课题申报辅助", "写作引导", "团队协作"], 
      btn: "btn-secondary",
      gradient: "linear-gradient(135deg, #F8FAFC, #F1F5F9)",
      iconBg: "linear-gradient(135deg, #E2E8F0, #CBD5E1)",
      icon: "🎯",
      textColor: "var(--gray-900)",
      featureColor: "var(--gray-700)",
      checkColor: "#10B981"
    },
  ];

  return (
    <section id="pricing" className="py-24 px-6" style={{ background: 'linear-gradient(180deg, #F8FAFC 0%, #F1F5F9 100%)' }}>
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2.5 px-5 py-2 rounded-full font-semibold mb-5" style={{ background: 'rgba(255,255,255,0.8)', color: 'var(--gray-700)', fontSize: '15px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
            <span>💰</span>
            <span>定价方案</span>
          </div>
          <h2 className="mb-5" style={{ fontSize: '36px', fontWeight: '700', color: 'var(--gray-900)' }}>选择适合您的方案</h2>
          <p style={{ color: 'var(--gray-500)', fontSize: '18px' }}>从免费开始，按需升级</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((p, i) => (
            <div 
              key={i} 
              className="relative rounded-2xl overflow-hidden transition-all hover:-translate-y-2"
              style={{ 
                background: p.gradient,
                boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
                border: '1px solid var(--border)'
              }}
            >
              {/* 最受欢迎标签已移除 */}
              <div className="p-8">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5" style={{ background: p.iconBg, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                  <span className="text-3xl">{p.icon}</span>
                </div>
                <div className="text-2xl font-bold mb-2" style={{ color: p.textColor }}>{p.name}</div>
                <div className="flex items-baseline gap-1 mb-8">
                  <span className="text-5xl font-bold" style={{ color: p.textColor }}>{p.price}</span>
                  <span className="text-lg font-medium" style={{ color: 'var(--gray-500)' }}>{p.period}</span>
                </div>
                <div className="space-y-4 mb-10">
                  {p.features.map((f, j) => (
                    <div key={j} className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: 'rgba(16, 185, 129, 0.1)' }}>
                        <span className="text-sm" style={{ color: p.checkColor }}>✓</span>
                      </div>
                      <span className="font-medium" style={{ color: p.featureColor, fontSize: '16px' }}>{f}</span>
                    </div>
                  ))}
                </div>
                <Link href="/auth/register" className={`btn ${p.btn} w-full py-4 text-base`}>开始使用</Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// CTA - 带限时优惠
function CTA() {
  return (
    <section className="py-20 px-6" style={{ background: 'var(--bg-base)' }}>
      <div className="max-w-4xl mx-auto">
        <div className="rounded-3xl p-12 text-center relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #1E3A5F 0%, #1E40AF 100%)' }}>
          {/* 装饰元素 */}
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-20" style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%)', transform: 'translate(30%, -30%)' }}></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full opacity-15" style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%)', transform: 'translate(-30%, 30%)' }}></div>
          
          <div className="relative z-10">
            {/* 限时优惠标签 */}
            <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full text-base font-bold mb-6" style={{ background: 'rgba(255,255,255,0.2)', color: 'white', border: '1px solid rgba(255,255,255,0.3)' }}>
              <span>🔥</span>
              <span>限时优惠：教师版首月仅 ¥99</span>
              <span className="px-2 py-0.5 rounded text-xs" style={{ background: 'rgba(255,255,255,0.3)' }}>省200元</span>
            </div>

            <h2 className="mb-4" style={{ fontSize: '36px', fontWeight: '700', color: 'white' }}>
              准备好提升学术写作效率了吗？
            </h2>
            <p className="text-xl mb-8" style={{ color: 'rgba(255,255,255,0.85)' }}>
              立即注册，免费体验所有核心功能
            </p>
            <Link href="/auth/register" className="px-10 py-4 rounded-xl text-lg font-bold transition-all hover:scale-105" style={{ background: 'white', color: 'var(--brand-700)', boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)' }}>
              <span>免费开始</span>
              <span className="ml-2">→</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

// 页脚
function Footer() {
  return (
    <footer className="py-16 px-6" style={{ background: 'var(--gray-900)' }}>
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #3B82F6, #1D4ED8)' }}>
              <span className="text-white font-bold text-lg">A</span>
            </div>
            <span className="text-xl font-bold text-white">学术写作助手</span>
          </div>
          <div className="flex items-center gap-8" style={{ color: 'rgba(255,255,255,0.7)', fontSize: '16px', fontWeight: '500' }}>
            <a href="#features" className="hover:text-white transition-colors">功能</a>
            <a href="#pricing" className="hover:text-white transition-colors">定价</a>
            <a href="/legal/terms" className="hover:text-white transition-colors">用户协议</a>
            <a href="/legal/privacy" className="hover:text-white transition-colors">隐私政策</a>
          </div>
          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px' }}>© 2026 学术写作助手</div>
        </div>
      </div>
    </footer>
  );
}

// 主页
export default function Home() {
  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-base)' }}>
      <Navbar />
      <Hero />
      <Features />
      <Pricing />
      <Testimonials />
      <CTA />
      <Stats />
      <Footer />
    </div>
  );
}
