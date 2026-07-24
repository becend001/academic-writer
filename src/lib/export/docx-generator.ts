import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  TabStopPosition,
  TabStopType,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  convertInchesToTwip,
  ExternalHyperlink,
  PageBreak,
} from "docx";

// 格式配置
const FORMAT = {
  // 字体配置
  fonts: {
    title: "黑体",
    subtitle: "黑体",
    heading: "黑体",
    body: "宋体",
    english: "Times New Roman",
  },
  // 字号配置（半磅）
  sizes: {
    title: 44,        // 二号 (22pt = 44半磅)
    subtitle: 32,     // 三号 (16pt = 32半磅)
    heading: 28,      // 小三 (14pt = 28半磅)
    body: 24,         // 小四 (12pt = 24半磅)
    small: 21,        // 五号 (10.5pt = 21半磅)
  },
  // 间距配置（twips）
  spacing: {
    line: convertInchesToTwip(0.25),  // 1.5倍行距
    after: convertInchesToTwip(0.1),
    before: convertInchesToTwip(0.1),
  },
  // 页边距（twips）
  margins: {
    top: convertInchesToTwip(1),
    bottom: convertInchesToTwip(1),
    left: convertInchesToTwip(1.25),
    right: convertInchesToTwip(1.25),
  },
};

// 章节配置
const SECTIONS_CONFIG = [
  { id: "abstract", title: "摘要", icon: "📝" },
  { id: "background", title: "立项依据", icon: "📚" },
  { id: "content", title: "研究内容", icon: "🎯" },
  { id: "methodology", title: "研究方案", icon: "🔬" },
  { id: "innovation", title: "特色与创新", icon: "💡" },
  { id: "plan", title: "年度计划", icon: "📅" },
  { id: "output", title: "预期成果", icon: "🏆" },
  { id: "budget", title: "经费预算", icon: "💰" },
];

// 创建标题段落
function createTitle(text: string): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({
        text,
        font: FORMAT.fonts.title,
        size: FORMAT.sizes.title,
        bold: true,
      }),
    ],
    alignment: AlignmentType.CENTER,
    spacing: {
      after: FORMAT.spacing.after * 2,
    },
  });
}

// 创建副标题段落
function createSubtitle(text: string): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({
        text,
        font: FORMAT.fonts.subtitle,
        size: FORMAT.sizes.subtitle,
        bold: true,
      }),
    ],
    alignment: AlignmentType.CENTER,
    spacing: {
      after: FORMAT.spacing.after,
    },
  });
}

// 创建章节标题
function createHeading(text: string, level: "heading" | "subtitle" = "heading"): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({
        text,
        font: FORMAT.fonts.heading,
        size: level === "heading" ? FORMAT.sizes.heading : FORMAT.sizes.subtitle,
        bold: true,
      }),
    ],
    heading: level === "heading" ? HeadingLevel.HEADING_2 : HeadingLevel.HEADING_1,
    spacing: {
      before: FORMAT.spacing.before * 2,
      after: FORMAT.spacing.after,
    },
  });
}

// 创建正文段落
function createBodyText(text: string): Paragraph[] {
  if (!text) return [new Paragraph({ children: [] })];

  return text.split("\n").map((line) => {
    const trimmed = line.trim();
    if (!trimmed) return new Paragraph({ children: [] });

    return new Paragraph({
      children: [
        new TextRun({
          text: trimmed,
          font: FORMAT.fonts.body,
          size: FORMAT.sizes.body,
        }),
      ],
      spacing: {
        line: FORMAT.spacing.line,
        after: FORMAT.spacing.after,
      },
      indent: {
        firstLine: convertInchesToTwip(0.5), // 首行缩进2字符
      },
    });
  });
}

// 创建信息行（如：研究领域：XXX）
function createInfoLine(label: string, value: string): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({
        text: `${label}：`,
        font: FORMAT.fonts.body,
        size: FORMAT.sizes.body,
        bold: true,
      }),
      new TextRun({
        text: value || "未指定",
        font: FORMAT.fonts.body,
        size: FORMAT.sizes.body,
      }),
    ],
    spacing: {
      line: FORMAT.spacing.line,
      after: FORMAT.spacing.after,
    },
  });
}

