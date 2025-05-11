"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useRouter } from "next/navigation"

interface Flow {
  id: string
  source: string
  target: string
  value: string
}

export default function ViewPage({ diagramId }: { diagramId?: string }) {
  const router = useRouter()
  const [flows, setFlows] = useState<Flow[]>([])
  const [error, setError] = useState<string | null>(null)

  // Load diagram data
  useEffect(() => {
    if (!diagramId) {
      setError("No diagram ID provided")
      return
    }

    const stored = localStorage.getItem(`sankeyDiagram_${diagramId}`)
    if (!stored) {
      setError("Diagram not found")
      return
    }

    try {
      const { flows } = JSON.parse(stored)
      setFlows(flows)
    } catch (err) {
      setError("Failed to load diagram data")
      console.error(err)
    }
  }, [diagramId])

  const rowsToColour = (name: string) => {
    const hash = name.split("").reduce((a, b) => {
      a = (a << 5) - a + b.charCodeAt(0)
      return a & a
    }, 0)
    return `hsl(${hash % 360}, 70%, 50%)`
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#F4F5F7] flex items-center justify-center">
        <div className="max-w-md w-full p-6">
          <Alert variant="destructive" className="bg-[#FFEBE6] text-[#DE350B] border-[#FF8F73]">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button
            onClick={() => router.push("/")}
            className="mt-4 w-full bg-[#0052CC] hover:bg-[#0747A6] text-white"
          >
            Return to Home
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F4F5F7]">
      <header className="border-b bg-white">
        <div className="container mx-auto py-4">
          <h1 className="text-xl font-semibold text-[#172B4D]">Sankey Diagram Viewer</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-[#172B4D]">View Diagram</h2>
          <p className="text-[#42526E]">View your Sankey diagram flows</p>
        </div>

        <div className="space-y-6">
          {/* column headers */}
          <div
            className="grid gap-4 font-medium text-[#42526E] sm:grid-cols-1"
            style={{ gridTemplateColumns: '20px 1fr 1fr 120px' }}
          >
            <div /> <div>Source</div> <div>Target</div> <div>Value</div>
          </div>

          {/* rows */}
          <div className="space-y-3">
            {flows.map(flow => (
              <div
                key={flow.id}
                className="grid gap-4 items-center sm:grid-cols-1 bg-white p-4 rounded-lg border border-[#DFE1E6]"
                style={{ gridTemplateColumns: '20px 1fr 1fr 120px' }}
              >
                <div className="h-3 w-3 rounded-sm border" style={{ background: rowsToColour(flow.source) }} />
                <div className="text-[#172B4D]">{flow.source}</div>
                <div className="text-[#172B4D]">{flow.target}</div>
                <div className="text-[#172B4D]">{flow.value}</div>
              </div>
            ))}
          </div>

          <Button
            onClick={() => router.push(`/builder/${diagramId}`)}
            className="bg-[#0052CC] hover:bg-[#0747A6] text-white"
          >
            Edit Diagram
          </Button>
        </div>
      </main>
    </div>
  )
} 