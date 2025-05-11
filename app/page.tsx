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

// Type for diagram metadata
interface DiagramMetadata {
  id: string
  name: string
  createdAt: string
  updatedAt: string
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

  // Load diagrams from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("sankeyDiagrams")
      if (stored) {
        const parsedDiagrams = JSON.parse(stored) as DiagramMetadata[]
        setDiagrams(parsedDiagrams)
      }
    } catch (err) {
      console.error("Failed to load diagrams:", err)
      setError("Failed to load saved diagrams")
    }
  }, [])

  const createNewDiagram = () => {
    if (!newDiagramName.trim()) {
      setError("Please enter a diagram name")
      return
    }

    try {
      const newDiagram: DiagramMetadata = {
        id: crypto.randomUUID(),
        name: newDiagramName.trim(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      // Create initial empty diagram data
      const initialDiagramData: DiagramData = {
        flows: [{
          id: crypto.randomUUID(),
          source: "",
          target: "",
          value: "",
        }]
      }

      // Save both metadata and initial data
      const updatedDiagrams = [...diagrams, newDiagram]
      localStorage.setItem("sankeyDiagrams", JSON.stringify(updatedDiagrams))
      localStorage.setItem(`sankeyDiagram_${newDiagram.id}`, JSON.stringify(initialDiagramData))
      
      setDiagrams(updatedDiagrams)

      // Reset form and close dialog
      setNewDiagramName("")
      setError(null)
      setIsCreateDialogOpen(false)

      // Navigate to the builder
      router.push(`/builder/${newDiagram.id}`)
    } catch (err) {
      console.error("Failed to create diagram:", err)
      setError("Failed to create new diagram")
    }
  }

  const deleteDiagram = (id: string) => {
    try {
      const updatedDiagrams = diagrams.filter(d => d.id !== id)
      localStorage.setItem("sankeyDiagrams", JSON.stringify(updatedDiagrams))
      localStorage.removeItem(`sankeyDiagram_${id}`)
      setDiagrams(updatedDiagrams)
    } catch (err) {
      console.error("Failed to delete diagram:", err)
      setError("Failed to delete diagram")
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
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
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
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
                    setIsCreateDialogOpen(false)
                    setNewDiagramName("")
                    setError(null)
                  }}
                  className="border-[#DFE1E6] text-[#42526E] hover:bg-[#F4F5F7]"
                >
                  Cancel
                </Button>
                <Button onClick={createNewDiagram} className="bg-[#0052CC] hover:bg-[#0747A6] text-white">
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
                onClick={() => setIsCreateDialogOpen(true)}
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
                    <p>Created: {formatDate(diagram.createdAt)}</p>
                    <p>Last modified: {formatDate(diagram.updatedAt)}</p>
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