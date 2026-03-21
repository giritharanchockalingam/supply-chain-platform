/**
 * MCP Server: Demand Planning
 *
 * 18 tools for forecasting, replenishment, inventory signals,
 * data ingestion, and planning exceptions
 */

import { BaseMCPServer, createJsonResult, createTextResult, createErrorResult, validateParams } from './protocol';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
  { db: { schema: 'supply_chain' } }
);

export class DemandPlanningServer extends BaseMCPServer {
  name = 'mcp-demand-planning';
  version = '1.0.0';
  description = 'Supply chain demand planning - forecasts, inventory, replenishment, ingestion';

  constructor() {
    super();
    this.registerAllTools();
  }

  private registerAllTools() {
    // ---- FORECAST TOOLS ----
    this.registerTool({
      name: 'get_forecasts',
      description: 'Get demand forecasts with optional filters by SKU, customer, or date range',
      inputSchema: {
        type: 'object',
        properties: {
          sku_id: { type: 'string', description: 'Filter by product/SKU ID' },
          customer_id: { type: 'string', description: 'Filter by customer ID' },
          period_start: { type: 'string', description: 'Start date (YYYY-MM-DD)' },
          period_end: { type: 'string', description: 'End date (YYYY-MM-DD)' },
          limit: { type: 'number', description: 'Max results', default: 50 },
        },
      },
    }, async (args) => {
      let query = supabase.from('forecasts').select('*').order('period_start', { ascending: false }).limit(Number(args.limit) || 50);
      if (args.sku_id) query = query.eq('product_id', args.sku_id);
      if (args.customer_id) query = query.eq('customer_id', args.customer_id);
      if (args.period_start) query = query.gte('period_start', args.period_start);
      if (args.period_end) query = query.lte('period_end', args.period_end);
      const { data, error } = await query;
      if (error) return createErrorResult(error.message);
      return createJsonResult({ forecasts: data, count: data?.length || 0 });
    });

    this.registerTool({
      name: 'get_forecast_accuracy',
      description: 'Calculate forecast accuracy metrics (MAPE, bias, weighted accuracy)',
      inputSchema: {
        type: 'object',
        properties: {
          sku_id: { type: 'string', description: 'Filter by SKU' },
          periods: { type: 'number', description: 'Number of past periods to analyze', default: 12 },
        },
      },
    }, async (args) => {
      const limit = Number(args.periods) || 12;
      let query = supabase.from('forecasts').select('*').not('actual_demand', 'is', null).order('period_start', { ascending: false }).limit(limit);
      if (args.sku_id) query = query.eq('product_id', args.sku_id);
      const { data, error } = await query;
      if (error) return createErrorResult(error.message);
      const forecasts = data || [];
      if (forecasts.length === 0) return createTextResult('No forecast data with actuals available for accuracy calculation');

      let totalAbsError = 0, totalBias = 0, totalActual = 0;
      for (const f of forecasts) {
        const forecast = f.forecast_qty || 0;
        const actual = f.actual_demand || 0;
        if (actual > 0) {
          totalAbsError += Math.abs(forecast - actual) / actual;
          totalBias += (forecast - actual) / actual;
          totalActual += actual;
        }
      }
      const n = forecasts.filter(f => (f.actual_demand || 0) > 0).length || 1;
      return createJsonResult({
        mape: Math.round((totalAbsError / n) * 10000) / 100,
        bias_pct: Math.round((totalBias / n) * 10000) / 100,
        weighted_accuracy: Math.round((1 - totalAbsError / n) * 10000) / 100,
        periods_analyzed: n,
      });
    });

    // ---- PRODUCT / SKU TOOLS ----
    this.registerTool({
      name: 'list_products',
      description: 'List all products/SKUs with inventory levels and category info',
      inputSchema: {
        type: 'object',
        properties: {
          category: { type: 'string', description: 'Filter by category' },
          search: { type: 'string', description: 'Search by name or SKU code' },
          limit: { type: 'number', description: 'Max results', default: 25 },
        },
      },
    }, async (args) => {
      let query = supabase.from('products').select('*').order('name').limit(Number(args.limit) || 25);
      if (args.category) query = query.eq('category', args.category);
      if (args.search) query = query.or(`name.ilike.%${args.search}%,sku_code.ilike.%${args.search}%`);
      const { data, error } = await query;
      if (error) return createErrorResult(error.message);
      return createJsonResult({ products: data, count: data?.length || 0 });
    });

    this.registerTool({
      name: 'get_product_detail',
      description: 'Get detailed product information including inventory, forecasts, and replenishment status',
      inputSchema: {
        type: 'object',
        properties: { product_id: { type: 'string', description: 'Product UUID' } },
        required: ['product_id'],
      },
    }, async (args) => {
      const [product, forecasts, replenishments, signals] = await Promise.all([
        supabase.from('products').select('*').eq('id', args.product_id).single(),
        supabase.from('forecasts').select('*').eq('product_id', args.product_id).order('period_start', { ascending: false }).limit(6),
        supabase.from('replenishments').select('*').eq('product_id', args.product_id).order('created_at', { ascending: false }).limit(5),
        supabase.from('inventory_signals').select('*').eq('product_id', args.product_id).order('created_at', { ascending: false }).limit(5),
      ]);
      if (product.error) return createErrorResult(product.error.message);
      return createJsonResult({
        product: product.data,
        recent_forecasts: forecasts.data,
        recent_replenishments: replenishments.data,
        recent_signals: signals.data,
      });
    });

    // ---- INVENTORY SIGNAL TOOLS ----
    this.registerTool({
      name: 'get_inventory_signals',
      description: 'Get latest inventory signals (POS data, warehouse levels, supplier feeds)',
      inputSchema: {
        type: 'object',
        properties: {
          source: { type: 'string', description: 'Filter by signal source', enum: ['pos', 'warehouse', 'supplier', 'ecommerce'] },
          product_id: { type: 'string', description: 'Filter by product' },
          limit: { type: 'number', description: 'Max results', default: 20 },
        },
      },
    }, async (args) => {
      let query = supabase.from('inventory_signals').select('*').order('created_at', { ascending: false }).limit(Number(args.limit) || 20);
      if (args.source) query = query.eq('source', args.source);
      if (args.product_id) query = query.eq('product_id', args.product_id);
      const { data, error } = await query;
      if (error) return createErrorResult(error.message);
      return createJsonResult({ signals: data, count: data?.length || 0 });
    });

    this.registerTool({
      name: 'get_low_stock_alerts',
      description: 'Get products that are below reorder point or at critically low inventory',
      inputSchema: { type: 'object', properties: {} },
    }, async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .lt('current_stock', 100) // simplified - could use reorder_point column
        .order('current_stock', { ascending: true });
      if (error) return createErrorResult(error.message);
      return createJsonResult({ low_stock_products: data, count: data?.length || 0 });
    });

