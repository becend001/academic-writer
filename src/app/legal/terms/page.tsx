"use client";

import Link from "next/link";

export default function TermsPage() {
  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-base)' }}>
      <header style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border-subtle)' }}>
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, var(--brand-500), var(--brand-700))' }}>
              <span className="text-white font-bold text-xl">A</span>
            </div>
            <span className="text-xl font-bold" style={{ color: 'var(--gray-900)' }}>学术写作助手</span>
          </Link>
          <Link href="/" className="text-sm font-medium" style={{ color: 'var(--brand-600)' }}>← 返回首页</Link>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--gray-900)' }}>用户协议</h1>
        <p className="text-sm mb-10" style={{ color: 'var(--gray-400)' }}>更新日期：2026年7月</p>

        <div className="card-premium p-8 space-y-6" style={{ lineHeight: '1.8', color: 'var(--gray-700)' }}>
          <section>
            <h2 className="text-xl font-bold mb-3" style={{ color: 'var(--gray-900)' }}>1. 服务条款</h2>
            <p>欢迎使用学术写作助手（以下简称"本平台"）。本平台是由学术写作助手团队运营的AI学术写作服务平台，旨在为高校教师提供学术写作辅助工具。</p>
            <p>您在使用本平台服务前，请仔细阅读并充分理解本协议的全部内容。一旦您注册或使用本平台服务，即表示您已阅读、理解并同意接受本协议的约束。</p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3" style={{ color: 'var(--gray-900)' }}>2. 服务内容</h2>
            <p>本平台提供以下AI辅助学术写作服务：</p>
            <ul className="list-disc ml-6 mt-2 space-y-1">
              <li>学术论文润色与语法检查</li>
              <li>中英文互译（学术语境）</li>
              <li>论文摘要与关键词生成</li>
              <li>文献搜索与综述辅助</li>
              <li>课题申报书辅助撰写</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3" style={{ color: 'var(--gray-900)' }}>3. 用户责任</h2>
            <p>您在使用本平台时应遵守以下规范：</p>
            <ul className="list-disc ml-6 mt-2 space-y-1">
              <li>提供真实、准确的注册信息</li>
              <li>妥善保管账号和密码，对账号下的活动负责</li>
              <li>不得利用本平台从事违法违规活动</li>
              <li>不得恶意攻击、干扰本平台的正常运行</li>
              <li>AI生成的内容仅供参考，请自行审核后使用</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3" style={{ color: 'var(--gray-900)' }}>4. 知识产权</h2>
            <p>本平台的技术、界面设计、文字、图片等均为平台所有。用户使用本平台AI功能生成的内容，知识产权归用户所有。但用户同意本平台可在匿名化处理后用于改进服务质量。</p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3" style={{ color: 'var(--gray-900)' }}>5. 免责声明</h2>
            <ul className="list-disc ml-6 space-y-1">
              <li>AI生成内容的准确性和完整性不作保证，请用户自行审核验证</li>
              <li>本平台不对因使用AI生成内容而导致的任何损失承担责任</li>
              <li>本平台保留随时修改或终止服务的权利</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3" style={{ color: 'var(--gray-900)' }}>6. 协议修改</h2>
            <p>本平台有权根据需要修改本协议，修改后的协议将在平台上公布。继续使用本平台服务即视为接受修改后的协议。</p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3" style={{ color: 'var(--gray-900)' }}>7. 联系方式</h2>
            <p>如您对本协议有任何疑问，请通过平台提供的联系方式与我们取得联系。</p>
          </section>
        </div>
      </div>
    </div>
  );
}
