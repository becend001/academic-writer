# AI学术写作助手 — 功能增强需求文档 V1.1

> 版本：V1.1  
> 更新日期：2026年7月24日  
> 状态：规划中  
> 基于市场分析和竞品对比制定

---

## 一、文档说明

### 1.1 背景

基于资深市场总监视角分析，当前项目功能"大而全"但缺乏"非用不可"的理由。为增强市场竞争力，制定以下功能增强计划。

### 1.2 核心策略

1. **聚焦课题申报做深做透** — 唯一无竞品领域，建立差异化优势
2. **构建论文全生命周期** — 从选题到发表，增加用户粘性
3. **建立数据壁垒** — 积累学术数据资产，形成护城河

### 1.3 优先级定义

| 优先级 | 定义 | 开发周期 |
|--------|------|----------|
| P0 | 必须有，直接影响付费转化和差异化 | 2周内 |
| P1 | 应该有，完善产品矩阵，增加粘性 | 3-4周 |
| P2 | 可以有，锦上添花 | 后续迭代 |

---

## 二、P0 功能详细设计

### 2.1 课题申报 Word 导出

#### 2.1.1 功能描述

将 AI 生成的课题申报书导出为符合基金委格式要求的 Word 文档，用户可直接下载并提交。

#### 2.1.2 用户故事

> 作为高校教师，我希望将 AI 生成的申报书导出为标准 Word 格式，这样我可以直接打印或提交给科研处。

#### 2.1.3 技术方案

**技术选型**：使用 `docx` 库（npm install docx）

**理由**：
- 纯 JS 实现，无需安装 LibreOffice
- 部署简单，无系统依赖
- 社区活跃，文档完善

#### 2.1.4 格式规范

```typescript
// 基金委申报书标准格式
const FORMAT = {
  title: { 
    font: "黑体", 
    size: 22,        // 二号
    bold: true 
  },
  subtitle: { 
    font: "黑体", 
    size: 16,        // 三号
    bold: true 
  },
  body: { 
    font: "宋体", 
    size: 12         // 小四
  },
  lineSpacing: 1.5,  // 1.5倍行距
  margins: { 
    top: 2.54,       // cm
    bottom: 2.54, 
    left: 3.17, 
    right: 3.17 
  }
}
```

#### 2.1.5 文件结构

```
src/lib/export/
├── docx-generator.ts      # Word 生成核心
├── templates/
│   ├── nsfc.ts            # 国自然模板
│   ├── nssfc.ts           # 国社科模板
│   └── provincial.ts      # 省部级模板
└── helpers/
    ├── format-text.ts     # 文本格式化
    └── table-builder.ts   # 表格生成（经费预算）
```

#### 2.1.6 实现步骤

| 步骤 | 内容 | 工时 | 依赖 |
|------|------|------|------|
| 1 | 安装 docx 依赖 | 0.5h | 无 |
| 2 | 创建 docx-generator.ts 核心模块 | 4h | 步骤1 |
| 3 | 实现各章节格式模板 | 4h | 步骤2 |
| 4 | 前端添加"导出 Word"按钮 | 1h | 步骤3 |
| 5 | 测试不同项目类型的格式 | 2h | 步骤4 |

**总工时**：约 11.5h（1.5天）

#### 2.1.7 前端交互

```tsx
// 导出按钮组
<div className="flex gap-3">
  <button onClick={() => handleExport("docx")} className="btn btn-primary">
    <span>📄</span>
    <span>导出 Word</span>
  </button>
  <button onClick={() => handleExport("md")} className="btn btn-secondary">
    <span>📝</span>
    <span>导出 Markdown</span>
  </button>
  <button onClick={() => handleExport("txt")} className="btn btn-secondary">
    <span>📋</span>
    <span>导出文本</span>
  </button>
</div>
```

#### 2.1.8 验收标准

- [ ] 导出的 Word 文件可正常打开
- [ ] 格式符合基金委要求（字体、字号、行距）
- [ ] 8个章节内容完整
- [ ] 经费预算表格正确生成
- [ ] 不同项目类型（国自然/国社科/省部级）格式正确

---

### 2.2 申报书评分系统

#### 2.2.1 功能描述

AI 自动评估申报书质量，给出总分、各维度得分和改进建议，帮助用户提升申报书质量。

