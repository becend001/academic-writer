"use client";

import { useState } from "react";
import { csrfFetch } from "@/lib/utils/csrf-fetch";
import { useToast } from "@/components/ui/Toast";

interface FeedbackModalProps {
  onClose: () => void;
}

export function FeedbackModal({ onClose }: FeedbackModalProps) {
  const { showToast } = useToast();
  const [type, setType] = useState("suggestion");
  const [content, setContent] = useState("");
  const [contact, setContact] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!content.trim()) return;
    setLoading(true);
    try {
      const res = await csrfFetch("/api/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ type, content: content.trim(), contact: contact.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSubmitted(true);
        showToast("反馈提交成功，感谢您的建议！");
      } else {
        showToast(data.error || "提交失败", "error");
      }
    } catch {
      showToast("提交失败，请稍后重试", "error");
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.5)' }} onClick={onClose}>
      <div className="w-full max-w-md mx-4 p-8 rounded-2xl" style={{ background: 'white', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }} onClick={(e) => e.stopPropagation()}>
        <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--gray-900)' }}>意见反馈</h3>
        <p className="text-sm mb-6" style={{ color: 'var(--gray-500)' }}>
          {submitted ? "感谢您的反馈！" : "您的建议对我们很重要，帮助我们改进产品"}
        </p>

        {submitted ? (
          <div className="text-center">
            <div className="p-4 rounded-xl text-sm mb-6" style={{ background: '#DCFCE7', color: '#16A34A' }}>
              反馈已提交，我们会认真阅读每一条建议。
            </div>
            <button onClick={onClose} className="btn btn-primary w-full py-3">
              知道了
            </button>
          </div>
        ) : (
          <>
            <div className="mb-4">
              <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--gray-700)' }}>反馈类型</label>
              <select value={type} onChange={(e) => setType(e.target.value)} className="input py-3 w-full">
                <option value="suggestion">功能建议</option>
                <option value="bug">Bug反馈</option>
                <option value="other">其他</option>
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--gray-700)' }}>反馈内容 *</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="textarea h-32 w-full"
                placeholder="请详细描述您的建议或遇到的问题..."
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--gray-700)' }}>联系方式（选填）</label>
              <input
                type="text"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                className="input py-3 w-full"
                placeholder="邮箱或微信，方便我们回复您"
              />
            </div>

            <div className="flex gap-3">
              <button onClick={onClose} className="btn btn-secondary flex-1 py-3">
                取消
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading || !content.trim()}
                className="btn btn-primary flex-1 py-3"
              >
                {loading ? "提交中..." : "提交反馈"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
