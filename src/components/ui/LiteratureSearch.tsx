"use client";

import { useState } from "react";
import { useToast } from "@/components/ui/Toast";
import { copyToClipboard } from "@/lib/utils/clipboard";
import JournalRecommendation from "@/components/ui/JournalRecommendation";
import SubmissionAssist from "@/components/ui/SubmissionAssist";
import { csrfFetch } from "@/lib/utils/csrf-fetch";

interface Paper {
  id: string;
  title: string;
  authors: string[];
  year: number;
  journal: string;
  citationCount: number;
  abstract: string;
  doi: string;
  url: string;
  aiReason?: string;
  relevance?: string;
}

interface LiteratureSearchProps {
  onSelect?: (paper: Paper) => void;
  selectedPapers?: Paper[];
  todayUsage?: number;
  usageLimit?: number;
  whitelisted?: boolean;
  onUsageConsumed?: () => void;
}

// 引用格式选项
const citationFormats = [
  { value: "gb7714", label: "GB/T 7714（国标）" },
  { value: "apa", label: "APA" },
  { value: "mla", label: "MLA" },
  { value: "chicago", label: "Chicago" },
  { value: "ieee", label: "IEEE" },
  { value: "harvard", label: "Harvard" },
];

export function LiteratureSearch({
  onSelect,
  selectedPapers = [],
  todayUsage = 0,
  usageLimit = 3,
  whitelisted = false,
  onUsageConsumed,
}: LiteratureSearchProps) {
  const [activeTab, setActiveTab] = useState<"search" | "recommend" | "journal" | "submission">("search");

  // 搜索相关状态
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [expandedAbstract, setExpandedAbstract] = useState<string | null>(null);
  const { showToast } = useToast();

  // AI推荐相关状态
  const [recommendContent, setRecommendContent] = useState("");
  const [recommendResults, setRecommendResults] = useState<Paper[]>([]);
  const [recommendLoading, setRecommendLoading] = useState(false);
  const [searchQueries, setSearchQueries] = useState<string[]>([]);

  // 引用相关状态
  const [citationFormat, setCitationFormat] = useState("gb7714");
  const [citations, setCitations] = useState<string[]>([]);
  const [showCitation, setShowCitation] = useState(false);
  const [generatingCitation, setGeneratingCitation] = useState(false);

  // 文献综述相关状态
  const [reviewFocus, setReviewFocus] = useState("status");
  const [reviewContent, setReviewContent] = useState("");
  const [reviewLoading, setReviewLoading] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [customPrompt, setCustomPrompt] = useState("");

  // 关键词搜索
  const handleSearch = async (newPage = 0) => {
    if (!query.trim()) return;

    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams({
        q: query,
        limit: "10",
        offset: String(newPage * 10),
      });

      const res = await csrfFetch(`/api/academic/search?${params}`);
      const data = await res.json();

      if (data.error) {
        setError(data.error);
      } else {
        setResults(data.papers || []);
        setTotal(data.total || 0);
        setPage(newPage);
      }
    } catch {
      setError("搜索失败，请稍后重试");
    }

    setLoading(false);
  };

  // AI推荐
  const handleRecommend = async () => {
    if (!recommendContent.trim()) return;
    if (!whitelisted && todayUsage >= usageLimit) {
      setError(`今日免费次数已用完（${usageLimit}次），请升级Pro版`);
      return;
    }

    setRecommendLoading(true);
    setError("");
    setRecommendResults([]);
    setSearchQueries([]);

    try {
      const res = await csrfFetch("/api/academic/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: recommendContent,
        }),
      });

      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setRecommendResults(data.papers || []);
        setSearchQueries(data.searchQueries || []);
        onUsageConsumed?.();
        try {
          await csrfFetch("/api/works", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title: `AI文献推荐`, content: recommendContent.substring(0, 200), result: JSON.stringify(data.papers || []).substring(0, 200), feature: "academic-recommend" }),
          });
        } catch {}
      }
    } catch {
      setError("推荐失败，请稍后重试");
    }

    setRecommendLoading(false);
  };

  // 生成文献综述
  const handleGenerateReview = async () => {
    if (selectedPapers.length === 0) return;
    if (!whitelisted && todayUsage >= usageLimit) {
      setError(`今日免费次数已用完（${usageLimit}次），请升级Pro版`);
      return;
    }

    setReviewLoading(true);
    setError("");
    setReviewContent("");

    try {
      const res = await csrfFetch("/api/academic/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          papers: selectedPapers.map((p) => ({
            title: p.title,
            authors: p.authors,
            year: p.year,
            journal: p.journal,
            abstract: p.abstract,
          })),
          focus: reviewFocus,
          customPrompt: reviewFocus === "custom" ? customPrompt : undefined,
        }),
      });

      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setReviewContent(data.review || "");
        setShowReview(true);
        onUsageConsumed?.();
        try {
          await csrfFetch("/api/works", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title: `文献综述`, content: selectedPapers.map(p => p.title).join(", ").substring(0, 200), result: (data.review || "").substring(0, 200), feature: "academic-review" }),
          });
        } catch {}
      }
    } catch {
      setError("生成文献综述失败");
    }

    setReviewLoading(false);
  };

  // 复制综述
  const handleCopyReview = () => {
    copyToClipboard(reviewContent);
    showToast("文献综述已复制到剪贴板");
  };

  // 生成引用
  const handleGenerateCitation = async () => {
    if (selectedPapers.length === 0) return;

    setGeneratingCitation(true);
    try {
      const res = await csrfFetch("/api/academic/citation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          papers: selectedPapers.map((p) => ({
            title: p.title,
            authors: p.authors,
            year: p.year,
            journal: p.journal,
          })),
          format: citationFormat,
        }),
      });

      const data = await res.json();
      if (data.citations) {
        setCitations(data.citations);
        setShowCitation(true);
      }
    } catch {
      setError("生成引用失败");
    }
    setGeneratingCitation(false);
  };

  // 复制引用
  const handleCopyCitations = () => {
    copyToClipboard(citations.join("\n\n"));
    showToast("引用已复制到剪贴板");
  };

  // 判断文献是否已选
  const isSelected = (paperId: string) => {
    return selectedPapers.some((p) => p.id === paperId);
  };

  // 渲染文献卡片
  const renderPaperCard = (paper: Paper) => (
    <div
      key={paper.id}
      className={`border rounded-lg p-4 transition-colors ${
        isSelected(paper.id)
          ? "border-blue-500 bg-blue-50"
          : "border-gray-200 hover:border-blue-300"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-medium text-gray-900">{paper.title}</h4>
            {paper.relevance && (
              <span
                className={`text-xs px-2 py-0.5 rounded-full ${
                  paper.relevance === "high"
                    ? "bg-green-100 text-green-700"
                    : "bg-yellow-100 text-yellow-700"
                }`}
              >
                {paper.relevance === "high" ? "高度相关" : "相关"}
              </span>
            )}
          </div>
          <div className="text-sm text-gray-600 mb-2">
            <span>{paper.authors.slice(0, 3).join(", ")}</span>
            {paper.authors.length > 3 && (
              <span> 等 {paper.authors.length} 位作者</span>
            )}
          </div>
          <div className="flex items-center gap-4 text-xs text-gray-500">
            {paper.journal && <span>📰 {paper.journal}</span>}
            <span>📅 {paper.year}</span>
            <span>📊 引用 {paper.citationCount}</span>
          </div>

          {/* AI推荐理由 */}
          {paper.aiReason && (
            <div className="mt-2 p-2 bg-blue-50 rounded text-xs text-blue-700">
              <span className="font-medium">推荐理由：</span>
              {paper.aiReason}
            </div>
          )}

          {/* 摘要展开/收起 */}
          {paper.abstract && (
            <div className="mt-2">
              <button
                onClick={() =>
                  setExpandedAbstract(
                    expandedAbstract === paper.id ? null : paper.id
                  )
                }
                className="text-xs text-blue-600 hover:text-blue-700"
              >
                {expandedAbstract === paper.id ? "收起摘要" : "查看摘要"}
              </button>
              {expandedAbstract === paper.id && (
                <p className="mt-2 text-sm text-gray-600 leading-relaxed">
                  {paper.abstract}
                </p>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2">
          {onSelect && (
            <button
              onClick={() => onSelect(paper)}
              className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
                isSelected(paper.id)
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {isSelected(paper.id) ? "已选择" : "选择"}
            </button>
          )}
          <a
            href={paper.url}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1 text-xs text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 text-center"
          >
            查看原文
          </a>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* 标签页切换 */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab("search")}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === "search"
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          🔍 关键词搜索
        </button>
        <button
          onClick={() => setActiveTab("recommend")}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === "recommend"
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          🤖 AI智能推荐
        </button>
        <button
          onClick={() => setActiveTab("journal")}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === "journal"
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          📚 期刊推荐
        </button>
        <button
          onClick={() => setActiveTab("submission")}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === "submission"
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          📝 投稿辅助
        </button>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* 关键词搜索 */}
      {activeTab === "search" && (
        <div>
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              placeholder="输入关键词搜索文献..."
            />
            <button
              onClick={() => handleSearch()}
              disabled={loading || !query.trim()}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? "搜索中..." : "搜索"}
            </button>
          </div>

          {/* 搜索结果 */}
          {results.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-gray-600">
                  找到 {total} 篇文献
                </span>
              </div>

              <div className="space-y-3">
                {results.map((paper) => renderPaperCard(paper))}
              </div>

              {/* 分页 */}
              {total > 10 && (
                <div className="flex justify-center gap-2 mt-4">
                  <button
                    onClick={() => handleSearch(page - 1)}
                    disabled={page === 0}
                    className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                  >
                    上一页
                  </button>
                  <span className="px-4 py-2 text-sm text-gray-600">
                    第 {page + 1} / {Math.ceil(total / 10)} 页
                  </span>
                  <button
                    onClick={() => handleSearch(page + 1)}
                    disabled={(page + 1) * 10 >= total}
                    className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                  >
                    下一页
                  </button>
                </div>
              )}
            </div>
          )}

          {!loading && results.length === 0 && query && !error && (
            <div className="text-center text-gray-500 py-8">
              未找到相关文献，请尝试其他关键词
            </div>
          )}
        </div>
      )}

      {/* AI智能推荐 */}
      {activeTab === "recommend" && (
        <div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              输入您的研究内容或论文摘要
            </label>
            <textarea
              value={recommendContent}
              onChange={(e) => setRecommendContent(e.target.value)}
              className="w-full h-32 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
              placeholder="请描述您的研究内容，AI将为您推荐相关文献...&#10;&#10;例如：本研究旨在利用深度学习技术，构建多模态融合的医学影像诊断系统，提高诊断准确率。"
            />
          </div>

          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={handleRecommend}
              disabled={recommendLoading || !recommendContent.trim()}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {recommendLoading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  分析中...
                </span>
              ) : (
                "AI推荐"
              )}
            </button>
          </div>

          {/* 搜索关键词 */}
          {searchQueries.length > 0 && (
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <span className="text-xs text-gray-500">AI使用的搜索关键词：</span>
              <div className="flex flex-wrap gap-2 mt-1">
                {searchQueries.map((q, i) => (
                  <span
                    key={i}
                    className="px-2 py-1 text-xs bg-white border border-gray-200 rounded"
                  >
                    {q}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* 推荐结果 */}
          {recommendResults.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-gray-600">
                  AI推荐 {recommendResults.length} 篇相关文献
                </span>
              </div>

              <div className="space-y-3">
                {recommendResults.map((paper) => renderPaperCard(paper))}
              </div>
            </div>
          )}

          {!recommendLoading && recommendResults.length === 0 && recommendContent && !error && (
            <div className="text-center text-gray-500 py-8">
              未能生成推荐，请尝试修改研究内容描述
            </div>
          )}
        </div>
      )}

      {/* 期刊推荐 */}
      {activeTab === "journal" && (
        <JournalRecommendation
          todayUsage={todayUsage}
          usageLimit={usageLimit}
          whitelisted={whitelisted}
          onUsageConsumed={onUsageConsumed}
        />
      )}

      {/* 投稿辅助 */}
      {activeTab === "submission" && (
        <SubmissionAssist
          todayUsage={todayUsage}
          usageLimit={usageLimit}
          whitelisted={whitelisted}
          onUsageConsumed={onUsageConsumed}
        />
      )}

      {/* 引用格式面板 */}
      {selectedPapers.length > 0 && (
        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
          <h3 className="text-sm font-medium text-gray-700 mb-3">引用格式</h3>

          <div className="flex items-center gap-4 mb-3">
            <select
              value={citationFormat}
              onChange={(e) => setCitationFormat(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            >
              {citationFormats.map((fmt) => (
                <option key={fmt.value} value={fmt.value}>
                  {fmt.label}
                </option>
              ))}
            </select>

            <button
              onClick={handleGenerateCitation}
              disabled={generatingCitation}
              className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {generatingCitation ? "生成中..." : "生成引用"}
            </button>
          </div>

          <div className="text-xs text-gray-500">
            已选择 {selectedPapers.length} 篇文献
          </div>
        </div>
      )}

      {/* 引用结果展示 */}
      {showCitation && citations.length > 0 && (
        <div className="border border-green-200 rounded-lg p-4 bg-green-50">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-green-700">生成的引用</h3>
            <div className="flex gap-2">
              <button
                onClick={handleCopyCitations}
                className="px-3 py-1 text-xs bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                复制全部
              </button>
              <button
                onClick={() => setShowCitation(false)}
                className="px-3 py-1 text-xs text-green-600 hover:text-green-700"
              >
                收起
              </button>
            </div>
          </div>

          <div className="space-y-2">
            {citations.map((citation, index) => (
              <div
                key={index}
                className="p-3 bg-white rounded border border-green-200 text-sm text-gray-800 font-mono"
              >
                {citation}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 文献综述面板 */}
      {selectedPapers.length > 0 && (
        <div className="border border-purple-200 rounded-lg p-4 bg-purple-50">
          <h3 className="text-sm font-medium text-purple-700 mb-3">
            📝 文献综述生成
          </h3>

          <div className="flex items-center gap-4 mb-3">
            <select
              value={reviewFocus}
              onChange={(e) => setReviewFocus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
            >
              <option value="status">研究现状</option>
              <option value="method">研究方法</option>
              <option value="trend">研究趋势</option>
              <option value="custom">自定义</option>
            </select>

            {reviewFocus === "custom" && (
              <input
                type="text"
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                placeholder="请输入您的具体要求..."
              />
            )}

            <button
              onClick={handleGenerateReview}
              disabled={reviewLoading}
              className="px-4 py-2 bg-purple-600 text-white text-sm rounded-lg font-medium hover:bg-purple-700 transition-colors disabled:opacity-50"
            >
              {reviewLoading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  生成中...
                </span>
              ) : (
                "生成综述"
              )}
            </button>
          </div>

          <div className="text-xs text-gray-500">
            已选择 {selectedPapers.length} 篇文献 · 当前焦点：{
              reviewFocus === "status" ? "研究现状" :
              reviewFocus === "method" ? "研究方法" :
              reviewFocus === "trend" ? "研究趋势" : "自定义"
            }
          </div>
        </div>
      )}

      {/* 综述结果展示 */}
      {showReview && reviewContent && (
        <div className="border border-purple-200 rounded-lg p-4 bg-white">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-purple-700">
              生成的文献综述
            </h3>
            <div className="flex gap-2">
              <button
                onClick={handleCopyReview}
                className="px-3 py-1 text-xs bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                复制
              </button>
              <button
                onClick={() => setShowReview(false)}
                className="px-3 py-1 text-xs text-purple-600 hover:text-purple-700"
              >
                收起
              </button>
            </div>
          </div>

          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
              {reviewContent}
            </p>
          </div>

          <div className="mt-2 text-xs text-gray-500">
            {reviewContent.length} 字 · 基于 {selectedPapers.length} 篇文献生成
          </div>
        </div>
      )}
    </div>
  );
}