#### 2.2.2 用户故事

> 作为高校教师，我希望在提交申报书前了解它的质量评分和改进方向，这样可以针对性地优化。

#### 2.2.3 评分维度

| 维度 | 权重 | 评分标准 |
|------|------|----------|
| 选题创新性 | 25% | 是否有原创性、是否紧跟前沿、是否有研究价值 |
| 研究方案可行性 | 25% | 技术路线是否清晰、方法是否合理、风险是否可控 |
| 文献综述质量 | 20% | 是否全面、是否有遗漏、是否引用最新文献 |
| 预期成果明确性 | 15% | 成果是否可量化、可考核、是否有创新 |
| 经费预算合理性 | 15% | 预算分配是否合理、是否符合资助强度 |

#### 2.2.4 技术方案

**API 设计**：

```typescript
// POST /api/grant/score

// 请求体
interface ScoreRequest {
  title: string;
  field: string;
  sections: {
    abstract: string;
    background: string;
    content: string;
    methodology: string;
    innovation: string;
    plan: string;
    output: string;
    budget: string;
  };
  projectType: string;
}

// 响应体
interface ScoreResult {
  totalScore: number;           // 总分 0-100
  level: "优秀" | "良好" | "合格" | "需改进";
  dimensions: {
    innovation: number;         // 创新性 0-100
    feasibility: number;        // 可行性 0-100
    literature: number;         // 文献质量 0-100
    output: number;             // 成果明确性 0-100
    budget: number;             // 预算合理性 0-100
  };
  suggestions: string[];        // 改进建议（5-8条）
  comparisonRate?: number;      // 预估中标率（基于历史数据）
}
```

**评分 Prompt 设计**：

```typescript
const SCORING_PROMPT = `你是一位资深的基金评审专家，拥有20年评审经验。
请对以下课题申报书进行评分和评估。

## 评分维度

1. **选题创新性（25分）**
   - 原创性：是否有新的科学问题或技术方法
   - 前沿性：是否紧跟国际前沿
   - 研究价值：是否具有理论或应用价值

2. **研究方案可行性（25分）**
   - 技术路线：是否清晰、合理
   - 研究方法：是否科学、先进
   - 风险控制：是否有备选方案

3. **文献综述质量（20分）**
   - 全面性：是否覆盖主要文献
   - 时效性：是否引用最新文献
   - 批判性：是否有自己的分析

4. **预期成果明确性（15分）**
   - 可量化：成果是否具体、可衡量
   - 创新性：成果是否有创新点
   - 可考核：是否可验收

5. **经费预算合理性（15分）**
   - 分配合理性：各项费用比例是否合理
   - 资助强度：是否符合该类项目资助范围
   - 使用依据：是否有充分的说明

## 申报书内容

标题：${title}
研究领域：${field}
项目类型：${projectType}

### 摘要
${sections.abstract}

### 立项依据
${sections.background}

### 研究内容
${sections.content}

### 研究方案
${sections.methodology}

### 特色与创新
${sections.innovation}

### 年度计划
${sections.plan}

### 预期成果
${sections.output}

### 经费预算
${sections.budget}

## 输出要求

请按以下JSON格式输出评分结果：
{
  "totalScore": 总分(0-100),
  "level": "优秀/良好/合格/需改进",
  "dimensions": {
    "innovation": 创新性得分,
    "feasibility": 可行性得分,
    "literature": 文献质量得分,
    "output": 成果明确性得分,
    "budget": 预算合理性得分
  },
  "suggestions": ["建议1", "建议2", ...],
  "strengths": ["优势1", "优势2", ...],
  "weaknesses": ["不足1", "不足2", ...]
}`;
```

#### 2.2.5 文件结构

```
src/app/api/grant/
└── score/
    └── route.ts           # 评分 API

src/components/ui/
└── ScoreReport.tsx        # 评分报告组件
```

#### 2.2.6 实现步骤

| 步骤 | 内容 | 工时 | 依赖 |
|------|------|------|------|
| 1 | 创建评分 Prompt 模板 | 3h | 无 |
| 2 | 实现 `/api/grant/score` 接口 | 2h | 步骤1 |
| 3 | 前端评分展示组件 | 3h | 步骤2 |
| 4 | 雷达图可视化（recharts） | 2h | 步骤3 |
| 5 | 历史评分对比 | 2h | 步骤4 |

