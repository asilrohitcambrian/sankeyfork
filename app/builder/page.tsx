"use client";

import { useState, useRef, useMemo, useCallback, useEffect } from "react";
import Link from "next/link";
import { scaleOrdinal } from 'd3-scale';
import { schemeTableau10 } from 'd3-scale-chromatic';
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

// shadcn/ui components
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// custom diagram component
import { SankeyDiagram } from "@/components/sankey-diagram";

// icons
import { ChevronLeft, Download, FileText, Info, Plus, Trash2, Upload, ArrowRight, Save } from "lucide-react";

// Types for flow data
import { FlowRow } from '@/lib/rowsToSankey';

// example CSV for users to download
const exampleCsvData = `source,target,value\nSolar,Electricity,42\nWind,Electricity,35\nCoal,Heat,50\nCoal,Electricity,30\nGas,Heat,20\nGas,Electricity,15\nElectricity,Residential,40\nElectricity,Commercial,50\nElectricity,Industrial,32\nHeat,Residential,30\nHeat,Commercial,20\nHeat,Industrial,20`;

type InputMode = 'pair' | 'path'

interface DiagramMetadata {
  id: string
  name: string
  created_at: string
  updated_at: string
}

interface DiagramData {
  flows: FlowRow[]
}

export default function BuilderPage({ diagramId }: { diagramId?: string }) {
  const router = useRouter()
  // state hooks
  const [flows, setFlows] = useState<FlowRow[]>([]);
  const [diagramData, setDiagramData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("input");
  const [inputMode, setInputMode] = useState<InputMode>('pair');
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");

  // file upload refs & drag state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const colourScale = useMemo(
    () =>
      scaleOrdinal<string>()
        .domain(flows.flatMap(f => [f.source.trim(), f.target.trim()]))
        .range(schemeTableau10),
    [flows]
  );

  const rowsToColour = (name: string) => {
    const hash = name.split("").reduce((a, b) => {
      a = (a << 5) - a + b.charCodeAt(0)
      return a & a
    }, 0)
    return `hsl(${hash % 360}, 70%, 50%)`
  }

  // row CRUD helpers
  const addFlow = () => {
    setFlows([
      ...flows,
      {
        id: crypto.randomUUID(),
        source: "",
        target: "",
        value: "",
      },
    ]);
  };
  const removeFlow = (id: string) => {
    setFlows(flows.filter(flow => flow.id !== id));
  };
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
  };

  // CSV parsing helpers
  const parseCsvToPairRows = (csv: string): FlowRow[] => {
    const lines = csv.split("\n");
    const headers = lines[0].toLowerCase().split(",");
    if (!headers.includes("source") || !headers.includes("target") || !headers.includes("value")) {
      throw new Error("CSV must have source, target, and value columns");
    }
    return lines.slice(1)
      .filter(line => line.trim())
      .map(line => {
        const values = line.split(",");
        return {
          id: crypto.randomUUID(),
          source: values[headers.indexOf("source")]?.trim() || "",
          target: values[headers.indexOf("target")]?.trim() || "",
          value: values[headers.indexOf("value")]?.trim() || ""
        };
      });
  };

  const parseCsvToPathRows = (csv: string): FlowRow[] => {
    const lines = csv.split("\n");
    const headers = lines[0].toLowerCase().split(",");
    if (!headers.includes("path") || !headers.includes("value")) {
      throw new Error("CSV must have path and value columns");
    }
    return lines.slice(1)
      .filter(line => line.trim())
      .map(line => {
        const values = line.split(",");
        return {
          id: crypto.randomUUID(),
          source: values[headers.indexOf("path")]?.trim() || "",
          target: "",
          value: values[headers.indexOf("value")]?.trim() || ""
        };
      });
  };

  // CSV parsing & upload handling
  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (file.type !== "text/csv" && !file.name.endsWith(".csv")) {
      setUploadError("Please upload a CSV file.");
      return;
    }
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const csv = e.target?.result as string;
        if (csv.toLowerCase().startsWith('path,')) {
          setInputMode('path');
          const parsed = parseCsvToPathRows(csv);
          setFlows(parsed);
        } else {
          setInputMode('pair');
          const parsed = parseCsvToPairRows(csv);
          setFlows(parsed);
        }
        setUploadError(null);
      } catch (err) {
        console.error(err);
        setUploadError("Failed to parse CSV file. Please check the format.");
      }
    };
    reader.readAsText(file);
  }, []);

  // drag‑and‑drop helpers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = () => setIsDragging(false);
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const csv = ev.target?.result as string;
        if (csv.toLowerCase().startsWith('path,')) {
          setInputMode('path');
          const parsed = parseCsvToPathRows(csv);
          setFlows(parsed);
        } else {
          setInputMode('pair');
          const parsed = parseCsvToPairRows(csv);
          setFlows(parsed);
        }
        setUploadError(null);
      } catch (err) {
        setUploadError("Failed to parse CSV file. Please check the format.");
      }
    };
    reader.readAsText(file);
  };

  // validation
  const validateFlows = () => {
    if (flows.some(f => !f.source || !f.target || !f.value)) {
      setError("All fields are required for each flow.");
      return false;
    }
    if (flows.some(f => isNaN(Number(f.value)) || Number(f.value) <= 0)) {
      setError("Values must be positive numbers.");
      return false;
    }
    setError(null);
    return true;
  };

  // preview generation (mock backend for now)
  const generateDiagram = useCallback(async () => {
    if (!validateFlows()) return;
    setIsLoading(true);
    try {
      await new Promise(res => setTimeout(res, 500));
      const rawFlows = inputMode === 'pair' 
        ? flows 
        : flows.flatMap(f => explodePath(f.source, Number(f.value)));

      const nodeNames = Array.from(new Set(rawFlows.flatMap(f => [f.source, f.target])));
      const colourScale = scaleOrdinal<string>()
        .domain(nodeNames)
        .range(schemeTableau10);

      const nodes = nodeNames.map(name => ({ 
        name,
        colour: colourScale(name)
      }));

      const links = rawFlows.map(flow => ({
        source: nodes.findIndex(n => n.name === flow.source),
        target: nodes.findIndex(n => n.name === flow.target),
        value: Number(flow.value),
        colour: colourScale(flow.source)
      }));

      setDiagramData({ nodes, links });
      setActiveTab("preview");
    } catch (err) {
      console.error(err);
      setError("Failed to generate diagram. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [flows, inputMode]);

  // download example CSV
  const downloadExampleCsv = () => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([exampleCsvData], { type: "text/csv" }));
    a.download = "sankey-example.csv";
    a.click();
  };

  const exportAsPng = () => alert("Export as PNG coming soon 🙌");

  function explodePath(path: string, value: number): FlowRow[] {
    const nodes = path.split(',').map(s => s.trim()).filter(Boolean)
    const out: FlowRow[] = []
    for (let i = 0; i < nodes.length - 1; i++) {
      out.push({
        id: crypto.randomUUID(),
        source: nodes[i],
        target: nodes[i + 1],
        value: String(value),
      })
    }
    return out
  }

  // Load existing diagram data
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

      if (data?.data_json?.flows) {
        setFlows(data.data_json.flows)
      } else {
        setFlows([{
          id: crypto.randomUUID(),
          source: "",
          target: "",
          value: "",
        }])
      }
      setIsLoading(false)
    })()
  }, [])

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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F4F5F7] flex items-center justify-center">
        <p className="text-[#42526E]">Loading diagram...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F4F5F7]">
      {/* header */}
      <header className="border-b bg-white">
        <div className="container mx-auto py-4">
          <div className="flex items-center justify-between">
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
            <h1 className="text-xl font-semibold text-[#172B4D]">Sankey Diagram Builder</h1>
            <Link href="/help" className="text-[#42526E] hover:text-[#172B4D]">Help</Link>
          </div>
        </div>
      </header>

      {/* main content */}
      <main className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="bg-white border">
            <TabsTrigger value="input" className="data-[state=active]:bg-[#0052CC] data-[state=active]:text-white">Input Data</TabsTrigger>
            <TabsTrigger value="preview" disabled={!diagramData} className="data-[state=active]:bg-[#0052CC] data-[state=active]:text-white">Preview Diagram</TabsTrigger>
          </TabsList>

          {/* input tab */}
          <TabsContent value="input" className="space-y-8">
            <Card className="border-[#DFE1E6]">
              <CardContent className="pt-6">
                {/* flow form */}
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

                  {/* add row */}
                  <Button
                    onClick={addFlow}
                    className="gap-2 bg-[#0052CC] hover:bg-[#0747A6] text-white"
                  >
                    <Plus className="h-4 w-4" />
                    Add Flow
                  </Button>

                  {/* CSV upload */}
                  <div className="rounded-md border border-[#DFE1E6] p-4 bg-[#FAFBFC]">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2"><FileText className="h-4 w-4 text-[#6B778C]" /><span className="text-[#42526E] font-medium">Upload a CSV file</span></div>
                        <p className="text-sm text-[#6B778C]">CSV columns: source,target,value</p>
                        <Button variant="link" onClick={downloadExampleCsv} className="h-auto p-0 text-[#0052CC]">Download example CSV</Button>
                      </div>
                      <div className="space-y-2">
                        <div className={`flex cursor-pointer flex-col items-center justify-center rounded-md border-2 border-dashed p-4 transition-colors ${isDragging ? "border-[#4C9AFF] bg-[#DEEBFF]" : "border-[#DFE1E6]"}`} onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop} onClick={() => fileInputRef.current?.click()}>
                          <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={handleFileSelect} />
                          <Upload className="mb-2 h-6 w-6 text-[#6B778C]" />
                          <p className="text-sm text-[#6B778C]">Drag & drop CSV or click to select</p>
                        </div>
                        {uploadError && <Alert variant="destructive" className="bg-[#FFEBE6] text-[#DE350B] border-[#FF8F73]"><AlertDescription>{uploadError}</AlertDescription></Alert>}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button onClick={generateDiagram} disabled={isLoading || !flows.length} className="gap-2 bg-[#0052CC] hover:bg-[#0747A6] text-white">
                {isLoading ? "Generating..." : "Preview Diagram"}
                {!isLoading && <ArrowRight className="h-4 w-4" />}
              </Button>
            </div>
          </TabsContent>

          {/* preview tab */}
          <TabsContent value="preview" className="space-y-8">
            {diagramData && (
              <>
                <Card className="border-[#DFE1E6]">
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h2 className="text-xl font-semibold text-[#172B4D]">Sankey Diagram Preview</h2>
                        <Button variant="outline" onClick={exportAsPng} className="gap-2 border-[#DFE1E6] text-[#42526E] hover:bg-[#F4F5F7]">
                          <Download className="h-4 w-4" />
                          Export as PNG
                        </Button>
                      </div>
                      <div className="overflow-x-auto rounded-md border border-[#DFE1E6] bg-white p-4">
                        <SankeyDiagram data={diagramData} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setActiveTab("input")} className="border-[#DFE1E6] text-[#42526E] hover:bg-[#F4F5F7]">
                    Edit Data
                  </Button>
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* footer */}
      <footer className="border-t bg-white py-6 mt-8">
        <div className="container mx-auto px-4 flex flex-col items-center gap-4 md:flex-row md:justify-between">
          <p className="text-sm text-[#6B778C]">© {new Date().getFullYear()} Sankey Diagram Builder</p>
          <div className="flex gap-4">
            <Link href="/privacy" className="text-sm text-[#6B778C] hover:text-[#172B4D]">Privacy Policy</Link>
            <Link href="/terms" className="text-sm text-[#6B778C] hover:text-[#172B4D]">Terms of Service</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
