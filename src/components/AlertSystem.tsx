import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bell, Volume2, Shield, AlertTriangle } from "lucide-react";

interface AlertSystemProps {
  alertLevel: 0 | 1 | 2 | 3;
  fatigueLevel: number;
}

const AlertSystem = ({ alertLevel, fatigueLevel }: AlertSystemProps) => {
  const stages = [
    {
      level: 1,
      title: "Early Intervention",
      description: "Subtle alerts and gentle notifications",
      icon: Bell,
      color: "warning",
      active: alertLevel >= 1,
    },
    {
      level: 2,
      title: "Strong Alert",
      description: "Audio-visual warnings and recommendations",
      icon: Volume2,
      color: "alert",
      active: alertLevel >= 2,
    },
    {
      level: 3,
      title: "Safety Takeover",
      description: "ADAS engagement and emergency protocols",
      icon: Shield,
      color: "destructive",
      active: alertLevel >= 3,
    },
  ];

  const getAlertMessage = () => {
    if (alertLevel === 0) {
      return "All systems nominal. Driver wellness within safe parameters.";
    }
    if (alertLevel === 1) {
      return "Minor fatigue detected. Consider taking a short break soon.";
    }
    if (alertLevel === 2) {
      return "Moderate fatigue detected. Please pull over at the next safe location.";
    }
    return "Critical alert! High fatigue level. Initiating safety protocols.";
  };

  return (
    <Card
      className={`p-6 border-2 transition-all duration-500 ${
        alertLevel === 0
          ? "bg-gradient-card border-border"
          : alertLevel === 1
          ? "bg-warning/5 border-warning/30 shadow-glow-warning"
          : alertLevel === 2
          ? "bg-alert/5 border-alert/30 shadow-glow-alert animate-pulse"
          : "bg-destructive/5 border-destructive/30 shadow-glow-alert animate-pulse"
      }`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className={`p-3 rounded-full ${
              alertLevel === 0
                ? "bg-success/10"
                : alertLevel === 1
                ? "bg-warning/10"
                : alertLevel === 2
                ? "bg-alert/10"
                : "bg-destructive/10"
            }`}
          >
            <AlertTriangle
              className={`w-6 h-6 ${
                alertLevel === 0
                  ? "text-success"
                  : alertLevel === 1
                  ? "text-warning"
                  : alertLevel === 2
                  ? "text-alert"
                  : "text-destructive"
              }`}
            />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">Alert Status</h2>
            <p className="text-sm text-muted-foreground">
              3-Stage intervention system
            </p>
          </div>
        </div>
        <Badge
          className={`px-3 py-1 ${
            alertLevel === 0
              ? "bg-success text-success-foreground"
              : alertLevel === 1
              ? "bg-warning text-warning-foreground"
              : alertLevel === 2
              ? "bg-alert text-alert-foreground"
              : "bg-destructive text-destructive-foreground"
          }`}
        >
          Stage {alertLevel === 0 ? "-" : alertLevel}
        </Badge>
      </div>

      <div className="mb-6 p-4 bg-background/50 rounded-lg">
        <p className="text-foreground font-medium">{getAlertMessage()}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stages.map((stage) => {
          const Icon = stage.icon;
          return (
            <div
              key={stage.level}
              className={`p-4 rounded-lg border-2 transition-all duration-300 ${
                stage.active
                  ? stage.color === "warning"
                    ? "bg-warning/10 border-warning shadow-glow-warning"
                    : stage.color === "alert"
                    ? "bg-alert/10 border-alert shadow-glow-alert"
                    : "bg-destructive/10 border-destructive shadow-glow-alert"
                  : "bg-secondary/30 border-border"
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <Icon
                  className={`w-5 h-5 ${
                    stage.active
                      ? stage.color === "warning"
                        ? "text-warning"
                        : stage.color === "alert"
                        ? "text-alert"
                        : "text-destructive"
                      : "text-muted-foreground"
                  }`}
                />
                <span
                  className={`text-sm font-semibold ${
                    stage.active ? "text-foreground" : "text-muted-foreground"
                  }`}
                >
                  Stage {stage.level}
                </span>
              </div>
              <h3
                className={`font-semibold mb-1 ${
                  stage.active ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                {stage.title}
              </h3>
              <p className="text-xs text-muted-foreground">{stage.description}</p>
              {stage.active && (
                <div className="mt-3 flex items-center gap-2">
                  <div
                    className={`w-2 h-2 rounded-full animate-pulse ${
                      stage.color === "warning"
                        ? "bg-warning"
                        : stage.color === "alert"
                        ? "bg-alert"
                        : "bg-destructive"
                    }`}
                  />
                  <span className="text-xs text-foreground font-medium">Active</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
};

export default AlertSystem;