**总工时**：约 12h（1.5天）

#### 2.2.7 前端展示

```
┌─────────────────────────────────────────┐
│  📊 申报书评分报告                        │
├─────────────────────────────────────────┤
│  总分：82/100  ⭐⭐⭐⭐                    │
│  等级：良好                               │
│  预估中标率：35%                          │
├─────────────────────────────────────────┤
│           [雷达图可视化]                  │
│                                         │
│  创新性    ████████░░  85               │
│  可行性    ███████░░░  78               │
│  文献质量  █████████░  88               │
│  成果明确  ████████░░  82               │
│  预算合理  ███████░░░  75               │
├─────────────────────────────────────────┤
│  💪 优势：                               │
│  1. 选题紧跟国际前沿，具有创新性          │
│  2. 文献综述全面，引用规范               │
├─────────────────────────────────────────┤
│  ⚠️ 不足：                               │
│  1. 研究方案部分技术路线不够清晰          │
│  2. 经费预算中设备费占比偏高             │
├─────────────────────────────────────────┤
│  💡 改进建议：                           │
│  1. 建议增加技术路线图                   │
│  2. 调整设备费比例至30%以下              │
│  3. 补充风险应对措施                     │
└─────────────────────────────────────────┘
```

#### 2.2.8 验收标准

- [ ] 评分结果准确，符合专家评审标准
- [ ] 雷达图正确展示各维度得分
- [ ] 改进建议具体、可操作
- [ ] 评分结果可保存到历史记录
- [ ] 不同项目类型评分标准有差异

---

## 三、P1 功能详细设计

### 3.1 期刊推荐

#### 3.1.1 功能描述

根据论文内容、研究领域和目标影响因子，智能推荐合适的投稿期刊。

#### 3.1.2 用户故事

> 作为高校教师，我写完论文后不知道投哪个期刊，希望 AI 能根据我的论文内容推荐合适的期刊。

#### 3.1.3 数据源

| 数据源 | 用途 | 成本 | 更新频率 |
|--------|------|------|----------|
| Semantic Scholar API | 期刊信息、影响因子 | 免费 | 实时 |
| OpenAlex API | 开放学术数据 | 免费 | 每周 |
| LetPub 数据 | 中文期刊分区信息 | 爬虫 | 每月 |

#### 3.1.4 推荐算法

```typescript
interface JournalRecommendation {
  name: string;              // 期刊名
  issn: string;              // ISSN号
  publisher: string;         // 出版社
  impactFactor: number;      // 影响因子
  quartile: string;          // Q1/Q2/Q3/Q4
  ChinesePartition: string;  // 中科院分区（1-4区）
  acceptanceRate: number;    // 预估录用率
  reviewTime: string;        // 审稿周期
  openAccess: boolean;       // 是否OA
  matchScore: number;        // 匹配度 0-100
  matchReason: string;       // 匹配理由
  website: string;           // 期刊官网
}
```

#### 3.1.5 匹配维度

| 维度 | 权重 | 说明 |
|------|------|------|
| 研究领域匹配 | 40% | 关键词、学科分类匹配 |
| 影响因子范围 | 25% | 用户期望的 IF 区间 |
| 审稿周期 | 15% | 用户期望的审稿速度 |
| 录用率 | 10% | 历史录用率 |
| 开放获取 | 10% | 是否需要 OA |

#### 3.1.6 API 设计

```typescript
// POST /api/academic/journal-recommend

// 请求体
interface JournalRequest {
  title: string;           // 论文标题
  abstract: string;        // 论文摘要
  keywords: string[];      // 关键词
  field: string;           // 研究领域
  targetIF?: number;       // 目标影响因子
  targetQuartile?: string; // 目标分区（Q1/Q2）
  reviewTimeLimit?: string; // 审稿周期要求
}

// 响应体
interface JournalResponse {
  recommendations: JournalRecommendation[];
  totalFound: number;
  searchTime: number;
}
```

#### 3.1.7 实现步骤

