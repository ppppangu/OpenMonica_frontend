// Knowledge graph API service
import { authenticatedFormPost } from './api'

export interface DocumentNode {
  id: string
  name: string
  tags: string[]
}

export interface GraphNode {
  id: string
  name: string
  type: 'document' | 'tag'
  group?: number
  size?: number
  color?: string
}

export interface GraphLink {
  source: string
  target: string
  value?: number
}

export interface KnowledgeGraphData {
  nodes: GraphNode[]
  links: GraphLink[]
}

export interface GraphGenerateResponse {
  status: string
  message: string
  data: {
    status: string
    message: string
  }
}

export interface GraphGetResponse {
  status: string
  message: string
  data: {
    status: string
    documents: DocumentNode[]
  }
}

/**
 * Generate knowledge graph for a knowledge base
 */
export async function generateKnowledgeGraph(
  userId: string,
  knowledgeBaseId: string,
  level: 'document' | 'chunk' = 'document'
): Promise<GraphGenerateResponse> {
  const response = await authenticatedFormPost('/user/knowledgebase/generate_graph', {
    user_id: userId,
    knowledge_base_id: knowledgeBaseId,
    level
  })

  if (!response.ok) {
    throw new Error(`Graph generation failed: ${response.status} ${response.statusText}`)
  }

  return await response.json()
}

/**
 * Get knowledge graph data for a knowledge base
 */
export async function getKnowledgeGraph(
  userId: string,
  knowledgeBaseId: string,
  level: 'document' | 'chunk' = 'document'
): Promise<GraphGetResponse> {
  const response = await authenticatedFormPost('/user/knowledgebase/get_graph', {
    user_id: userId,
    knowledge_base_id: knowledgeBaseId,
    level
  })

  if (!response.ok) {
    throw new Error(`Graph retrieval failed: ${response.status} ${response.statusText}`)
  }

  return await response.json()
}

/**
 * Transform backend graph data to D3.js format
 */
export function transformToD3Format(documents: DocumentNode[]): KnowledgeGraphData {
  const nodes: GraphNode[] = []
  const links: GraphLink[] = []
  const tagMap = new Map<string, number>()

  // Create document nodes
  documents.forEach(doc => {
    nodes.push({
      id: doc.id,
      name: doc.name,
      type: 'document',
      group: 1,
      size: 20,
      color: '#8b5cf6' // Purple for documents
    })

    // Process tags for this document
    doc.tags.forEach(tag => {
      // Create tag node if it doesn't exist
      if (!tagMap.has(tag)) {
        tagMap.set(tag, nodes.length)
        nodes.push({
          id: tag,
          name: tag,
          type: 'tag',
          group: 2,
          size: 15,
          color: '#10b981' // Green for tags
        })
      }

      // Create link between document and tag
      links.push({
        source: doc.id,
        target: tag,
        value: 1
      })
    })
  })

  return { nodes, links }
}

/**
 * Get graph configuration from config
 */
export async function getGraphConfig() {
  try {
    // In a real implementation, this would fetch from the backend
    // For now, return default configuration
    return {
      nodes: {
        document: {
          color: '#8b5cf6',
          size: 20,
          stroke_color: '#6d28d9',
          stroke_width: 2
        },
        tag: {
          color: '#10b981',
          size: 15,
          stroke_color: '#059669',
          stroke_width: 1.5
        }
      },
      links: {
        color: '#d1d5db',
        width: 2,
        opacity: 0.6
      },
      layout: {
        force_strength: -300,
        link_distance: 100,
        center_force: 0.1
      },
      interaction: {
        hover_opacity: 0.8,
        selected_opacity: 1.0,
        unselected_opacity: 0.3
      }
    }
  } catch (error) {
    console.warn('Failed to fetch graph config, using defaults')
    return {
      nodes: {
        document: {
          color: '#8b5cf6',
          size: 20,
          stroke_color: '#6d28d9',
          stroke_width: 2
        },
        tag: {
          color: '#10b981',
          size: 15,
          stroke_color: '#059669',
          stroke_width: 1.5
        }
      },
      links: {
        color: '#d1d5db',
        width: 2,
        opacity: 0.6
      },
      layout: {
        force_strength: -300,
        link_distance: 100,
        center_force: 0.1
      },
      interaction: {
        hover_opacity: 0.8,
        selected_opacity: 1.0,
        unselected_opacity: 0.3
      }
    }
  }
}

/**
 * Calculate graph statistics
 */
export function calculateGraphStats(data: KnowledgeGraphData) {
  const documentNodes = data.nodes.filter(n => n.type === 'document')
  const tagNodes = data.nodes.filter(n => n.type === 'tag')
  
  // Calculate tag frequency
  const tagFrequency = new Map<string, number>()
  data.links.forEach(link => {
    const target = link.target as string
    const targetNode = data.nodes.find(n => n.id === target)
    if (targetNode && targetNode.type === 'tag') {
      tagFrequency.set(target, (tagFrequency.get(target) || 0) + 1)
    }
  })

  // Find most connected tags
  const sortedTags = Array.from(tagFrequency.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)

  return {
    totalDocuments: documentNodes.length,
    totalTags: tagNodes.length,
    totalConnections: data.links.length,
    averageTagsPerDocument: data.links.length / documentNodes.length,
    mostConnectedTags: sortedTags.map(([tag, count]) => ({ tag, count }))
  }
}

/**
 * Filter graph data based on search criteria
 */
export function filterGraphData(
  data: KnowledgeGraphData,
  searchTerm: string,
  selectedTags: string[] = []
): KnowledgeGraphData {
  if (!searchTerm && selectedTags.length === 0) {
    return data
  }

  const filteredNodes = new Set<string>()
  const filteredLinks: GraphLink[] = []

  // Filter by search term
  if (searchTerm) {
    const term = searchTerm.toLowerCase()
    data.nodes.forEach(node => {
      if (node.name.toLowerCase().includes(term)) {
        filteredNodes.add(node.id)
      }
    })
  }

  // Filter by selected tags
  if (selectedTags.length > 0) {
    selectedTags.forEach(tag => {
      filteredNodes.add(tag)
      // Add all documents connected to this tag
      data.links.forEach(link => {
        if (link.target === tag) {
          filteredNodes.add(link.source as string)
        }
      })
    })
  }

  // If no search term, include all nodes
  if (!searchTerm && selectedTags.length === 0) {
    data.nodes.forEach(node => filteredNodes.add(node.id))
  }

  // Add connected nodes and links
  data.links.forEach(link => {
    const source = link.source as string
    const target = link.target as string
    
    if (filteredNodes.has(source) || filteredNodes.has(target)) {
      filteredNodes.add(source)
      filteredNodes.add(target)
      filteredLinks.push(link)
    }
  })

  return {
    nodes: data.nodes.filter(node => filteredNodes.has(node.id)),
    links: filteredLinks
  }
}
