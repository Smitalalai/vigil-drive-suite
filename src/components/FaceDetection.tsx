import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Eye, AlertTriangle } from "lucide-react";
import { useEffect, useState } from "react";

interface FaceDetectionProps {
  fatigueLevel: number;
  onFacialMetricsChange?: (metrics: {
    ear: number;
    perclos: number;
    blinkRate: number;
    yawnCount: number;
  }) => void;
}

const FaceDetection = ({ fatigueLevel, onFacialMetricsChange }: FaceDetectionProps) => {
  const [ear, setEar] = useState(0.32); // Eye Aspect Ratio
  const [perclos, setPerclos] = useState(8); // Percentage of Eye Closure
  const [blinkRate, setBlinkRate] = useState(15); // Blinks per minute
  const [yawnCount, setYawnCount] = useState(0);
  const [isEyesClosed, setIsEyesClosed] = useState(false);

  // Simulate real-time facial metrics
  useEffect(() => {
    const interval = setInterval(() => {
      // EAR decreases with fatigue (normal: 0.25-0.35, drowsy: <0.20)
      const newEar = Math.max(0.15, 0.32 - (fatigueLevel / 100) * 0.15 + (Math.random() - 0.5) * 0.05);
      setEar(newEar);

      // PERCLOS increases with fatigue (normal: <15%, drowsy: >20%)
      const newPerclos = Math.min(50, 8 + (fatigueLevel / 100) * 30 + (Math.random() - 0.5) * 5);
      setPerclos(newPerclos);

      // Blink rate changes (normal: 15-20/min, drowsy: <10/min or >30/min)
      const newBlinkRate = Math.max(5, 15 - (fatigueLevel / 100) * 8 + (Math.random() - 0.5) * 4);
      setBlinkRate(newBlinkRate);

      // Yawn detection increases with fatigue
      if (Math.random() < (fatigueLevel / 100) * 0.05) {
        setYawnCount(prev => prev + 1);
      }

      // Simulate eye closure
      setIsEyesClosed(newEar < 0.22 && Math.random() < 0.3);

      // Notify parent component
      onFacialMetricsChange?.({
        ear: newEar,
        perclos: newPerclos,
        blinkRate: newBlinkRate,
        yawnCount,
      });
    }, 1500);

    return () => clearInterval(interval);
  }, [fatigueLevel, yawnCount, onFacialMetricsChange]);

  const getEarStatus = () => {
    if (ear > 0.25) return { status: "Normal", color: "text-success" };
    if (ear > 0.20) return { status: "Warning", color: "text-warning" };
    return { status: "Critical", color: "text-destructive" };
  };

  const getPerclosStatus = () => {
    if (perclos < 15) return { status: "Alert", color: "bg-success" };
    if (perclos < 25) return { status: "Drowsy", color: "bg-warning" };
    return { status: "Critical", color: "bg-destructive" };
  };

  const earStatus = getEarStatus();
  const perclosStatus = getPerclosStatus();

  return (
    <Card className="p-6 bg-gradient-card border-border backdrop-blur-sm h-full">
      <div className="mb-4">
        <h2 className="text-xl font-bold text-foreground mb-2">Live Face Detection</h2>
        <p className="text-sm text-muted-foreground">NIR camera facial cue analysis</p>
      </div>

      {/* Simulated Video Feed */}
      <div className="relative aspect-video bg-secondary/30 rounded-lg overflow-hidden mb-4 border border-border">
        {/* Face Detection Overlay */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative">
            {/* Face Circle */}
            <div className={`w-32 h-40 rounded-full border-4 transition-all duration-300 ${
              fatigueLevel > 60 ? "border-destructive animate-pulse" : 
              fatigueLevel > 40 ? "border-warning" : "border-success"
            }`}>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-6xl mb-2">👤</span>
              </div>
              
              {/* Eye Detection Points */}
              <div className="absolute top-12 left-8">
                <Eye className={`w-4 h-4 ${isEyesClosed ? "text-destructive" : "text-success"}`} />
              </div>
              <div className="absolute top-12 right-8">
                <Eye className={`w-4 h-4 ${isEyesClosed ? "text-destructive" : "text-success"}`} />
              </div>
            </div>

            {/* Detection Status */}
            <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap">
              <Badge variant={fatigueLevel > 60 ? "destructive" : "default"} className="text-xs">
                Face Detected
              </Badge>
            </div>
          </div>
        </div>

        {/* Live indicator */}
        <div className="absolute top-3 left-3 flex items-center gap-2 bg-background/80 backdrop-blur-sm px-3 py-1.5 rounded-full">
          <div className="w-2 h-2 bg-destructive rounded-full animate-pulse" />
          <span className="text-xs font-semibold text-foreground">LIVE</span>
        </div>

        {/* Alert Indicator */}
        {fatigueLevel > 60 && (
          <div className="absolute top-3 right-3 bg-destructive/80 backdrop-blur-sm px-3 py-1.5 rounded-full flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-destructive-foreground animate-pulse" />
            <span className="text-xs font-semibold text-destructive-foreground">DROWSINESS DETECTED</span>
          </div>
        )}
      </div>

      {/* Facial Metrics */}
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          {/* EAR Metric */}
          <div className="p-3 bg-secondary/50 rounded-lg border border-border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">Eye Aspect Ratio</span>
              <span className={`text-xs font-semibold ${earStatus.color}`}>{earStatus.status}</span>
            </div>
            <div className="text-2xl font-bold text-foreground font-mono">{ear.toFixed(3)}</div>
            <div className="text-xs text-muted-foreground mt-1">Normal: &gt;0.25</div>
          </div>

          {/* PERCLOS Metric */}
          <div className="p-3 bg-secondary/50 rounded-lg border border-border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">PERCLOS</span>
              <Badge className={`${perclosStatus.color} text-xs px-2 py-0`}>
                {perclosStatus.status}
              </Badge>
            </div>
            <div className="text-2xl font-bold text-foreground">{perclos.toFixed(1)}%</div>
            <div className="text-xs text-muted-foreground mt-1">Normal: &lt;15%</div>
          </div>

          {/* Blink Rate */}
          <div className="p-3 bg-secondary/50 rounded-lg border border-border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">Blink Rate</span>
            </div>
            <div className="text-2xl font-bold text-foreground">{Math.round(blinkRate)}</div>
            <div className="text-xs text-muted-foreground mt-1">per minute</div>
          </div>

          {/* Yawn Detection */}
          <div className="p-3 bg-secondary/50 rounded-lg border border-border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">Yawn Count</span>
            </div>
            <div className="text-2xl font-bold text-foreground">{yawnCount}</div>
            <div className="text-xs text-muted-foreground mt-1">detected</div>
          </div>
        </div>

        {/* AI Decision */}
        <div className={`p-3 rounded-lg border ${
          fatigueLevel > 80 ? "bg-destructive/10 border-destructive/30" :
          fatigueLevel > 60 ? "bg-warning/10 border-warning/30" :
          fatigueLevel > 40 ? "bg-alert/10 border-alert/30" :
          "bg-success/10 border-success/30"
        }`}>
          <div className="flex items-start gap-2">
            <AlertTriangle className={`w-4 h-4 mt-0.5 ${
              fatigueLevel > 80 ? "text-destructive" :
              fatigueLevel > 60 ? "text-warning" :
              fatigueLevel > 40 ? "text-alert" :
              "text-success"
            }`} />
            <div className="flex-1">
              <div className="text-sm font-semibold text-foreground mb-1">AI Decision</div>
              <div className="text-xs text-muted-foreground">
                {fatigueLevel > 80 && "CRITICAL: Immediate intervention required. Driver showing severe drowsiness signs."}
                {fatigueLevel > 60 && fatigueLevel <= 80 && "WARNING: High fatigue detected. Recommend rest break within 15 minutes."}
                {fatigueLevel > 40 && fatigueLevel <= 60 && "CAUTION: Early fatigue signs detected. Monitor closely."}
                {fatigueLevel <= 40 && "NORMAL: Driver alert. All facial parameters within normal range."}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default FaceDetection;
