'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import {
  Shield, Lock, Unlock, AlertTriangle, MapPin, Clock, Eye, CheckCircle,
  XCircle, Filter, Fingerprint, Radio, ScanLine
} from 'lucide-react';

type Seal = { id: string; truck_id: string; seal_number: string; seal_type: string; status: string; applied_at: string; verified_at: string | null; verified_by: string | null; broken_at: string | null; notes: string | null };
type CustodyEvent = { id: string; truck_id: string; event_type: string; location_zone: string | null; performed_by: string | null; performed_by_role: string | null; notes: string | null; is_anomaly: boolean; anomaly_reason: string | null; created_at: string };
type GeofenceAlert = { id: string; truck_id: string; zone_id: string; alert_type: string; severity: string; status: string; created_at: string; resolution_notes: string | null };
type GeofenceZone = { id: string; zone_name: string; zone_type: string; max_dwell_minutes: number; alert_on_exit: boolean; alert_on_unauthorized_entry: boolean; is_active: boolean };

const eventIcons: Record<string, typeof Shield> = { gate_in: MapPin, gate_out: MapPin, seal_verify: CheckCircle, seal_break: Unlock, seal_apply: Lock, tamper_alert: AlertTriangle, geofence_breach: Radio, dock_assign: Eye, dock_arrive: Eye, inspection: ScanLine, default: Clock };
const sealStatusColors: Record<string, string> = { intact: 'bg-emerald-100 text-emerald-700', tampered: 'bg-red-100 text-red-700', broken: 'bg-orange-100 text-orange-700', missing: 'bg-gray-100 text-gray-700', verified: 'bg-blue-100 text-blue-700', replaced: 'bg-purple-100 text-purple-700' };
const severityColors: Record<string, string> = { critical: 'bg-red-50 border-red-200', warning: 'bg-amber-50 border-amber-200', info: 'bg-blue-50 border-blue-200' };