| 步骤 | 内容 | 工时 | 依赖 |
|------|------|------|------|
| 1 | 搭建期刊数据库（爬取/导入） | 3天 | 无 |
| 2 | 实现 Semantic Scholar API 封装 | 4h | 步骤1 |
| 3 | 实现 `/api/academic/journal-recommend` | 4h | 步骤2 |
| 4 | 匹配算法实现 | 1天 | 步骤3 |
| 5 | 前端期刊列表展示 | 1天 | 步骤4 |
| 6 | 一键生成投稿信 | 2h | 步骤5 |

**总工时**：约 6天

#### 3.1.8 前端展示

```
┌─────────────────────────────────────────┐
│  📚 期刊推荐                             │
├─────────────────────────────────────────┤
│  筛选条件：                              │
│  目标IF: [≥3.0]  分区: [Q1]  审稿: [6个月] │
├─────────────────────────────────────────┤
│  推荐结果（共12个）                       │
├─────────────────────────────────────────┤
│  1. Journal of XXX                       │
│     IF: 5.2 | Q1 | 中科院1区             │
│     录用率: 25% | 审稿: 3-6个月           │
│     匹配度: 95%                          │
│     理由：与您的研究领域高度匹配...        │
│     [查看详情] [生成投稿信]                │
├─────────────────────────────────────────┤
│  2. International Journal of YYY         │
│     IF: 3.8 | Q1 | 中科院2区             │
│     录用率: 35% | 审稿: 2-4个月           │
│     匹配度: 88%                          │
│     理由：该期刊近期发表过相关主题...       │
│     [查看详情] [生成投稿信]                │
└─────────────────────────────────────────┘
```

---

### 3.2 投稿辅助

#### 3.2.1 功能描述

提供从写作到投稿的全流程辅助，包括投稿信生成、格式检查、审稿意见回复等。

#### 3.2.2 功能模块

| 模块 | 功能 | 说明 |
|------|------|------|
| 投稿信生成 | Cover Letter | 根据论文+期刊自动生成 |
| 格式检查 | Format Check | 检查是否符合目标期刊要求 |
| 审稿意见回复 | Rebuttal Letter | AI 帮写回复信 |
| 投稿追踪 | Submission Tracker | 管理投稿状态和截止日期 |

#### 3.2.3 投稿信模板

```typescript
// POST /api/academic/cover-letter

const COVER_LETTER_TEMPLATE = `
Dear Editor,

We would like to submit our manuscript entitled "[[TITLE]]" 
for consideration for publication in [[JOURNAL]].

[研究背景段落 - AI根据摘要生成]

[研究目的段落 - AI根据研究内容生成]

[主要发现段落 - AI根据预期成果生成]

[创新点段落 - AI根据特色与创新生成]

We confirm that this manuscript has not been published 
elsewhere and is not under consideration by another journal.

All authors have approved the manuscript and agree with 
its submission to [[JOURNAL]].

We suggest the following potential reviewers:
1. [AI基于领域推荐审稿人1]
2. [AI基于领域推荐审稿人2]
3. [AI基于领域推荐审稿人3]

Thank you for considering our manuscript.

Sincerely,
[[AUTHOR_NAME]]
[[AFFILIATION]]
[[EMAIL]]
`;
```

#### 3.2.4 格式检查规则

```typescript
interface FormatCheckRule {
  id: string;
  name: string;
  description: string;
  check: (content: string) => boolean;
  severity: "error" | "warning" | "info";
}

const FORMAT_CHECKS: FormatCheckRule[] = [
  {
    id: "word-count",
    name: "字数检查",
    description: "检查是否符合期刊字数要求",
    check: (content) => content.length <= 8000,
    severity: "error"
  },
  {
    id: "abstract-length",
    name: "摘要长度",
    description: "摘要应在150-300词之间",
    check: (content) => {
      const abstract = extractAbstract(content);
      const wordCount = abstract.split(/\s+/).length;
      return wordCount >= 150 && wordCount <= 300;
    },
    severity: "error"
  },
  {
    id: "keyword-count",
    name: "关键词数量",
    description: "关键词应在3-8个之间",
    check: (content) => {
      const keywords = extractKeywords(content);
      return keywords.length >= 3 && keywords.length <= 8;
    },
    severity: "warning"
  },
  {
    id: "reference-format",
    name: "参考文献格式",
    description: "检查引用格式是否统一",
    check: (content) => checkReferenceFormat(content),
    severity: "warning"
  },
  {
    id: "figure-caption",
    name: "图表标题",
    description: "检查图表是否有标题",
    check: (content) => checkFigureCaptions(content),
    severity: "info"
  }
];
```

