import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useUserStore } from './user_info'
import { useKnowledgeBaseStore } from './knowledgebase_list'
import {
  generateKnowledgeGraph,
  getKnowledgeGraph,
  transformToD3Format,
  calculateGraphStats,
  filterGraphData,
  type KnowledgeGraphData,
  type DocumentNode,
  type GraphNode,
  type GraphLink
} from '../utils/knowledgeGraphApi'

export const useKnowledgeGraphStore = defineStore('knowledgeGraph', () => {
  // State
  const graphData = ref<KnowledgeGraphData>({ nodes: [], links: [] })
  const originalGraphData = ref<KnowledgeGraphData>({ nodes: [], links: [] })
  const isLoading = ref(false)
  const isGenerating = ref(false)
  const error = ref<string | null>(null)
  const searchTerm = ref('')
  const selectedTags = ref<string[]>([])
  const graphStats = ref<any>(null)

  // Computed
  const filteredGraphData = computed(() => {
    if (!searchTerm.value && selectedTags.value.length === 0) {
      return originalGraphData.value
    }
    return filterGraphData(originalGraphData.value, searchTerm.value, selectedTags.value)
  })

  const availableTags = computed(() => {
    return originalGraphData.value.nodes
      .filter(node => node.type === 'tag')
      .map(node => node.name)
      .sort()
  })

  const documentNodes = computed(() => {
    return filteredGraphData.value.nodes.filter(node => node.type === 'document')
  })

  const tagNodes = computed(() => {
    return filteredGraphData.value.nodes.filter(node => node.type === 'tag')
  })

  // Actions
  async function generateGraph(knowledgeBaseId?: string, level: 'document' | 'chunk' = 'document') {
    const userStore = useUserStore()
    const knowledgeBaseStore = useKnowledgeBaseStore()

    const userId = userStore.user?.id
    const targetKnowledgeBaseId = knowledgeBaseId || knowledgeBaseStore.activeKnowledgeBaseItem?.id

    if (!userId) {
      error.value = '用户未登录'
      return false
    }

    if (!targetKnowledgeBaseId) {
      error.value = '未指定知识库ID'
      return false
    }

    isGenerating.value = true
    error.value = null

    try {
      console.log('开始生成知识图谱:', { userId, targetKnowledgeBaseId, level })

      const response = await generateKnowledgeGraph(userId, targetKnowledgeBaseId, level)

      if (response.status === 'ok') {
        console.log('知识图谱生成成功:', response.message)
        // After generation, fetch the graph data
        await fetchGraph(targetKnowledgeBaseId, level)
        return true
      } else {
        throw new Error(response.message || '知识图谱生成失败')
      }
    } catch (err) {
      console.error('知识图谱生成失败:', err)
      error.value = err instanceof Error ? err.message : '知识图谱生成失败'
      return false
    } finally {
      isGenerating.value = false
    }
  }

  async function fetchGraph(knowledgeBaseId?: string, level: 'document' | 'chunk' = 'document') {
    const userStore = useUserStore()
    const knowledgeBaseStore = useKnowledgeBaseStore()

    const userId = userStore.user?.id
    const targetKnowledgeBaseId = knowledgeBaseId || knowledgeBaseStore.activeKnowledgeBaseItem?.id

    if (!userId) {
      error.value = '用户未登录'
      return false
    }

    if (!targetKnowledgeBaseId) {
      error.value = '未指定知识库ID'
      return false
    }

    isLoading.value = true
    error.value = null

    try {
      console.log('开始获取知识图谱:', { userId, targetKnowledgeBaseId, level })

      const response = await getKnowledgeGraph(userId, targetKnowledgeBaseId, level)

      if (response.status === 'ok' && response.data.documents) {
        const transformedData = transformToD3Format(response.data.documents)
        originalGraphData.value = transformedData
        graphData.value = transformedData
        graphStats.value = calculateGraphStats(transformedData)

        console.log('知识图谱获取成功:', {
          documents: response.data.documents.length,
          nodes: transformedData.nodes.length,
          links: transformedData.links.length
        })
        return true
      } else {
        throw new Error(response.message || '知识图谱获取失败')
      }
    } catch (err) {
      console.error('知识图谱获取失败:', err)
      error.value = err instanceof Error ? err.message : '知识图谱获取失败'
      
      // Use mock data for development
      console.warn('使用模拟知识图谱数据')
      const mockData = createMockGraphData()
      originalGraphData.value = mockData
      graphData.value = mockData
      graphStats.value = calculateGraphStats(mockData)
      return false
    } finally {
      isLoading.value = false
    }
  }

  function setSearchTerm(term: string) {
    searchTerm.value = term
    updateFilteredData()
  }

  function setSelectedTags(tags: string[]) {
    selectedTags.value = tags
    updateFilteredData()
  }

  function addSelectedTag(tag: string) {
    if (!selectedTags.value.includes(tag)) {
      selectedTags.value.push(tag)
      updateFilteredData()
    }
  }

  function removeSelectedTag(tag: string) {
    const index = selectedTags.value.indexOf(tag)
    if (index > -1) {
      selectedTags.value.splice(index, 1)
      updateFilteredData()
    }
  }

  function clearFilters() {
    searchTerm.value = ''
    selectedTags.value = []
    updateFilteredData()
  }

  function updateFilteredData() {
    graphData.value = filteredGraphData.value
  }

  function clearError() {
    error.value = null
  }

  function clearGraphData() {
    graphData.value = { nodes: [], links: [] }
    originalGraphData.value = { nodes: [], links: [] }
    graphStats.value = null
    searchTerm.value = ''
    selectedTags.value = []
    error.value = null
  }

  // Helper function to create mock data for development
  function createMockGraphData(): KnowledgeGraphData {
    const mockDocuments: DocumentNode[] = [
      {
        id: 'doc1',
        name: '金融基础知识.pdf',
        tags: ['金融', '基础知识', '投资', '理财']
      },
      {
        id: 'doc2',
        name: '股票投资指南.docx',
        tags: ['股票', '投资', '金融市场', '风险管理']
      },
      {
        id: 'doc3',
        name: '债券分析报告.pdf',
        tags: ['债券', '投资', '固定收益', '风险评估']
      },
      {
        id: 'doc4',
        name: '基金投资策略.pptx',
        tags: ['基金', '投资策略', '资产配置', '理财']
      }
    ]

    return transformToD3Format(mockDocuments)
  }

  return {
    // State
    graphData: computed(() => graphData.value),
    originalGraphData: computed(() => originalGraphData.value),
    isLoading: computed(() => isLoading.value),
    isGenerating: computed(() => isGenerating.value),
    error: computed(() => error.value),
    searchTerm: computed(() => searchTerm.value),
    selectedTags: computed(() => selectedTags.value),
    graphStats: computed(() => graphStats.value),

    // Computed
    filteredGraphData,
    availableTags,
    documentNodes,
    tagNodes,

    // Actions
    generateGraph,
    fetchGraph,
    setSearchTerm,
    setSelectedTags,
    addSelectedTag,
    removeSelectedTag,
    clearFilters,
    clearError,
    clearGraphData
  }
})