export default function SecurityPage() {
  const [tab, setTab] = useState<'dashboard' | 'seals' | 'custody' | 'geofence'>('dashboard');
  const [seals, setSeals] = useState<Seal[]>([]);
  const [custody, setCustody] = useState<CustodyEvent[]>([]);
  const [alerts, setAlerts] = useState<GeofenceAlert[]>([]);
  const [zones, setZones] = useState<GeofenceZone[]>([]);
  const [loading, setLoading] = useState(true);
  const [sealFilter, setSealFilter] = useState('all');
  const [anomalyOnly, setAnomalyOnly] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [s, c, a, z] = await Promise.all([
        supabase.from('trailer_seals').select('*').order('applied_at', { ascending: false }),
        supabase.from('custody_ledger').select('*').order('created_at', { ascending: false }).limit(100),
        supabase.from('geofence_alerts').select('*').order('created_at', { ascending: false }),
        supabase.from('geofence_zones').select('*').order('zone_name'),
      ]);
      setSeals((s.data || []) as Seal[]);
      setCustody((c.data || []) as CustodyEvent[]);
      setAlerts((a.data || []) as GeofenceAlert[]);
      setZones((z.data || []) as GeofenceZone[]);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (<div className="p-8 flex items-center justify-center min-h-[400px]"><div className="text-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4" /><p className="text-gray-600">Loading security data...</p></div></div>);
  }

  const intactSeals = seals.filter(s => s.status === 'intact').length;
  const tamperedSeals = seals.filter(s => s.status === 'tampered').length;
  const brokenSeals = seals.filter(s => s.status === 'broken').length;
  const missingSeals = seals.filter(s => s.status === 'missing').length;
  const openAlerts = alerts.filter(a => a.status === 'open').length;
  const anomalyEvents = custody.filter(c => c.is_anomaly).length;
  const criticalAlerts = alerts.filter(a => a.severity === 'critical' && a.status === 'open').length;
  const filteredSeals = sealFilter === 'all' ? seals : seals.filter(s => s.status === sealFilter);
  const filteredCustody = anomalyOnly ? custody.filter(c => c.is_anomaly) : custody;

  return (
    <div className="p-6 space-y-6">
      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        {([
          { id: 'dashboard' as const, label: 'Dashboard', icon: Shield },
          { id: 'seals' as const, label: 'Seal Verification', icon: Lock },
          { id: 'custody' as const, label: 'Chain of Custody', icon: Fingerprint },
          { id: 'geofence' as const, label: 'Geofence Monitor', icon: MapPin },
        ]).map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === t.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            <t.icon size={16} />{t.label}
          </button>
        ))}
      </div>

      {/* DASHBOARD */}
      {tab === 'dashboard' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            {[
              { label: 'Total Seals', value: seals.length, color: 'text-blue-600', bg: 'bg-blue-50' },
              { label: 'Intact', value: intactSeals, color: 'text-emerald-600', bg: 'bg-emerald-50' },
              { label: 'Intact %', value: seals.length > 0 ? `${Math.round((intactSeals / seals.length) * 100)}%` : '0%', color: 'text-emerald-600', bg: 'bg-emerald-50' },
              { label: 'Tampered', value: tamperedSeals, color: 'text-red-600', bg: 'bg-red-50' },
              { label: 'Broken', value: brokenSeals, color: 'text-orange-600', bg: 'bg-orange-50' },
              { label: 'Open Alerts', value: openAlerts, color: 'text-amber-600', bg: 'bg-amber-50' },
              { label: 'Anomalies', value: anomalyEvents, color: 'text-red-600', bg: 'bg-red-50' },
            ].map((kpi, i) => (
              <div key={i} className={`${kpi.bg} rounded-xl p-4 border border-gray-100`}>
                <div className={`text-2xl font-bold ${kpi.color}`}>{kpi.value}</div>
                <div className="text-[11px] text-gray-500 font-medium mt-1">{kpi.label}</div>
              </div>
            ))}
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {[
              { label: 'Critical', count: criticalAlerts, color: 'border-l-4 border-red-500 bg-red-50', text: 'text-red-700' },
              { label: 'Warning', count: alerts.filter(a => a.severity === 'warning' && a.status === 'open').length, color: 'border-l-4 border-amber-500 bg-amber-50', text: 'text-amber-700' },
              { label: 'Info', count: alerts.filter(a => a.severity === 'info' && a.status === 'open').length, color: 'border-l-4 border-blue-500 bg-blue-50', text: 'text-blue-700' },
            ].map((s, i) => (
              <div key={i} className={`${s.color} rounded-lg p-5`}>
                <div className={`text-3xl font-bold ${s.text}`}>{s.count}</div>
                <div className="text-sm text-gray-600 mt-1">{s.label} Alerts</div>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2"><AlertTriangle size={18} className="text-red-500" />Recent Anomalies</h3>
            <div className="space-y-3">
              {custody.filter(c => c.is_anomaly).slice(0, 8).map(event => (
                <div key={event.id} className="flex items-start gap-3 p-3 bg-red-50 rounded-lg border border-red-100">
                  <AlertTriangle size={16} className="text-red-500 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-900 capitalize">{event.event_type.replace(/_/g, ' ')}</span>
                      <span className="text-xs text-gray-400">{event.location_zone}</span>
                    </div>
                    <p className="text-xs text-gray-600 mt-0.5">{event.anomaly_reason || event.notes}</p>
                    <div className="flex gap-4 mt-1 text-[10px] text-gray-400">
                      <span>By: {event.performed_by}</span>
                      <span>{new Date(event.created_at).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              ))}
              {custody.filter(c => c.is_anomaly).length === 0 && <p className="text-sm text-gray-400 text-center py-8">No anomalies detected</p>}
            </div>
          </div>
        </div>
      )}

      {/* SEALS */}
      {tab === 'seals' && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Filter size={16} className="text-gray-400" />
            <div className="flex gap-1.5">
              {['all', 'intact', 'tampered', 'broken', 'missing', 'verified'].map(s => (
                <button key={s} onClick={() => setSealFilter(s)} className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${sealFilter === s ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                  {s === 'all' ? `All (${seals.length})` : `${s.charAt(0).toUpperCase() + s.slice(1)} (${seals.filter(x => x.status === s).length})`}
                </button>
              ))}
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Seal #</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Type</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Status</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Applied</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Verified By</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Verified At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredSeals.map(seal => (
                  <tr key={seal.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs font-semibold">{seal.seal_number}</td>
                    <td className="px-4 py-3"><span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded capitalize">{seal.seal_type}</span></td>
                    <td className="px-4 py-3"><span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${sealStatusColors[seal.status] || 'bg-gray-100 text-gray-600'}`}>{seal.status.charAt(0).toUpperCase() + seal.status.slice(1)}</span></td>
                    <td className="px-4 py-3 text-gray-600 text-xs">{seal.applied_at ? new Date(seal.applied_at).toLocaleString() : '-'}</td>
                    <td className="px-4 py-3 text-gray-600 text-xs">{seal.verified_by || '-'}</td>
                    <td className="px-4 py-3 text-gray-600 text-xs">{seal.verified_at ? new Date(seal.verified_at).toLocaleString() : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CHAIN OF CUSTODY */}
      {tab === 'custody' && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <button onClick={() => setAnomalyOnly(!anomalyOnly)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${anomalyOnly ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-gray-100 text-gray-600'}`}>
              <AlertTriangle size={14} />Anomalies Only ({anomalyEvents})
            </button>
            <span className="text-xs text-gray-400">{filteredCustody.length} events</span>
          </div>
          <div className="space-y-2">
            {filteredCustody.slice(0, 50).map(event => {
              const IconComp = eventIcons[event.event_type] || eventIcons.default;
              return (
                <div key={event.id} className={`flex items-start gap-4 p-4 rounded-xl border ${event.is_anomaly ? 'bg-red-50 border-red-200' : 'bg-white border-gray-200'}`}>
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${event.is_anomaly ? 'bg-red-100 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
                    <IconComp size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-900 capitalize">{event.event_type.replace(/_/g, ' ')}</span>
                      {event.is_anomaly && <span className="px-2 py-0.5 bg-red-100 text-red-700 text-[10px] font-bold rounded-full">ANOMALY</span>}
                      {event.location_zone && <span className="text-xs text-gray-400">{event.location_zone}</span>}
                    </div>
                    <p className="text-xs text-gray-600 mt-0.5">{event.is_anomaly ? event.anomaly_reason : event.notes}</p>
                    <div className="flex gap-4 mt-1.5 text-[10px] text-gray-400">
                      {event.performed_by && <span>By: <strong>{event.performed_by}</strong> ({event.performed_by_role})</span>}
                      <span>{new Date(event.created_at).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* GEOFENCE */}
      {tab === 'geofence' && (
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-900">Geofence Zones ({zones.length})</h3>
            {zones.map(zone => (
              <div key={zone.id} className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2"><MapPin size={16} className="text-blue-500" /><span className="font-semibold text-gray-900">{zone.zone_name}</span></div>
                  <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${zone.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>{zone.is_active ? 'Active' : 'Inactive'}</span>
                </div>
                <div className="flex gap-4 mt-2 text-xs text-gray-500">
                  <span className="capitalize">Type: <strong>{zone.zone_type}</strong></span>
                  <span>Max Dwell: <strong>{zone.max_dwell_minutes}m</strong></span>
                </div>
                <div className="flex gap-3 mt-2">
                  {zone.alert_on_exit && <span className="text-[10px] bg-amber-50 text-amber-700 px-2 py-0.5 rounded">Exit Alert</span>}
                  {zone.alert_on_unauthorized_entry && <span className="text-[10px] bg-red-50 text-red-700 px-2 py-0.5 rounded">Unauthorized Entry Alert</span>}
                </div>
              </div>
            ))}
          </div>
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-900">Active Alerts ({openAlerts})</h3>
            {alerts.map(alert => (
              <div key={alert.id} className={`rounded-xl border p-4 ${severityColors[alert.severity] || 'bg-gray-50 border-gray-200'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2"><AlertTriangle size={16} /><span className="text-sm font-semibold capitalize">{alert.alert_type.replace(/_/g, ' ')}</span></div>
                  <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${alert.status === 'open' ? 'bg-red-200 text-red-800' : alert.status === 'acknowledged' ? 'bg-amber-200 text-amber-800' : 'bg-emerald-200 text-emerald-800'}`}>{alert.status}</span>
                </div>
                <div className="text-xs text-gray-600 mt-2">{new Date(alert.created_at).toLocaleString()}</div>
                {alert.status === 'open' && (
                  <div className="flex gap-2 mt-3">
                    <button className="px-3 py-1.5 bg-amber-600 text-white text-xs font-medium rounded-lg hover:bg-amber-700">Acknowledge</button>
                    <button className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-medium rounded-lg hover:bg-emerald-700">Resolve</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
