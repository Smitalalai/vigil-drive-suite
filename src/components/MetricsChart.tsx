import { Card } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface MetricsChartProps {
  fatigueLevel: number;
  heartRate: number;
  stressLevel: number;
}

interface DataPoint {
  time: string;
  fatigue: number;
  heartRate: number;
  stress: number;
}

const MetricsChart = ({ fatigueLevel, heartRate, stressLevel }: MetricsChartProps) => {
  const [data, setData] = useState<DataPoint[]>([]);

  useEffect(() => {
    const now = new Date();
    const timeString = `${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}`;

    setData((prevData) => {
      const newData = [
        ...prevData,
        {
          time: timeString,
          fatigue: Math.round(fatigueLevel),
          heartRate: Math.round(heartRate),
          stress: Math.round(stressLevel),
        },
      ];

      // Keep only last 15 data points
      return newData.slice(-15);
    });
  }, [fatigueLevel, heartRate, stressLevel]);

  return (
    <Card className="p-6 bg-gradient-card border-border backdrop-blur-sm">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-foreground mb-2">
          Real-Time Metrics
        </h2>
        <p className="text-sm text-muted-foreground">
          Continuous physiological monitoring over time
        </p>
      </div>

      <div className="w-full h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="time"
              stroke="hsl(var(--muted-foreground))"
              tick={{ fill: "hsl(var(--muted-foreground))" }}
            />
            <YAxis
              stroke="hsl(var(--muted-foreground))"
              tick={{ fill: "hsl(var(--muted-foreground))" }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "0.5rem",
                color: "hsl(var(--foreground))",
              }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="fatigue"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              dot={false}
              name="Fatigue %"
            />
            <Line
              type="monotone"
              dataKey="heartRate"
              stroke="hsl(var(--accent))"
              strokeWidth={2}
              dot={false}
              name="Heart Rate"
            />
            <Line
              type="monotone"
              dataKey="stress"
              stroke="hsl(var(--warning))"
              strokeWidth={2}
              dot={false}
              name="Stress %"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-6 grid grid-cols-3 gap-4">
        <div className="text-center">
          <div className="text-sm text-muted-foreground mb-1">Avg Fatigue</div>
          <div className="text-2xl font-bold text-primary">
            {data.length > 0
              ? Math.round(
                  data.reduce((sum, d) => sum + d.fatigue, 0) / data.length
                )
              : 0}
            %
          </div>
        </div>
        <div className="text-center">
          <div className="text-sm text-muted-foreground mb-1">Avg Heart Rate</div>
          <div className="text-2xl font-bold text-accent">
            {data.length > 0
              ? Math.round(
                  data.reduce((sum, d) => sum + d.heartRate, 0) / data.length
                )
              : 0}{" "}
            bpm
          </div>
        </div>
        <div className="text-center">
          <div className="text-sm text-muted-foreground mb-1">Avg Stress</div>
          <div className="text-2xl font-bold text-warning">
            {data.length > 0
              ? Math.round(
                  data.reduce((sum, d) => sum + d.stress, 0) / data.length
                )
              : 0}
            %
          </div>
        </div>
      </div>
    </Card>
  );
};

export default MetricsChart;
