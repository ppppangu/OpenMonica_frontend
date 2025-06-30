import { useEffect, useRef } from 'react'
import * as d3 from 'd3'
import { useKnowledgeBaseStoreV2 } from '../../stores/knowledgeBaseStoreV2'
import { Spin, Empty } from 'antd'
import { useAuthStore } from '../../stores/authStore'

export function KBGraphView() {
  const svgRef = useRef<SVGSVGElement | null>(null)
  const userId = useAuthStore(state => state.user?.id) || ''
  const { currentKB, graph, fetchGraph } = useKnowledgeBaseStoreV2()

  useEffect(() => {
    if (currentKB) {
      fetchGraph(userId, currentKB.id)
    }
  }, [currentKB?.id])

  // Render graph when data ready
  useEffect(() => {
    if (!graph || !svgRef.current) return

    const width = svgRef.current.clientWidth || 600
    const height = 600
    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    interface NodeDatum {
      id: string
      type: 'doc' | 'tag'
      name: string
    }

    interface LinkDatum {
      source: string
      target: string
    }

    const nodes: NodeDatum[] = []
    const links: LinkDatum[] = []

    const tagSet = new Set<string>()

    graph.documents.forEach(doc => {
      nodes.push({ id: `doc-${doc.id}`, type: 'doc', name: doc.name })
      doc.tags.forEach(tag => {
        if (!tagSet.has(tag)) {
          tagSet.add(tag)
          nodes.push({ id: `tag-${tag}`, type: 'tag', name: tag })
        }
        links.push({ source: `doc-${doc.id}`, target: `tag-${tag}` })
      })
    })

    const simulation = d3.forceSimulation(nodes as any)
      .force('link', d3.forceLink(links as any).id((d: any) => d.id).distance(120))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2))

    const link = svg.append('g')
      .attr('stroke', '#C2C8D6')
      .attr('stroke-width', 1.2)
      .selectAll('line')
      .data(links)
      .enter()
      .append('line')

    const nodeGroup = svg.append('g')
      .selectAll('g')
      .data(nodes)
      .enter()
      .append('g')
      .call(d3.drag<SVGGElement, NodeDatum>()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended))

    nodeGroup.append('circle')
      .attr('r', 18)
      .attr('fill', d => d.type === 'doc' ? 'rgba(22,100,255,0.2)' : 'rgba(20,182,91,0.2)')
      .attr('stroke', d => d.type === 'doc' ? '#1664FF' : '#14B65B')

    nodeGroup.append('text')
      .text(d => d.name.length > 10 ? d.name.slice(0, 10) + '…' : d.name)
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'central')
      .attr('font-size', 10)
      .attr('pointer-events', 'none')

    simulation.on('tick', () => {
      link.attr('x1', (d: any) => (d.source as any).x)
        .attr('y1', (d: any) => (d.source as any).y)
        .attr('x2', (d: any) => (d.target as any).x)
        .attr('y2', (d: any) => (d.target as any).y)

      nodeGroup.attr('transform', d => `translate(${(d as any).x},${(d as any).y})`)
    })

    function dragstarted(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart()
      d.fx = d.x
      d.fy = d.y
    }

    function dragged(event: any, d: any) {
      d.fx = event.x
      d.fy = event.y
    }

    function dragended(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0)
      d.fx = null
      d.fy = null
    }

    return () => {
      simulation.stop()
    }
  }, [graph])

  if (!currentKB) return null
  if (!graph) return <Spin />
  if (graph.documents.length === 0) return <Empty description="暂无图谱数据" />

  return <svg ref={svgRef} className="w-full" style={{ height: 600 }} />
} 