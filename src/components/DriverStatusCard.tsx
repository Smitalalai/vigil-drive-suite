import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, Heart, Brain } from "lucide-react";

interface DriverStatusCardProps {
  fatigueLevel: number;
  heartRate: number;
  stressLevel: number;
  alertLevel: 0 | 1 | 2 | 3;
}

const DriverStatusCard = ({
  fatigueLevel,
  heartRate,
  stressLevel,
  alertLevel,
}: DriverStatusCardProps) => {
  const getStatusColor = () => {
    if (alertLevel === 0) return "success";
    if (alertLevel === 1) return "warning";
    if (alertLevel === 2) return "alert";
    return "destructive";
  };

  const getStatusText = () => {
    if (alertLevel === 0) return "Normal";
    if (alertLevel === 1) return "Minor Concern";
    if (alertLevel === 2) return "Moderate Alert";
    return "Critical Alert";
  };

  const getStatusBadgeClass = () => {
    if (alertLevel === 0) return "bg-success text-success-foreground shadow-glow-success";
    if (alertLevel === 1) return "bg-warning text-warning-foreground shadow-glow-warning";
    if (alertLevel === 2) return "bg-alert text-alert-foreground shadow-glow-alert";
    return "bg-destructive text-destructive-foreground shadow-glow-alert";
  };

  return (
    <Card className="p-6 bg-gradient-card border-border backdrop-blur-sm">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Driver Status</h2>
          <p className="text-muted-foreground">Real-time physiological monitoring</p>
        </div>
        <Badge className={`${getStatusBadgeClass()} px-4 py-2 text-sm font-semibold`}>
          {getStatusText()}
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Fatigue Level */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-primary" />
            <span className="text-sm font-medium text-muted-foreground">Fatigue Level</span>
          </div>
          <div className="relative">
            <div className="text-4xl font-bold text-foreground">
              {Math.round(fatigueLevel)}%
            </div>
            <div className="mt-3 h-2 bg-secondary rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${
                  fatigueLevel < 40
                    ? "bg-success"
                    : fatigueLevel < 60
                    ? "bg-warning"
                    : fatigueLevel < 80
                    ? "bg-alert"
                    : "bg-destructive"
                }`}
                style={{ width: `${fatigueLevel}%` }}
              />
            </div>
          </div>
        </div>

        {/* Heart Rate */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-accent" />
            <span className="text-sm font-medium text-muted-foreground">Heart Rate</span>
          </div>
          <div className="relative">
            <div className="text-4xl font-bold text-foreground">
              {Math.round(heartRate)}
              <span className="text-xl text-muted-foreground ml-1">bpm</span>
            </div>
            <div className="mt-3 flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="flex-1 h-8 bg-secondary rounded animate-pulse"
                  style={{
                    animationDelay: `${i * 0.15}s`,
                    opacity: 0.3 + (i * 0.15),
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Stress Level */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />
            <span className="text-sm font-medium text-muted-foreground">Stress Index</span>
          </div>
          <div className="relative">
            <div className="text-4xl font-bold text-foreground">
              {Math.round(stressLevel)}%
            </div>
            <div className="mt-3 h-2 bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-primary transition-all duration-500"
                style={{ width: `${stressLevel}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Driver Visualization */}
      <div className="mt-6 pt-6 border-t border-border">
        <div className="flex items-center justify-center">
          <div className="relative w-32 h-32">
            <div
              className={`absolute inset-0 rounded-full border-4 transition-all duration-500 ${
                alertLevel === 0
                  ? "border-success shadow-glow-success"
                  : alertLevel === 1
                  ? "border-warning shadow-glow-warning animate-pulse"
                  : alertLevel === 2
                  ? "border-alert shadow-glow-alert animate-pulse"
                  : "border-destructive shadow-glow-alert animate-pulse"
              }`}
            />
            <div className="absolute inset-2 rounded-full bg-gradient-card flex items-center justify-center">
              <span className="text-2xl">👤</span>
            </div>
          </div>
        </div>
        <p className="text-center text-sm text-muted-foreground mt-4">
          Monitoring active sensors and biometric data
        </p>
      </div>
    </Card>
  );
};

export default DriverStatusCard;
