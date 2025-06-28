import { escape } from "lodash-es";

// 简易稳定 stringify：深度优先、键名排序
function stableStringify(obj: any): string {
  if (obj === null || typeof obj !== "object") return JSON.stringify(obj);
  if (Array.isArray(obj)) {
    return `[${obj.map((v) => stableStringify(v)).join(",")}]`;
  }
  const keys = Object.keys(obj).sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${stableStringify(obj[k])}`).join(",")}}`;
}

export type SegmentType = "think" | "normal" | "toolUsing" | "toolDone";

export interface BaseSegment {
  type: SegmentType;
  content: string; // 原始文本（代码块保留 ```json ...```）
}

export interface ToolUsingSegment extends BaseSegment {
  type: "toolUsing";
  json: {
    tool: string;
    arguments: any;
  };
}

export interface ToolDoneSegment extends BaseSegment {
  type: "toolDone";
  json: {
    params: string;
    tool_response: string;
    is_error: string | boolean;
  };
  parsedParams?: {
    tool: string;
    arguments: any;
  };
}

export type Segment = BaseSegment | ToolUsingSegment | ToolDoneSegment;

/* ------------------------------------------------------------
 * 解析 X 字符串 => Segment[]
 * ----------------------------------------------------------*/
export function parseX(x: string): Segment[] {
  const segments: Segment[] = [];
  const codeRe = /```json[\s\S]*?```/g;
  let lastIdx = 0;
  let match: RegExpExecArray | null;

  while ((match = codeRe.exec(x)) !== null) {
    // 前置文本
    if (match.index > lastIdx) {
      segments.push(...splitThinkNormal(x.slice(lastIdx, match.index)));
    }

    const codeBlock = match[0];
    const inner = codeBlock.replace(/^```json\s*/i, "").replace(/```$/, "");
    let obj: any;
    try {
      obj = JSON.parse(inner);
    } catch {
      // 非合法 json，当成普通文本
      segments.push({ type: "normal", content: codeBlock });
      lastIdx = codeRe.lastIndex;
      continue;
    }

    const keys = Object.keys(obj);
    if (keys.length === 2 && keys.includes("tool") && keys.includes("arguments")) {
      segments.push({
        type: "toolUsing",
        content: codeBlock,
        json: obj,
      } as ToolUsingSegment);
    } else if (
      keys.length === 3 &&
      keys.includes("params") &&
      keys.includes("tool_response") &&
      keys.includes("is_error")
    ) {
      let parsedParams: any;
      try {
        parsedParams = JSON.parse(obj.params);
      } catch {
        parsedParams = undefined;
      }
      segments.push({
        type: "toolDone",
        content: codeBlock,
        json: obj,
        parsedParams,
      } as ToolDoneSegment);
    } else {
      // 其他 json 片段，归为普通文本
      segments.push({ type: "normal", content: codeBlock });
    }

    lastIdx = codeRe.lastIndex;
  }

  // 尾部文本
  if (lastIdx < x.length) {
    segments.push(...splitThinkNormal(x.slice(lastIdx)));
  }

  return segments;
}

/* ------------------------------------------------------------
 * 将普通文本依 <think> 标签拆分
 * ----------------------------------------------------------*/
function splitThinkNormal(text: string): Segment[] {
  const list: Segment[] = [];
  const tagRe = /<\/??think>/g;
  let last = 0;
  let inThink = false;
  let m: RegExpExecArray | null;

  while ((m = tagRe.exec(text)) !== null) {
    if (m.index > last) {
      list.push({ type: inThink ? "think" : "normal", content: text.slice(last, m.index) });
    }
    // toggle state
    inThink = m[0] === "<think>";
    last = tagRe.lastIndex;
  }
  if (last < text.length) {
    list.push({ type: inThink ? "think" : "normal", content: text.slice(last) });
  }
  return list;
}

/* ------------------------------------------------------------
 * Segment[] => HTML 字符串
 * ----------------------------------------------------------*/
export function renderSegmentsToHtml(segs: Segment[]): string {
  // 1. 收集已完成 params
  const doneParamsSet = new Set<string>();
  segs.forEach((s) => {
    if (s.type === "toolDone" && (s as ToolDoneSegment).parsedParams) {
      doneParamsSet.add(stableStringify((s as ToolDoneSegment).parsedParams));
    }
  });

  // 2. 组装容器（think / normal）
  type Container = { type: "think" | "normal"; inner: string[] };
  const containers: Container[] = [];
  function ensureContainer(t: "think" | "normal") {
    let last = containers[containers.length - 1];
    if (!last || last.type !== t) {
      last = { type: t, inner: [] };
      containers.push(last);
    }
    return last;
  }

  let currentType: "think" | "normal" = "normal";

  segs.forEach((s) => {
    if (s.type === "think" || s.type === "normal") {
      currentType = s.type;
      const ctn = ensureContainer(currentType);
      ctn.inner.push(markdownTransform(s.content));
      return;
    }

    // 工具相关段落归属到当前容器
    const ctn = ensureContainer(currentType);
    if (s.type === "toolUsing") {
      const key = stableStringify((s as ToolUsingSegment).json);
      if (doneParamsSet.has(key)) return; // 隐藏
      ctn.inner.push(
        `<div class="tool-using" data-params='${escape(key)}'><pre>${escape(s.content)}</pre></div>`
      );
    } else if (s.type === "toolDone") {
      const paramsKey = (s as ToolDoneSegment).parsedParams
        ? stableStringify((s as ToolDoneSegment).parsedParams!)
        : "";
      ctn.inner.push(
        `<div class="tool-done" data-params='${escape(paramsKey)}'><pre>${escape(s.content)}</pre></div>`
      );
    }
  });

  // 3. 输出 HTML
  const htmlParts = containers.map((c) => {
    const cls = c.type === "think" ? "think" : "normal";
    return `<div class="${cls}">${c.inner.join("\n")}</div>`;
  });

  return htmlParts.join("\n");
}

/* ------------------------------------------------------------
 * markdown 转换 & url iframe 插入（简化版）
 * ----------------------------------------------------------*/
import MarkdownIt from "markdown-it";
const md = new MarkdownIt();

function markdownTransform(src: string): string {
  let html = md.render(src);
  // 检测 <url> 包裹
  const urlRe = /&lt;(https?:\/\/[^&]+)&gt;/g;
  html = html.replace(urlRe, (_m, p1) => {
    const safe = escape(p1);
    return `<iframe src="${safe}" sandbox="allow-scripts allow-same-origin" referrerpolicy="no-referrer" style="width:100%;height:300px;"></iframe>`;
  });
  return html;
} 