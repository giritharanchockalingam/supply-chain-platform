'use client';

import { Truck, BillOfLading } from '@/lib/types';
import { X, Truck as TruckIcon, MapPin, Clock, Package } from 'lucide-react';
import { StatusBadge } from './StatusBadge';
import { PriorityBadge } from './PriorityBadge';

interface TruckDetailPanelProps {
  truck: Truck | null;
  bol?: BillOfLading | null;
  onClose: () => void;
}

export function TruckDetailPanel({ truck, bol, onClose }: TruckDetailPanelProps) {
  if (!truck) return null;

  const arrivalTime = new Date(truck.arrivalTime);
  const arrivalStr = arrivalTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end z-50">
      <div className="bg-white w-full max-w-md rounded-t-2xl shadow-xl max-h-[80vh] overflow-y-auto">
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <TruckIcon size={24} />
            <h2 className="text-xl font-bold">{truck.licensePlate}</h2>
          </div>
          <button onClick={onClose} className="hover:bg-blue-800 p-1 rounded">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Status Section */}
          <div>
            <h3 className="text-sm font-semibold text-gray-600 mb-3">Status</h3>
            <div className="flex gap-3">
              <StatusBadge status={truck.status} />
              <PriorityBadge level={truck.priorityLevel} score={truck.priorityScore} />
            </div>
          </div>

          {/* Truck Info */}
          <div>
            <h3 className="text-sm font-semibold text-gray-600 mb-3">Truck Information</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Trailer Number:</span>
                <span className="font-medium">{truck.trailerNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Carrier:</span>
                <span className="font-medium">{truck.carrierName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Driver:</span>
                <span className="font-medium">{truck.driverName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Driver Phone:</span>
                <span className="font-medium">{truck.driverPhone}</span>
              </div>
            </div>
          </div>

          {/* Timing */}
          <div>
            <h3 className="text-sm font-semibold text-gray-600 mb-3">Timing</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Arrival Time:</span>
                <span className="font-medium">{arrivalStr}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Dwell Time:</span>
                <span className="font-medium">{truck.dwellTime} min</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Est. Unload:</span>
                <span className="font-medium">{truck.estimatedUnloadTime} min</span>
              </div>
            </div>
          </div>

          {/* Dock Assignment */}
          <div>
            <h3 className="text-sm font-semibold text-gray-600 mb-3">Assignment</h3>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm">
                <span className="text-gray-600">Assigned Dock: </span>
                <span className="font-bold text-blue-600">{truck.assignedDock || 'Not assigned'}</span>
              </p>
            </div>
          </div>

          {/* Cargo Info */}
          <div>
            <h3 className="text-sm font-semibold text-gray-600 mb-3">Cargo Information</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">BOL:</span>
                <span className="font-medium">{truck.bolId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Temperature:</span>
                <span className="font-medium capitalize">{truck.temperatureClass}</span>
              </div>
            </div>
          </div>

          {/* BOL Details */}
          {bol && (
            <div>
              <h3 className="text-sm font-semibold text-gray-600 mb-3">Shipment Details</h3>
              <div className="space-y-2 text-sm bg-gray-50 border border-gray-200 rounded-lg p-3">
                <div>
                  <span className="text-gray-600">Customer:</span>
                  <p className="font-medium">{bol.customerName}</p>
                </div>
                <div>
                  <span className="text-gray-600">Product:</span>
                  <p className="font-medium">{bol.productType}</p>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Quantity:</span>
                  <span className="font-medium">{bol.quantity}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Weight:</span>
                  <span className="font-medium">{bol.weight.toLocaleString()} lbs</span>
                </div>
                {bol.hazmat && (
                  <div className="bg-red-50 border border-red-200 rounded p-2 mt-2">
                    <p className="text-xs font-semibold text-red-700">HAZMAT: {bol.hazmatClass}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-4">
            <button className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700">
              Assign Dock
            </button>
            <button className="flex-1 bg-gray-200 text-gray-900 py-2 rounded-lg font-medium hover:bg-gray-300">
              Add Note
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
