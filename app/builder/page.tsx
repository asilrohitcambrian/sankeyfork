"use client";

import { useState, useRef, useMemo } from "react";
import Link from "next/link";
import { scaleOrdinal } from 'd3-scale';
import { schemeTableau10 } from 'd3-scale-chromatic';

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
import { ChevronLeft, Download, FileText, Info, Plus, Trash2, Upload, ArrowRight } from "lucide-react";

// Types for flow data
type Flow = {
  id: string;
  source: string;
  target: string;
  value: string;
};

// helper to create an empty flow row
const emptyFlow = (): Flow => ({
  id: crypto.randomUUID(),
  source: "",
  target: "",
  value: "",
});

// example CSV for users to download
const exampleCsvData = `source,target,value\nSolar,Electricity,42\nWind,Electricity,35\nCoal,Heat,50\nCoal,Electricity,30\nGas,Heat,20\nGas,Electricity,15\nElectricity,Residential,40\nElectricity,Commercial,50\nElectricity,Industrial,32\nHeat,Residential,30\nHeat,Commercial,20\nHeat,Industrial,20`;

export default function BuilderPage() {
  // state hooks
  const [flows, setFlows] = useState<Flow[]>([emptyFlow()]);
  const [diagramData, setDiagramData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("input");

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

  const rowsToColour = (name: string) => colourScale(name.trim().toLowerCase());

  // row CRUD helpers
  const addFlow = () => setFlows([...flows, emptyFlow()]);
  const removeFlow = (id: string) => setFlows(flows.filter(f => f.id !== id));
  const updateFlow = (id: string, field: keyof Flow, val: string) =>
    setFlows(flows.map(f => (f.id === id ? { ...f, [field]: val } : f)));

  // CSV parsing & upload handling
  const parseCsvToFlows = (csv: string): Flow[] => {
    const lines = csv.split("\n");
    const start = lines[0].toLowerCase().includes("source") ? 1 : 0;
    const parsed: Flow[] = [];
    for (let i = start; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      const [source, target, value] = line.split(",").map(s => s.trim());
      if (!source || !target || !value) throw new Error("CSV format incorrect");
      parsed.push({ id: crypto.randomUUID(), source, target, value });
    }
    return parsed;
  };

  const handleFileSelect = (file: File) => {
    if (!file) return;
    if (file.type !== "text/csv" && !file.name.endsWith(".csv")) {
      setUploadError("Please upload a CSV file.");
      return;
    }
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const csv = e.target?.result as string;
        const parsed = parseCsvToFlows(csv);
        if (!parsed.length) {
          setUploadError("No valid data found in CSV file.");
          return;
        }
        setUploadError(null);
        setFlows(parsed);
      } catch (err) {
        console.error(err);
        setUploadError("Failed to parse CSV file. Please check the format.");
      }
    };
    reader.readAsText(file);
  };

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
    handleFileSelect(file);
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
  const generateDiagram = async () => {
    if (!validateFlows()) return;
    setIsLoading(true);
    try {
      await new Promise(res => setTimeout(res, 500));
      const nodeNames = Array.from(new Set(flows.flatMap(f => [f.source, f.target])));
      const colourScale = scaleOrdinal<string>()
        .domain(nodeNames)
        .range(schemeTableau10);

      const nodes = nodeNames.map(name => ({ 
        name,
        colour: colourScale(name)
      }));

      const links = flows.map(flow => ({
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
  };

  // download example CSV
  const downloadExampleCsv = () => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([exampleCsvData], { type: "text/csv" }));
    a.download = "sankey-example.csv";
    a.click();
  };

  const exportAsPng = () => alert("Export as PNG coming soon 🙌");

  return (
    <div className="min-h-screen bg-[#F4F5F7]">
      {/* header */}
      <header className="border-b bg-white">
        <div className="container mx-auto py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 text-[#42526E] hover:text-[#172B4D]">
              <ChevronLeft className="h-4 w-4" /> Back to Home
            </Link>
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
                    className="grid gap-4 font-medium text-[#42526E]"
                    style={{ gridTemplateColumns: '20px 1fr 1fr 120px 40px' }}
                  >
                    <div />                 {/* empty header over swatch */}
                    <div>Source</div>
                    <div>Target</div>
                    <div>Value</div>
                    <div />                 {/* empty over trash */}
                  </div>

                  {/* rows */}
                  <div className="space-y-3">
                    {flows.map(flow => (
                      <div
                        key={flow.id}
                        className="grid gap-4 items-center"
                        style={{ gridTemplateColumns: '20px 1fr 1fr 120px 40px' }}
                      >
                        {/* colour swatch */}
                        <div className="h-3 w-3 rounded-sm border" style={{ background: rowsToColour(flow.source) }} />

                        {/* Source */}
                        <Input
                          placeholder="e.g. Solar"
                          value={flow.source}
                          onChange={e => updateFlow(flow.id, 'source', e.target.value)}
                          className="border-[#DFE1E6] focus:border-[#4C9AFF] focus:ring-[#4C9AFF]"
                        />

                        {/* Target */}
                        <Input
                          placeholder="e.g. Electricity"
                          value={flow.target}
                          onChange={e => updateFlow(flow.id, 'target', e.target.value)}
                          className="border-[#DFE1E6] focus:border-[#4C9AFF] focus:ring-[#4C9AFF]"
                        />

                        {/* Value */}
                        <Input
                          type="number"
                          min="0"
                          step="1"
                          placeholder="e.g. 50"
                          value={flow.value}
                          onChange={e => updateFlow(flow.id, 'value', e.target.value)}
                          className="border-[#DFE1E6] focus:border-[#4C9AFF] focus:ring-[#4C9AFF]"
                        />

                        {/* delete */}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeFlow(flow.id)}
                          disabled={flows.length === 1}
                          aria-label="Remove flow"
                          className="text-[#6B778C] hover:text-[#172B4D] hover:bg-[#F4F5F7]"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>

                  {/* add row */}
                  <Button variant="outline" size="sm" onClick={addFlow} className="gap-2 border-[#DFE1E6] text-[#42526E] hover:bg-[#F4F5F7]"><Plus className="h-4 w-4" />Add another flow</Button>

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
                          <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={e => e.target.files && handleFileSelect(e.target.files[0])} />
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

            <div className="flex justify-end"><Button onClick={generateDiagram} disabled={isLoading || !flows.length} className="gap-2 bg-[#0052CC] hover:bg-[#0747A6] text-white">{isLoading ? "Generating..." : "Preview Diagram"}{!isLoading && <ArrowRight className="h-4 w-4" />}</Button></div>
          </TabsContent>

          {/* preview tab */}
          <TabsContent value="preview" className="space-y-8">
            {diagramData && (
              <>
                <Card className="border-[#DFE1E6]">
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between"><h2 className="text-xl font-semibold text-[#172B4D]">Sankey Diagram Preview</h2><Button variant="outline" onClick={exportAsPng} className="gap-2 border-[#DFE1E6] text-[#42526E] hover:bg-[#F4F5F7]"><Download className="h-4 w-4" />Export as PNG</Button></div>
                      <div className="overflow-x-auto rounded-md border border-[#DFE1E6] bg-white p-4"><SankeyDiagram data={diagramData} /></div>
                    </div>
                  </CardContent>
                </Card>
                <div className="flex justify-between"><Button variant="outline" onClick={() => setActiveTab("input")} className="border-[#DFE1E6] text-[#42526E] hover:bg-[#F4F5F7]">Edit Data</Button></div>
              </>
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* footer */}
      <footer className="border-t bg-white py-6 mt-8">
        <div className="container mx-auto px-4 flex flex-col items-center gap-4 md:flex-row md:justify-between"><p className="text-sm text-[#6B778C]">© {new Date().getFullYear()} Sankey Diagram Builder</p><div className="flex gap-4"><Link href="/privacy" className="text-sm text-[#6B778C] hover:text-[#172B4D]">Privacy Policy</Link><Link href="/terms" className="text-sm text-[#6B778C] hover:text-[#172B4D]">Terms of Service</Link></div></div>
      </footer>
    </div>
  );
}
