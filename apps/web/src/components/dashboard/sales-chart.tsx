// apps/web/src/components/dashboard/sales-chart.tsx

'use client';

// Sales trend chart with 7/30 day toggle.
// Uses recharts AreaChart with a smooth gradient.

import { useState } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { TrendingUp } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useSalesChart } from '@/hooks/use-dashboard';
import { formatMoneyCompact, formatNumber } from '@/lib/format';
import { cn } from '@/lib/utils';

type Range = 7 | 30;

export function SalesChart() {
  const [range, setRange] = useState<Range>(7);
  const { data, isLoading } = useSalesChart(range);

  const totalSales = data?.reduce((s, p) => s + p.totalSales, 0) ?? 0;
  const totalQuantity = data?.reduce((s, p) => s + p.totalQuantity, 0) ?? 0;

  return (
    <Card>
      <CardHeader className="pb-3 flex flex-row items-start justify-between space-y-0 gap-2">
        <div>
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="size-4 text-emerald-600" />
            Sales Trend
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-1">
            {formatMoneyCompact(totalSales)} · {formatNumber(totalQuantity, 0)} pcs
          </p>
        </div>

        {/* Range toggle */}
        <div className="inline-flex rounded-lg border bg-muted/40 p-0.5">
          {([7, 30] as Range[]).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRange(r)}
              className={cn(
                'px-2.5 h-7 rounded-md text-xs font-medium transition-colors',
                range === r
                  ? 'bg-background shadow-sm text-foreground'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {r}d
            </button>
          ))}
        </div>
      </CardHeader>

      <CardContent className="pl-0 pr-2">
        {isLoading ? (
          <Skeleton className="h-[220px] w-full rounded-md" />
        ) : !data || data.length === 0 ? (
          <p className="text-sm text-muted-foreground py-12 text-center">
            No sales data yet
          </p>
        ) : (
          <div className="h-[220px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={data}
                margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="salesFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  className="stroke-border/60"
                />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: 'currentColor' }}
                  tickFormatter={(v: string) => v.slice(5)} // MM-DD
                  className="text-muted-foreground"
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: 'currentColor' }}
                  tickFormatter={(v: number) => formatMoneyCompact(v)}
                  width={48}
                  className="text-muted-foreground"
                />
                <Tooltip
                  contentStyle={{
                    background: 'hsl(var(--color-card))',
                    border: '1px solid hsl(var(--color-border))',
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  labelFormatter={(label) => `Date: ${label}`}
                  formatter={(value, name) => {
                    const numericValue = Number(value ?? 0);

                    if (name === 'totalSales') {
                        return [formatMoneyCompact(numericValue), 'Sales'];
                    }

                    return [numericValue, 'Qty'];
                    }}
                />
                <Area
                  type="monotone"
                  dataKey="totalSales"
                  stroke="#10b981"
                  strokeWidth={2}
                  fill="url(#salesFill)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
