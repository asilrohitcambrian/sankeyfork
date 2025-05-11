"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, Edit, Eye, Trash2, MoreHorizontal, MoreVertical, Pencil } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { FlowRow } from '@/lib/rowsToSankey'
import { supabase } from "@/lib/supabase"

// Type for diagram metadata
interface DiagramMetadata {
  id: string
  name: string
  created_at: string
  updated_at: string
}

// Type for diagram data
interface DiagramData {
  flows: FlowRow[]
}

export default function HomePage() {
  const router = useRouter()
  const [diagrams, setDiagrams] = useState<DiagramMetadata[]>([])
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [newDiagramName, setNewDiagramName] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Load diagrams from Supabase
  useEffect(() => {
    loadDiagrams()
  }, [])

  const loadDiagrams = async () => {
    try {
      const { data, error } = await supabase
        .from('diagrams')
        .select('id, name, created_at, updated_at')
        .order('created_at', { ascending: false })

      if (error) throw error
      setDiagrams(data || [])
    } catch (err) {
      console.error('Error loading diagrams:', err)
      setError('Failed to load diagrams')
    } finally {
      setIsLoading(false)
    }
  }

  const createDiagram = async () => {
    if (!newDiagramName.trim()) {
      setError("Please enter a diagram name")
      return
    }

    try {
      const { data, error } = await supabase
        .from('diagrams')
        .insert({
          name: newDiagramName.trim(),
          data_json: { flows: [{ id: crypto.randomUUID(), source: '', target: '', value: '' }] },
        })
        .select('id')
        .single()

      if (error) {
        setError(error.message)
        return
      }

      setNewDiagramName("")
      setIsCreating(false)
      router.push(`/builder/${data.id}`)
    } catch (err) {
      console.error('Error creating diagram:', err)
      setError('Failed to create diagram')
    }
  }

  const deleteDiagram = async (id: string) => {
    try {
      // Delete flows first due to foreign key constraint
      const { error: flowsError } = await supabase
        .from('diagram_flows')
        .delete()
        .eq('diagram_id', id)

      if (flowsError) throw flowsError

      // Then delete the diagram
      const { error } = await supabase
        .from('diagrams')
        .delete()
        .eq('id', id)

      if (error) throw error

      setDiagrams(diagrams.filter(d => d.id !== id))
    } catch (err) {
      console.error('Error deleting diagram:', err)
      setError('Failed to delete diagram')
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F4F5F7] flex items-center justify-center">
        <p className="text-[#42526E]">Loading diagrams...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F4F5F7]">
      <header className="border-b bg-white">
        <div className="container mx-auto py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold text-[#172B4D]">Sankey Diagram Builder</h1>
            <nav>
              <ul className="flex space-x-6">
                <li>
                  <Link href="/help" className="text-[#42526E] hover:text-[#172B4D]">
                    Help
                  </Link>
                </li>
                <li>
                  <Link
                    href="https://github.com/yourusername/sankey-diagram"
                    className="text-[#42526E] hover:text-[#172B4D]"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    GitHub
                  </Link>
                </li>
              </ul>
            </nav>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-[#172B4D]">Your Diagrams</h2>
            <p className="text-[#42526E]">Create and manage your Sankey diagrams</p>
          </div>
          <Dialog open={isCreating} onOpenChange={setIsCreating}>
            <DialogTrigger asChild>
              <Button className="gap-2 bg-[#0052CC] hover:bg-[#0747A6] text-white">
                <Plus className="h-4 w-4" />
                Create New Diagram
              </Button>
            </DialogTrigger>
            <DialogContent className="border-[#DFE1E6] bg-white sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle className="text-[#172B4D]">Create New Diagram</DialogTitle>
                <DialogDescription className="text-[#6B778C]">Enter a name for your new Sankey diagram.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                {error && (
                  <Alert variant="destructive" className="bg-[#FFEBE6] text-[#DE350B] border-[#FF8F73]">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-[#172B4D]">
                    Diagram Name
                  </Label>
                  <Input
                    id="name"
                    value={newDiagramName}
                    onChange={(e) => setNewDiagramName(e.target.value)}
                    placeholder="e.g. Energy Flow Diagram"
                    className="border-[#DFE1E6] focus:border-[#4C9AFF] focus:ring-[#4C9AFF]"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsCreating(false)
                    setNewDiagramName("")
                    setError(null)
                  }}
                  className="border-[#DFE1E6] text-[#42526E] hover:bg-[#F4F5F7]"
                >
                  Cancel
                </Button>
                <Button onClick={createDiagram} className="bg-[#0052CC] hover:bg-[#0747A6] text-white">
                  Create
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {diagrams.length === 0 ? (
          <Card className="border-[#DFE1E6] bg-white">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="mb-4 rounded-full bg-[#DEEBFF] p-4">
                <Plus className="h-8 w-8 text-[#0052CC]" />
              </div>
              <h3 className="mb-2 text-xl font-medium text-[#172B4D]">No diagrams yet</h3>
              <p className="mb-6 text-center text-[#42526E]">
                Create your first Sankey diagram to visualize flows between nodes.
              </p>
              <Button
                onClick={() => setIsCreating(true)}
                className="gap-2 bg-[#0052CC] hover:bg-[#0747A6] text-white"
              >
                <Plus className="h-4 w-4" />
                Create New Diagram
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {diagrams.map((diagram) => (
              <Card key={diagram.id} className="border-[#DFE1E6] bg-white">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg font-medium text-[#172B4D]">{diagram.name}</CardTitle>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-[#6B778C]">
                          <MoreVertical className="h-4 w-4" />
                          <span className="sr-only">Actions</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="border-[#DFE1E6]">
                        <DropdownMenuItem
                          className="text-[#42526E] focus:bg-[#F4F5F7] focus:text-[#172B4D]"
                          onClick={() => router.push(`/builder/${diagram.id}`)}
                        >
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-[#42526E] focus:bg-[#F4F5F7] focus:text-[#172B4D]"
                          onClick={() => router.push(`/view/${diagram.id}`)}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          View
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-[#DE350B] focus:bg-[#FFEBE6] focus:text-[#DE350B]"
                          onClick={() => deleteDiagram(diagram.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent className="pb-2">
                  <div className="text-sm text-[#6B778C]">
                    <p>Created: {formatDate(diagram.created_at)}</p>
                    <p>Last modified: {formatDate(diagram.updated_at)}</p>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(`/view/${diagram.id}`)}
                    className="border-[#DFE1E6] text-[#42526E] hover:bg-[#F4F5F7]"
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    View
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => router.push(`/builder/${diagram.id}`)}
                    className="bg-[#0052CC] hover:bg-[#0747A6] text-white"
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </main>

      <footer className="border-t bg-white py-6 mt-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <p className="text-sm text-[#6B778C]">&copy; {new Date().getFullYear()} Sankey Diagram Builder</p>
            <div className="flex gap-4">
              <Link href="/privacy" className="text-sm text-[#6B778C] hover:text-[#172B4D]">
                Privacy Policy
              </Link>
              <Link href="/terms" className="text-sm text-[#6B778C] hover:text-[#172B4D]">
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
} 