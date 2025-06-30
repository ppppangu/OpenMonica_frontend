import { create } from 'zustand'
import {
  KnowledgeBaseSummary,
  KnowledgeBaseDetail,
  KnowledgeGraph,
} from '../types/knowledgeBase'
import {
  fetchKnowledgeBaseList,
  fetchKnowledgeBaseDetail,
  createOrUpdateKnowledgeBase,
  deleteKnowledgeBase,
  uploadFileToMinio,
  processFileToKnowledgeBase,
  deleteFileFromKnowledgeBase,
  fetchKnowledgeGraph,
  produceKnowledgeGraph,
} from '../utils/knowledgeBaseApi'

interface State {
  list: KnowledgeBaseSummary[]
  currentKB: KnowledgeBaseDetail | null
  graph: KnowledgeGraph | null
  loading: boolean
  error?: string

  // actions
  fetchList: (userId: string) => Promise<void>
  fetchDetail: (userId: string, kbId: string) => Promise<void>
  createOrUpdate: (params: {
    userId: string
    kbId?: string
    name: string
    description: string
  }) => Promise<void>
  remove: (userId: string, kbId: string) => Promise<void>
  uploadDocs: (params: {
    userId: string
    kbId: string
    files: File[]
    mode?: 'simple' | 'normal'
  }) => Promise<void>
  deleteDoc: (params: {
    userId: string
    kbId: string
    docId: string
  }) => Promise<void>
  produceGraph: (userId: string, kbId: string) => Promise<void>
  fetchGraph: (userId: string, kbId: string) => Promise<void>
}

export const useKnowledgeBaseStoreV2 = create<State>((set, get) => ({
  list: [],
  currentKB: null,
  graph: null,
  loading: false,

  async fetchList(userId) {
    set({ loading: true, error: undefined })
    try {
      const list = await fetchKnowledgeBaseList(userId)
      set({ list })
      if (list.length && !get().currentKB) {
        await get().fetchDetail(userId, list[0].id)
      }
    } catch (e: any) {
      set({ error: e.message })
    } finally {
      set({ loading: false })
    }
  },

  async fetchDetail(userId, kbId) {
    set({ loading: true, error: undefined })
    try {
      const detail = await fetchKnowledgeBaseDetail(userId, kbId)
      set({ currentKB: detail })
    } catch (e: any) {
      set({ error: e.message })
    } finally {
      set({ loading: false })
    }
  },

  async createOrUpdate(params) {
    await createOrUpdateKnowledgeBase(params)
    await get().fetchList(params.userId)
  },

  async remove(userId, kbId) {
    await deleteKnowledgeBase(userId, kbId)
    if (get().currentKB?.id === kbId) {
      set({ currentKB: null })
    }
    await get().fetchList(userId)
  },

  async uploadDocs({ userId, kbId, files, mode = 'simple' }) {
    for (const file of files) {
      const { public_url } = await uploadFileToMinio(userId, file)
      await processFileToKnowledgeBase({ userId, kbId, fileUrl: public_url, mode })
    }
    await get().fetchDetail(userId, kbId)
  },

  async deleteDoc({ userId, kbId, docId }) {
    await deleteFileFromKnowledgeBase({ userId, fileId: docId, kbId })
    await get().fetchDetail(userId, kbId)
  },

  async produceGraph(userId, kbId) {
    await produceKnowledgeGraph(userId, kbId)
    await get().fetchGraph(userId, kbId)
  },

  async fetchGraph(userId, kbId) {
    const graph = await fetchKnowledgeGraph(userId, kbId)
    set({ graph })
  },
})) 