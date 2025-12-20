/**
 * ChartCard Component
 *
 * Universal card for displaying charts and visualizations
 * Supports different chart types via configuration
 *
 * Note: Actual chart implementation will use Recharts library
 * For now, this is a placeholder structure
 */

export type ChartType = "line" | "bar" | "pie" | "area";

export interface ChartCardData {
  title: string;
  subtitle?: string;
  chartType: ChartType;
  data: {
    labels: string[];
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

  return (
    <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
      {/* Header */}
      <div className="mb-4">
        <h3 className="font-bold text-foreground text-lg mb-1">{title}</h3>
        {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
      </div>

      {/* Chart placeholder */}
      <div className="h-64 bg-background rounded-xl flex items-center justify-center border border-border">
        <div className="text-center text-muted-foreground">
          <div className="text-4xl mb-2">📊</div>
          <p className="text-sm">
            Wykres{" "}
            {chartType === "line"
              ? "liniowy"
              : chartType === "bar"
                ? "słupkowy"
                : chartType === "pie"
                  ? "kołowy"
                  : "obszarowy"}
          </p>
          <p className="text-xs mt-1">TODO: Integracja z Recharts</p>
        </div>
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
