export interface Attachment {
  name: string
  url: string
}

export interface ParseAttachmentResult {
  attachments: Attachment[]
  stripped: string // 去除附件块后的纯文本
}

/**
 * 解析包含新格式附件块的文本
 *
 * 格式示例：
 * ```
 * [[附件列表]
 * [附件1]
 * [name]filename1
 * [url]url1
 * [附件2]
 * [name]filename2
 * [url]url2
 * ]
 * ```
 */
export function parseAttachmentBlock(raw: string): ParseAttachmentResult {
  const attachments: Attachment[] = []

  // ---------- 新格式 ([[附件列表]...) ----------
  const newStartTag = '[[附件列表]'
  const newStartIdx = raw.indexOf(newStartTag)
  if (newStartIdx !== -1) {
    const endIdx = raw.indexOf('\n]', newStartIdx)
    if (endIdx !== -1) {
      const block = raw.slice(newStartIdx, endIdx + 2)
      const lines = block.split(/\r?\n/)
      let current: Partial<Attachment> = {}
      for (const line of lines) {
        if (/^\[附件\d+]/.test(line)) {
          if (current.name && current.url) {
            attachments.push({ name: current.name, url: current.url })
          }
          current = {}
        } else if (line.startsWith('[name]')) {
          current.name = line.replace('[name]', '').trim()
        } else if (line.startsWith('[url]')) {
          current.url = line.replace('[url]', '').trim()
        }
      }
      if (current.name && current.url) {
        attachments.push({ name: current.name, url: current.url })
      }

      const stripped = raw.slice(0, newStartIdx).trimEnd() + '\n' + raw.slice(endIdx + 2).trimStart()
      return { attachments, stripped }
    }
  }

  // ---------- 旧格式 ([附件列表] filename: url) ----------
  const oldTag = '[附件列表]'
  const oldIdx = raw.indexOf(oldTag)
  if (oldIdx !== -1) {
    const listStr = raw.slice(oldIdx + oldTag.length).trim()
    const lines = listStr.split(/\r?\n/)
    lines.forEach((l) => {
      const m = l.match(/([^:]+):\s*(\S+)/)
      if (m) {
        attachments.push({ name: m[1].trim(), url: m[2].trim() })
      }
    })

    // 若在同一行（原示例），上面 split 会返回空数组首元，需处理
    if (attachments.length === 0) {
      const inlineMatch = listStr.match(/([^:]+):\s*(\S+)/)
      if (inlineMatch) {
        attachments.push({ name: inlineMatch[1].trim(), url: inlineMatch[2].trim() })
      }
    }

    // 直接保留附件块之前的文本，避免偏移误差导致残留字符
    const stripped = raw.slice(0, oldIdx).trimEnd()
    return { attachments, stripped }
  }

  // 未匹配任何附件格式
  return { attachments: [], stripped: raw }
} 