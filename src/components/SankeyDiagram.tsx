'use client';

import { useRef, useEffect } from 'react';
import { sankey as d3sankey, sankeyLinkHorizontal } from 'd3-sankey';
import * as d3 from 'd3';
import type { SankeyGraph, SankeyNode, SankeyLink } from 'd3-sankey';

interface Props {
  data: SankeyGraph<{ name: string; colour: string }, { value: number; colour: string }>;
  width?: number;
  height?: number;
}

export default function SankeyDiagram({ data, width = 700, height = 400 }: Props) {
  const ref = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    const svg = d3.select(ref.current);
    svg.selectAll('*').remove();

    const { nodes, links } = d3sankey<{ name: string; colour: string }, { value: number; colour: string }>()
      .nodeWidth(15)
      .nodePadding(10)
      .extent([[0, 0], [width, height]])(data);

    svg.append('g')
      .attr('fill', 'none')
      .attr('stroke-opacity', 0.45)
      .selectAll('path')
      .data(links)
      .join('path')
      .attr('d', sankeyLinkHorizontal())
      .attr('stroke', d => d.colour)
      .attr('stroke-width', d => Math.max(1, d.width!))
      .append('title')
      .text(d => {
        const source = d.source as SankeyNode<{ name: string; colour: string }, { value: number; colour: string }>;
        const target = d.target as SankeyNode<{ name: string; colour: string }, { value: number; colour: string }>;
        return `${source.name} → ${target.name}\n${d.value}`;
      });

    svg.append('g')
      .selectAll('rect')
      .data(nodes)
      .join('rect')
      .attr('x', d => d.x0!)
      .attr('y', d => d.y0!)
      .attr('height', d => d.y1! - d.y0!)
      .attr('width', d => d.x1! - d.x0!)
      .attr('fill', d => d.colour)
      .attr('stroke', '#000')
      .append('title')
      .text(d => `${d.name}\n${d.value}`);

    svg.append('g')
      .style('font', '10px sans-serif')
      .selectAll('text')
      .data(nodes)
      .join('text')
      .attr('x', d => (d.x0! < width / 2 ? d.x1! + 6 : d.x0! - 6))
      .attr('y', d => (d.y1! + d.y0!) / 2)
      .attr('dy', '0.35em')
      .attr('text-anchor', d => (d.x0! < width / 2 ? 'start' : 'end'))
      .text(d => d.name);
  }, [data, width, height]);

  return <svg ref={ref} width={width} height={height} />;
} 