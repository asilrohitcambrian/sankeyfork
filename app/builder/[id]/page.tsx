"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Plus, Trash2, Info, Save } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { FlowRow } from '@/lib/rowsToSankey'
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

export default function BuilderPage({ params }: { params: { id: string } }) {
  const diagramId = params.id
  const router = useRouter()
  const [flows, setFlows] = useState<FlowRow[]>([])
  const [diagramName, setDiagramName] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle")
  const [isLoading, setIsLoading] = useState(true)

  // Load existing diagram data
  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from('diagrams')
        .select('name, data_json')
        .eq('id', diagramId)
        .single()

      if (error) {
        console.error(error)
        setError('Failed to load diagram data')
        return
      }

      setDiagramName(data.name)
      setFlows(data.data_json.flows || [{
        id: crypto.randomUUID(),
        source: "",
        target: "",
        value: "",
      }])
      setIsLoading(false)
    })()
  }, [diagramId])

  const saveDiagram = async () => {
    setSaveStatus("saving")

    try {
      const { error } = await supabase
        .from('diagrams')
        .update({
          data_json: { flows },
          updated_at: new Date().toISOString()
        })
        .eq('id', diagramId)

      if (error) throw error

      setSaveStatus("saved")
      setTimeout(() => setSaveStatus("idle"), 2000)
    } catch (err) {
      console.error('Error saving diagram:', err)
      setError('Failed to save diagram')
      setSaveStatus("idle")
    }
  }

  const addFlow = () => {
    setFlows([
      ...flows,
      {
        id: crypto.randomUUID(),
        source: "",
        target: "",
        value: "",
      },
    ])
  }

  const removeFlow = (id: string) => {
    setFlows(flows.filter(flow => flow.id !== id))
  }

  const updateFlow = async (id: string, field: keyof FlowRow, value: string) => {
    const updatedFlows = flows.map(flow => (flow.id === id ? { ...flow, [field]: value } : flow))
    setFlows(updatedFlows)

    try {
      const { error } = await supabase
        .from('diagrams')
        .update({
          data_json: { flows: updatedFlows },
          updated_at: new Date().toISOString(),
        })
        .eq('id', diagramId)

      if (error) throw error
    } catch (err) {
      console.error('Error auto-saving diagram:', err)
      setError('Failed to auto-save changes')
    }
  }

  const rowsToColour = (name: string) => {
    const hash = name.split("").reduce((a, b) => {
      a = (a << 5) - a + b.charCodeAt(0)
      return a & a
    }, 0)
    return `hsl(${hash % 360}, 70%, 50%)`
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F4F5F7] flex items-center justify-center">
        <p className="text-[#42526E]">Loading diagram...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F4F5F7]">
      <header className="border-b bg-white">
        <div className="container mx-auto py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold text-[#172B4D]">Sankey Diagram Builder</h1>
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => router.push("/")}
                className="text-[#42526E] hover:text-[#172B4D]"
              >
                Back to Home
              </Button>
              <Button
                onClick={saveDiagram}
                className="bg-[#0052CC] hover:bg-[#0747A6] text-white"
                disabled={saveStatus === "saving"}
              >
                <Save className="mr-2 h-4 w-4" />
                {saveStatus === "saving" ? "Saving..." : saveStatus === "saved" ? "Saved!" : "Save Changes"}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-[#172B4D]">Build Your Diagram</h2>
          <p className="text-[#42526E]">Add flows between nodes to create your Sankey diagram</p>
        </div>

        <div className="space-y-6">
          {/* title with tooltip */}
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold text-[#172B4D]">Flow Data</h2>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger><Info className="h-4 w-4 text-[#6B778C]" /></TooltipTrigger>
                <TooltipContent className="bg-[#172B4D] text-white"><p className="max-w-xs">Enter source, target & value. Example: Solar → Electricity, 50</p></TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {/* error */}
          {error && <Alert variant="destructive" className="bg-[#FFEBE6] text-[#DE350B] border-[#FF8F73]"><AlertDescription>{error}</AlertDescription></Alert>}

          {/* column headers */}
          <div
            className="grid gap-4 font-medium text-[#42526E] sm:grid-cols-1"
            style={{ gridTemplateColumns: '20px 1fr 1fr 120px 40px' }}
          >
            <div /> <div>Source</div> <div>Target</div> <div>Value</div> <div />
          </div>

          {/* rows */}
          <div className="space-y-3">
            {flows.map(flow => (
              <div
                key={flow.id}
                className="grid gap-4 items-center sm:grid-cols-1"
                style={{ gridTemplateColumns: '20px 1fr 1fr 120px 40px' }}
              >
                <div className="h-3 w-3 rounded-sm border" style={{ background: rowsToColour(flow.source) }} />
                <Input
                  placeholder="Source"
                  value={flow.source}
                  onChange={e => updateFlow(flow.id, 'source', e.target.value)}
                />
                <Input
                  placeholder="Target"
                  value={flow.target}
                  onChange={e => updateFlow(flow.id, 'target', e.target.value)}
                />
                <Input
                  type="number"
                  min="0"
                  step="1"
                  placeholder="Value"
                  value={flow.value}
                  onChange={e => updateFlow(flow.id, 'value', e.target.value)}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeFlow(flow.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          {/* add row button */}
          <Button
            onClick={addFlow}
            className="gap-2 bg-[#0052CC] hover:bg-[#0747A6] text-white"
          >
            <Plus className="h-4 w-4" />
            Add Flow
          </Button>
        </div>
      </main>
    </div>
  )
} 