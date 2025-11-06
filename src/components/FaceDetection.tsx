import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, AlertTriangle, Camera, CameraOff } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { FaceMesh } from "@mediapipe/face_mesh";
import { Camera as CameraUtils } from "@mediapipe/camera_utils";

interface FaceDetectionProps {
  onMetricsUpdate: (metrics: { 
    fatigueLevel: number; 
    alertLevel: 0 | 1 | 2 | 3;
  }) => void;
}

const FaceDetection = ({ onMetricsUpdate }: FaceDetectionProps) => {
  const [ear, setEar] = useState(0.32); // Eye Aspect Ratio
  const [perclos, setPerclos] = useState(8); // Percentage of Eye Closure
  const [blinkRate, setBlinkRate] = useState(15); // Blinks per minute
  const [yawnCount, setYawnCount] = useState(0);
  const [isEyesClosed, setIsEyesClosed] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [faceDetected, setFaceDetected] = useState(false);
  const [fatigueLevel, setFatigueLevel] = useState(0);
  const [alertLevel, setAlertLevel] = useState<0 | 1 | 2 | 3>(0);
  const [mediaPipeLoading, setMediaPipeLoading] = useState(true);
  const [mediaPipeError, setMediaPipeError] = useState<string | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const faceMeshRef = useRef<FaceMesh | null>(null);
  const cameraRef = useRef<any>(null);
  const { toast } = useToast();
  
  // Detection thresholds
  const EAR_THRESHOLD = 0.21;
  const MAR_THRESHOLD = 0.6;
  const EAR_CONSEC_FRAMES = 20;
  const MAR_CONSEC_FRAMES = 15;
  
  // Counters
  const earCounterRef = useRef(0);
  const marCounterRef = useRef(0);
  const blinkCounterRef = useRef(0);
  const totalBlinkRef = useRef(0);
  const closedEyesFramesRef = useRef(0);
  const totalFramesRef = useRef(0);
  const lastBeepRef = useRef(0);
  
  // Landmark indices for MediaPipe Face Mesh
  const LEFT_EYE = [362, 385, 387, 263, 373, 380];
  const RIGHT_EYE = [33, 160, 158, 133, 153, 144];
  const MOUTH = [61, 291, 0, 17, 269, 405];
  
  // Calculate Euclidean distance
  const euclideanDistance = (point1: any, point2: any) => {
    const dx = point1.x - point2.x;
    const dy = point1.y - point2.y;
    const dz = point1.z - point2.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  };
  
  // Calculate Eye Aspect Ratio (EAR)
  const calculateEAR = (eyeLandmarks: any[]) => {
    const A = euclideanDistance(eyeLandmarks[1], eyeLandmarks[5]);
    const B = euclideanDistance(eyeLandmarks[2], eyeLandmarks[4]);
    const C = euclideanDistance(eyeLandmarks[0], eyeLandmarks[3]);
    return (A + B) / (2.0 * C);
  };
  
  // Calculate Mouth Aspect Ratio (MAR)
  const calculateMAR = (mouthLandmarks: any[]) => {
    const vertical = euclideanDistance(mouthLandmarks[1], mouthLandmarks[5]);
    const horizontal = euclideanDistance(mouthLandmarks[0], mouthLandmarks[3]);
    return vertical / horizontal;
  };
  
  // Play alert sound
  const playAlertSound = () => {
    const currentTime = Date.now();
    if (currentTime - lastBeepRef.current > 2000) {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
      
      lastBeepRef.current = currentTime;
    }
  };

  // Initialize MediaPipe Face Mesh
  useEffect(() => {
    const initMediaPipe = async () => {
      if (typeof window !== 'undefined') {
        try {
          setMediaPipeLoading(true);
          setMediaPipeError(null);
          
          faceMeshRef.current = new FaceMesh({
            locateFile: (file) => {
              return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
            }
          });
          
          faceMeshRef.current.setOptions({
            maxNumFaces: 1,
            refineLandmarks: true,
            minDetectionConfidence: 0.5,
            minTrackingConfidence: 0.5
          });
          
          faceMeshRef.current.onResults(onFaceMeshResults);
          
          // Wait a bit to ensure models start loading
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          setMediaPipeLoading(false);
          
          toast({
            title: "Face Detection Ready",
            description: "AI models loaded successfully",
          });
        } catch (error) {
          console.error("MediaPipe initialization error:", error);
          const errorMsg = "Failed to load face detection models. Please refresh the page.";
          setMediaPipeError(errorMsg);
          setMediaPipeLoading(false);
          
          toast({
            title: "Initialization Error",
            description: errorMsg,
            variant: "destructive",
          });
        }
      }
    };
    
    initMediaPipe();
    
    return () => {
      if (faceMeshRef.current) {
        faceMeshRef.current.close();
      }
    };
  }, []);
  
  // Process face mesh results
  const onFaceMeshResults = (results: any) => {
    if (!canvasRef.current || !videoRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    totalFramesRef.current += 1;
    
    if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
      setFaceDetected(true);
      const landmarks = results.multiFaceLandmarks[0];
      
      // Get eye landmarks
      const leftEyeLandmarks = LEFT_EYE.map(i => landmarks[i]);
      const rightEyeLandmarks = RIGHT_EYE.map(i => landmarks[i]);
      const mouthLandmarks = MOUTH.map(i => landmarks[i]);
      
      // Calculate metrics
      const leftEAR = calculateEAR(leftEyeLandmarks);
      const rightEAR = calculateEAR(rightEyeLandmarks);
      const avgEAR = (leftEAR + rightEAR) / 2.0;
      const mar = calculateMAR(mouthLandmarks);
      
      setEar(avgEAR);
      
      // Drowsiness detection
      if (avgEAR < EAR_THRESHOLD) {
        earCounterRef.current += 1;
        closedEyesFramesRef.current += 1;
        setIsEyesClosed(true);
        
        if (earCounterRef.current >= EAR_CONSEC_FRAMES) {
          playAlertSound();
          toast({
            title: "🚨 DROWSINESS ALERT!",
            description: "Eyes closing frequently. Wake up!",
            variant: "destructive",
          });
        }
      } else {
        earCounterRef.current = 0;
        setIsEyesClosed(false);
      }
      
      // Blink detection
      if (avgEAR < 0.18) {
        blinkCounterRef.current += 1;
      } else {
        if (blinkCounterRef.current >= 2 && blinkCounterRef.current <= 5) {
          totalBlinkRef.current += 1;
        }
        blinkCounterRef.current = 0;
      }
      
      // Yawn detection
      if (mar > MAR_THRESHOLD) {
        marCounterRef.current += 1;
        
        if (marCounterRef.current >= MAR_CONSEC_FRAMES) {
          setYawnCount(prev => prev + 1);
          toast({
            title: "😮 YAWNING DETECTED",
            description: "Fatigue signs detected. Take a break!",
          });
          marCounterRef.current = 0;
        }
      } else {
        marCounterRef.current = 0;
      }
      
      // Calculate PERCLOS
      const newPerclos = (closedEyesFramesRef.current / totalFramesRef.current) * 100;
      setPerclos(newPerclos);
      
      // Calculate blink rate (per minute)
      const newBlinkRate = (totalBlinkRef.current / totalFramesRef.current) * 1800; // 30fps * 60s
      setBlinkRate(newBlinkRate);
      
      // ========== CALCULATE FATIGUE LEVEL ==========
      // Multi-metric fatigue calculation with weighted scores
      
      // 1. PERCLOS Score (40% weight) - Most reliable indicator
      const perclosScore = Math.min(100, (newPerclos / 30) * 100); // 30% PERCLOS = max fatigue
      
      // 2. EAR Score (30% weight) - Eye closure detection
      const earScore = avgEAR < EAR_THRESHOLD 
        ? Math.min(100, ((EAR_THRESHOLD - avgEAR) / EAR_THRESHOLD) * 150) 
        : 0;
      
      // 3. Yawn Score (20% weight)
      const yawnScore = Math.min(100, (yawnCount / 5) * 100); // 5 yawns = max contribution
      
      // 4. Blink Rate Score (10% weight) - Low blink rate indicates fatigue
      const normalBlinkRate = 15;
      const blinkScore = newBlinkRate < normalBlinkRate 
        ? Math.min(100, ((normalBlinkRate - newBlinkRate) / normalBlinkRate) * 80) 
        : 0;
      
      // Weighted fatigue calculation
      const calculatedFatigue = Math.round(
        (perclosScore * 0.4) + 
        (earScore * 0.3) + 
        (yawnScore * 0.2) + 
        (blinkScore * 0.1)
      );
      
      setFatigueLevel(calculatedFatigue);
      
      // ========== DETERMINE ALERT LEVEL ==========
      let newAlertLevel: 0 | 1 | 2 | 3 = 0;
      
      if (calculatedFatigue > 75 || avgEAR < 0.18) {
        newAlertLevel = 3; // Critical - Immediate intervention
      } else if (calculatedFatigue > 50 || avgEAR < 0.21) {
        newAlertLevel = 2; // High - Strong warning
      } else if (calculatedFatigue > 25 || avgEAR < 0.24) {
        newAlertLevel = 1; // Moderate - Early intervention
      } else {
        newAlertLevel = 0; // Normal - All clear
      }
      
      setAlertLevel(newAlertLevel);
      
      // Emit metrics to parent component
      onMetricsUpdate({
        fatigueLevel: calculatedFatigue,
        alertLevel: newAlertLevel
      });
      
      // Draw landmarks on canvas
      ctx.save();
      ctx.scale(-1, 1);
      ctx.translate(-canvas.width, 0);
      
      // Draw eyes
      const eyeColor = avgEAR > EAR_THRESHOLD ? '#00ff00' : '#ff0000';
      drawLandmarks(ctx, leftEyeLandmarks, eyeColor, canvas.width, canvas.height);
      drawLandmarks(ctx, rightEyeLandmarks, eyeColor, canvas.width, canvas.height);
      
      // Draw mouth
      const mouthColor = mar < MAR_THRESHOLD ? '#00ff00' : '#ffa500';
      drawLandmarks(ctx, mouthLandmarks, mouthColor, canvas.width, canvas.height);
      
      ctx.restore();
    } else {
      setFaceDetected(false);
      // Reset to normal when no face detected
      setFatigueLevel(0);
      setAlertLevel(0);
      onMetricsUpdate({
        fatigueLevel: 0,
        alertLevel: 0
      });
    }
  };
  
  const drawLandmarks = (ctx: CanvasRenderingContext2D, landmarks: any[], color: string, width: number, height: number) => {
    ctx.fillStyle = color;
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    
    // Draw points
    landmarks.forEach(landmark => {
      const x = landmark.x * width;
      const y = landmark.y * height;
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, 2 * Math.PI);
      ctx.fill();
    });
    
    // Draw lines connecting points
    ctx.beginPath();
    landmarks.forEach((landmark, i) => {
      const x = landmark.x * width;
      const y = landmark.y * height;
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.closePath();
    ctx.stroke();
  };
  
  // Start/stop camera
  const startCamera = async () => {
    try {
      setCameraError(null);
      
      if (mediaPipeError) {
        toast({
          title: "Cannot Start Camera",
          description: "Face detection models failed to load. Please refresh the page.",
          variant: "destructive",
        });
        return;
      }
      
      if (mediaPipeLoading) {
        toast({
          title: "Please Wait",
          description: "Face detection models are still loading...",
        });
        return;
      }
      
      if (videoRef.current && faceMeshRef.current) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: "user"
          }
        });
        
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        
        // Wait for video to be ready
        await new Promise((resolve) => {
          if (videoRef.current) {
            videoRef.current.onloadedmetadata = resolve;
          }
        });
        
        // Set canvas size
        if (canvasRef.current && videoRef.current) {
          canvasRef.current.width = videoRef.current.videoWidth;
          canvasRef.current.height = videoRef.current.videoHeight;
        }
        
        // Start MediaPipe camera
        cameraRef.current = new CameraUtils(videoRef.current, {
          onFrame: async () => {
            if (faceMeshRef.current && videoRef.current) {
              await faceMeshRef.current.send({ image: videoRef.current });
            }
          },
          width: 1280,
          height: 720
        });
        
        await cameraRef.current.start();
        
        setIsCameraActive(true);
        toast({
          title: "Camera Active",
          description: "Real-time face detection started",
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
    if (cameraRef.current) {
      cameraRef.current.stop();
      cameraRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
    setFaceDetected(false);
    toast({
      title: "Camera Stopped",
      description: "Face monitoring paused",
    });
  };

  // Cleanup camera on unmount
  useEffect(() => {
    return () => {
      if (cameraRef.current) {
        cameraRef.current.stop();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

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
          disabled={mediaPipeLoading || !!mediaPipeError}
        >
          {isCameraActive ? (
            <>
              <CameraOff className="w-4 h-4 mr-2" />
              Stop Camera
            </>
          ) : mediaPipeLoading ? (
            <>
              <Camera className="w-4 h-4 mr-2 animate-pulse" />
              Loading Models...
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
          style={{ transform: 'scaleX(-1)', display: isCameraActive ? 'block' : 'none' }}
        />
        
        {/* Canvas for landmark drawing */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full object-cover"
          style={{ transform: 'scaleX(-1)', display: isCameraActive ? 'block' : 'none' }}
        />

        {/* Overlay when camera is off */}
        {!isCameraActive && (
          <div className="absolute inset-0 flex items-center justify-center bg-secondary/50 backdrop-blur-sm">
            <div className="text-center">
              {mediaPipeError ? (
                <>
                  <AlertTriangle className="w-16 h-16 text-destructive mx-auto mb-4" />
                  <p className="text-lg font-semibold text-destructive mb-2">
                    Face Detection Error
                  </p>
                  <p className="text-sm text-muted-foreground mb-4">
                    {mediaPipeError}
                  </p>
                  <Button onClick={() => window.location.reload()} size="sm">
                    Refresh Page
                  </Button>
                </>
              ) : mediaPipeLoading ? (
                <>
                  <Camera className="w-16 h-16 text-muted-foreground mx-auto mb-4 animate-pulse" />
                  <p className="text-sm text-muted-foreground">
                    Loading AI models...
                  </p>
                </>
              ) : (
                <>
                  <Camera className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <p className="text-sm text-muted-foreground">
                    {cameraError || "Click 'Start Camera' to begin real-time face detection"}
                  </p>
                </>
              )}
            </div>
          </div>
        )}
        
        {/* No face detected warning */}
        {isCameraActive && !faceDetected && (
          <div className="absolute inset-0 flex items-center justify-center bg-destructive/10 backdrop-blur-sm">
            <div className="text-center">
              <AlertTriangle className="w-16 h-16 text-destructive mx-auto mb-4 animate-pulse" />
              <p className="text-lg font-semibold text-destructive">⚠ NO FACE DETECTED</p>
              <p className="text-sm text-muted-foreground mt-2">Position your face in the camera view</p>
            </div>
          </div>
        )}

        {/* Face Detection Status */}
        {isCameraActive && faceDetected && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2">
            <Badge variant={ear < EAR_THRESHOLD ? "destructive" : "default"} className="text-xs">
              {ear < EAR_THRESHOLD ? "⚠ DROWSINESS DETECTED" : "✓ Face Tracked"}
            </Badge>
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
        {isCameraActive && faceDetected && ear < EAR_THRESHOLD && (
          <div className="absolute top-3 right-3 bg-destructive/80 backdrop-blur-sm px-3 py-1.5 rounded-full flex items-center gap-2 animate-pulse">
            <AlertTriangle className="w-4 h-4 text-destructive-foreground" />
            <span className="text-xs font-semibold text-destructive-foreground">🚨 DROWSINESS ALERT</span>
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
          ear < 0.18 || perclos > 30 ? "bg-destructive/10 border-destructive/30" :
          ear < EAR_THRESHOLD || perclos > 20 ? "bg-warning/10 border-warning/30" :
          ear < 0.24 || perclos > 15 ? "bg-alert/10 border-alert/30" :
          "bg-success/10 border-success/30"
        }`}>
          <div className="flex items-start gap-2">
            <AlertTriangle className={`w-4 h-4 mt-0.5 ${
              ear < 0.18 || perclos > 30 ? "text-destructive" :
              ear < EAR_THRESHOLD || perclos > 20 ? "text-warning" :
              ear < 0.24 || perclos > 15 ? "text-alert" :
              "text-success"
            }`} />
            <div className="flex-1">
              <div className="text-sm font-semibold text-foreground mb-1">AI Decision</div>
              <div className="text-xs text-muted-foreground">
                {!isCameraActive && "Start camera to begin real-time drowsiness detection."}
                {isCameraActive && !faceDetected && "No face detected. Position yourself in front of the camera."}
                {isCameraActive && faceDetected && ear < 0.18 && "🚨 CRITICAL: Severe drowsiness detected! Immediate intervention required."}
                {isCameraActive && faceDetected && ear >= 0.18 && ear < EAR_THRESHOLD && "⚠ WARNING: High fatigue detected. Recommend rest break soon."}
                {isCameraActive && faceDetected && ear >= EAR_THRESHOLD && ear < 0.24 && "⚠ CAUTION: Early fatigue signs. Monitor closely."}
                {isCameraActive && faceDetected && ear >= 0.24 && "✅ NORMAL: Driver alert. All facial parameters within normal range."}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default FaceDetection;
