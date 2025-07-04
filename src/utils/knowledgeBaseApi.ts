import {
  KnowledgeBaseSummary,
  KnowledgeBaseDetail,
  KnowledgeGraph,
} from '../types/knowledgeBase'
import { loadConfig } from './configLoader'

/**
 * 帮助方法：向用户管理服务发送请求
 */
async function userServiceFetch(path: string, options: RequestInit) {
  const cfg = await loadConfig()
  const base = cfg.user_manage_url || ''
  return fetch(`${base}${path}`, options)
}

/**
 * 帮助方法：向文件管理服务发送请求
 */
async function fileServiceFetch(path: string, options: RequestInit) {
  const cfg = await loadConfig()
  const base = cfg.file_manage_url || ''
  return fetch(`${base}${path}`, options)
}
// ---------------- 知识库核心接口 ---------------- //
export async function fetchKnowledgeBaseList(userId: string): Promise<KnowledgeBaseSummary[]> {
  const body = new FormData()
  body.append('mode', 'get')
  body.append('user_id', userId)
  body.append('target', 'list')

  const res = await userServiceFetch('/user/knowledgebase', {
    method: 'POST',
    body,
  })
  const json = await res.json()
  if (json.status !== 'success') throw new Error(json.message || 'API error')
  return json.data as KnowledgeBaseSummary[]
}

export async function fetchKnowledgeBaseDetail(userId: string, kbId: string): Promise<KnowledgeBaseDetail> {
  const body = new FormData()
  body.append('mode', 'get')
  body.append('user_id', userId)
  body.append('knowledgebase_id', kbId)
  body.append('target', 'detail')

  const res = await userServiceFetch('/user/knowledgebase', {
    method: 'POST',
    body,
  })
  const json = await res.json()
  if (json.status !== 'success') throw new Error(json.message || 'API error')

  const data = json.data
  // 后端在不同版本中可能返回数组或单个对象，这里做兼容处理
  const detail: KnowledgeBaseDetail | undefined = Array.isArray(data) ? data[0] : data
  if (!detail) throw new Error('知识库详情为空')
  return detail
}

export async function createOrUpdateKnowledgeBase(params: {
  userId: string
  kbId?: string
  name: string
  description: string
}): Promise<void> {
  const body = new FormData()
  body.append('mode', 'update')
  body.append('user_id', params.userId)
  if (params.kbId) body.append('knowledgebase_id', params.kbId)
  body.append('name', params.name)
  body.append('description', params.description)

  const res = await userServiceFetch('/user/knowledgebase', {
    method: 'POST',
    body,
  })
  const json = await res.json()
  if (json.status !== 'success') throw new Error(json.message || 'API error')
}

export async function deleteKnowledgeBase(userId: string, kbId: string): Promise<void> {
  const body = new FormData()
  body.append('mode', 'delete')
  body.append('user_id', userId)
  body.append('knowledgebase_id', kbId)

  const res = await userServiceFetch('/user/knowledgebase', {
    method: 'POST',
    body,
  })
  const json = await res.json()
  if (json.status !== 'success') throw new Error(json.message || 'API error')
}

// ---------------- 文件与文档 ---------------- //
export async function getSupportedFileTypes(): Promise<string[]> {
  const res = await fileServiceFetch('/get_supported_file_types', {
    method: 'GET',
  })
  const json = await res.json()
  return json.data.supported_file_types as string[]
}

export async function uploadFileToMinio(userId: string, file: File): Promise<{ public_url: string; file_id: string }> {
  const formData = new FormData()
  formData.append('user_id', userId)
  formData.append('upload_file', file)

  const res = await fileServiceFetch('/upload_minio', {
    method: 'POST',
    body: formData,
  })
  const json = await res.json()
  if (json.status !== 'success') throw new Error(json.message || 'upload failed')
  return json.data
}

export async function processFileToKnowledgeBase(params: {
  userId: string
  fileUrl: string
  kbId: string
  mode?: 'simple' | 'normal'
}): Promise<void> {
  const formData = new FormData()
  formData.append('user_id', params.userId)
  formData.append('file_url', params.fileUrl)
  formData.append('knowledge_base_id', params.kbId)
  formData.append('mode', params.mode ?? 'simple')

  const res = await fileServiceFetch('/process', {
    method: 'POST',
    body: formData,
  })
  const json = await res.json()
  if (json.status !== 'ok' && json.status !== 'success') throw new Error(json.message || 'process failed')
}

export async function deleteFileFromKnowledgeBase(params: { userId: string; fileId: string; kbId: string }): Promise<void> {
  const formData = new FormData()
  formData.append('user_id', params.userId)
  formData.append('file_id', params.fileId)
  formData.append('knowledge_base_id', params.kbId)

  const res = await fileServiceFetch('/delete_file', {
    method: 'POST',
    body: formData,
  })
  await res.json()
}

// ---------------- 知识图谱 ---------------- //
export async function produceKnowledgeGraph(userId: string, kbId: string): Promise<void> {
  const formData = new FormData()
  formData.append('mode', 'produce')
  formData.append('user_id', userId)
  formData.append('knowledge_base_id', kbId)
  formData.append('level', 'document')

  const res = await fileServiceFetch('/graph/knowledge_base', {
    method: 'POST',
    body: formData,
  })
  await res.json()
}

export async function fetchKnowledgeGraph(userId: string, kbId: string): Promise<KnowledgeGraph> {
  const formData = new FormData()
  formData.append('mode', 'get')
  formData.append('user_id', userId)
  formData.append('knowledge_base_id', kbId)
  formData.append('level', 'document')

  const res = await fileServiceFetch('/graph/knowledge_base', {
    method: 'POST',
    body: formData,
  })
  const json = await res.json()
  if (json.status !== 'ok') throw new Error(json.message || 'graph fetch failed')
  return json.data as KnowledgeGraph
} 