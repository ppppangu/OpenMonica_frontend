<template>
  <div class="knowledge-graph-container">
    <!-- Controls -->
    <div class="graph-controls">
      <div class="control-group">
        <a-input-search
          v-model:value="searchTerm"
          placeholder="搜索文档或标签..."
          style="width: 300px"
          @search="handleSearch"
          @change="handleSearchChange"
        />
      </div>
      
      <div class="control-group">
        <a-select
          v-model:value="selectedTags"
          mode="multiple"
          placeholder="选择标签过滤"
          style="width: 300px"
          :options="tagOptions"
          @change="handleTagFilter"
        />
      </div>

      <div class="control-group">
        <a-button @click="clearFilters" :disabled="!hasFilters">
          清除过滤
        </a-button>
        <a-button @click="resetZoom" type="primary">
          重置视图
        </a-button>
      </div>
    </div>

    <!-- Graph Stats -->
    <div class="graph-stats" v-if="graphStats">
      <a-row :gutter="16">
        <a-col :span="6">
          <a-statistic title="文档数量" :value="graphStats.totalDocuments" />
        </a-col>
        <a-col :span="6">
          <a-statistic title="标签数量" :value="graphStats.totalTags" />
        </a-col>
        <a-col :span="6">
          <a-statistic title="连接数量" :value="graphStats.totalConnections" />
        </a-col>
        <a-col :span="6">
          <a-statistic 
            title="平均标签/文档" 
            :value="graphStats.averageTagsPerDocument" 
            :precision="1"
          />
        </a-col>
      </a-row>
    </div>

    <!-- Graph Container -->
    <div class="graph-wrapper">
      <div ref="graphContainer" class="graph-svg-container"></div>
      
      <!-- Loading Overlay -->
      <div v-if="isLoading" class="graph-loading">
        <a-spin size="large" />
        <p>加载知识图谱中...</p>
      </div>

      <!-- Empty State -->
      <div v-if="!isLoading && (!graphData.nodes || graphData.nodes.length === 0)" class="graph-empty">
        <a-empty description="暂无图谱数据">
          <a-button type="primary" @click="generateGraph">
            生成知识图谱
          </a-button>
        </a-empty>
      </div>
    </div>

    <!-- Node Details Modal -->
    <a-modal
      v-model:open="showNodeDetails"
      :title="selectedNode?.name"
      :footer="null"
      width="600px"
    >
      <div v-if="selectedNode">
        <a-descriptions :column="1" bordered>
          <a-descriptions-item label="类型">
            <a-tag :color="selectedNode.type === 'document' ? 'purple' : 'green'">
              {{ selectedNode.type === 'document' ? '文档' : '标签' }}
            </a-tag>
          </a-descriptions-item>
          <a-descriptions-item label="名称">
            {{ selectedNode.name }}
          </a-descriptions-item>
          <a-descriptions-item label="连接数量">
            {{ getNodeConnections(selectedNode.id) }}
          </a-descriptions-item>
        </a-descriptions>

        <div v-if="selectedNode.type === 'document'" class="mt-4">
          <h4>相关标签</h4>
          <div class="tag-list">
            <a-tag 
              v-for="tag in getDocumentTags(selectedNode.id)" 
              :key="tag"
              color="green"
              @click="filterByTag(tag)"
              style="cursor: pointer; margin: 4px;"
            >
              {{ tag }}
            </a-tag>
          </div>
        </div>

        <div v-if="selectedNode.type === 'tag'" class="mt-4">
          <h4>相关文档</h4>
          <a-list size="small">
            <a-list-item 
              v-for="doc in getTagDocuments(selectedNode.id)" 
              :key="doc"
            >
              {{ doc }}
            </a-list-item>
          </a-list>
        </div>
      </div>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'
import * as d3 from 'd3'
import { useKnowledgeGraphStore } from '../store/knowledge_graph'
import type { GraphNode, GraphLink } from '../utils/knowledgeGraphApi'

defineOptions({ name: 'KnowledgeGraphVisualization' })

// Props
interface Props {
  knowledgeBaseId?: string
  height?: number
  width?: number
}

const props = withDefaults(defineProps<Props>(), {
  height: 600,
  width: 800
})

// Store
const graphStore = useKnowledgeGraphStore()

// Refs
const graphContainer = ref<HTMLDivElement>()
const searchTerm = ref('')
const selectedTags = ref<string[]>([])
const showNodeDetails = ref(false)
const selectedNode = ref<GraphNode | null>(null)

