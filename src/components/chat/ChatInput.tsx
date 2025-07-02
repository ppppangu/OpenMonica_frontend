import React, { useState, useRef } from 'react'
import { Input, Button, Upload, App, Select, Switch } from 'antd'
import { SendOutlined, PaperClipOutlined, AudioOutlined, StopOutlined, HistoryOutlined, PlusCircleFilled } from '@ant-design/icons'
import { useFileStore } from '../../stores/fileStore'
import { useFileUploadMutation } from '../../hooks/useApi'
import { useAuth } from '../../hooks/useAuth'
import yaml from 'js-yaml'
import KnowledgeSourceSelect from './KnowledgeSourceSelect'

const { TextArea } = Input

interface ChatInputProps {
  onSend: (message: string) => void
  onStop?: () => void
  onNewConversation?: () => void
  onShowHistory?: () => void
  onModelChange?: (value: string) => void
  modelList?: { model_id: string; model_name: string }[]
  selectedModelId?: string
  modelsLoading?: boolean
  modelsError?: boolean
  disabled?: boolean
  isStreaming?: boolean
  placeholder?: string
}

const ChatInput: React.FC<ChatInputProps> = ({
  onSend,
  onStop,
  onNewConversation,
  onShowHistory,
  onModelChange,
  modelList = [],
  selectedModelId,
  modelsLoading = false,
  modelsError = false,
  disabled = false,
  isStreaming = false,
  placeholder = "输入消息..."
}) => {
  const [inputValue, setInputValue] = useState('')
  const [isComposing, setIsComposing] = useState(false)
  const [promptButtons, setPromptButtons] = useState<Record<string, string>>({})
  const [activePrompts, setActivePrompts] = useState<{ key: string; text: string }[]>([])
  const [knowledgeSource, setKnowledgeSource] = useState<string>('smart')
  const [deepResearch, setDeepResearch] = useState<boolean>(false)
  const [deepResearchPrompt, setDeepResearchPrompt] = useState<string>('')
  const [isListening, setIsListening] = useState(false)
  const recognitionRef = useRef<any>(null)
  const textAreaRef = useRef<any>(null)
  
  const { addAttachment, isUploading, attachments, removeAttachment } = useFileStore()
  const { user } = useAuth()
  const fileUploadMutation = useFileUploadMutation()
  const { message } = App.useApp()

  const MAX_SIZE = 300 * 1024 * 1024 // 300MB

  // 读取 config.yaml 的 prompt_buttons
  React.useEffect(() => {
    fetch('/config.yaml')
      .then(res => res.text())
      .then(text => {
        const data: any = yaml.load(text)
        if (data && data.prompt_buttons) {
          // 过滤 value 非字符串的情况
          const buttons: Record<string, string> = {}
          Object.entries<any>(data.prompt_buttons).forEach(([k, v]) => {
            if (typeof v === 'string') buttons[k] = v
          })
          setPromptButtons(buttons)
        }

        if (data && typeof data.deep_research_prompt === 'string') {
          setDeepResearchPrompt(data.deep_research_prompt)
        }
      })
      .catch(err => console.warn('加载 prompt_buttons 失败', err))
  }, [])

  const handleSend = () => {
    const trimmedValue = inputValue.trim()

    if (!trimmedValue && activePrompts.length === 0) return

    // 合并 prompt chips 与输入内容
    const promptText = activePrompts.map(p => p.text).join('，')

    let finalContent = promptText ? `${promptText} • ${trimmedValue}` : trimmedValue

    // DeepResearch 注入
    if (deepResearch && deepResearchPrompt) {
      finalContent = `${deepResearchPrompt} • ${finalContent}`
    }

    onSend(finalContent)

    // 重置输入与已选 prompt
    setInputValue('')
    setActivePrompts([])

    // Focus back to input
    setTimeout(() => {
      textAreaRef.current?.focus()
    }, 100)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && !isComposing) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleFileUpload = async (file: File) => {
    if (file.size > MAX_SIZE) {
      message.error(`文件 ${file.name} 超过 300MB 大小限制`)
      return false
    }

    try {
      const formData = new FormData()
      if (user?.id) {
        formData.append('user_id', user.id)
      }
      if (user?.token) {
        formData.append('token', user.token)
      }
      formData.append('upload', file)
      
      const result: any = await fileUploadMutation.mutateAsync(formData)
      
      if (result && result.public_url) {
        const attachment = {
          id: Date.now().toString(),
          filename: file.name,
          public_url: result.public_url,
          file_type: file.type,
          file_size: file.size,
          upload_time: new Date().toISOString(),
          category: file.type.startsWith('image/') ? 'image' as const : 'document' as const
        }
        
        addAttachment(attachment)
        message.success(`文件 ${file.name} 上传成功`)
      }
    } catch (error) {
      console.error('File upload failed:', error)
      message.error(`文件 ${file.name} 上传失败`)
    }
  }

  const handlePaste = async (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items
    if (!items) return

    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      if (item.type.indexOf('image') !== -1) {
        const file = item.getAsFile()
        if (file) {
          await handleFileUpload(file)
        }
      }
    }
  }

  const uploadProps = {
    beforeUpload: (file: File) => {
      handleFileUpload(file)
      return false // Prevent default upload
    },
    showUploadList: false,
    multiple: true,
  }

  const renderAttachmentPreview = () => {
    if (attachments.length === 0) return null

    return (
      <div className="flex flex-wrap gap-2 mt-2">
        {attachments.map((att) => (
          <div key={att.id} className="relative border rounded p-2 text-xs max-w-xs">
            {att.category === 'image' ? (
              <img src={att.public_url} alt={att.filename} className="w-24 h-16 object-cover rounded" />
            ) : (
              <span className="inline-block w-24 truncate">{att.filename}</span>
            )}
            <Button
              type="text"
              size="small"
              className="!absolute top-0 right-0"
              onClick={() => removeAttachment(att.id)}
            >
              ✕
            </Button>
          </div>
        ))}
      </div>
    )
  }

  const renderPromptChips = () => {
    if (activePrompts.length === 0) return null

    return (
      <div className="flex flex-wrap gap-2 mb-2">
        {activePrompts.map(p => (
          <span
            key={p.key}
            className="inline-flex items-center px-2 py-0.5 rounded-full bg-gray-200 text-sm text-gray-800 cursor-pointer hover:bg-gray-300"
            onClick={() => setActivePrompts(prev => prev.filter(item => item.key !== p.key))}
            title="点击移除"
          >
            {p.key} ✕
          </span>
        ))}
      </div>
    )
  }

  // 工具按钮标签集合（不显示 chips，只需高亮切换）
  const TOOL_LABELS = [
    '思维导图', 'Mind Map',
    '邮件', 'Email',
    '代码执行', 'Code Execution',
    '每日新闻', 'Daily News'
  ]
  const [activeTools, setActiveTools] = useState<string[]>([])

  /**
   * 初始化并开始语音识别
   */
  const startVoiceRecognition = () => {
    // 判断浏览器兼容性
    const SpeechRecognition: any = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) {
      message.error('当前浏览器不支持语音输入')
      return
    }

    // 如果已经在监听，则停止
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop()
      return
    }

    try {
      const recognition = new SpeechRecognition()
      recognition.lang = 'zh-CN'
      recognition.continuous = false
      recognition.interimResults = false

      recognition.onstart = () => {
        setIsListening(true)
        message.info({ content: '正在听… 请开始说话', key: 'voice_rec' })
      }

      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((r: any) => r[0]?.transcript)
          .join('')

        if (transcript) {
          setInputValue(prev => (prev ? prev + ' ' + transcript : transcript))
        }
      }

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event)
        message.error({ content: '语音识别出错', key: 'voice_rec' })
        setIsListening(false)
      }

      recognition.onend = () => {
        setIsListening(false)
        message.destroy('voice_rec')
        textAreaRef.current?.focus()
      }

      recognition.start()
      recognitionRef.current = recognition
    } catch (e) {
      console.error('Failed to start speech recognition:', e)
      message.error('启动语音识别失败')
    }
  }

  return (
    /*
     * 固定到底部，带圆角阴影的输入栏
     * 使用 z-10 保证覆盖在页面内容之上
     */
    <div className="fixed bottom-0 left-0 w-full bg-gray-50 p-4 md:px-6 space-y-2 shadow-[0_-2px_6px_rgba(0,0,0,0.04)] border-t border-gray-200 z-10">
      {/* 行 1：快捷提示 & 会话控制 */}
      <div className="flex items-center justify-between max-w-4xl mx-auto">
        {/* 左：预设提示词 */}
        <div className="flex items-center gap-1 flex-wrap">
          {Object.entries(promptButtons).map(([label, prompt]) => {
            const isTool = TOOL_LABELS.includes(label)
            const isActive = isTool
              ? activeTools.includes(label)
              : activePrompts.some(p => p.key === label)
            return (
              <Button
                key={label}
                size="small"
                className={`${['!border !border-gray-300', isActive ? '!bg-gray-300' : '!bg-gray-100', '!text-gray-800', 'hover:!bg-gray-200', 'transition-colors duration-150'].join(' ')}`}
                onClick={() => {
                  if (isTool) {
                    // 处理工具按钮
                    setActiveTools(prev => {
                      if (prev.includes(label)) {
                        return prev.filter(l => l !== label)
                      }
                      return [...prev, label]
                    })
                  } else {
                    // 非工具，作为 prompt chip
                    setActivePrompts(prev => {
                      if (prev.some(p => p.key === label)) {
                        return prev.filter(p => p.key !== label)
                      }
                      return [...prev, { key: label, text: prompt }]
                    })
                  }
                  setTimeout(() => textAreaRef.current?.focus(), 50)
                }}
              >
                {label}
              </Button>
            )
          })}
        </div>

        {/* 右：会话列表 & 新建会话 */}
        <div className="flex items-center gap-1">
          <Button
            type="text"
            icon={<HistoryOutlined />}
            title="会话列表"
            onClick={onShowHistory}
          />
          <Button
            type="text"
            icon={<PlusCircleFilled style={{ color: '#7c3aed', fontSize: 20 }} />}
            title="新建对话"
            onClick={onNewConversation}
          />
        </div>
      </div>

      {/* 行 2：附件 + 输入框 + 语音/发送 */}
      <div className="flex items-end gap-2 max-w-4xl mx-auto">
        {/* 文件上传 */}
        <Upload {...uploadProps}>
          <Button
            icon={<PaperClipOutlined />}
            disabled={disabled || isUploading}
            loading={isUploading}
            title="上传文件"
          />
        </Upload>

        {/* 输入与附件预览 */}
        <div className="flex-1">
          {renderPromptChips()}
          {renderAttachmentPreview()}
          <TextArea
            ref={textAreaRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyPress}
            onPaste={handlePaste}
            onCompositionStart={() => setIsComposing(true)}
            onCompositionEnd={() => setIsComposing(false)}
            placeholder={placeholder}
            disabled={disabled}
            autoSize={{ minRows: 1, maxRows: 4 }}
            className="resize-none rounded-xl border border-gray-300 shadow-sm !px-3 !py-2"
          />
        </div>

        {/* 语音输入 */}
        <Button
          icon={<AudioOutlined className={isListening ? 'animate-pulse text-red-500' : ''} />}
          disabled={disabled}
          type={isListening ? 'primary' : 'default'}
          danger={isListening}
          title={isListening ? '点击停止语音输入' : '语音输入'}
          onClick={startVoiceRecognition}
        />

        {/* 发送/停止 */}
        {isStreaming ? (
          <Button
            type="primary"
            danger
            icon={<StopOutlined />}
            onClick={onStop}
            title="停止生成"
          />
        ) : (
          <Button
            type="primary"
            icon={<SendOutlined />}
            onClick={handleSend}
            disabled={disabled || !inputValue.trim()}
            title="发送消息 (Enter)"
          />
        )}
      </div>

      {/* 行 3：模型选择 */}
      <div className="max-w-4xl mx-auto flex items-center gap-2">
        <Select
          placeholder={modelsError ? '模型加载失败' : '选择AI模型'}
          value={selectedModelId}
          onChange={val => onModelChange?.(val)}
          loading={modelsLoading}
          style={{ minWidth: 200 }}
          disabled={isStreaming || disabled}
          status={modelsError ? 'error' : undefined}
          placement="topLeft"
          popupRender={(menu) => (
            <div>
              {modelsError ? (
                <div className="p-3 text-center">
                  <span className="text-red-500 text-sm block mb-2">加载模型失败</span>
                </div>
              ) : (
                menu
              )}
            </div>
          )}
        >
          {modelList?.map((model: any) => (
            <Select.Option key={model.model_id} value={model.model_id}>
              {model.model_name}
            </Select.Option>
          ))}
        </Select>

        {/* 知识来源单选 */}
        <KnowledgeSourceSelect
          value={knowledgeSource}
          onChange={setKnowledgeSource}
          disabled={isStreaming || disabled}
        />

        {/* DeepResearch Toggle */}
        <div className="flex items-center gap-1">
          <span className="text-sm text-gray-600">DeepResearch</span>
          <Switch
            checked={deepResearch}
            onChange={setDeepResearch}
            disabled={isStreaming || disabled}
            size="small"
          />
        </div>
      </div>
    </div>
  )
}

export default ChatInput
