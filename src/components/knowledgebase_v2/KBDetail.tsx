import { useKnowledgeBaseStoreV2 } from '../../stores/knowledgeBaseStoreV2'
import { Card, Tabs, Table, Button, Upload, message, Popconfirm, Radio, Modal } from 'antd'
import { UploadOutlined, ReloadOutlined, DeleteOutlined, DownloadOutlined } from '@ant-design/icons'
import { useAuthStore } from '../../stores/authStore'
import { useState } from 'react'
import { RcFile } from 'antd/es/upload'
import { KBGraphView } from './KBGraphView'
import { KBDetailHeader } from './KBDetailHeader'

export function KBDetail() {
  const userId = useAuthStore(state => state.user?.id) || ''
  const { currentKB, graph, uploadDocs, produceGraph, deleteDoc } = useKnowledgeBaseStoreV2()
  const [uploading, setUploading] = useState(false)
  const [mode, setMode] = useState<'simple' | 'normal'>('simple')

  if (!currentKB) return null

  const handleUpload = async (file: RcFile) => {
    setUploading(true)
    try {
      if (mode === 'normal') {
        Modal.info({
          title: '正在进行 OCR 处理',
          content: '该模式会对文档执行 OCR 解析，上传与处理时间可能较长，请耐心等待。',
          okText: '知道了',
        })
      }
      await uploadDocs({ userId, kbId: currentKB.id, files: [file], mode })
      message.success('上传成功')
    } catch (e:any) {
      message.error(e.message)
    } finally {
      setUploading(false)
    }
    return false // prevent auto upload
  }

  const docsColumns = [
    { title: '文件名', dataIndex: 'name', key: 'name', render: (text: string) => <span className="text-blue-600 cursor-pointer">{text}</span> },
    { title: '类型', dataIndex: ['extra_info','type'], key: 'type' },
    { title: '大小', dataIndex: ['extra_info','size'], key: 'size', render: (size:number) => `${(size/1024).toFixed(1)}KB` },
    { title: '更新时间', dataIndex: ['extra_info','updated_at'], key: 'updated' },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_:any, record:any) => (
        <span className="flex gap-2">
          <a href={record.markdown_url} target="_blank" rel="noopener" title="下载"><DownloadOutlined /></a>
          <Popconfirm title="确认删除该文档?" onConfirm={() => deleteDoc({ userId, kbId: currentKB.id, docId: record.id })}>
            <DeleteOutlined className="text-red-500 cursor-pointer" />
          </Popconfirm>
        </span>
      ),
    },
  ]

  // const tags = Array.from(
  //   new Set(
  //     (graph?.documents?.flatMap((d) => d.tags) as string[] | undefined) ?? []
  //   )
  // )

  return (
    <div>
      <KBDetailHeader />

      {/* 上传模式选择 */}
      <div className="flex items-center gap-3 my-2">
        <span>上传模式:</span>
        <Radio.Group value={mode} onChange={e => setMode(e.target.value)}>
          <Radio.Button value="simple">简单</Radio.Button>
          <Radio.Button value="normal">OCR</Radio.Button>
        </Radio.Group>
      </div>

      <Upload beforeUpload={handleUpload} showUploadList={false} disabled={uploading}>
        <Button type="primary" icon={<UploadOutlined />} loading={uploading} className="my-1">上传文档</Button>
      </Upload>

      <Tabs defaultActiveKey="docs" items={[
        {
          key: 'docs',
          label: '文档列表',
          children: <Table rowKey="id" dataSource={currentKB.documents} columns={docsColumns} pagination={false} />
        },
        {
          key: 'graph',
          label: '知识图谱',
          children: (
            <div>
              <Button icon={<ReloadOutlined />} onClick={() => produceGraph(userId, currentKB.id)} className="mb-2">刷新图谱</Button>
              <KBGraphView />
            </div>
          )
        }
      ]} />
    </div>
  )
} 