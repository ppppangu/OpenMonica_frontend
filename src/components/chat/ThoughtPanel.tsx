import React, { useEffect } from 'react'
import ReactDOM from 'react-dom'
import MarkdownIt from 'markdown-it'

interface ThoughtPanelProps {
  thoughts: string[]
  visible: boolean
  onClose: () => void
}

const md = new MarkdownIt({
  html: true,
  linkify: true,
})

const ThoughtPanel: React.FC<ThoughtPanelProps> = ({ thoughts, visible, onClose }) => {
  // 监听 Esc 键关闭
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])

  // 将思维列表转为 markdown -> html
  const markdownStr = thoughts.map(t => `- ${t}`).join('\n')
  const html = md.render(markdownStr)

  // 面板元素
  const panel = (
    <div
      className={
        `fixed top-0 right-0 h-full w-[400px] bg-white shadow-lg z-50 transform transition-transform duration-300 ease-in-out ` +
        (visible ? 'translate-x-0' : 'translate-x-full')
      }
    >
      {/* 标题栏 */}
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <h2 className="text-lg font-semibold">Agent 思维路径</h2>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700 text-xl leading-none"
          aria-label="Close"
        >
          ×
        </button>
      </div>

      {/* 内容区域 */}
      <div className="p-4 overflow-y-auto markdown-content" dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  )

  return ReactDOM.createPortal(panel, document.body)
}

export default ThoughtPanel 