// 创建分隔线
function createDivider(): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({
        text: "─".repeat(50),
        font: FORMAT.fonts.body,
        size: FORMAT.sizes.small,
        color: "999999",
      }),
    ],
    alignment: AlignmentType.CENTER,
    spacing: {
      before: FORMAT.spacing.before,
      after: FORMAT.spacing.after,
    },
  });
}

// 创建经费预算表格
function createBudgetTable(budgetText: string): Table {
  // 解析预算文本
  const lines = budgetText.split("\n").filter((l) => l.trim());
  const rows: TableRow[] = [];

  // 表头
  rows.push(
    new TableRow({
      children: [
        createTableCell("序号", true),
        createTableCell("预算科目", true),
        createTableCell("金额（万元）", true),
        createTableCell("说明", true),
      ],
    })
  );

  // 数据行
  let totalAmount = 0;
  lines.forEach((line, index) => {
    const match = line.match(/(.+?)[：:]\s*(\d+\.?\d*)\s*万元?[，,]?\s*(.*)/);
    if (match) {
      const [, category, amount, description] = match;
      totalAmount += parseFloat(amount);
      rows.push(
        new TableRow({
          children: [
            createTableCell(`${index + 1}`),
            createTableCell(category.trim()),
            createTableCell(amount),
            createTableCell(description.trim() || "-"),
          ],
        })
      );
    }
  });

  // 合计行
  rows.push(
    new TableRow({
      children: [
        createTableCell(""),
        createTableCell("合计", true),
        createTableCell(totalAmount.toFixed(1), true),
        createTableCell(""),
      ],
    })
  );

  return new Table({
    rows,
    width: {
      size: 100,
      type: WidthType.PERCENTAGE,
    },
  });
}

// 创建表格单元格
function createTableCell(text: string, bold = false): TableCell {
  return new TableCell({
    children: [
      new Paragraph({
        children: [
          new TextRun({
            text,
            font: FORMAT.fonts.body,
            size: FORMAT.sizes.body,
            bold,
          }),
        ],
        alignment: AlignmentType.CENTER,
      }),
    ],
    width: {
      size: 25,
      type: WidthType.PERCENTAGE,
    },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 1 },
      bottom: { style: BorderStyle.SINGLE, size: 1 },
      left: { style: BorderStyle.SINGLE, size: 1 },
      right: { style: BorderStyle.SINGLE, size: 1 },
    },
  });
}

// 生成 Word 文档
export async function generateWordDocument(data: {
  title: string;
  field: string;
  keywords: string;
  projectType: string;
  sections: Record<string, string>;
}): Promise<Blob> {
  const { title, field, keywords, projectType, sections } = data;

  // 构建文档内容
  const children: (Paragraph | Table)[] = [];

  // 封面信息
  children.push(createTitle("课题申报书"));
  children.push(createSubtitle(title || "未命名项目"));
  children.push(createDivider());

  // 项目基本信息
  children.push(createInfoLine("研究领域", field));
  children.push(createInfoLine("关键词", keywords));
  children.push(createInfoLine("项目类型", projectType));
  children.push(createInfoLine("申报日期", new Date().toLocaleDateString("zh-CN")));
  children.push(createDivider());

  // 各章节内容
  SECTIONS_CONFIG.forEach((section) => {
    const content = sections[section.id] || "";

    // 章节标题
    children.push(createHeading(`${section.icon} ${section.title}`));

    // 特殊处理：经费预算使用表格
    if (section.id === "budget" && content) {
      children.push(createBudgetTable(content));
    } else if (content) {
      // 普通文本内容
      children.push(...createBodyText(content));
    } else {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: "（待生成）",
              font: FORMAT.fonts.body,
              size: FORMAT.sizes.body,
              italics: true,
              color: "999999",
            }),
          ],
        })
      );
    }

    // 章节间分隔
    children.push(createDivider());
  });

  // 页脚信息
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: `本申报书由 AI学术写作助手 生成 | ${new Date().toLocaleDateString("zh-CN")}`,
          font: FORMAT.fonts.body,
          size: FORMAT.sizes.small,
          color: "999999",
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: {
        before: FORMAT.spacing.before * 3,
      },
    })
  );

  // 创建文档
  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: FORMAT.margins,
          },
        },
        children,
      },
    ],
  });

  // 生成 Blob
  return Packer.toBlob(doc);
}

// 下载文件
export function downloadDocx(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".docx") ? filename : `${filename}.docx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
