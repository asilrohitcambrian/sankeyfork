import { scaleOrdinal } from 'd3-scale';
import { schemeTableau10 } from 'd3-scale-chromatic';
import type { SankeyNode, SankeyLink } from 'd3-sankey';

export type FlowRow = { id: string; source: string; target: string; value: string };

/**
 * Map rows → { nodes, links }  **with a colour property added**
 */
export function rowsToSankey(rows: FlowRow[]) {
  /* ---------- 1.  build unique node list -------------------- */
  const nodeNames = Array.from(new Set(rows.flatMap(r => [r.source.trim(), r.target.trim()])))
    .filter(Boolean);

  /* ---------- 2.  assign a repeatable colour per node -------- */
  const colourScale = scaleOrdinal<string>()
    .domain(nodeNames)
    .range(schemeTableau10);         // 10 pleasantly-contrasting colours (loops if >10)

  const nodes: SankeyNode<{ name: string; colour: string }>[] = nodeNames.map(name => ({
    name,
    colour: colourScale(name),       // <— store colour on the node object
  }));

  const nameToIndex = Object.fromEntries(nodeNames.map((n, i) => [n, i]));

  /* ---------- 3.  create links -------------------------------- */
  const links: SankeyLink<
    { name: string; colour: string },
    { value: number; colour: string }
  >[] = rows
    .filter(r => r.source && r.target && r.value)
    .map(r => ({
      source: nameToIndex[r.source.trim()],
      target: nameToIndex[r.target.trim()],
      value : +r.value,
      colour: colourScale(r.source.trim()),   // link inherits colour of its *source* node
    }));

  return { nodes, links };
} 