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

  // 锁定滚动（打开时）并设置全局 CSS 变量供布局使用
  useEffect(() => {
    const body = document.body
    if (visible) {
      body.classList.add('thought-panel-open')
      // 根据当前断点动态设置宽度：sm 以上 400px，移动端 0
      const panelWidth = window.innerWidth >= 640 ? '400px' : '0px'
      body.style.setProperty('--thought-panel-width', panelWidth)
    } else {
      body.classList.remove('thought-panel-open')
      body.style.setProperty('--thought-panel-width', '0px')
    }
    // 清理
    return () => {
      body.classList.remove('thought-panel-open')
      body.style.setProperty('--thought-panel-width', '0px')
    }
  }, [visible])

  // 将思维列表转为 markdown -> html
  const markdownStr = thoughts.map(t => `- ${t}`).join('\n')
  const html = md.render(markdownStr)

  // 若不可见则直接返回 null，避免透明层阻挡点击
  if (!visible) return null

  const panel = (
    <div
      className="fixed top-0 right-0 h-full w-full sm:w-[400px] bg-white shadow-lg z-[60] transform transition-transform duration-300 ease-in-out translate-x-0"
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