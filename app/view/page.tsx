"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useRouter } from "next/navigation"
import { SankeyDiagram } from "@/components/sankey-diagram"
import { rowsToSankey } from "@/lib/rowsToSankey"
import { supabase } from "@/lib/supabase"

export default function ViewPage() {
  const router = useRouter()
  const [diagramData, setDiagramData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from('diagrams')
        .select('data_json')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (error) {
        console.error(error)
        setError('Failed to load diagram data')
        return
      }

      const graph = rowsToSankey(data.data_json.flows)
      setDiagramData(graph)
      setIsLoading(false)
    })()
  }, [])

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
            <h1 className="text-xl font-semibold text-[#172B4D]">Sankey Diagram Viewer</h1>
            <Button
              variant="ghost"
              onClick={() => router.push("/")}
              className="text-[#42526E] hover:text-[#172B4D]"
            >
              Back to Home
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {error && (
          <Alert variant="destructive" className="mb-6 bg-[#FFEBE6] text-[#DE350B] border-[#FF8F73]">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {diagramData ? (
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <SankeyDiagram data={diagramData} />
          </div>
        ) : (
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold text-[#172B4D] mb-2">No diagram data found</h2>
            <p className="text-[#42526E]">Create a new diagram to get started.</p>
          </div>
        )}
      </main>
    </div>
  )
} 