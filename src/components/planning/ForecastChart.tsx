'use client';

import { ComposedChart, Bar, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart } from 'recharts';

interface ChartData {
  period: string;
  actual?: number | null;
  forecast?: number;
  confidenceLow?: number;
  confidenceHigh?: number;
  previous?: number;
}

interface ForecastChartProps {
  data: ChartData[];
  height?: number;
  showConfidence?: boolean;
  showPrevious?: boolean;
}

export function ForecastChart({
  data,
  height = 300,
  showConfidence = true,
  showPrevious = true,
}: ForecastChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <ComposedChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey="period" stroke="#64748b" />
        <YAxis stroke="#64748b" />
        <Tooltip
          contentStyle={{
            backgroundColor: '#1e293b',
            border: 'none',
            borderRadius: '8px',
            color: '#f1f5f9',
          }}
        />
        <Legend />

        {showConfidence && (
          <Area
            type="monotone"
            dataKey="confidenceLow"
            fill="#93c5fd"
            stroke="none"
            isAnimationActive={false}
            name="Confidence Interval"
          />
        )}

        <Bar dataKey="actual" fill="#3b82f6" name="Actual" radius={[4, 4, 0, 0]} />
        <Line
          type="monotone"
          dataKey="forecast"
          stroke="#3b82f6"
          strokeDasharray="5 5"
          name="Forecast"
          strokeWidth={2}
        />

        {showPrevious && (
          <Line
            type="monotone"
            dataKey="previous"
            stroke="#9ca3af"
            strokeWidth={2}
            name="Previous Forecast"
            opacity={0.6}
          />
        )}
      </ComposedChart>
    </ResponsiveContainer>
  );
}