// D3 refs
let svg: d3.Selection<SVGSVGElement, unknown, null, undefined>
let simulation: d3.Simulation<GraphNode, GraphLink>
let linkElements: d3.Selection<SVGLineElement, GraphLink, SVGGElement, unknown>
let nodeElements: d3.Selection<SVGCircleElement, GraphNode, SVGGElement, unknown>
let labelElements: d3.Selection<SVGTextElement, GraphNode, SVGGElement, unknown>

// Computed
const graphData = computed(() => graphStore.graphData)
const isLoading = computed(() => graphStore.isLoading)
const graphStats = computed(() => graphStore.graphStats)
const availableTags = computed(() => graphStore.availableTags)

const tagOptions = computed(() => 
  availableTags.value.map(tag => ({ label: tag, value: tag }))
)

const hasFilters = computed(() => 
  searchTerm.value.length > 0 || selectedTags.value.length > 0
)

// Methods
function initializeGraph() {
  if (!graphContainer.value) return

  // Clear existing SVG
  d3.select(graphContainer.value).selectAll('*').remove()

  // Create SVG
  svg = d3.select(graphContainer.value)
    .append('svg')
    .attr('width', props.width)
    .attr('height', props.height)
    .style('border', '1px solid #e8e8e8')
    .style('border-radius', '8px')

  // Add zoom behavior
  const zoom = d3.zoom<SVGSVGElement, unknown>()
    .scaleExtent([0.1, 4])
    .on('zoom', (event) => {
      svg.selectAll('g').attr('transform', event.transform)
    })

  svg.call(zoom)

  // Create groups for different elements
  svg.append('g').attr('class', 'links')
  svg.append('g').attr('class', 'nodes')
  svg.append('g').attr('class', 'labels')

  // Initialize simulation
  simulation = d3.forceSimulation<GraphNode>()
    .force('link', d3.forceLink<GraphNode, GraphLink>().id(d => d.id).distance(100))
    .force('charge', d3.forceManyBody().strength(-300))
    .force('center', d3.forceCenter(props.width / 2, props.height / 2))
    .force('collision', d3.forceCollide().radius(30))
}

function updateGraph() {
  if (!svg || !simulation) return

  const data = graphData.value
  if (!data.nodes || data.nodes.length === 0) return

  // Update links
  linkElements = svg.select('.links')
    .selectAll('line')
    .data(data.links)
    .join('line')
    .attr('stroke', '#d1d5db')
    .attr('stroke-width', 2)
    .attr('stroke-opacity', 0.6)

  // Update nodes
  nodeElements = svg.select('.nodes')
    .selectAll('circle')
    .data(data.nodes)
    .join('circle')
    .attr('r', d => d.size || (d.type === 'document' ? 20 : 15))
    .attr('fill', d => d.color || (d.type === 'document' ? '#8b5cf6' : '#10b981'))
    .attr('stroke', d => d.type === 'document' ? '#6d28d9' : '#059669')
    .attr('stroke-width', d => d.type === 'document' ? 2 : 1.5)
    .style('cursor', 'pointer')
    .on('click', (event, d) => {
      selectedNode.value = d
      showNodeDetails.value = true
    })
    .on('mouseover', function(event, d) {
      d3.select(this).attr('stroke-width', 4)
      // Highlight connected nodes and links
      highlightConnected(d.id, true)
    })
    .on('mouseout', function(event, d) {
      d3.select(this).attr('stroke-width', d.type === 'document' ? 2 : 1.5)
      // Remove highlight
      highlightConnected(d.id, false)
    })

  // Update labels
  labelElements = svg.select('.labels')
    .selectAll('text')
    .data(data.nodes)
    .join('text')
    .text(d => d.name.length > 15 ? d.name.substring(0, 15) + '...' : d.name)
    .attr('font-size', '12px')
    .attr('font-family', 'Arial, sans-serif')
    .attr('fill', '#374151')
    .attr('text-anchor', 'middle')
    .attr('dy', '0.35em')
    .style('pointer-events', 'none')

  // Update simulation
  simulation.nodes(data.nodes)
  simulation.force<d3.ForceLink<GraphNode, GraphLink>>('link')?.links(data.links)
  simulation.alpha(1).restart()

  // Update positions on tick
  simulation.on('tick', () => {
    linkElements
      .attr('x1', d => (d.source as GraphNode).x!)
      .attr('y1', d => (d.source as GraphNode).y!)
      .attr('x2', d => (d.target as GraphNode).x!)
      .attr('y2', d => (d.target as GraphNode).y!)

    nodeElements
      .attr('cx', d => d.x!)
      .attr('cy', d => d.y!)

    labelElements
      .attr('x', d => d.x!)
      .attr('y', d => d.y! + (d.size || 20) + 15)
  })
}

