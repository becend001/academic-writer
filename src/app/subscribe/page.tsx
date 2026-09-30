"use client";

import { useState } from "react";
import Link from "next/link";

export default function SubscribePage() {
  const [plan, setPlan] = useState("teacher");

  const plans = {
    teacher: {
      name: "教师版",
      price: "¥299",
      period: "/月",
      promo: "首月特惠 ¥99",
      features: ["无限使用所有功能", "润色/翻译/摘要", "文献搜索", "优先客服"],
    },
    professional: {
      name: "专业版",
      price: "¥599",
      period: "/月",
      promo: null,
      features: ["教师版所有功能", "课题申报辅助", "写作引导", "团队协作"],
    },
  };

  const current = plans[plan as keyof typeof plans];

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-base)' }}>
      {/* 顶部导航 */}
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
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold mb-3" style={{ color: 'var(--gray-900)' }}>开通会员</h1>
          <p className="text-lg" style={{ color: 'var(--gray-500)' }}>选择适合您的套餐，联系客服即可开通</p>
        </div>

        {/* 套餐选择 */}
        <div className="grid grid-cols-2 gap-6 mb-10">
          {Object.entries(plans).map(([key, p]) => (
            <div
              key={key}
              onClick={() => setPlan(key)}
              className="relative p-8 rounded-2xl cursor-pointer transition-all"
              style={{
                background: plan === key ? 'var(--brand-50)' : 'white',
                border: plan === key ? '2px solid var(--brand-500)' : '1px solid var(--border-subtle)',
                boxShadow: plan === key ? '0 8px 24px rgba(37, 99, 235, 0.15)' : '0 1px 3px rgba(0,0,0,0.08)',
              }}
            >
              {key === "teacher" && (
                <div className="absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-bold" style={{ background: '#FEE2E2', color: '#DC2626' }}>
                  🔥 首月 ¥99
                </div>
              )}
              <div className="text-lg font-bold mb-2" style={{ color: 'var(--gray-900)' }}>{p.name}</div>
              <div className="flex items-baseline gap-1 mb-4">
                <span className="text-4xl font-bold" style={{ color: 'var(--gray-900)' }}>{p.price}</span>
                <span className="text-base" style={{ color: 'var(--gray-500)' }}>{p.period}</span>
              </div>
              {p.promo && (
                <div className="mb-4 px-3 py-1.5 rounded-lg text-sm font-semibold inline-block" style={{ background: '#FEF3C7', color: '#B45309' }}>
                  限时优惠：{p.promo}（省200元）
                </div>
              )}
              <div className="space-y-2">
                {p.features.map((f, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm" style={{ color: 'var(--gray-600)' }}>
                    <span style={{ color: '#10B981' }}>✓</span>
                    <span>{f}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* 开通方式 */}
        <div className="card-premium p-8">
          <h2 className="text-xl font-bold mb-6" style={{ color: 'var(--gray-900)' }}>如何开通？</h2>

          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'var(--brand-100)' }}>
                <span className="text-lg font-bold" style={{ color: 'var(--brand-600)' }}>1</span>
              </div>
              <div>
                <div className="font-semibold mb-1" style={{ color: 'var(--gray-900)' }}>添加客服微信</div>
                <div className="text-sm" style={{ color: 'var(--gray-500)' }}>扫描下方二维码或搜索微信号添加客服</div>
                <div className="mt-2 inline-block px-4 py-2 rounded-lg text-sm font-mono" style={{ background: 'var(--gray-100)', color: 'var(--gray-900)' }}>
                  微信号：academic-writer-service
                </div>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'var(--brand-100)' }}>
                <span className="text-lg font-bold" style={{ color: 'var(--brand-600)' }}>2</span>
              </div>
              <div>
                <div className="font-semibold mb-1" style={{ color: 'var(--gray-900)' }}>告知开通需求</div>
                <div className="text-sm" style={{ color: 'var(--gray-500)' }}>
                  告诉客服您要开通 <strong style={{ color: 'var(--gray-900)' }}>{current.name}</strong>，并提供您的注册邮箱
                </div>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'var(--brand-100)' }}>
                <span className="text-lg font-bold" style={{ color: 'var(--brand-600)' }}>3</span>
              </div>
              <div>
                <div className="font-semibold mb-1" style={{ color: 'var(--gray-900)' }}>完成支付</div>
                <div className="text-sm" style={{ color: 'var(--gray-500)' }}>
                  支持微信/支付宝转账，客服确认后立即开通
                </div>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: '#DCFCE7' }}>
                <span className="text-lg font-bold" style={{ color: '#16A34A' }}>✓</span>
              </div>
              <div>
                <div className="font-semibold mb-1" style={{ color: 'var(--gray-900)' }}>开始使用</div>
                <div className="text-sm" style={{ color: 'var(--gray-500)' }}>
                  开通成功后刷新页面即可享受 <strong style={{ color: 'var(--gray-900)' }}>{current.name}</strong> 全部功能
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 p-4 rounded-xl" style={{ background: 'var(--brand-50)', border: '1px solid var(--brand-200)' }}>
            <div className="text-sm" style={{ color: 'var(--gray-700)' }}>
              💡 <strong>提示</strong>：当前您选择的是 <strong>{current.name}</strong>
              （{current.price}{current.period}）
              {current.promo && <>，{current.promo}</>}
              。如需其他套餐，请在上方切换。
            </div>
          </div>
        </div>

        {/* 底部 */}
        <div className="text-center mt-8">
          <p className="text-sm" style={{ color: 'var(--gray-400)' }}>
            还没有账号？{" "}
            <Link href="/auth/register" className="font-semibold" style={{ color: 'var(--brand-600)' }}>免费注册</Link>
            {" "}先体验免费版
          </p>
        </div>
      </div>
    </div>
  );
}
