import { scaleOrdinal } from 'd3-scale'
import { schemeTableau10 } from 'd3-scale-chromatic'

export interface FlowRow {
  id: string
  source: string
  target: string
  value: string
}

export function rowsToSankey(flows: FlowRow[]) {
  const nodeNames = Array.from(new Set(flows.flatMap(f => [f.source, f.target])))
  const colourScale = scaleOrdinal<string>()
    .domain(nodeNames)
    .range(schemeTableau10)

  const nodes = nodeNames.map(name => ({
    name,
    colour: colourScale(name)
  }))

  const links = flows.map(flow => ({
    source: nodes.findIndex(n => n.name === flow.source),
    target: nodes.findIndex(n => n.name === flow.target),
    value: Number(flow.value),
    colour: colourScale(flow.source)
  }))

  return { nodes, links }
} 