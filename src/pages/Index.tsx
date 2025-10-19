import { useState, useEffect } from "react";
import DriverStatusCard from "@/components/DriverStatusCard";
import SensorMonitoring from "@/components/SensorMonitoring";
import AlertSystem from "@/components/AlertSystem";
import MetricsChart from "@/components/MetricsChart";
import SystemStatus from "@/components/SystemStatus";

const Index = () => {
  const [alertLevel, setAlertLevel] = useState<0 | 1 | 2 | 3>(0);
  const [fatigueLevel, setFatigueLevel] = useState(20);
  const [heartRate, setHeartRate] = useState(72);
  const [stressLevel, setStressLevel] = useState(15);

  // Simulate real-time data updates
  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate gradual fatigue increase
      setFatigueLevel((prev) => {
        const newValue = prev + (Math.random() - 0.3) * 5;
        return Math.max(0, Math.min(100, newValue));
      });

      // Simulate heart rate variation
      setHeartRate((prev) => {
        const newValue = prev + (Math.random() - 0.5) * 3;
        return Math.max(60, Math.min(100, newValue));
      });

      // Simulate stress level changes
      setStressLevel((prev) => {
        const newValue = prev + (Math.random() - 0.4) * 4;
        return Math.max(0, Math.min(100, newValue));
      });
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  // Determine alert level based on fatigue
  useEffect(() => {
    if (fatigueLevel > 80) {
      setAlertLevel(3);
    } else if (fatigueLevel > 60) {
      setAlertLevel(2);
    } else if (fatigueLevel > 40) {
      setAlertLevel(1);
    } else {
      setAlertLevel(0);
    }
  }, [fatigueLevel]);

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Driver Wellness Monitor
            </h1>
            <p className="text-muted-foreground">
              AI-Enhanced Real-Time Safety System
            </p>
          </div>
          <SystemStatus />
        </header>

        {/* Alert System */}
        <AlertSystem alertLevel={alertLevel} fatigueLevel={fatigueLevel} />

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Driver Status - Takes 2 columns on large screens */}
          <div className="lg:col-span-2">
            <DriverStatusCard
              fatigueLevel={fatigueLevel}
              heartRate={heartRate}
              stressLevel={stressLevel}
              alertLevel={alertLevel}
            />
          </div>

          {/* Sensor Monitoring */}
          <div>
            <SensorMonitoring alertLevel={alertLevel} />
          </div>
        </div>

        {/* Metrics Chart */}
        <MetricsChart
          fatigueLevel={fatigueLevel}
          heartRate={heartRate}
          stressLevel={stressLevel}
        />
      </div>
    </div>
  );
};

export default Index;