function highlightConnected(nodeId: string, highlight: boolean) {
  const connectedNodes = new Set<string>()
  const connectedLinks = new Set<string>()

  // Find connected nodes and links
  graphData.value.links.forEach(link => {
    const sourceId = typeof link.source === 'string' ? link.source : link.source.id
    const targetId = typeof link.target === 'string' ? link.target : link.target.id

    if (sourceId === nodeId || targetId === nodeId) {
      connectedNodes.add(sourceId)
      connectedNodes.add(targetId)
      connectedLinks.add(`${sourceId}-${targetId}`)
    }
  })

  // Apply highlight styles
  if (highlight) {
    nodeElements
      .style('opacity', d => connectedNodes.has(d.id) ? 1 : 0.3)
    
    linkElements
      .style('opacity', d => {
        const sourceId = typeof d.source === 'string' ? d.source : d.source.id
        const targetId = typeof d.target === 'string' ? d.target : d.target.id
        return connectedLinks.has(`${sourceId}-${targetId}`) ? 1 : 0.1
      })
  } else {
    nodeElements.style('opacity', 1)
    linkElements.style('opacity', 0.6)
  }
}

function resetZoom() {
  if (!svg) return
  
  svg.transition()
    .duration(750)
    .call(
      d3.zoom<SVGSVGElement, unknown>().transform,
      d3.zoomIdentity
    )
}

function handleSearch() {
  graphStore.setSearchTerm(searchTerm.value)
}

function handleSearchChange() {
  graphStore.setSearchTerm(searchTerm.value)
}

function handleTagFilter() {
  graphStore.setSelectedTags(selectedTags.value)
}

function clearFilters() {
  searchTerm.value = ''
  selectedTags.value = []
  graphStore.clearFilters()
}

function filterByTag(tag: string) {
  if (!selectedTags.value.includes(tag)) {
    selectedTags.value.push(tag)
    handleTagFilter()
  }
  showNodeDetails.value = false
}

function getNodeConnections(nodeId: string): number {
  return graphData.value.links.filter(link => {
    const sourceId = typeof link.source === 'string' ? link.source : link.source.id
    const targetId = typeof link.target === 'string' ? link.target : link.target.id
    return sourceId === nodeId || targetId === nodeId
  }).length
}

function getDocumentTags(documentId: string): string[] {
  return graphData.value.links
    .filter(link => {
      const sourceId = typeof link.source === 'string' ? link.source : link.source.id
      return sourceId === documentId
    })
    .map(link => {
      const targetId = typeof link.target === 'string' ? link.target : link.target.id
      return targetId
    })
}

function getTagDocuments(tagId: string): string[] {
  return graphData.value.links
    .filter(link => {
      const targetId = typeof link.target === 'string' ? link.target : link.target.id
      return targetId === tagId
    })
    .map(link => {
      const sourceId = typeof link.source === 'string' ? link.source : link.source.id
      const node = graphData.value.nodes.find(n => n.id === sourceId)
      return node?.name || sourceId
    })
}

async function generateGraph() {
  await graphStore.generateGraph(props.knowledgeBaseId)
}

// Lifecycle
onMounted(() => {
  initializeGraph()
  
  // Fetch graph data if knowledge base is specified
  if (props.knowledgeBaseId) {
    graphStore.fetchGraph(props.knowledgeBaseId)
  }
})

onUnmounted(() => {
  if (simulation) {
    simulation.stop()
  }
})

// Watch for data changes
watch(graphData, () => {
  updateGraph()
}, { deep: true })

// Watch for search and filter changes
watch([searchTerm, selectedTags], () => {
  // Sync with store
  graphStore.setSearchTerm(searchTerm.value)
  graphStore.setSelectedTags(selectedTags.value)
})
</script>

<style scoped>
.knowledge-graph-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.graph-controls {
  display: flex;
  gap: 16px;
  align-items: center;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
  flex-wrap: wrap;
}

.control-group {
  display: flex;
  gap: 8px;
  align-items: center;
}

.graph-stats {
  padding: 16px;
  background: white;
  border-radius: 8px;
  border: 1px solid #e8e8e8;
}

.graph-wrapper {
  position: relative;
  flex: 1;
  min-height: 400px;
  background: white;
  border-radius: 8px;
  overflow: hidden;
}

.graph-svg-container {
  width: 100%;
  height: 100%;
}

.graph-loading {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.9);
  z-index: 10;
}

.graph-empty {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.tag-list {
  margin-top: 8px;
}

.mt-4 {
  margin-top: 16px;
}
</style>