#### 3.2.5 审稿意见回复

```typescript
// POST /api/academic/rebuttal

interface RebuttalRequest {
  paperTitle: string;
  reviewerComments: string;    // 审稿人意见
  originalManuscript: string;  // 原稿摘要
  authorResponses?: string;    // 作者初步回复
}

interface RebuttalResponse {
  responseLetter: string;      // 完整回复信
  pointByPoint: {              // 逐条回复
    original: string;          // 原始意见
    response: string;          // 回复内容
    changeLocation?: string;   // 修改位置
  }[];
  tone: "professional" | "polite" | "firm";  // 语气建议
}
```

#### 3.2.6 实现步骤

| 步骤 | 内容 | 工时 | 依赖 |
|------|------|------|------|
| 1 | 投稿信生成 API + 前端 | 1天 | 无 |
| 2 | 格式检查规则库 | 2天 | 无 |
| 3 | 格式检查前端组件 | 1天 | 步骤2 |
| 4 | 审稿意见回复模板 | 1天 | 无 |
| 5 | 审稿回复前端页面 | 1天 | 步骤4 |
| 6 | 投稿状态管理 | 1天 | 无 |

**总工时**：约 7天

---

### 3.3 用户数据积累功能

#### 3.3.1 功能描述

自动记录用户的所有学术活动，建立个人学术档案，增加用户粘性。

#### 3.3.2 功能模块

| 功能 | 说明 | 价值 |
|------|------|------|
| 写作档案 | 自动保存所有润色/翻译记录 | 用户回访 |
| 论文时间线 | 追踪论文从选题到投稿全过程 | 增加粘性 |
| 学术画像 | 分析用户研究领域、写作习惯 | 个性化推荐 |
| 数据导出 | 一键导出所有个人数据 | 合规（GDPR） |

#### 3.3.3 数据库设计

```sql
-- 新增表：用户学术档案
CREATE TABLE user_academic_profile (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) UNIQUE,
  research_fields TEXT[],                    -- 研究领域
  publications_count INT DEFAULT 0,          -- 发表论文数
  grants_count INT DEFAULT 0,                -- 课题数
  writing_style JSONB,                       -- 写作风格分析
  interests JSONb,                           -- 兴趣标签
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 新增表：论文时间线
CREATE TABLE paper_timeline (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  paper_title TEXT NOT NULL,
  status TEXT CHECK (status IN (
    '选题', '写作', '修改', '投稿', 
    '审稿', '修回', '录用', '拒稿', '发表'
  )),
  milestones JSONB[],                        -- 里程碑记录
  target_journal TEXT,                        -- 目标期刊
  submission_date DATE,                       -- 投稿日期
  decision_date DATE,                         -- 决定日期
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 新增表：写作活动日志
CREATE TABLE writing_activity_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  activity_type TEXT CHECK (activity_type IN (
    'polish', 'translate', 'abstract', 'grant', 
    'literature', 'journal_search', 'cover_letter'
  )),
  paper_id UUID REFERENCES paper_timeline(id),
  content_snapshot TEXT,                      -- 内容快照
  ai_result TEXT,                             -- AI处理结果
  token_used INT,                             -- 消耗token数
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 3.3.4 学术画像生成

```typescript
// POST /api/user/academic-profile

