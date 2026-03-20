'use client';

interface InventoryGaugeProps {
  current: number;
  reorderPoint: number;
  safetyStock: number;
  max?: number;
  unit?: string;
}

export function InventoryGauge({
  current,
  reorderPoint,
  safetyStock,
  max,
  unit = 'units',
}: InventoryGaugeProps) {
  const maxValue = max || reorderPoint * 2;
  const currentPct = (current / maxValue) * 100;
  const reorderPct = (reorderPoint / maxValue) * 100;
  const safetyPct = (safetyStock / maxValue) * 100;

  let statusColor = 'bg-emerald-500';
  let statusText = 'Healthy';

  if (current < safetyStock) {
    statusColor = 'bg-red-500';
    statusText = 'Critical';
  } else if (current < reorderPoint) {
    statusColor = 'bg-amber-500';
    statusText = 'Low Stock';
  }

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium text-slate-700">Inventory Level</span>
        <span className={`text-xs font-semibold px-2 py-1 rounded ${statusColor} text-white`}>
          {statusText}
        </span>
      </div>

      <div className="relative h-8 bg-slate-200 rounded-full overflow-hidden">
        <div
          className={`absolute h-full ${statusColor} transition-all`}
          style={{ width: `${Math.min(currentPct, 100)}%` }}
        />
        <div
          className="absolute h-full border-r-2 border-amber-600 top-0"
          style={{ left: `${Math.min(reorderPct, 100)}%` }}
          title="Reorder Point"
        />
        <div
          className="absolute h-full border-r-2 border-red-600 top-0"
          style={{ left: `${Math.min(safetyPct, 100)}%` }}
          title="Safety Stock"
        />
      </div>

      <div className="flex justify-between text-xs text-slate-600">
        <span>Safety: {safetyStock} {unit}</span>
        <span>Reorder: {reorderPoint} {unit}</span>
        <span className="font-semibold">Current: {current} {unit}</span>
      </div>
    </div>
  );
}
