import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface KnowledgeBase {
  knowledgebase_id: string
  name: string
  description: string
  document_count: number
  created_at: string
  updated_at: string
}

export interface Document {
  document_id: string
  filename: string
  pdf_file_path?: string
  markdown_file_path?: string
  upload_time: string
  file_size?: number
  status: string
}

export interface KnowledgeGraphNode {
  id: string
  label: string
  type: 'document' | 'tag'
  size?: number
  color?: string
}

export interface KnowledgeGraphLink {
  source: string
  target: string
  weight?: number
}

export interface KnowledgeGraphData {
  nodes: KnowledgeGraphNode[]
  links: KnowledgeGraphLink[]
}

interface KnowledgeBaseState {
  // Knowledge base list
  knowledgeBases: KnowledgeBase[]
  activeKnowledgeBaseId: string | null
  
  // Documents
  documents: Document[]
  activeDocumentId: string | null
  
  // Knowledge graph
  graphData: KnowledgeGraphData
  isGraphLoading: boolean
  graphError: string | null
  
  // View state
  currentView: 'dashboard' | 'detail' | 'graph'
  searchTerm: string
  selectedTags: string[]
  
  // Actions
  setKnowledgeBases: (bases: KnowledgeBase[]) => void
  setActiveKnowledgeBase: (id: string | null) => void
  setDocuments: (documents: Document[]) => void
  setActiveDocument: (id: string | null) => void
  setCurrentView: (view: 'dashboard' | 'detail' | 'graph') => void
  setSearchTerm: (term: string) => void
  setSelectedTags: (tags: string[]) => void
  
  // Graph actions
  setGraphData: (data: KnowledgeGraphData) => void
  setGraphLoading: (loading: boolean) => void
  setGraphError: (error: string | null) => void
  
  // Computed getters
  getActiveKnowledgeBase: () => KnowledgeBase | null
  getActiveDocument: () => Document | null
  getFilteredDocuments: () => Document[]
}

export const useKnowledgeBaseStore = create<KnowledgeBaseState>()(
  persist(
    (set, get) => ({
      knowledgeBases: [],
      activeKnowledgeBaseId: null,
      documents: [],
      activeDocumentId: null,
      graphData: { nodes: [], links: [] },
      isGraphLoading: false,
      graphError: null,
      currentView: 'dashboard',
      searchTerm: '',
      selectedTags: [],

      setKnowledgeBases: (bases: KnowledgeBase[]) => {
        set({ knowledgeBases: bases })
      },

      setActiveKnowledgeBase: (id: string | null) => {
        set({ 
          activeKnowledgeBaseId: id,
          documents: [], // Clear documents when switching knowledge base
          activeDocumentId: null
        })
      },

      setDocuments: (documents: Document[]) => {
        set({ documents })
      },

      setActiveDocument: (id: string | null) => {
        set({ activeDocumentId: id })
      },

      setCurrentView: (view: 'dashboard' | 'detail' | 'graph') => {
        set({ currentView: view })
      },

      setSearchTerm: (term: string) => {
        set({ searchTerm: term })
      },

      setSelectedTags: (tags: string[]) => {
        set({ selectedTags: tags })
      },

      setGraphData: (data: KnowledgeGraphData) => {
        set({ graphData: data })
      },

      setGraphLoading: (loading: boolean) => {
        set({ isGraphLoading: loading })
      },

      setGraphError: (error: string | null) => {
        set({ graphError: error })
      },

      getActiveKnowledgeBase: () => {
        const { knowledgeBases, activeKnowledgeBaseId } = get()
        return knowledgeBases.find(kb => kb.knowledgebase_id === activeKnowledgeBaseId) || null
      },

      getActiveDocument: () => {
        const { documents, activeDocumentId } = get()
        return documents.find(doc => doc.document_id === activeDocumentId) || null
      },

      getFilteredDocuments: () => {
        const { documents, searchTerm } = get()
        if (!searchTerm) return documents
        
        return documents.filter(doc => 
          doc.filename.toLowerCase().includes(searchTerm.toLowerCase())
        )
      }
    }),
    {
      name: 'knowledge-base-storage',
      partialize: (state) => ({
        activeKnowledgeBaseId: state.activeKnowledgeBaseId,
        activeDocumentId: state.activeDocumentId,
        currentView: state.currentView
      }),
    }
  )
)
