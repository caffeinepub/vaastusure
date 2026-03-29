import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { Toaster } from "@/components/ui/sonner";
import { AnalysisPage } from "@/pages/AnalysisPage";
import { HomePage } from "@/pages/HomePage";
import { ResultsPage } from "@/pages/ResultsPage";
import {
  type RoomLabel,
  type VastuResult,
  computeVastuScore,
} from "@/utils/vastuEngine";
import { useState } from "react";
import { toast } from "sonner";

type Page = "home" | "analysis" | "results";

export default function App() {
  const [page, setPage] = useState<Page>("home");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [roomLabels, setRoomLabels] = useState<RoomLabel[]>([]);
  const [vastuResult, setVastuResult] = useState<VastuResult | null>(null);

  const handleFileSelect = (file: File, preview: string | null) => {
    setUploadedFile(file);
    setImagePreview(preview);
    setRoomLabels([]);
    setVastuResult(null);
    setPage("analysis");
  };

  const handleRunAnalysis = () => {
    if (roomLabels.length === 0) {
      toast.error("Please label at least one room before running analysis.");
      return;
    }
    const result = computeVastuScore(roomLabels);
    setVastuResult(result);
    setPage("results");
  };

  const handleStartOver = () => {
    setUploadedFile(null);
    setImagePreview(null);
    setRoomLabels([]);
    setVastuResult(null);
    setPage("home");
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar
        currentPage={page}
        onNavigate={(p) => {
          if (p === "home") handleStartOver();
          else setPage(p);
        }}
      />

      {page === "home" && <HomePage onFileSelect={handleFileSelect} />}

      {page === "analysis" && uploadedFile && (
        <AnalysisPage
          file={uploadedFile}
          imagePreview={imagePreview}
          roomLabels={roomLabels}
          onLabelsChange={setRoomLabels}
          onRunAnalysis={handleRunAnalysis}
          onBack={() => setPage("home")}
          onImageCrop={(dataUrl) => setImagePreview(dataUrl)}
        />
      )}

      {page === "results" && vastuResult && (
        <ResultsPage
          file={uploadedFile}
          imagePreview={imagePreview}
          roomLabels={roomLabels}
          vastuResult={vastuResult}
          fileName={uploadedFile?.name ?? "Floor Plan"}
          onBack={() => setPage("analysis")}
          onStartOver={handleStartOver}
        />
      )}

      <Footer />
      <Toaster richColors position="top-right" />
    </div>
  );
}
