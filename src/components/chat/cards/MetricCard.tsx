/**
 * MetricCard Component
 *
 * Universal card for displaying key metrics with optional breakdown
 * Use cases:
 * - Total expenses
 * - Member balances summary
 * - Any large number + context
 */

import { Button } from "@/components/ui/button";

export interface MetricCardData {
  title: string;
  subtitle?: string;
  metric: {
    value: number;
    label: string;
    currency?: string;
    trend?: {
      direction: "up" | "down" | "neutral";
      percentage: number;
      label: string;
    };
  };
  breakdown?: {
    label: string;
    items: {
      name: string;
      value: number;
      currency?: string;
      color?: "red" | "green" | "neutral";
    }[];
  };
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface MetricCardProps {
  data: MetricCardData;
}

export default function MetricCard({ data }: MetricCardProps) {
  const { title, subtitle, metric, breakdown, action } = data;

  // Format number with locale
  const formatNumber = (num: number, currency?: string) => {
    const formatted = num.toLocaleString("pl-PL", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return currency ? `${formatted} ${currency}` : formatted;
  };

  // Get trend color
  const getTrendColor = (direction: "up" | "down" | "neutral") => {
    if (direction === "up") return "text-red-600";
    if (direction === "down") return "text-green-600";
    return "text-muted-foreground";
  };

  // Get value color
  const getValueColor = (color?: "red" | "green" | "neutral") => {
    if (color === "red") return "text-red-600";
    if (color === "green") return "text-green-600";
    return "text-foreground";
  };

  return (
    <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
      {/* Header */}
      <div className="mb-4">
        <h3 className="font-bold text-foreground text-lg mb-1">{title}</h3>
        {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
      </div>

      {/* Main Metric */}
      <div className="mb-6">
        <p className="text-sm text-muted-foreground mb-1">{metric?.label || "Wartość"}</p>
        <p className="text-4xl font-bold text-primary">
          {metric ? formatNumber(metric.value, metric.currency) : "---"}
        </p>

        {/* Trend indicator */}
        {metric?.trend && (
          <div className={`mt-2 flex items-center gap-2 ${getTrendColor(metric.trend.direction)}`}>
            {metric.trend.direction === "up" && <span>↑</span>}
            {metric.trend.direction === "down" && <span>↓</span>}
            <span className="font-semibold">
              {metric.trend.percentage > 0 ? "+" : ""}
              {metric.trend.percentage.toFixed(1)}%
            </span>
            <span className="text-sm">{metric.trend.label}</span>
          </div>
        )}
      </div>

      {/* Breakdown */}
      {breakdown && breakdown.items.length > 0 && (
        <div className="border-t border-border pt-4">
          <p className="text-xs text-muted-foreground mb-2 font-semibold">{breakdown.label}</p>
          <div className="space-y-2">
            {breakdown.items.map((item, index) => (
              <div key={index} className="flex justify-between text-sm">
                <span className="text-foreground/80">{item.name}</span>
                <span className={`font-semibold ${getValueColor(item.color)}`}>
                  {formatNumber(item.value, item.currency)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action button */}
      {action && (
        <Button className="mt-4 w-full" variant="default" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
}
