"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/Toast";

interface Paper {
  id: string;
  paper_title: string;
  status: string;
  milestones: { status: string; date: string; note: string }[];
  target_journal: string | null;
  submission_date: string | null;
  decision_date: string | null;
  created_at: string;
  updated_at: string;
}

// 状态配置
const STATUS_CONFIG: Record<string, { color: string; icon: string }> = {
  "选题": { color: "#6B7280", icon: "💡" },
  "写作": { color: "#3B82F6", icon: "✍️" },
  "修改": { color: "#F59E0B", icon: "📝" },
  "投稿": { color: "#8B5CF6", icon: "📤" },
  "审稿": { color: "#EC4899", icon: "🔍" },
  "修回": { color: "#F97316", icon: "🔄" },
  "录用": { color: "#10B981", icon: "🎉" },
  "拒稿": { color: "#EF4444", icon: "❌" },
  "发表": { color: "#059669", icon: "🏆" },
};

// 状态流转顺序
const STATUS_FLOW = ["选题", "写作", "修改", "投稿", "审稿", "修回", "录用", "发表"];

export default function PaperTimeline() {
  const [papers, setPapers] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewPaper, setShowNewPaper] = useState(false);
  const [newPaperTitle, setNewPaperTitle] = useState("");
  const [newPaperJournal, setNewPaperJournal] = useState("");
  const [creating, setCreating] = useState(false);
  const [selectedPaper, setSelectedPaper] = useState<Paper | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const { showToast } = useToast();

  useEffect(() => {
    loadPapers();
  }, []);

  const loadPapers = async () => {
    try {
      const res = await fetch("/api/user/timeline");
      const data = await res.json();
      if (data.success) {
        setPapers(data.papers || []);
      }
    } catch (error) {
      console.error("加载论文失败:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePaper = async () => {
    if (!newPaperTitle.trim()) {
      showToast("请输入论文标题", "error");
      return;
    }

    setCreating(true);
    try {
      const res = await fetch("/api/user/timeline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paper_title: newPaperTitle,
          target_journal: newPaperJournal || null,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setPapers([data.paper, ...papers]);
        setShowNewPaper(false);
        setNewPaperTitle("");
        setNewPaperJournal("");
        showToast("论文已创建", "success");
      }
    } catch (error) {
      showToast("创建失败", "error");
    } finally {
      setCreating(false);
    }
  };

  const handleUpdateStatus = async (paperId: string, newStatus: string) => {
    setUpdatingStatus(paperId);
    try {
      const res = await fetch(`/api/user/timeline/${paperId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newStatus,
          milestone_note: `状态更新为：${newStatus}`,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setPapers(papers.map((p) => (p.id === paperId ? data.paper : p)));
        if (selectedPaper?.id === paperId) {
          setSelectedPaper(data.paper);
        }
        showToast(`状态已更新为"${newStatus}"`, "success");
      }
    } catch (error) {
      showToast("更新失败", "error");
    } finally {
      setUpdatingStatus(null);
    }
  };

  const handleDeletePaper = async (paperId: string) => {
    if (!confirm("确定要删除这篇论文吗？")) return;

    try {
      const res = await fetch(`/api/user/timeline/${paperId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        setPapers(papers.filter((p) => p.id !== paperId));
        if (selectedPaper?.id === paperId) {
          setSelectedPaper(null);
        }
        showToast("论文已删除", "success");
      }
    } catch (error) {
      showToast("删除失败", "error");
    }
  };

  // 获取下一个可能的状态
  const getNextStatuses = (currentStatus: string): string[] => {
    const currentIndex = STATUS_FLOW.indexOf(currentStatus);
    if (currentIndex === -1 || currentIndex === STATUS_FLOW.length - 1) return [];
    
    // 可以前进到下一个状态，或者如果当前是"修回"，可以到"录用"或"拒稿"
    const next = [STATUS_FLOW[currentIndex + 1]];
    if (currentStatus === "修回") {
      next.push("拒稿");
    }
    return next;
  };

  if (loading) {
    return (
      <div className="card card-elevated p-6">
        <div className="flex items-center justify-center py-8">
          <div className="spinner"></div>
          <span className="ml-2" style={{ color: "var(--gray-500)" }}>加载中...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 标题和新建按钮 */}
      <div className="card card-elevated p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #F59E0B, #D97706)" }}>
              <span className="text-xl">📄</span>
            </div>
            <h3 className="text-lg font-bold" style={{ color: "var(--gray-900)" }}>论文时间线</h3>
          </div>
          <button onClick={() => setShowNewPaper(true)} className="btn btn-primary">
            + 新建论文
          </button>
        </div>

        {/* 新建论文表单 */}
        {showNewPaper && (
          <div className="p-4 rounded-xl mb-4" style={{ background: "var(--brand-50)", border: "1px solid var(--brand-100)" }}>
            <div className="space-y-3">
              <input
                type="text"
                value={newPaperTitle}
                onChange={(e) => setNewPaperTitle(e.target.value)}
                className="input"
                placeholder="论文标题 *"
              />
              <input
                type="text"
                value={newPaperJournal}
                onChange={(e) => setNewPaperJournal(e.target.value)}
                className="input"
                placeholder="目标期刊（可选）"
              />
              <div className="flex gap-2">
                <button onClick={handleCreatePaper} disabled={creating} className="btn btn-primary">
                  {creating ? "创建中..." : "创建"}
                </button>
                <button onClick={() => setShowNewPaper(false)} className="btn btn-secondary">
                  取消
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 论文列表 */}
        {papers.length === 0 ? (
          <div className="text-center py-8" style={{ color: "var(--gray-500)" }}>
            暂无论文，点击"新建论文"开始追踪
          </div>
        ) : (
          <div className="space-y-3">
            {papers.map((paper) => (
              <div
                key={paper.id}
                className="p-4 rounded-xl border cursor-pointer transition-all hover:shadow-md"
                style={{
                  borderColor: selectedPaper?.id === paper.id ? "var(--brand-400)" : "var(--border)",
                  background: selectedPaper?.id === paper.id ? "var(--brand-50)" : "white",
                }}
                onClick={() => setSelectedPaper(paper)}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span>{STATUS_CONFIG[paper.status]?.icon}</span>
                    <span className="font-semibold" style={{ color: "var(--gray-900)" }}>
                      {paper.paper_title}
                    </span>
                  </div>
                  <span
                    className="px-2 py-1 rounded text-xs font-semibold text-white"
                    style={{ background: STATUS_CONFIG[paper.status]?.color }}
                  >
                    {paper.status}
                  </span>
                </div>

                {/* 进度条 */}
                <div className="flex gap-1 mb-2">
                  {STATUS_FLOW.slice(0, STATUS_FLOW.indexOf("发表") + 1).map((status, index) => {
                    const currentStatusIndex = STATUS_FLOW.indexOf(paper.status);
                    const isCompleted = index <= currentStatusIndex;
                    const isCurrent = index === currentStatusIndex;
                    return (
                      <div
                        key={status}
                        className="flex-1 h-1.5 rounded-full"
                        style={{
                          background: isCompleted ? STATUS_CONFIG[status]?.color : "var(--gray-200)",
                          opacity: isCurrent ? 1 : isCompleted ? 0.7 : 1,
                        }}
                      />
                    );
                  })}
                </div>

                {/* 元信息 */}
                <div className="flex items-center gap-4 text-xs" style={{ color: "var(--gray-500)" }}>
                  {paper.target_journal && <span>📰 {paper.target_journal}</span>}
                  <span>📅 {new Date(paper.created_at).toLocaleDateString("zh-CN")}</span>
                  <span>🔄 {paper.milestones?.length || 0} 次更新</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 论文详情 */}
      {selectedPaper && (
        <div className="card card-elevated p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold" style={{ color: "var(--gray-900)" }}>
              {STATUS_CONFIG[selectedPaper.status]?.icon} {selectedPaper.paper_title}
            </h3>
            <button
              onClick={() => handleDeletePaper(selectedPaper.id)}
              className="btn btn-secondary text-sm"
              style={{ color: "#EF4444" }}
            >
              🗑️ 删除
            </button>
          </div>

          {/* 状态更新按钮 */}
          <div className="mb-4">
            <div className="text-sm font-semibold mb-2" style={{ color: "var(--gray-700)" }}>更新状态</div>
            <div className="flex gap-2 flex-wrap">
              {getNextStatuses(selectedPaper.status).map((status) => (
                <button
                  key={status}
                  onClick={() => handleUpdateStatus(selectedPaper.id, status)}
                  disabled={updatingStatus === selectedPaper.id}
                  className="px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-80"
                  style={{ background: STATUS_CONFIG[status]?.color }}
                >
                  {STATUS_CONFIG[status]?.icon} {status}
                </button>
              ))}
            </div>
          </div>

          {/* 里程碑记录 */}
          <div>
            <div className="text-sm font-semibold mb-3" style={{ color: "var(--gray-700)" }}>里程碑记录</div>
            <div className="relative pl-6">
              {/* 时间线轴 */}
              <div className="absolute left-2 top-0 bottom-0 w-0.5" style={{ background: "var(--gray-200)" }} />

              {(selectedPaper.milestones || []).map((milestone, index) => (
                <div key={index} className="relative mb-4 last:mb-0">
                  {/* 圆点 */}
                  <div
                    className="absolute -left-4 w-4 h-4 rounded-full border-2 border-white"
                    style={{ background: STATUS_CONFIG[milestone.status]?.color || "var(--gray-400)" }}
                  />

                  <div className="ml-4">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold" style={{ color: "var(--gray-900)" }}>
                        {STATUS_CONFIG[milestone.status]?.icon} {milestone.status}
                      </span>
                      <span className="text-xs" style={{ color: "var(--gray-500)" }}>
                        {new Date(milestone.date).toLocaleString("zh-CN")}
                      </span>
                    </div>
                    {milestone.note && (
                      <div className="text-sm mt-1" style={{ color: "var(--gray-600)" }}>
                        {milestone.note}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
