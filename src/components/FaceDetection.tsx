import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, AlertTriangle, Camera, CameraOff } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { useToast } from "@/hooks/use-toast";

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
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const { toast } = useToast();

  // Start/stop camera
  const startCamera = async () => {
    try {
      setCameraError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: "user"
        }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsCameraActive(true);
        toast({
          title: "Camera Active",
          description: "Live face monitoring started",
        });
      }
    } catch (error) {
      console.error("Camera error:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to access camera";
      setCameraError(errorMessage);
      toast({
        title: "Camera Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
    toast({
      title: "Camera Stopped",
      description: "Face monitoring paused",
    });
  };

  // Cleanup camera on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

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

      // Show alerts based on conditions
      if (isCameraActive) {
        if (newPerclos > 30 && fatigueLevel > 70) {
          toast({
            title: "⚠️ Drowsiness Alert!",
            description: "Eyes closing frequently. Consider taking a break.",
            variant: "destructive",
          });
        } else if (yawnCount > 3 && fatigueLevel > 60) {
          toast({
            title: "⚠️ Fatigue Warning",
            description: `${yawnCount} yawns detected. Rest recommended.`,
          });
        }
      }
    }, 1500);

    return () => clearInterval(interval);
  }, [fatigueLevel, yawnCount, onFacialMetricsChange, isCameraActive, toast]);

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
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground mb-2">Live Face Detection</h2>
          <p className="text-sm text-muted-foreground">Real-time facial cue analysis</p>
        </div>
        <Button
          onClick={isCameraActive ? stopCamera : startCamera}
          variant={isCameraActive ? "destructive" : "default"}
          size="sm"
        >
          {isCameraActive ? (
            <>
              <CameraOff className="w-4 h-4 mr-2" />
              Stop Camera
            </>
          ) : (
            <>
              <Camera className="w-4 h-4 mr-2" />
              Start Camera
            </>
          )}
        </Button>
      </div>

      {/* Live Video Feed */}
      <div className="relative aspect-video bg-secondary/30 rounded-lg overflow-hidden mb-4 border border-border">
        {/* Video Element */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="absolute inset-0 w-full h-full object-cover"
          style={{ transform: 'scaleX(-1)' }}
        />

        {/* Overlay when camera is off */}
        {!isCameraActive && (
          <div className="absolute inset-0 flex items-center justify-center bg-secondary/50 backdrop-blur-sm">
            <div className="text-center">
              <Camera className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-sm text-muted-foreground">
                {cameraError || "Click 'Start Camera' to begin monitoring"}
              </p>
            </div>
          </div>
        )}

        {/* Face Detection Overlay (only when camera is active) */}
        {isCameraActive && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="relative">
              {/* Face Detection Frame */}
              <div className={`w-48 h-56 rounded-lg border-4 transition-all duration-300 ${
                fatigueLevel > 60 ? "border-destructive animate-pulse" : 
                fatigueLevel > 40 ? "border-warning" : "border-success"
              }`}>
                {/* Eye Detection Points */}
                <div className="absolute top-16 left-12">
                  <Eye className={`w-5 h-5 ${isEyesClosed ? "text-destructive" : "text-success"}`} />
                </div>
                <div className="absolute top-16 right-12">
                  <Eye className={`w-5 h-5 ${isEyesClosed ? "text-destructive" : "text-success"}`} />
                </div>

                {/* Detection Status */}
                <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap">
                  <Badge variant={fatigueLevel > 60 ? "destructive" : "default"} className="text-xs">
                    Face Tracked
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Live indicator (only when camera is active) */}
        {isCameraActive && (
          <div className="absolute top-3 left-3 flex items-center gap-2 bg-background/80 backdrop-blur-sm px-3 py-1.5 rounded-full">
            <div className="w-2 h-2 bg-destructive rounded-full animate-pulse" />
            <span className="text-xs font-semibold text-foreground">LIVE</span>
          </div>
        )}

        {/* Alert Indicator (only when camera is active) */}
        {isCameraActive && fatigueLevel > 60 && (
          <div className="absolute top-3 right-3 bg-destructive/80 backdrop-blur-sm px-3 py-1.5 rounded-full flex items-center gap-2 animate-pulse">
            <AlertTriangle className="w-4 h-4 text-destructive-foreground" />
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