interface AcademicProfile {
  userId: string;
  researchFields: string[];           // 研究领域（从活动日志分析）
  writingFrequency: {                 // 写作频率
    daily: number;
    weekly: number;
    monthly: number;
  };
  preferredFeatures: string[];        // 常用功能
  collaborationStyle: string;         // 写作风格
  interests: string[];                // 兴趣标签
  stats: {
    totalActivities: number;
    totalTokensUsed: number;
    savedPapers: number;
    grantApplications: number;
  };
  recommendations: {                  // 个性化推荐
    features: string[];               // 推荐功能
    journals: string[];               // 推荐期刊
    topics: string[];                 // 推荐研究方向
  };
}
```

#### 3.3.5 实现步骤

| 步骤 | 内容 | 工时 | 依赖 |
|------|------|------|------|
| 1 | 数据库表设计 + 迁移 | 2h | 无 |
| 2 | 自动记录写作历史（中间件） | 4h | 步骤1 |
| 3 | 学术画像生成 API | 1天 | 步骤2 |
| 4 | 个人中心"我的档案"页面 | 1天 | 步骤3 |
| 5 | 论文时间线组件 | 1天 | 步骤1 |
| 6 | 数据导出功能 | 2h | 步骤1 |

**总工时**：约 4天

#### 3.3.6 前端展示

**个人中心 - 我的学术档案**：

```
┌─────────────────────────────────────────┐
│  👤 我的学术档案                          │
├─────────────────────────────────────────┤
│  研究领域：人工智能、医学影像、深度学习     │
│  写作风格：学术严谨型                      │
│  活跃度：⭐⭐⭐⭐ （本周写作5次）            │
├─────────────────────────────────────────┤
│  📊 使用统计                              │
│  ┌─────────┬─────────┬─────────┐        │
│  │ 润色 45次 │ 翻译 32次 │ 申报 8次  │        │
│  └─────────┴─────────┴─────────┘        │
├─────────────────────────────────────────┤
│  📄 我的论文时间线                        │
│  ┌─────────────────────────────────┐    │
│  │ 选题 → 写作 → 投稿 → 审稿 → 录用  │    │
│  │ ●━━━━━━━━━○─────────────────  │    │
│  │ 基于深度学习的医学影像诊断研究      │    │
│  │ 当前状态：投稿至 Nature Medicine   │    │
│  └─────────────────────────────────┘    │
├─────────────────────────────────────────┤
│  💡 为你推荐                              │
│  • 功能：试试"课题申报辅助"               │
│  • 期刊：IEEE Trans. on Medical Imaging │
│  • 方向：多模态医学影像融合               │
└─────────────────────────────────────────┘
```

---

## 四、技术依赖

### 4.1 新增依赖

```json
{
  "dependencies": {
    "docx": "^8.0.0",
    "papaparse": "^5.0.0",
    "recharts": "^2.0.0"
  },
  "devDependencies": {
    "@types/papaparse": "^5.0.0"
  }
}
```

### 4.2 外部服务

| 服务 | 用途 | 成本 |
|------|------|------|
| Semantic Scholar API | 期刊信息查询 | 免费 |
| OpenAlex API | 学术数据查询 | 免费 |
| DeepSeek API | AI评分/生成 | 按量付费 |

---

## 五、总体排期

| 周次 | P0 功能 | P1 功能 |
|------|---------|---------|
| **第1周** | Word 导出（1.5天） | 期刊数据库搭建（3天） |
| **第2周** | 申报书评分（1.5天） | 期刊推荐 API（2天） |
| **第3周** | - | 投稿辅助（3天） |
| **第4周** | - | 用户数据积累（4天） |

**总计**：约 4 周完成全部 P0+P1 功能

---

## 六、验收标准汇总

### P0 功能验收

- [ ] Word 导出格式符合基金委要求
- [ ] 不同项目类型模板正确
- [ ] 评分结果准确，符合专家标准
- [ ] 雷达图正确展示各维度得分
- [ ] 改进建议具体、可操作

### P1 功能验收

- [ ] 期刊推荐准确，匹配度合理
- [ ] 投稿信内容完整、格式规范
- [ ] 格式检查覆盖主要规则
- [ ] 审稿意见回复专业、得体
- [ ] 用户数据自动记录完整
- [ ] 学术画像准确反映用户特征
- [ ] 数据导出功能正常

---

## 七、风险评估

| 风险 | 概率 | 影响 | 应对策略 |
|------|------|------|----------|
| 期刊数据获取困难 | 中 | 高 | 多数据源备份，优先使用免费API |
| 评分标准不准确 | 中 | 中 | 收集专家反馈，持续优化Prompt |
| Word格式兼容性问题 | 低 | 中 | 多版本测试，提供备用格式 |
| 用户数据隐私问题 | 低 | 高 | 严格遵守隐私政策，数据脱敏 |

---

*文档版本：v1.1*  
*创建时间：2026年7月24日*  
*更新时间：2026年7月24日*  
*作者：MiMoCode*
