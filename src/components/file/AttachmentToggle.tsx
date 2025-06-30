import React, { useState } from 'react'
import {
  PaperClipOutlined,
  FilePdfOutlined,
  FileImageOutlined,
  FileZipOutlined,
  FileWordOutlined,
  FileExcelOutlined,
  FilePptOutlined,
  FileTextOutlined,
  DownOutlined,
  UpOutlined,
} from '@ant-design/icons'
import { Attachment } from '../../utils/parseAttachments'

interface Props {
  attachments: Attachment[]
  className?: string
}

const AttachmentToggle: React.FC<Props> = ({ attachments, className = '' }) => {
  const [expanded, setExpanded] = useState(false)

  if (!attachments || attachments.length === 0) return null

  const getIcon = (name: string) => {
    const ext = name.split('.').pop()?.toLowerCase() || ''
    switch (ext) {
      case 'pdf':
        return <FilePdfOutlined className="text-red-600" />
      case 'png':
      case 'jpg':
      case 'jpeg':
      case 'gif':
        return <FileImageOutlined className="text-yellow-500" />
      case 'zip':
      case 'rar':
      case '7z':
        return <FileZipOutlined className="text-purple-500" />
      case 'doc':
      case 'docx':
        return <FileWordOutlined className="text-blue-600" />
      case 'xls':
      case 'xlsx':
        return <FileExcelOutlined className="text-green-600" />
      case 'ppt':
      case 'pptx':
        return <FilePptOutlined className="text-orange-500" />
      case 'txt':
      case 'py':
      case 'js':
      case 'ts':
      case 'md':
        return <FileTextOutlined className="text-gray-600" />
      default:
        return <PaperClipOutlined />
    }
  }

  return (
    <div className={`mt-2 ${className}`}>
      <button
        className="flex items-center text-sm text-gray-500 hover:underline"
        onClick={() => setExpanded(!expanded)}
      >
        <PaperClipOutlined className="mr-1" />
        共{attachments.length}个附件 {expanded ? '收起' : '展开'}
        {expanded ? (
          <UpOutlined className="ml-1" />
        ) : (
          <DownOutlined className="ml-1" />
        )}
      </button>
      {expanded && (
        <ul className="mt-2 space-y-1">
          {attachments.map((a, idx) => (
            <li key={idx} className="flex items-center text-sm text-gray-700">
              {getIcon(a.name)}
              <span className="mx-1" />
              <a
                href={a.url}
                target="_blank"
                rel="noopener noreferrer"
                download
                className="hover:underline flex-1 truncate"
              >
                {a.name}
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default AttachmentToggle 