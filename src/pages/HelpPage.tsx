import React from 'react'
import { Card, Typography, Collapse } from 'antd'

const { Title, Paragraph } = Typography
const { Panel } = Collapse

const HelpPage: React.FC = () => {
  const faqItems = [
    {
      key: '1',
      label: '如何开始使用AI聊天助手？',
      children: (
        <Paragraph>
          登录后，点击"智能对话"即可开始与AI助手聊天。您可以直接输入问题或上传文件进行分析。
        </Paragraph>
      ),
    },
    {
      key: '2',
      label: '如何创建和管理知识库？',
      children: (
        <Paragraph>
          在"知识库"页面，您可以创建新的知识库，上传文档，并通过知识图谱查看文档之间的关系。
        </Paragraph>
      ),
    },
    {
      key: '3',
      label: '支持哪些文件格式？',
      children: (
        <Paragraph>
          目前支持PDF、Word文档、文本文件、图片等多种格式。具体支持的格式会在上传时显示。
        </Paragraph>
      ),
    },
    {
      key: '4',
      label: '如何设置个人偏好？',
      children: (
        <Paragraph>
          在"设置"页面，您可以配置AI模型偏好、个人提示词、以及其他系统设置。
        </Paragraph>
      ),
    },
  ]

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card>
        <Title level={2}>帮助中心</Title>
        <Paragraph>
          欢迎使用AI聊天助手！这里是您的使用指南和常见问题解答。
        </Paragraph>
      </Card>

      <Card>
        <Title level={3}>快速开始</Title>
        <div className="space-y-4">
          <div>
            <Title level={4}>1. 智能对话</Title>
            <Paragraph>
              与AI助手进行自然语言对话，获得智能回答和建议。
            </Paragraph>
          </div>
          <div>
            <Title level={4}>2. 知识库管理</Title>
            <Paragraph>
              上传和管理您的文档，构建个人知识库。
            </Paragraph>
          </div>
          <div>
            <Title level={4}>3. 个性化设置</Title>
            <Paragraph>
              根据您的需求调整AI助手的行为和偏好。
            </Paragraph>
          </div>
        </div>
      </Card>

      {/* 系统架构卡片开始 */}
      <Card>
        <Title level={3}>系统架构</Title>
        <Paragraph>
          下方展示的是本系统的整体设计架构图，您可以在需要时全屏查看以了解系统组件及其交互方式。
        </Paragraph>
        <div className="relative w-full aspect-video">
          {/* 使用绝对定位和 aspect-video 保持 16:9 比例，并确保在不同屏幕尺寸下自适应 */}
          <iframe
            src="https://miro.com/app/live-embed/uXjVIgDI4JY=/?embedMode=view_only_without_ui&moveToViewport=-1427,-1540,3495,1874&embedId=267681669693"
            frameBorder="0"
            scrolling="no"
            allow="fullscreen; clipboard-read; clipboard-write"
            allowFullScreen
            className="absolute inset-0 w-full h-full rounded-lg shadow"
            title="系统设计架构图"
          ></iframe>
        </div>
      </Card>
      {/* 系统架构卡片结束 */}

      <Card>
        <Title level={3}>常见问题</Title>
        <Collapse items={faqItems} />
      </Card>

      <Card>
        <Title level={3}>联系我们</Title>
        <Paragraph>
          如果您有任何问题或建议，请通过以下方式联系我们：
        </Paragraph>
        <ul>
          <li>邮箱：support@ai-assistant.com</li>
          <li>在线客服：工作日 9:00-18:00</li>
        </ul>
      </Card>
    </div>
  )
}

export default HelpPage
