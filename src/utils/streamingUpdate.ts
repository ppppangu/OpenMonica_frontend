/**
 * X 字符串增量更新算法原型
 * -------------------------------------------------------------
 * BubbleState 用于维护单条气泡的流式内容累计状态。
 * addChunk() 按设计文档 3.2 的伪代码实现。
 * -------------------------------------------------------------
 */

export interface Chunk {
  content?: string;
  reasoning_content?: string;
}

export interface BubbleState {
  /** 已累积的完整 X 字符串 */
  x: string;
  /** 是否处于未闭合的 <think> 标签内部 */
  inThink: boolean;
}

/**
 * 创建新的气泡状态对象
 */
export function createBubbleState(): BubbleState {
  return { x: "", inThink: false };
}

/**
 * 向气泡状态中追加一个流式块
 * @param state BubbleState
 * @param chunk 流式块（同时兼容 OpenAI SSE / 自定义数据结构）
 */
export function addChunk(state: BubbleState, chunk: Chunk): void {
  if (!chunk) return;

  const isReason = chunk.reasoning_content !== undefined && chunk.reasoning_content !== null;
  const text = (isReason ? chunk.reasoning_content : chunk.content) ?? "";
  if (text === "") return;

  // 思考块处理
  if (isReason) {
    if (state.x === "") {
      // 首块且思考
      state.x += `\n<think>` + text;
      state.inThink = true;
    } else if (state.inThink) {
      // 已在 <think> 内
      state.x += text;
    } else {
      // 之前已闭合，现在重新开始思考
      state.x += `\n<think>` + text;
      state.inThink = true;
    }
    return;
  }

  // 非思考块处理
  if (state.inThink) {
    // 先闭合 <think>
    state.x += `</think>\n` + text;
    state.inThink = false;
  } else {
    state.x += text;
  }
}

// -------------------------- demo ------------------------------
// 该函数仅用于测试环境快速验证算法逻辑，在生产环境可以删除。
export function demo() {
  const s = createBubbleState();
  const feed: Chunk[] = [
    { reasoning_content: "思考 1" },
    { reasoning_content: " 思考 2" },
    { content: "最终答案。" },
    { reasoning_content: "新的思考" },
    { content: "补充答案。" }
  ];

  for (const c of feed) addChunk(s, c);
  /* eslint-disable no-console */
  console.log("[streamingUpdate demo] result:\n", s.x);
  /* eslint-enable no-console */
} 