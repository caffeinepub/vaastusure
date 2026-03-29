import { CompassSVG } from "@/components/CompassSVG";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { useInternetIdentity } from "@/hooks/useInternetIdentity";
import { useCreateAnalysis, useUpdateAnalysis } from "@/hooks/useQueries";
import {
  ROOM_COLORS,
  type RoomLabel,
  type VastuResult,
} from "@/utils/vastuEngine";
import {
  AlertCircle,
  AlertTriangle,
  Building2,
  CheckCircle2,
  ChevronLeft,
  Download,
  Info,
  Loader2,
  MapPin,
  Save,
  Wrench,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import type { AnalysisRecord, ScoreBreakdown } from "../backend";
import { AnalysisStatus } from "../backend";

interface ResultsPageProps {
  file: File | null;
  imagePreview: string | null;
  roomLabels: RoomLabel[];
  vastuResult: VastuResult;
  fileName: string;
  onBack: () => void;
  onStartOver: () => void;
}

function ScoreRing({ score }: { score: number }) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;
  const color = score >= 70 ? "#2F6B43" : score >= 40 ? "#D97706" : "#DC2626";

  return (
    <div
      className="relative inline-flex items-center justify-center"
      style={{ width: 140, height: 140 }}
    >
      <svg
        width={140}
        height={140}
        viewBox="0 0 140 140"
        className="-rotate-90"
      >
        <title>Vastu score ring</title>
        <circle
          cx={70}
          cy={70}
          r={radius}
          fill="none"
          stroke="#E7E0D3"
          strokeWidth={10}
        />
        <circle
          cx={70}
          cy={70}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={10}
          strokeDasharray={`${progress} ${circumference}`}
          strokeLinecap="round"
          style={{ transition: "stroke-dasharray 1s ease-out" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold text-foreground">{score}</span>
        <span className="text-xs text-muted-foreground font-medium">/ 100</span>
      </div>
    </div>
  );
}

function scoreColor(val: number, max: number) {
  const pct = val / max;
  if (pct >= 0.7) return "text-primary";
  if (pct >= 0.4) return "text-amber-600";
  return "text-destructive";
}

function scoreBg(val: number, max: number) {
  const pct = val / max;
  if (pct >= 0.7) return "bg-vastu-lime";
  if (pct >= 0.4) return "bg-vastu-yellow";
  return "bg-vastu-red";
}

function SeverityIcon({ severity }: { severity: string }) {
  if (severity === "high")
    return <AlertTriangle className="w-4 h-4 text-destructive flex-shrink-0" />;
  if (severity === "medium")
    return <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />;
  return <Info className="w-4 h-4 text-primary flex-shrink-0" />;
}

function severityBg(sev: string) {
  if (sev === "high") return "bg-vastu-red border-destructive/20";
  if (sev === "medium") return "bg-vastu-yellow border-amber-200";
  return "bg-vastu-lime border-primary/20";
}

export function ResultsPage({
  file,
  imagePreview,
  roomLabels,
  vastuResult,
  fileName,
  onBack,
  onStartOver,
}: ResultsPageProps) {
  const [saved, setSaved] = useState(false);
  const { identity } = useInternetIdentity();
  const createMutation = useCreateAnalysis();
  const updateMutation = useUpdateAnalysis();

  const { totalScore, breakdown, issues, easyFixes, structuralChanges } =
    vastuResult;

  const scoreLabel =
    totalScore >= 80
      ? "Excellent"
      : totalScore >= 70
        ? "Good"
        : totalScore >= 50
          ? "Fair"
          : "Needs Attention";

  const handleSave = async () => {
    if (!identity) {
      toast.error("Please sign in to save your analysis.");
      return;
    }
    try {
      let imageBytes: Uint8Array | undefined;
      if (imagePreview) {
        const res = await fetch(imagePreview);
        const buf = await res.arrayBuffer();
        imageBytes = new Uint8Array(buf);
      }

      const analysisId = await createMutation.mutateAsync({
        name: fileName,
        imageBytes,
      });

      const scoreBreakdown: ScoreBreakdown = {
        entrance: BigInt(breakdown.entrance + breakdown.mainDoor),
        kitchen: BigInt(breakdown.kitchen + breakdown.cooking),
        bedrooms: BigInt(breakdown.bedroom + breakdown.bedHead),
        toilets: BigInt(breakdown.toilet + breakdown.wc),
        energyBalance: BigInt(breakdown.livingRoom + breakdown.poojaRoom),
      };

      const record: AnalysisRecord = {
        id: analysisId,
        status: AnalysisStatus.complete,
        roomLabels: roomLabels.map((l) => ({
          x: BigInt(Math.round(l.x * 1000)),
          y: BigInt(Math.round(l.y * 1000)),
          direction: l.direction,
          room: l.room,
        })),
        scoreBreakdown,
        floorPlanName: fileName,
        userId: identity.getPrincipal(),
        vastuScore: BigInt(totalScore),
        issues: issues.map(
          (iss) => `[${iss.severity.toUpperCase()}] ${iss.message}`,
        ),
        easyFixes,
        structuralChanges,
        uploadedAt: BigInt(Date.now()) * BigInt(1_000_000),
      };

      await updateMutation.mutateAsync({ id: analysisId, record });
      setSaved(true);
      toast.success("Analysis saved successfully!");
    } catch {
      toast.error("Failed to save analysis.");
    }
  };

  const handleDownload = () => window.print();

  const breakdownItems = [
    { label: "Entrance", value: breakdown.entrance, max: 10 },
    { label: "Main Door", value: breakdown.mainDoor, max: 10 },
    { label: "Living Room", value: breakdown.livingRoom, max: 10 },
    { label: "Kitchen", value: breakdown.kitchen, max: 10 },
    { label: "Cooking", value: breakdown.cooking, max: 10 },
    { label: "Toilet", value: breakdown.toilet, max: 10 },
    { label: "WC", value: breakdown.wc, max: 10 },
    { label: "Bedroom", value: breakdown.bedroom, max: 10 },
    { label: "Bed Head", value: breakdown.bedHead, max: 10 },
    { label: "Pooja Room", value: breakdown.poojaRoom, max: 10 },
  ];

  const isSaving = createMutation.isPending || updateMutation.isPending;

  void file;

  return (
    <main className="flex-1" data-ocid="results.page">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex flex-wrap items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
            data-ocid="results.secondary_button"
          >
            <ChevronLeft className="w-4 h-4" /> Back to Analysis
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-semibold text-foreground">
              Vastu Analysis Results
            </h1>
            <p className="text-sm text-muted-foreground">{fileName}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              className="rounded-full text-sm flex items-center gap-1.5"
              data-ocid="results.secondary_button"
            >
              <Download className="w-4 h-4" /> Download Report
            </Button>
            <Button
              onClick={handleSave}
              disabled={saved || isSaving}
              className="rounded-full bg-primary text-primary-foreground hover:opacity-90 text-sm flex items-center gap-1.5 px-5"
              data-ocid="results.save_button"
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : saved ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {isSaving ? "Saving…" : saved ? "Saved" : "Save Analysis"}
            </Button>
          </div>
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Score overview */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card rounded-xl border border-border shadow-card p-6"
              data-ocid="results.card"
            >
              <h2 className="font-semibold text-foreground mb-5">
                Vastu Scoring
              </h2>
              <div className="flex flex-wrap items-start gap-8">
                <div className="flex flex-col items-center gap-2">
                  <ScoreRing score={totalScore} />
                  <Badge
                    className={`text-xs font-semibold px-3 py-1 rounded-full ${
                      totalScore >= 70
                        ? "bg-vastu-lime text-primary"
                        : totalScore >= 40
                          ? "bg-vastu-yellow text-amber-700"
                          : "bg-vastu-red text-red-700"
                    }`}
                  >
                    {scoreLabel}
                  </Badge>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-foreground mb-4">
                    Score Breakdown
                  </h3>
                  <div className="space-y-3">
                    {breakdownItems.map(({ label, value, max }) => (
                      <div key={label}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-muted-foreground">
                            {label}
                          </span>
                          <span
                            className={`text-sm font-semibold ${scoreColor(value, max)}`}
                          >
                            {value} / {max}
                          </span>
                        </div>
                        <div className="h-2 rounded-full bg-border overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-700 ${scoreBg(value, max)}`}
                            style={{ width: `${(value / max) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Issues */}
            {issues.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-card rounded-xl border border-border shadow-card p-6"
                data-ocid="results.panel"
              >
                <h2 className="font-semibold text-foreground mb-4">
                  Issues Found
                  <Badge variant="outline" className="ml-2 text-xs">
                    {issues.length}
                  </Badge>
                </h2>
                <div className="space-y-2">
                  {issues.map((issue, i) => (
                    <div
                      key={`issue-${issue.severity}-${i}`}
                      className={`flex items-start gap-3 p-3 rounded-xl border text-sm ${severityBg(issue.severity)}`}
                      data-ocid={`results.item.${i + 1}`}
                    >
                      <SeverityIcon severity={issue.severity} />
                      <span className="text-foreground">{issue.message}</span>
                      <Badge
                        variant="outline"
                        className="ml-auto text-xs capitalize flex-shrink-0"
                      >
                        {issue.severity}
                      </Badge>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Suggestions */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-card rounded-xl border border-border shadow-card p-6"
              data-ocid="results.panel"
            >
              <h2 className="font-semibold text-foreground mb-5">
                Actionable Suggestions
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Wrench className="w-4 h-4 text-primary" />
                    <h3 className="text-sm font-semibold text-foreground">
                      Easy Fixes
                    </h3>
                  </div>
                  {easyFixes.length === 0 ? (
                    <p className="text-xs text-muted-foreground">
                      No easy fixes needed &mdash; great layout!
                    </p>
                  ) : (
                    <ul className="space-y-2">
                      {easyFixes.map((fix) => (
                        <li
                          key={fix}
                          className="flex items-start gap-2 p-2.5 rounded-lg bg-vastu-lime text-sm text-foreground"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
                          {fix}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Building2 className="w-4 h-4 text-amber-600" />
                    <h3 className="text-sm font-semibold text-foreground">
                      Structural Changes
                    </h3>
                  </div>
                  {structuralChanges.length === 0 ? (
                    <p className="text-xs text-muted-foreground">
                      No structural changes needed!
                    </p>
                  ) : (
                    <ul className="space-y-2">
                      {structuralChanges.map((fix) => (
                        <li
                          key={fix}
                          className="flex items-start gap-2 p-2.5 rounded-lg bg-vastu-yellow text-sm text-foreground"
                        >
                          <AlertCircle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
                          {fix}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </motion.div>
          </div>

          {/* Right column */}
          <div className="space-y-5">
            <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
              <div className="px-4 py-3 border-b border-border">
                <h3 className="font-semibold text-foreground text-sm">
                  Floor Plan Overview
                </h3>
              </div>
              <div className="relative p-3">
                {imagePreview ? (
                  <div className="relative rounded-lg overflow-hidden">
                    <img
                      src={imagePreview}
                      alt="Floor plan thumbnail with room overlays"
                      className="w-full h-auto"
                    />
                    {roomLabels.map((label) => (
                      <div
                        key={label.id}
                        className="absolute w-5 h-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-sm flex items-center justify-center"
                        style={{
                          left: `${label.x * 100}%`,
                          top: `${label.y * 100}%`,
                          backgroundColor: ROOM_COLORS[label.room],
                        }}
                        title={label.room}
                      >
                        <MapPin className="w-2.5 h-2.5 text-white" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="h-32 flex items-center justify-center bg-muted/30 rounded-lg">
                    <p className="text-xs text-muted-foreground">
                      PDF &mdash; no preview
                    </p>
                  </div>
                )}
                <div className="mt-3 flex justify-center">
                  <CompassSVG size={80} />
                </div>
              </div>
            </div>

            <div className="bg-card rounded-xl border border-border shadow-card p-5">
              <h3 className="font-semibold text-foreground text-sm mb-3">
                Labeled Rooms
              </h3>
              {roomLabels.length === 0 ? (
                <div data-ocid="results.empty_state">
                  <p className="text-xs text-muted-foreground text-center py-4">
                    No rooms labeled.
                  </p>
                </div>
              ) : (
                <div className="space-y-1.5" data-ocid="results.list">
                  {roomLabels.map((l, i) => (
                    <div
                      key={l.id}
                      className="flex items-center justify-between text-sm py-1"
                      data-ocid={`results.row.${i + 1}`}
                    >
                      <span className="flex items-center gap-2 text-foreground">
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: ROOM_COLORS[l.room] }}
                        />
                        {l.room}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {l.direction}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Button
              onClick={onStartOver}
              variant="outline"
              className="w-full rounded-full text-sm border-primary text-primary hover:bg-vastu-mint/50"
              data-ocid="results.primary_button"
            >
              Start New Analysis
            </Button>

            <Separator />

            <div className="bg-vastu-mint rounded-xl p-4">
              <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-2">
                Overall Compliance
              </p>
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <Progress value={totalScore} className="h-2 bg-border" />
                </div>
                <span className="text-sm font-bold text-primary whitespace-nowrap">
                  {totalScore}%
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {totalScore >= 70
                  ? "Your floor plan has strong Vastu compliance."
                  : totalScore >= 50
                    ? "Moderate compliance — some improvements recommended."
                    : "Significant Vastu corrections needed."}
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