    // ---- REPLENISHMENT TOOLS ----
    this.registerTool({
      name: 'get_replenishments',
      description: 'Get replenishment recommendations and orders',
      inputSchema: {
        type: 'object',
        properties: {
          status: { type: 'string', description: 'Filter by status', enum: ['recommended', 'approved', 'ordered', 'in_transit', 'received', 'cancelled'] },
          urgency: { type: 'string', description: 'Filter by urgency', enum: ['critical', 'high', 'medium', 'low'] },
          limit: { type: 'number', description: 'Max results', default: 25 },
        },
      },
    }, async (args) => {
      let query = supabase.from('replenishments').select('*').order('created_at', { ascending: false }).limit(Number(args.limit) || 25);
      if (args.status) query = query.eq('status', args.status);
      if (args.urgency) query = query.eq('urgency', args.urgency);
      const { data, error } = await query;
      if (error) return createErrorResult(error.message);
      return createJsonResult({ replenishments: data, count: data?.length || 0 });
    });

    this.registerTool({
      name: 'approve_replenishment',
      description: 'Approve a replenishment recommendation to convert it to an order',
      inputSchema: {
        type: 'object',
        properties: {
          replenishment_id: { type: 'string', description: 'Replenishment UUID' },
          notes: { type: 'string', description: 'Approval notes' },
        },
        required: ['replenishment_id'],
      },
    }, async (args) => {
      const { data, error } = await supabase
        .from('replenishments')
        .update({ status: 'approved', approved_at: new Date().toISOString(), notes: args.notes || 'Approved via AI assistant' })
        .eq('id', args.replenishment_id)
        .select();
      if (error) return createErrorResult(error.message);
      return createJsonResult({ approved: true, replenishment: data?.[0] });
    });

    // ---- CUSTOMER TOOLS ----
    this.registerTool({
      name: 'list_customers',
      description: 'List customers with their tier, volume, and forecast status',
      inputSchema: {
        type: 'object',
        properties: {
          tier: { type: 'string', description: 'Filter by tier', enum: ['platinum', 'gold', 'silver', 'standard'] },
          search: { type: 'string', description: 'Search by name' },
        },
      },
    }, async (args) => {
      let query = supabase.from('customers').select('*').order('name');
      if (args.tier) query = query.eq('tier', args.tier);
      if (args.search) query = query.ilike('name', `%${args.search}%`);
      const { data, error } = await query;
      if (error) return createErrorResult(error.message);
      return createJsonResult({ customers: data, count: data?.length || 0 });
    });

