import { Card } from "@/components/ui/card";
import { Camera, Gauge, Watch, CheckCircle, AlertCircle } from "lucide-react";

interface SensorMonitoringProps {
  alertLevel: 0 | 1 | 2 | 3;
}

const SensorMonitoring = ({ alertLevel }: SensorMonitoringProps) => {
  const sensors = [
    {
      name: "NIR Camera",
      icon: Camera,
      status: "active",
      metrics: ["EAR: 0.28", "PERCLOS: 12%"],
      description: "Facial cue detection",
    },
    {
      name: "Steering Data",
      icon: Gauge,
      status: "active",
      metrics: ["Entropy: 0.82", "Corrections: 3/min"],
      description: "Behavioral analysis",
    },
    {
      name: "Seat Sensors",
      icon: Watch,
      status: "active",
      metrics: ["HRV: 45ms", "GSR: Normal"],
      description: "Biometric tracking",
    },
  ];

  return (
    <Card className="p-6 bg-gradient-card border-border backdrop-blur-sm h-full">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-foreground mb-2">Sensor Array</h2>
        <p className="text-sm text-muted-foreground">Multi-modal input monitoring</p>
      </div>

      <div className="space-y-4">
        {sensors.map((sensor, index) => {
          const Icon = sensor.icon;
          const isActive = sensor.status === "active";

          return (
            <div
              key={index}
              className="p-4 bg-secondary/50 rounded-lg border border-border transition-all duration-300 hover:bg-secondary/70"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-background rounded-lg">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{sensor.name}</h3>
                    <p className="text-xs text-muted-foreground">{sensor.description}</p>
                  </div>
                </div>
                {isActive ? (
                  <CheckCircle className="w-5 h-5 text-success" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-warning" />
                )}
              </div>

              <div className="space-y-2">
                {sensor.metrics.map((metric, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="text-muted-foreground">{metric.split(":")[0]}:</span>
                    <span className="font-mono text-accent">{metric.split(":")[1]}</span>
                  </div>
                ))}
              </div>

              {/* Status indicator */}
              <div className="mt-3 flex items-center gap-2">
                <div
                  className={`w-2 h-2 rounded-full ${
                    isActive ? "bg-success animate-pulse" : "bg-muted"
                  }`}
                />
                <span className="text-xs text-muted-foreground">
                  {isActive ? "Streaming" : "Offline"}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Processing Status */}
      <div className="mt-6 p-4 bg-primary/10 border border-primary/20 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-2 h-2 bg-accent rounded-full animate-pulse" />
          <span className="text-sm font-semibold text-foreground">BiViT Fusion Active</span>
        </div>
        <p className="text-xs text-muted-foreground">
          Edge AI processing sensor inputs in real-time
        </p>
      </div>
    </Card>
  );
};

export default SensorMonitoring;
