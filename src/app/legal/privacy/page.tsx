"use client";

import Link from "next/link";

export default function PrivacyPage() {
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
        <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--gray-900)' }}>隐私政策</h1>
        <p className="text-sm mb-10" style={{ color: 'var(--gray-400)' }}>更新日期：2026年7月</p>

        <div className="card-premium p-8 space-y-6" style={{ lineHeight: '1.8', color: 'var(--gray-700)' }}>
          <section>
            <h2 className="text-xl font-bold mb-3" style={{ color: 'var(--gray-900)' }}>1. 信息收集</h2>
            <p>我们在您使用本平台时收集以下信息：</p>
            <ul className="list-disc ml-6 mt-2 space-y-1">
              <li><strong>注册信息</strong>：邮箱地址、密码（加密存储）</li>
              <li><strong>使用数据</strong>：功能使用频率、文档保存记录</li>
              <li><strong>输入内容</strong>：您提交给AI处理的文本内容</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3" style={{ color: 'var(--gray-900)' }}>2. 信息使用</h2>
            <p>我们收集的信息仅用于以下目的：</p>
            <ul className="list-disc ml-6 mt-2 space-y-1">
              <li>提供和维护本平台服务</li>
              <li>验证用户身份，保障账号安全</li>
              <li>统计服务使用情况，改进产品功能</li>
              <li>发送服务通知和更新（经您同意）</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3" style={{ color: 'var(--gray-900)' }}>3. AI处理与数据安全</h2>
            <p>当您使用AI功能时，您提交的文本将通过安全加密通道传输至AI服务商进行处理。我们采取以下措施保护您的数据安全：</p>
            <ul className="list-disc ml-6 mt-2 space-y-1">
              <li>所有数据传输采用HTTPS加密</li>
              <li>用户密码使用bcrypt加密存储</li>
              <li>数据库启用行级安全策略（RLS），确保用户只能访问自己的数据</li>
              <li>AI处理过程不保留您的文本内容用于模型训练</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3" style={{ color: 'var(--gray-900)' }}>4. 信息共享</h2>
            <p>我们不会出售、交换或以其他方式向第三方提供您的个人信息，但以下情况除外：</p>
            <ul className="list-disc ml-6 mt-2 space-y-1">
              <li>经您明确同意</li>
              <li>法律法规要求披露</li>
              <li>为保护本平台或其用户的合法权利</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3" style={{ color: 'var(--gray-900)' }}>5. Cookie使用</h2>
            <p>本平台使用Cookie和本地存储技术来：</p>
            <ul className="list-disc ml-6 mt-2 space-y-1">
              <li>维持您的登录状态</li>
              <li>记住您的偏好设置</li>
              <li>分析服务使用情况</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3" style={{ color: 'var(--gray-900)' }}>6. 数据存储与保留</h2>
            <p>您的账户信息和文档数据将存储在安全的云服务器上。在您注销账户后，我们将在30天内删除您的个人数据。</p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3" style={{ color: 'var(--gray-900)' }}>7. 您的权利</h2>
            <ul className="list-disc ml-6 space-y-1">
              <li>查阅和更正您的个人信息</li>
              <li>请求删除您的账户和数据</li>
              <li>撤回对数据处理的同意</li>
              <li>导出您的数据</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3" style={{ color: 'var(--gray-900)' }}>8. 隐私政策更新</h2>
            <p>我们可能会不时更新本隐私政策。更新后的政策将在平台上公布，重大变更时我们将通过邮件通知您。</p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3" style={{ color: 'var(--gray-900)' }}>9. 联系方式</h2>
            <p>如您对本隐私政策有任何疑问，请通过平台提供的联系方式与我们取得联系。</p>
          </section>
        </div>
      </div>
    </div>
  );
}
