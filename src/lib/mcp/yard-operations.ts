/**
 * MCP Server: Yard Operations
 *
 * 22 tools for truck management, dock operations, gate check-in,
 * exception handling, and yard analytics
 */

import { BaseMCPServer, createJsonResult, createTextResult, createErrorResult, validateParams } from './protocol';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
  { db: { schema: 'supply_chain' } }
);

export class YardOperationsServer extends BaseMCPServer {
  name = 'mcp-yard-operations';
  version = '1.0.0';
  description = 'Supply chain yard management - trucks, docks, gates, exceptions';

  constructor() {
    super();
    this.registerAllTools();
  }

  private registerAllTools() {
    // ---- TRUCK TOOLS ----
    this.registerTool({
      name: 'get_truck_status',
      description: 'Get current status and location of a truck by license plate or ID',
      inputSchema: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'License plate or truck ID to search for' },
        },
        required: ['query'],
      },
    }, async (args) => {
      const q = String(args.query);
      const { data, error } = await supabase
        .from('trucks')
        .select('*')
        .or(`license_plate.ilike.%${q}%,id.eq.${q.length === 36 ? q : '00000000-0000-0000-0000-000000000000'}`)
        .limit(5);
      if (error) return createErrorResult(error.message);
      if (!data?.length) return createTextResult(`No trucks found matching "${q}"`);
      return createJsonResult(data);
    });

    this.registerTool({
      name: 'list_trucks_in_yard',
      description: 'List all trucks currently in the yard with optional status filter',
      inputSchema: {
        type: 'object',
        properties: {
          status: { type: 'string', description: 'Filter by status', enum: ['approaching', 'at_gate', 'checked_in', 'in_yard', 'at_dock', 'unloading', 'loading', 'completed', 'departed'] },
          limit: { type: 'number', description: 'Max results (default 25)', default: 25 },
        },
      },
    }, async (args) => {
      let query = supabase.from('trucks').select('*').order('created_at', { ascending: false }).limit(Number(args.limit) || 25);
      if (args.status) query = query.eq('status', args.status);
      const { data, error } = await query;
      if (error) return createErrorResult(error.message);
      return createJsonResult({ trucks: data, total: data?.length || 0 });
    });

    this.registerTool({
      name: 'get_trucks_by_carrier',
      description: 'Get all trucks from a specific carrier',
      inputSchema: {
        type: 'object',
        properties: {
          carrier_name: { type: 'string', description: 'Carrier name to search' },
        },
        required: ['carrier_name'],
      },
    }, async (args) => {
      const { data, error } = await supabase
        .from('trucks')
        .select('*')
        .ilike('carrier_name', `%${args.carrier_name}%`)
        .limit(20);
      if (error) return createErrorResult(error.message);
      return createJsonResult({ trucks: data, total: data?.length || 0 });
    });

    this.registerTool({
      name: 'get_high_dwell_trucks',
      description: 'Find trucks exceeding dwell time threshold (default 120 min)',
      inputSchema: {
        type: 'object',
        properties: {
          threshold_minutes: { type: 'number', description: 'Dwell time threshold in minutes', default: 120 },
        },
      },
    }, async (args) => {
      const threshold = Number(args.threshold_minutes) || 120;
      const { data, error } = await supabase
        .from('trucks')
        .select('*')
        .gt('dwell_time', threshold)
        .not('status', 'eq', 'departed')
        .order('dwell_time', { ascending: false });
      if (error) return createErrorResult(error.message);
      return createJsonResult({ high_dwell_trucks: data, threshold_minutes: threshold, count: data?.length || 0 });
    });

    this.registerTool({
      name: 'update_truck_status',
      description: 'Update a truck\'s status (e.g., check in, assign dock, mark departed)',
      inputSchema: {
        type: 'object',
        properties: {
          truck_id: { type: 'string', description: 'Truck UUID' },
          status: { type: 'string', description: 'New status', enum: ['approaching', 'at_gate', 'checked_in', 'in_yard', 'at_dock', 'unloading', 'loading', 'completed', 'departed'] },
        },
        required: ['truck_id', 'status'],
      },
    }, async (args) => {
      const v = validateParams(args, ['truck_id', 'status']);
      if (!v.valid) return createErrorResult(`Missing: ${v.missing.join(', ')}`);
      const updates: Record<string, unknown> = { status: args.status, updated_at: new Date().toISOString() };
      if (args.status === 'departed') updates.gate_out_at = new Date().toISOString();
      if (args.status === 'at_gate') updates.gate_in_at = new Date().toISOString();
      const { data, error } = await supabase.from('trucks').update(updates).eq('id', args.truck_id).select();
      if (error) return createErrorResult(error.message);
      return createJsonResult({ updated: true, truck: data?.[0] });
    });

    // ---- DOCK TOOLS ----
    this.registerTool({
      name: 'list_docks',
      description: 'List all docks with their current status and utilization',
      inputSchema: {
        type: 'object',
        properties: {
          status: { type: 'string', description: 'Filter by dock status', enum: ['available', 'assigned', 'occupied', 'maintenance', 'blocked'] },
        },
      },
    }, async (args) => {
      let query = supabase.from('docks').select('*').order('name');
      if (args.status) query = query.eq('status', args.status);
      const { data, error } = await query;
      if (error) return createErrorResult(error.message);
      return createJsonResult({ docks: data, total: data?.length || 0 });
    });

    this.registerTool({
      name: 'get_available_docks',
      description: 'Get docks that are currently available for assignment',
      inputSchema: {
        type: 'object',
        properties: {
          type: { type: 'string', description: 'Dock type filter', enum: ['inbound', 'outbound', 'dual'] },
          temperature_capable: { type: 'boolean', description: 'Require temperature control' },
          hazmat_capable: { type: 'boolean', description: 'Require hazmat capability' },
        },
      },
    }, async (args) => {
      let query = supabase.from('docks').select('*').eq('status', 'available');
      if (args.type) query = query.eq('type', args.type);
      if (args.temperature_capable) query = query.eq('temperature_capable', true);
      if (args.hazmat_capable) query = query.eq('hazmat_capable', true);
      const { data, error } = await query;
      if (error) return createErrorResult(error.message);
      return createJsonResult({ available_docks: data, count: data?.length || 0 });
    });

    this.registerTool({
      name: 'assign_truck_to_dock',
      description: 'Assign a truck to a specific dock',
      inputSchema: {
        type: 'object',
        properties: {
          truck_id: { type: 'string', description: 'Truck UUID' },
          dock_id: { type: 'string', description: 'Dock UUID' },
        },
        required: ['truck_id', 'dock_id'],
      },
    }, async (args) => {
      const now = new Date().toISOString();
      const [truckUpdate, dockUpdate] = await Promise.all([
        supabase.from('trucks').update({ assigned_dock_id: args.dock_id, status: 'at_dock', dock_assigned_at: now }).eq('id', args.truck_id).select(),
        supabase.from('docks').update({ current_truck_id: args.truck_id, status: 'assigned' }).eq('id', args.dock_id).select(),
      ]);
      if (truckUpdate.error) return createErrorResult(truckUpdate.error.message);
      if (dockUpdate.error) return createErrorResult(dockUpdate.error.message);
      return createJsonResult({ assigned: true, truck: truckUpdate.data?.[0], dock: dockUpdate.data?.[0] });
    });

    // ---- EXCEPTION TOOLS ----
    this.registerTool({
      name: 'list_yard_exceptions',
      description: 'List active yard exceptions (dwell violations, dock conflicts, capacity alerts)',
      inputSchema: {
        type: 'object',
        properties: {
          severity: { type: 'string', description: 'Filter by severity', enum: ['critical', 'high', 'medium', 'low'] },
          type: { type: 'string', description: 'Filter by exception type' },
          limit: { type: 'number', description: 'Max results', default: 20 },
        },
      },
    }, async (args) => {
      let query = supabase.from('yard_exceptions').select('*').order('created_at', { ascending: false }).limit(Number(args.limit) || 20);
      if (args.severity) query = query.eq('severity', args.severity);
      if (args.type) query = query.eq('type', args.type);
      const { data, error } = await query;
      if (error) return createErrorResult(error.message);
      return createJsonResult({ exceptions: data, count: data?.length || 0 });
    });

    this.registerTool({
      name: 'resolve_exception',
      description: 'Mark a yard exception as resolved with resolution notes',
      inputSchema: {
        type: 'object',
        properties: {
          exception_id: { type: 'string', description: 'Exception UUID' },
          resolution: { type: 'string', description: 'Resolution notes' },
        },
        required: ['exception_id', 'resolution'],
      },
    }, async (args) => {
      const { data, error } = await supabase
        .from('yard_exceptions')
        .update({ status: 'resolved', resolution: args.resolution, resolved_at: new Date().toISOString() })
        .eq('id', args.exception_id)
        .select();
      if (error) return createErrorResult(error.message);
      return createJsonResult({ resolved: true, exception: data?.[0] });
    });

    // ---- GATE / CHECK-IN TOOLS ----
    this.registerTool({
      name: 'get_gate_events',
      description: 'Get recent camera/OCR events at the gate',
      inputSchema: {
        type: 'object',
        properties: {
          gate_id: { type: 'string', description: 'Specific gate ID' },
          limit: { type: 'number', description: 'Max results', default: 10 },
        },
      },
    }, async (args) => {
      let query = supabase.from('camera_events').select('*').order('created_at', { ascending: false }).limit(Number(args.limit) || 10);
      if (args.gate_id) query = query.eq('gate_id', args.gate_id);
      const { data, error } = await query;
      if (error) return createErrorResult(error.message);
      return createJsonResult({ events: data, count: data?.length || 0 });
    });

    this.registerTool({
      name: 'get_bills_of_lading',
      description: 'Search bills of lading by BOL number, customer, or truck',
      inputSchema: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'BOL number, customer name, or truck ID to search' },
          limit: { type: 'number', description: 'Max results', default: 10 },
        },
        required: ['query'],
      },
    }, async (args) => {
      const q = String(args.query);
      const { data, error } = await supabase
        .from('bills_of_lading')
        .select('*')
        .or(`bol_number.ilike.%${q}%,customer_name.ilike.%${q}%`)
        .limit(Number(args.limit) || 10);
      if (error) return createErrorResult(error.message);
      return createJsonResult({ bills: data, count: data?.length || 0 });
    });

    // ---- ANALYTICS TOOLS ----
    this.registerTool({
      name: 'get_yard_metrics',
      description: 'Get real-time yard KPIs: occupancy, throughput, avg dwell time, dock utilization',
      inputSchema: { type: 'object', properties: {} },
    }, async () => {
      const [trucksRes, docksRes, exceptionsRes] = await Promise.all([
        supabase.from('trucks').select('status, dwell_time').not('status', 'eq', 'departed'),
        supabase.from('docks').select('status, utilization_today'),
        supabase.from('yard_exceptions').select('severity').eq('status', 'active'),
      ]);

      const trucks = trucksRes.data || [];
      const docks = docksRes.data || [];
      const exceptions = exceptionsRes.data || [];

      const totalTrucks = trucks.length;
      const avgDwell = trucks.length > 0 ? Math.round(trucks.reduce((s, t) => s + (t.dwell_time || 0), 0) / trucks.length) : 0;
      const atDock = trucks.filter(t => ['at_dock', 'unloading', 'loading'].includes(t.status)).length;
      const availableDocks = docks.filter(d => d.status === 'available').length;
      const avgUtilization = docks.length > 0 ? Math.round(docks.reduce((s, d) => s + (d.utilization_today || 0), 0) / docks.length) : 0;
      const criticalExceptions = exceptions.filter(e => e.severity === 'critical').length;

      return createJsonResult({
        trucks_in_yard: totalTrucks,
        trucks_at_dock: atDock,
        avg_dwell_minutes: avgDwell,
        available_docks: availableDocks,
        total_docks: docks.length,
        dock_utilization_pct: avgUtilization,
        active_exceptions: exceptions.length,
        critical_exceptions: criticalExceptions,
        status_breakdown: {
          approaching: trucks.filter(t => t.status === 'approaching').length,
          at_gate: trucks.filter(t => t.status === 'at_gate').length,
          checked_in: trucks.filter(t => t.status === 'checked_in').length,
          in_yard: trucks.filter(t => t.status === 'in_yard').length,
          at_dock: trucks.filter(t => t.status === 'at_dock').length,
          unloading: trucks.filter(t => t.status === 'unloading').length,
          loading: trucks.filter(t => t.status === 'loading').length,
          completed: trucks.filter(t => t.status === 'completed').length,
        },
      });
    });

    this.registerTool({
      name: 'get_dock_utilization_report',
      description: 'Get detailed dock utilization metrics for all docks',
      inputSchema: { type: 'object', properties: {} },
    }, async () => {
      const { data, error } = await supabase.from('docks').select('*').order('name');
      if (error) return createErrorResult(error.message);
      const docks = data || [];
      const available = docks.filter(d => d.status === 'available').length;
      const occupied = docks.filter(d => d.status === 'occupied').length;
      const maintenance = docks.filter(d => d.status === 'maintenance').length;
      return createJsonResult({
        total_docks: docks.length,
        available, occupied, maintenance,
        avg_utilization: Math.round(docks.reduce((s, d) => s + (d.utilization_today || 0), 0) / Math.max(docks.length, 1)),
        docks: docks.map(d => ({ name: d.name, status: d.status, utilization: d.utilization_today, type: d.type })),
      });
    });

    this.registerTool({
      name: 'get_throughput_summary',
      description: 'Get truck throughput numbers (check-ins, departures) for today',
      inputSchema: { type: 'object', properties: {} },
    }, async () => {
      const today = new Date().toISOString().split('T')[0];
      const [arrivals, departures] = await Promise.all([
        supabase.from('trucks').select('id').gte('gate_in_at', today),
        supabase.from('trucks').select('id').gte('gate_out_at', today),
      ]);
      return createJsonResult({
        date: today,
        arrivals: arrivals.data?.length || 0,
        departures: departures.data?.length || 0,
        net_flow: (arrivals.data?.length || 0) - (departures.data?.length || 0),
      });
    });

    // ---- CARRIER TOOLS ----
    this.registerTool({
      name: 'list_carriers',
      description: 'List all carriers with their truck counts and performance',
      inputSchema: { type: 'object', properties: {} },
    }, async () => {
      const { data, error } = await supabase.from('carriers').select('*').order('name');
      if (error) return createErrorResult(error.message);
      return createJsonResult({ carriers: data, total: data?.length || 0 });
    });
  }
}

// Singleton
let _instance: YardOperationsServer | null = null;
export function getYardOperationsServer(): YardOperationsServer {
  if (!_instance) _instance = new YardOperationsServer();
  return _instance;
}
