import React, { useEffect, useRef } from 'react'
import { Card, Button, Spin, Alert } from 'antd'
import { ReloadOutlined, FullscreenOutlined } from '@ant-design/icons'
import * as d3 from 'd3'
import { KnowledgeGraphData, KnowledgeGraphNode, KnowledgeGraphLink } from '../../stores/knowledgeBaseStore'

interface KnowledgeGraphProps {
  data: KnowledgeGraphData
  loading?: boolean
  error?: string | null
  onReload?: () => void
  onNodeClick?: (node: KnowledgeGraphNode) => void
  className?: string
}

const KnowledgeGraph: React.FC<KnowledgeGraphProps> = ({
  data,
  loading = false,
  error = null,
  onReload,
  onNodeClick,
  className = ''
}) => {
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!svgRef.current || !data.nodes.length || loading) return

    const svg = d3.select(svgRef.current)
    const container = containerRef.current
    if (!container) return

    // Clear previous content
    svg.selectAll('*').remove()

    // Get container dimensions
    const rect = container.getBoundingClientRect()
    const width = rect.width
    const height = rect.height

    // Set up SVG
    svg.attr('width', width).attr('height', height)

    // Create zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        g.attr('transform', event.transform)
      })

    svg.call(zoom)

    // Create main group
    const g = svg.append('g')

    // Create simulation
    const simulation = d3.forceSimulation<KnowledgeGraphNode>(data.nodes)
      .force('link', d3.forceLink<KnowledgeGraphNode, KnowledgeGraphLink>(data.links)
        .id(d => d.id)
        .distance(100))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2))

    // Create links
    const link = g.append('g')
      .attr('class', 'links')
      .selectAll('line')
      .data(data.links)
      .enter().append('line')
      .attr('stroke', '#999')
      .attr('stroke-opacity', 0.6)
      .attr('stroke-width', d => Math.sqrt(d.weight || 1))

    // Create nodes
    const node = g.append('g')
      .attr('class', 'nodes')
      .selectAll('g')
      .data(data.nodes)
      .enter().append('g')
      .attr('class', 'node')
      .style('cursor', 'pointer')
      .call(d3.drag<SVGGElement, KnowledgeGraphNode>()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended))

    // Add circles to nodes
    node.append('circle')
      .attr('r', d => d.size || 8)
      .attr('fill', d => d.color || (d.type === 'document' ? '#1890ff' : '#52c41a'))
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)

    // Add labels to nodes
    node.append('text')
      .text(d => d.label)
      .attr('x', 12)
      .attr('y', 4)
      .style('font-size', '12px')
      .style('fill', '#333')

    // Add click handler
    node.on('click', (event, d) => {
      event.stopPropagation()
      onNodeClick?.(d)
    })

    // Update positions on simulation tick
    simulation.on('tick', () => {
      link
        .attr('x1', d => (d.source as any).x)
        .attr('y1', d => (d.source as any).y)
        .attr('x2', d => (d.target as any).x)
        .attr('y2', d => (d.target as any).y)

      node
        .attr('transform', d => `translate(${d.x},${d.y})`)
    })

    // Drag functions
    function dragstarted(event: any, d: KnowledgeGraphNode) {
      if (!event.active) simulation.alphaTarget(0.3).restart()
      d.fx = d.x
      d.fy = d.y
    }

    function dragged(event: any, d: KnowledgeGraphNode) {
      d.fx = event.x
      d.fy = event.y
    }

    function dragended(event: any, d: KnowledgeGraphNode) {
      if (!event.active) simulation.alphaTarget(0)
      d.fx = null
      d.fy = null
    }

    // Cleanup
    return () => {
      simulation.stop()
    }
  }, [data, loading, onNodeClick])

  if (error) {
    return (
      <Alert
        message="加载知识图谱失败"
        description={error}
        type="error"
        action={
          <Button size="small" onClick={onReload}>
            重试
          </Button>
        }
      />
    )
  }

  return (
    <Card
      className={className}
      title="知识图谱"
      extra={
        <div className="flex gap-2">
          <Button
            icon={<ReloadOutlined />}
            onClick={onReload}
            loading={loading}
            size="small"
          >
            刷新
          </Button>
          <Button
            icon={<FullscreenOutlined />}
            size="small"
            onClick={() => {
              // Fullscreen functionality could be implemented here
            }}
          >
            全屏
          </Button>
        </div>
      }
    >
      <div
        ref={containerRef}
        className="relative w-full h-96 border border-gray-200 rounded"
      >
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 z-10">
            <Spin size="large" />
          </div>
        )}
        
        <svg
          ref={svgRef}
          className="w-full h-full"
          style={{ background: '#fafafa' }}
        />
        
        {!loading && data.nodes.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center text-gray-500">
            暂无图谱数据
          </div>
        )}
      </div>
      
      {/* Legend */}
      <div className="mt-4 flex items-center gap-4 text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-500"></div>
          <span>文档</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
          <span>标签</span>
        </div>
      </div>
    </Card>
  )
}

export default KnowledgeGraph
