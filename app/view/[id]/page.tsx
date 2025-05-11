'use client'

import { useEffect, useState } from 'react'
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useRouter } from 'next/navigation'
import { SankeyDiagram } from '@/components/sankey-diagram'
import { rowsToSankey } from '@/lib/rowsToSankey'
import { FlowRow } from '@/lib/rowsToSankey'

export default function ViewPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [diagramData, setDiagramData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!params.id) {
      setError("No diagram ID provided")
      return
    }

    const raw = localStorage.getItem(`sankeyDiagram_${params.id}`)
    if (!raw) {
      setError("Diagram not found")
      return
    }

    try {
      const { flows } = JSON.parse(raw) as { flows: FlowRow[] }
      setDiagramData(rowsToSankey(flows))
    } catch (err) {
      setError("Failed to load diagram data")
      console.error(err)
    }
  }, [params.id])

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

  if (!diagramData) {
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
            <Button
              variant="ghost"
              onClick={() => router.push("/")}
              className="text-[#42526E] hover:text-[#172B4D]"
            >
              Back to Home
            </Button>
            <h1 className="text-xl font-semibold text-[#172B4D]">Sankey Diagram Viewer</h1>
            <Button
              variant="ghost"
              onClick={() => router.push(`/builder/${params.id}`)}
              className="text-[#42526E] hover:text-[#172B4D]"
            >
              Edit Diagram
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg border border-[#DFE1E6] p-6">
          <SankeyDiagram data={diagramData} />
        </div>
      </main>
    </div>
  )
} 