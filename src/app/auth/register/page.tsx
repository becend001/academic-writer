"use client";

import Link from "next/link";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { useToast } from "@/components/ui/Toast";

export default function RegisterPage() {
  const { showToast } = useToast();
  return (
    <div className="min-h-screen flex" style={{ background: 'var(--bg-base)' }}>
      {/* 左侧：品牌展示 */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, var(--brand-600) 0%, var(--brand-800) 100%)' }}>
        <div className="absolute inset-0" style={{ background: 'radial-gradient(circle at 70% 50%, rgba(255,255,255,0.1) 0%, transparent 50%)' }}></div>
        <div className="absolute top-20 left-10 w-72 h-72 rounded-full opacity-20" style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%)' }}></div>
        
        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-20">
          <div className="flex items-center gap-4 mb-10">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.3)' }}>
              <span className="text-white font-bold text-3xl">A</span>
            </div>
            <span className="text-3xl font-bold text-white">学术写作助手</span>
          </div>
          
          <h1 className="text-4xl xl:text-5xl font-bold text-white mb-6" style={{ letterSpacing: '-0.02em', lineHeight: '1.2' }}>
            开始您的高效<br />学术写作之旅
          </h1>
          
          <p className="text-xl text-white/80 mb-10" style={{ lineHeight: '1.8' }}>
            注册即可获得每天3次免费使用额度
          </p>
          
          <div className="space-y-5">
            {[
              { num: "3", unit: "次/天", text: "免费使用额度" },
              { num: "6", unit: "项", text: "核心AI功能" },
              { num: "∞", unit: "", text: "文档保存空间" },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-5">
                <div className="w-16 h-16 rounded-2xl flex flex-col items-center justify-center" style={{ background: 'rgba(255,255,255,0.25)', border: '1px solid rgba(255,255,255,0.3)' }}>
                  <span className="text-2xl font-bold" style={{ color: 'white' }}>{item.num}</span>
                  <span className="text-xs" style={{ color: 'rgba(255,255,255,0.8)' }}>{item.unit}</span>
                </div>
                <span className="text-xl font-semibold" style={{ color: 'white' }}>{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 右侧：注册表单 */}
      <div className="flex-1 flex flex-col justify-center px-6 py-12 sm:px-12 lg:px-16 xl:px-24">
        <div className="mx-auto w-full max-w-lg">
          {/* Logo（移动端显示） */}
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, var(--brand-500), var(--brand-700))', boxShadow: '0 4px 12px rgba(37, 99, 235, 0.35)' }}>
              <span className="text-white font-bold text-2xl">A</span>
            </div>
            <span className="text-2xl font-bold" style={{ color: 'var(--gray-900)' }}>学术写作助手</span>
          </div>

          <h2 className="text-4xl font-bold mb-3" style={{ color: 'var(--gray-900)', letterSpacing: '-0.02em' }}>创建账号</h2>
          <p className="mb-10" style={{ color: 'var(--gray-600)', fontSize: '18px' }}>
            已有账号？{" "}
            <Link href="/auth/login" className="font-semibold" style={{ color: 'var(--brand-600)' }}>立即登录</Link>
          </p>

          <RegisterForm />

          <div className="mt-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full" style={{ borderTop: '1px solid var(--border-default)' }} />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 font-medium" style={{ background: 'var(--bg-base)', color: 'var(--gray-500)', fontSize: '15px' }}>或</span>
              </div>
            </div>

            <div className="mt-8">
              <button type="button" onClick={() => showToast("微信注册功能即将上线", "info")} className="w-full btn btn-secondary py-3.5 text-base">
                <span className="text-lg">📱</span>
                <span>微信注册</span>
              </button>
            </div>
          </div>

          <p className="mt-8 text-center font-medium" style={{ color: 'var(--gray-500)', fontSize: '14px' }}>
            注册即表示您同意我们的{" "}
            <Link href="/legal/terms" className="font-semibold" style={{ color: 'var(--brand-600)' }}>用户协议</Link>
            {" "}和{" "}
            <Link href="/legal/privacy" className="font-semibold" style={{ color: 'var(--brand-600)' }}>隐私政策</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