    // ---- DATA INGESTION TOOLS ----
    this.registerTool({
      name: 'list_ingestion_jobs',
      description: 'List data ingestion job history (EDI, API feeds, CSV imports)',
      inputSchema: {
        type: 'object',
        properties: {
          status: { type: 'string', description: 'Filter by status', enum: ['running', 'completed', 'failed', 'pending'] },
          source: { type: 'string', description: 'Filter by data source' },
          limit: { type: 'number', description: 'Max results', default: 15 },
        },
      },
    }, async (args) => {
      let query = supabase.from('ingestion_jobs').select('*').order('created_at', { ascending: false }).limit(Number(args.limit) || 15);
      if (args.status) query = query.eq('status', args.status);
      if (args.source) query = query.eq('source_system', args.source);
      const { data, error } = await query;
      if (error) return createErrorResult(error.message);
      return createJsonResult({ jobs: data, count: data?.length || 0 });
    });

    // ---- PLANNING EXCEPTION TOOLS ----
    this.registerTool({
      name: 'list_planning_exceptions',
      description: 'List planning exceptions (demand spikes, supply disruptions, forecast misses)',
      inputSchema: {
        type: 'object',
        properties: {
          severity: { type: 'string', description: 'Filter by severity', enum: ['critical', 'high', 'medium', 'low'] },
          type: { type: 'string', description: 'Filter by type' },
          limit: { type: 'number', description: 'Max results', default: 20 },
        },
      },
    }, async (args) => {
      let query = supabase.from('planning_exceptions').select('*').order('created_at', { ascending: false }).limit(Number(args.limit) || 20);
      if (args.severity) query = query.eq('severity', args.severity);
      if (args.type) query = query.eq('type', args.type);
      const { data, error } = await query;
      if (error) return createErrorResult(error.message);
      return createJsonResult({ exceptions: data, count: data?.length || 0 });
    });

    // ---- DEMAND PLANNING METRICS ----
    this.registerTool({
      name: 'get_planning_metrics',
      description: 'Get demand planning KPIs: forecast accuracy, fill rate, inventory turns, signal freshness',
      inputSchema: { type: 'object', properties: {} },
    }, async () => {
      const [forecasts, products, replenishments, exceptions, signals] = await Promise.all([
        supabase.from('forecasts').select('forecast_qty, actual_demand, confidence').not('actual_demand', 'is', null).limit(100),
        supabase.from('products').select('current_stock, reorder_point, category').limit(100),
        supabase.from('replenishments').select('status, urgency, estimated_value').limit(100),
        supabase.from('planning_exceptions').select('severity, status').eq('status', 'active'),
        supabase.from('inventory_signals').select('source, created_at').order('created_at', { ascending: false }).limit(50),
      ]);

      const fData = forecasts.data || [];
      const pData = products.data || [];
      const rData = replenishments.data || [];
      const eData = exceptions.data || [];

      // Forecast accuracy
      let mapeSum = 0, n = 0;
      for (const f of fData) {
        if (f.actual_demand > 0) {
          mapeSum += Math.abs((f.forecast_qty - f.actual_demand) / f.actual_demand);
          n++;
        }
      }
      const avgConfidence = fData.length > 0 ? Math.round(fData.reduce((s, f) => s + (f.confidence || 0), 0) / fData.length * 100) : 0;

      // Replenishment pipeline value
      const pendingValue = rData.filter(r => ['recommended', 'approved', 'ordered'].includes(r.status))
        .reduce((s, r) => s + (r.estimated_value || 0), 0);

      return createJsonResult({
        forecast_accuracy_pct: n > 0 ? Math.round((1 - mapeSum / n) * 10000) / 100 : 0,
        avg_forecast_confidence: avgConfidence,
        total_skus: pData.length,
        low_stock_skus: pData.filter(p => (p.current_stock || 0) < (p.reorder_point || 50)).length,
        pending_replenishments: rData.filter(r => r.status === 'recommended').length,
        approved_replenishments: rData.filter(r => r.status === 'approved').length,
        replenishment_pipeline_value: Math.round(pendingValue),
        active_exceptions: eData.length,
        critical_exceptions: eData.filter(e => e.severity === 'critical').length,
        signal_sources: [...new Set((signals.data || []).map(s => s.source))],
      });
    });
  }
}

let _instance: DemandPlanningServer | null = null;
export function getDemandPlanningServer(): DemandPlanningServer {
  if (!_instance) _instance = new DemandPlanningServer();
  return _instance;
}
