"use client";

import { useState, useEffect } from "react";

interface OnboardingProps {
  onComplete: () => void;
}

const steps = [
  {
    icon: "✍️",
    title: "学术润色",
    description: "一键提升论文表达质量，让您的学术写作更专业",
    tip: "输入中文文本，点击润色按钮即可",
  },
  {
    icon: "🌐",
    title: "智能翻译",
    description: "中英互译，保持专业术语准确",
    tip: "支持中文→英文，英文→中文",
  },
  {
    icon: "📝",
    title: "摘要生成",
    description: "输入论文全文，一键生成结构化摘要",
    tip: "同时提取关键词，节省写作时间",
  },
  {
    icon: "📚",
    title: "文献搜索",
    description: "搜索相关学术文献，AI智能推荐",
    tip: "在导航栏点击文献搜索进入",
  },
  {
    icon: "🎯",
    title: "课题申报",
    description: "智能选题、申报书生成，提高申报成功率",
    tip: "在导航栏点击课题申报进入",
  },
];

export function Onboarding({ onComplete }: OnboardingProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  const step = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;

  const handleNext = () => {
    if (isLastStep) {
      // 保存到localStorage，不再显示
      localStorage.setItem("onboarding_completed", "true");
      setIsVisible(false);
      onComplete();
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleSkip = () => {
    localStorage.setItem("onboarding_completed", "true");
    setIsVisible(false);
    onComplete();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(4px)' }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        {/* 顶部进度条 */}
        <div className="h-1 bg-gray-200">
          <div 
            className="h-full transition-all duration-300"
            style={{ 
              width: `${((currentStep + 1) / steps.length) * 100}%`,
              background: 'linear-gradient(90deg, #3B82F6, #1D4ED8)'
            }}
          />
        </div>

        {/* 内容区 */}
        <div className="p-8 text-center">
          <div 
            className="w-20 h-20 mx-auto mb-6 rounded-2xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #EFF6FF, #DBEAFE)' }}
          >
            <span className="text-4xl">{step.icon}</span>
          </div>
          
          <h2 className="text-2xl font-bold mb-3" style={{ color: 'var(--gray-900)' }}>
            {step.title}
          </h2>
          <p className="text-base mb-4" style={{ color: 'var(--gray-600)' }}>
            {step.description}
          </p>
          
          <div className="p-3 rounded-lg mb-6" style={{ background: 'var(--gray-50)', border: '1px solid var(--border-light)' }}>
            <p className="text-sm" style={{ color: 'var(--gray-500)' }}>
              💡 {step.tip}
            </p>
          </div>

          {/* 进度指示器 */}
          <div className="flex justify-center gap-2 mb-6">
            {steps.map((_, i) => (
              <div 
                key={i}
                className="w-2 h-2 rounded-full transition-all"
                style={{ 
                  background: i === currentStep ? 'var(--brand-500)' : 'var(--gray-300)',
                  transform: i === currentStep ? 'scale(1.2)' : 'scale(1)'
                }}
              />
            ))}
          </div>
        </div>

        {/* 底部按钮 */}
        <div className="px-8 pb-8">
          <div className="flex gap-3">
            <button
              onClick={handleSkip}
              className="flex-1 btn btn-secondary py-3"
            >
              跳过
            </button>
            <button
              onClick={handleNext}
              className="flex-1 btn btn-primary py-3"
            >
              {isLastStep ? "开始使用" : "下一步"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// 检查是否需要显示引导
export function shouldShowOnboarding(): boolean {
  return localStorage.getItem("onboarding_completed") !== "true";
}
