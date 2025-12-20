/**
 * ChartCard Component
 *
 * Universal card for displaying charts and visualizations
 * Supports different chart types via configuration
 *
 * Note: Actual chart implementation will use Recharts library
 * For now, this is a placeholder structure
 */

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  BarChart,
  Bar,
  AreaChart,
  Area,
} from "recharts";

export type ChartType = "line" | "bar" | "pie" | "area";

export interface ChartCardData {
  title: string;
  subtitle?: string;
  chartType: ChartType;
  data: {
    labels: string[]; // These will be mapped to "name" prop for X-Axis
    datasets: {
      label: string;
      data: number[];
      color?: string;
    }[];
  };
  insight?: string;
}

interface ChartCardProps {
  data: ChartCardData;
}

export default function ChartCard({ data }: ChartCardProps) {
  const { title, subtitle, chartType, insight } = data;

  // Transform data for Recharts
  // Recharts expects an array of objects, e.g., [{name: "Jan", uv: 4000, pv: 2400}, ...]
  const chartData = data.data.labels.map((label, index) => {
    const point: Record<string, string | number> = { name: label };
    data.data.datasets.forEach((dataset) => {
      point[dataset.label] = dataset.data[index] || 0;
    });
    return point;
  });

  // Get color for dataset
  const getColor = (colorName?: string) => {
    switch (colorName) {
      case "primary":
        return "hsl(var(--primary))";
      case "red":
        return "#ef4444";
      case "green":
        return "#22c55e";
      default:
        return "hsl(var(--primary))";
    }
  };

  const renderChart = () => {
    const CommonAxis = (
      <>
        <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.2} />
        <XAxis
          dataKey="name"
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          className="text-muted-foreground"
        />
        <YAxis
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `${value}`}
          className="text-muted-foreground"
        />
        <Tooltip
          contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))", borderRadius: "8px" }}
          itemStyle={{ color: "hsl(var(--foreground))" }}
          labelStyle={{ color: "hsl(var(--muted-foreground))" }}
        />
      </>
    );

    switch (chartType) {
      case "line":
        return (
          <LineChart data={chartData}>
            {CommonAxis}
            {data.data.datasets.map((dataset, i) => (
              <Line
                key={i}
                type="monotone"
                dataKey={dataset.label}
                stroke={getColor(dataset.color)}
                strokeWidth={2}
                dot={{ r: 4, fill: getColor(dataset.color) }}
                activeDot={{ r: 6 }}
              />
            ))}
          </LineChart>
        );
      case "bar":
        return (
          <BarChart data={chartData}>
            {CommonAxis}
            {data.data.datasets.map((dataset, i) => (
              <Bar key={i} dataKey={dataset.label} fill={getColor(dataset.color)} radius={[4, 4, 0, 0]} />
            ))}
          </BarChart>
        );
      case "area":
        return (
          <AreaChart data={chartData}>
            {CommonAxis}
            {data.data.datasets.map((dataset, i) => (
              <Area
                key={i}
                type="monotone"
                dataKey={dataset.label}
                stroke={getColor(dataset.color)}
                fill={getColor(dataset.color)}
                fillOpacity={0.2}
              />
            ))}
          </AreaChart>
        );
      // Fallback/TODO for pie
      default:
        return (
          <div className="h-full flex items-center justify-center text-muted-foreground">
            Wykres {chartType} nie jest jeszcze obsługiwany.
          </div>
        );
    }
  };

  return (
    <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
      {/* Header */}
      <div className="mb-4">
        <h3 className="font-bold text-foreground text-lg mb-1">{title}</h3>
        {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
      </div>

      {/* Chart Canvas */}
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          {renderChart()}
        </ResponsiveContainer>
      </div>

      {/* AI Insight */}
      {insight && (
        <div className="mt-4 bg-accent/10 rounded-xl p-4 border border-accent/30">
          <p className="text-sm text-foreground leading-relaxed">
            💡 <span className="font-semibold">Insight:</span> {insight}
          </p>
        </div>
      )}
    </div>
  );
}
