'use client';

import { useState, useEffect } from 'react';
import { useCameraEvents, useBillsOfLading } from '@/hooks/useSupabaseData';
import { AlertCircle, CheckCircle, AlertTriangle, Camera, RefreshCw } from 'lucide-react';

export default function CheckInPage() {
  const { data: cameraEvents, loading: eventsLoading } = useCameraEvents(1);
  const { data: bols, loading: bolsLoading } = useBillsOfLading(10);
  const loading = eventsLoading || bolsLoading;

  const ocrData = cameraEvents[0] || null;
  const [licensePlate, setLicensePlate] = useState('');
  const [trailerNumber, setTrailerNumber] = useState('');
  const [bolNumber, setBolNumber] = useState('BOL20240320001');
  const [carrierName, setCarrierName] = useState('FedEx Freight');
  const [driverName, setDriverName] = useState('John Smith');
  const [driverPhone, setDriverPhone] = useState('+1-555-0123');
  const [sealNumber, setSealNumber] = useState('SL-45832');

  const [bolLookedUp, setBolLookedUp] = useState(false);

  useEffect(() => {
    if (ocrData) {
      setLicensePlate(ocrData.licensePlate);
      setTrailerNumber(ocrData.trailerNumber);
    }
  }, [ocrData]);

  const bol = bolLookedUp && bols.length > 0 ? bols[0] : null;

  const validations = {
    bolMatch: { valid: true, label: 'BOL Match' },
    appointmentMatch: { valid: true, label: 'Appointment Match' },
    trailerId: { valid: true, label: 'Trailer ID Match' },
    sealIntegrity: { valid: true, label: 'Seal Integrity' },
    hazmatCert: { valid: true, label: 'Hazmat Certification' },
    tempEquip: { valid: false, label: 'Temperature Equipment' },
  };

  const priorityScore = 78;

  if (loading) {
    return (
      <div className="p-4 lg:p-8 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading check-in data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Gate Check-In Workflow</h1>
        <p className="text-gray-600 mb-8">Process: OCR Detection → BOL Lookup → Validation → Priority Assignment</p>

        <div className="grid lg:grid-cols-3 gap-4 lg:gap-8">
          {/* Main Workflow */}
          <div className="lg:col-span-2 space-y-6">
            {/* Camera Feed Simulation */}
            <div className="bg-white rounded-lg shadow">
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 flex items-center gap-3">
                <Camera size={20} />
                <h2 className="text-lg font-bold">Gate Camera 1 - OCR Detection</h2>
              </div>
              <div className="p-6">
                <div className="bg-black rounded-lg aspect-video mb-4 flex items-center justify-center text-gray-400">
                  <div className="text-center">
                    <div className="text-6xl mb-4">📷</div>
                    <p>Camera Feed - Simulated</p>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-blue-900 mb-3">OCR Results</h3>
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">License Plate Detected:</p>
                      <p className="font-bold text-lg text-blue-600">{ocrData?.licensePlate || licensePlate}</p>
                      <p className="text-xs text-gray-500">Confidence: {ocrData?.ocrConfidence ? Math.round(ocrData.ocrConfidence * 100) : 0}%</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Trailer Number Detected:</p>
                      <p className="font-bold text-lg text-blue-600">{ocrData?.trailerNumber || trailerNumber}</p>
                      <p className="text-xs text-gray-500">Confidence: {ocrData?.ocrConfidence ? Math.round(ocrData.ocrConfidence * 100) : 0}%</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Check-In Form */}
            <div className="bg-white rounded-lg shadow">
              <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white p-4">
                <h2 className="text-lg font-bold">Check-In Form</h2>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">License Plate*</label>
                    <input
                      type="text"
                      value={licensePlate}
                      onChange={(e) => setLicensePlate(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 bg-blue-50"
                      placeholder="Pre-filled from OCR"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Trailer Number*</label>
                    <input
                      type="text"
                      value={trailerNumber}
                      onChange={(e) => setTrailerNumber(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 bg-blue-50"
                      placeholder="Pre-filled from OCR"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Carrier Name*</label>
                    <input
                      type="text"
                      value={carrierName}
                      onChange={(e) => setCarrierName(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Driver Name*</label>
                    <input
                      type="text"
                      value={driverName}
                      onChange={(e) => setDriverName(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Driver Phone*</label>
                    <input
                      type="tel"
                      value={driverPhone}
                      onChange={(e) => setDriverPhone(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">BOL Number*</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={bolNumber}
                        onChange={(e) => setBolNumber(e.target.value)}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                      />
                      <button
                        onClick={() => setBolLookedUp(!bolLookedUp)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium whitespace-nowrap"
                      >
                        Lookup
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Seal Number*</label>
                    <input
                      type="text"
                      value={sealNumber}
                      onChange={(e) => setSealNumber(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* BOL Lookup Results */}
            {bolLookedUp && bol && (
              <div className="bg-white rounded-lg shadow">
                <div className="bg-gradient-to-r from-amber-600 to-amber-700 text-white p-4">
                  <h2 className="text-lg font-bold">BOL Details</h2>
                </div>
                <div className="p-6 space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Customer</p>
                      <p className="font-bold text-lg text-gray-900">{bol.customerName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Product Type</p>
                      <p className="font-bold text-lg text-gray-900">{bol.productType}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Quantity</p>
                      <p className="font-bold text-lg text-gray-900">{bol.quantity} units</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Weight</p>
                      <p className="font-bold text-lg text-gray-900">{bol.weight.toLocaleString()} lbs</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Temperature Requirement</p>
                      <p className="font-bold text-lg text-gray-900 capitalize">{bol.temperatureClass}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Delivery Deadline</p>
                      <p className="font-bold text-lg text-gray-900">{new Date(bol.deliveryDeadline).toLocaleDateString()}</p>
                    </div>
                  </div>

                  {bol.hazmat && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <p className="text-sm font-semibold text-red-900">HAZMAT CARGO: {bol.hazmatClass}</p>
                      <p className="text-sm text-red-700 mt-1">Special handling and certification required</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right Sidebar - Validations & Priority */}
          <div className="space-y-6">
            {/* Validation Results */}
            <div className="bg-white rounded-lg shadow">
              <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white p-4">
                <h2 className="text-lg font-bold">Validation Results</h2>
              </div>
              <div className="p-6 space-y-3">
                {Object.entries(validations).map(([key, { valid, label }]) => (
                  <div
                    key={key}
                    className={`flex items-center gap-3 p-3 rounded-lg ${
                      valid ? 'bg-emerald-50 border border-emerald-200' : 'bg-amber-50 border border-amber-200'
                    }`}
                  >
                    {valid ? (
                      <CheckCircle className="text-emerald-600 flex-shrink-0" size={20} />
                    ) : (
                      <AlertTriangle className="text-amber-600 flex-shrink-0" size={20} />
                    )}
                    <span className={valid ? 'text-emerald-900 font-medium' : 'text-amber-900 font-medium'}>
                      {label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Priority Score */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-300 rounded-lg p-6">
              <p className="text-sm text-blue-900 font-medium mb-2">Calculated Priority Score</p>
              <div className="flex items-end gap-3 mb-4">
                <div className="text-4xl font-bold text-blue-600">{priorityScore}</div>
                <div className="text-sm text-blue-700 font-medium mb-1">/ 100</div>
              </div>

              <div className="w-full h-2 bg-blue-200 rounded-full overflow-hidden mb-4">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all"
                  style={{ width: `${priorityScore}%` }}
                ></div>
              </div>

              <p className="text-xs text-blue-700">
                <strong>Status:</strong> HIGH PRIORITY - Will be assigned to available dock immediately
              </p>
            </div>

            {/* Exception Alerts */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex gap-2 mb-3">
                <AlertTriangle className="text-amber-600 flex-shrink-0" size={20} />
                <h3 className="font-bold text-amber-900">Exception Alert</h3>
              </div>
              <div className="text-sm text-amber-800">
                <p className="mb-2">Temperature equipment not validated</p>
                <button className="px-3 py-1 bg-amber-100 text-amber-900 rounded hover:bg-amber-200 text-xs font-medium mr-2">
                  Verify Equipment
                </button>
                <button className="px-3 py-1 bg-white text-amber-900 border border-amber-300 rounded hover:bg-amber-50 text-xs font-medium">
                  Override
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2">
              <button className="w-full bg-emerald-600 text-white py-3 rounded-lg font-bold hover:bg-emerald-700 transition-colors">
                Complete Check-In
              </button>
              <button className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition-colors">
                Flag for Review
              </button>
              <button className="w-full bg-red-600 text-white py-3 rounded-lg font-bold hover:bg-red-700 transition-colors">
                Reject Entry
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
