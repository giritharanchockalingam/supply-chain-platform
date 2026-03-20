import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  Truck,
  BillOfLading,
  Dock,
  YardException,
  GateEvent,
  YardMetrics,
  SKU,
  Customer,
  InventorySignal,
  ForecastRecord,
  ReplenishmentRecommendation,
  DemandPlanningMetrics,
  PlanningException,
  DataIngestionJob,
} from './types';
import {
  generateFullDataset,
  YardDataset,
  DemandPlanningDataset,
} from './mock-data';

/**
 * Supabase client with fallback to mock data for demo mode.
 * Allows seamless development without database connection.
 */
export class SupabaseManager {
  private client: SupabaseClient | null = null;
  private useMockData: boolean = false;
  private mockData: {
    yard: YardDataset;
    demandPlanning: DemandPlanningDataset;
  } | null = null;

  constructor() {
    this.initialize();
  }

  /**
   * Initialize Supabase client or fallback to mock data.
   */
  private initialize(): void {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.warn(
        'Supabase credentials not found. Using mock data for demo. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to enable database.'
      );
      this.useMockData = true;
      this.mockData = generateFullDataset();
      return;
    }

    try {
      this.client = createClient(supabaseUrl, supabaseKey);
      console.info('Supabase client initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Supabase client:', error);
      this.useMockData = true;
      this.mockData = generateFullDataset();
    }
  }

  /**
   * Check if running in mock data mode.
   */
  isUsingMockData(): boolean {
    return this.useMockData;
  }

  /**
   * Get Supabase client (creates one if needed).
   */
  getClient(): SupabaseClient {
    if (!this.client) {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://demo.supabase.co';
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'demo-key';
      this.client = createClient(supabaseUrl, supabaseKey);
    }
    return this.client;
  }

  // ========== YARD MANAGEMENT QUERIES ==========

  /**
   * Fetch all trucks in yard.
   */
  async getTrucks(): Promise<Truck[]> {
    if (this.useMockData && this.mockData) {
      return this.mockData.yard.trucks;
    }

    const { data, error } = await this.getClient()
      .from('trucks')
      .select('*')
      .order('arrivalTime', { ascending: false });

    if (error) {
      console.error('Error fetching trucks:', error);
      return [];
    }

    return (data as Truck[]) || [];
  }

  /**
   * Fetch a specific truck with its exceptions.
   */
  async getTruckById(truckId: string): Promise<Truck | null> {
    if (this.useMockData && this.mockData) {
      return (
        this.mockData.yard.trucks.find(t => t.id === truckId) || null
      );
    }

    const { data, error } = await this.getClient()
      .from('trucks')
      .select('*')
      .eq('id', truckId)
      .single();

    if (error) {
      console.error('Error fetching truck:', error);
      return null;
    }

    return (data as Truck) || null;
  }

  /**
   * Fetch all docks.
   */
  async getDocks(): Promise<Dock[]> {
    if (this.useMockData && this.mockData) {
      return this.mockData.yard.docks;
    }

    const { data, error } = await this.getClient()
      .from('docks')
      .select('*')
      .order('name');

    if (error) {
      console.error('Error fetching docks:', error);
      return [];
    }

    return (data as Dock[]) || [];
  }

  /**
   * Fetch yard exceptions.
   */
  async getYardExceptions(resolved: boolean = false): Promise<YardException[]> {
    if (this.useMockData && this.mockData) {
      return this.mockData.yard.exceptions.filter(e => {
        if (resolved) return e.resolvedAt !== null;
        return e.resolvedAt === null;
      });
    }

    const query = this.getClient().from('yard_exceptions').select('*');

    if (!resolved) {
      query.is('resolvedAt', null);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching exceptions:', error);
      return [];
    }

    return (data as YardException[]) || [];
  }

  /**
   * Fetch gate events for a time range.
   */
  async getGateEvents(hoursBack: number = 24): Promise<GateEvent[]> {
    if (this.useMockData && this.mockData) {
      const cutoff = new Date(Date.now() - hoursBack * 60 * 60 * 1000);
      return this.mockData.yard.gateEvents.filter(
        e => new Date(e.timestamp) > cutoff
      );
    }

    const cutoff = new Date(Date.now() - hoursBack * 60 * 60 * 1000);

    const { data, error } = await this.getClient()
      .from('gate_events')
      .select('*')
      .gte('timestamp', cutoff.toISOString())
      .order('timestamp', { ascending: false });

    if (error) {
      console.error('Error fetching gate events:', error);
      return [];
    }

    return (data as GateEvent[]) || [];
  }

  /**
   * Fetch yard metrics (aggregate statistics).
   */
  async getYardMetrics(): Promise<YardMetrics> {
    if (this.useMockData && this.mockData) {
      return this.mockData.yard.metrics;
    }

    // In production, query aggregated metrics table
    const { data, error } = await this.getClient()
      .from('yard_metrics')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      console.warn('Error fetching yard metrics:', error);
      // Return zeros if not available
      return {
        totalTrucksInYard: 0,
        trucksWaiting: 0,
        trucksUnloading: 0,
        averageDwellTime: 0,
        docksOccupied: 0,
        docksAvailable: 0,
        exceptionsOpen: 0,
        exceptionsCritical: 0,
        throughputToday: 0,
        avgTurnaroundTime: 0,
        detentionAtRisk: 0,
        onTimeUnload: 0,
      };
    }

    return data as YardMetrics;
  }

  // ========== DEMAND PLANNING QUERIES ==========

  /**
   * Fetch all SKUs.
   */
  async getSKUs(): Promise<SKU[]> {
    if (this.useMockData && this.mockData) {
      return this.mockData.demandPlanning.skus;
    }

    const { data, error } = await this.getClient()
      .from('skus')
      .select('*')
      .order('sku');

    if (error) {
      console.error('Error fetching SKUs:', error);
      return [];
    }

    return (data as SKU[]) || [];
  }

  /**
   * Fetch all customers.
   */
  async getCustomers(): Promise<Customer[]> {
    if (this.useMockData && this.mockData) {
      return this.mockData.demandPlanning.customers;
    }

    const { data, error } = await this.getClient()
      .from('customers')
      .select('*')
      .order('name');

    if (error) {
      console.error('Error fetching customers:', error);
      return [];
    }

    return (data as Customer[]) || [];
  }

  /**
   * Fetch inventory signals (recent data submissions).
   */
  async getInventorySignals(daysBack: number = 7): Promise<InventorySignal[]> {
    if (this.useMockData && this.mockData) {
      const cutoff = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000);
      return this.mockData.demandPlanning.inventorySignals.filter(
        s => new Date(s.receivedDate) > cutoff
      );
    }

    const cutoff = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000);

    const { data, error } = await this.getClient()
      .from('inventory_signals')
      .select('*')
      .gte('receivedDate', cutoff.toISOString())
      .order('receivedDate', { ascending: false });

    if (error) {
      console.error('Error fetching inventory signals:', error);
      return [];
    }

    return (data as InventorySignal[]) || [];
  }

  /**
   * Fetch forecast records for a SKU or customer.
   */
  async getForecastRecords(
    skuId?: string,
    customerId?: string,
    limit: number = 500
  ): Promise<ForecastRecord[]> {
    if (this.useMockData && this.mockData) {
      let records = this.mockData.demandPlanning.forecastRecords;

      if (skuId) {
        records = records.filter(r => r.skuId === skuId);
      }

      if (customerId) {
        records = records.filter(r => r.customerId === customerId);
      }

      return records.slice(0, limit);
    }

    let query = this.getClient()
      .from('forecast_records')
      .select('*');

    if (skuId) {
      query = query.eq('skuId', skuId);
    }

    if (customerId) {
      query = query.eq('customerId', customerId);
    }

    const { data, error } = await query.limit(limit);

    if (error) {
      console.error('Error fetching forecast records:', error);
      return [];
    }

    return (data as ForecastRecord[]) || [];
  }

  /**
   * Fetch replenishment recommendations.
   */
  async getReplenishmentRecommendations(
    urgencyFilter?: 'critical' | 'high' | 'medium' | 'low'
  ): Promise<ReplenishmentRecommendation[]> {
    if (this.useMockData && this.mockData) {
      let recs = this.mockData.demandPlanning.replenishmentRecommendations;

      if (urgencyFilter) {
        recs = recs.filter(r => r.urgency === urgencyFilter);
      }

      return recs;
    }

    let query = this.getClient()
      .from('replenishment_recommendations')
      .select('*');

    if (urgencyFilter) {
      query = query.eq('urgency', urgencyFilter);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching replenishment recommendations:', error);
      return [];
    }

    return (data as ReplenishmentRecommendation[]) || [];
  }

  /**
   * Fetch planning exceptions.
   */
  async getPlanningExceptions(
    resolved: boolean = false
  ): Promise<PlanningException[]> {
    if (this.useMockData && this.mockData) {
      return this.mockData.demandPlanning.planningExceptions.filter(e => {
        if (resolved) return e.resolvedAt !== null;
        return e.resolvedAt === null;
      });
    }

    const query = this.getClient()
      .from('planning_exceptions')
      .select('*');

    if (!resolved) {
      query.is('resolvedAt', null);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching planning exceptions:', error);
      return [];
    }

    return (data as PlanningException[]) || [];
  }

  /**
   * Fetch data ingestion jobs.
   */
  async getDataIngestionJobs(
    status?: 'queued' | 'processing' | 'completed' | 'failed' | 'needs_review'
  ): Promise<DataIngestionJob[]> {
    if (this.useMockData && this.mockData) {
      let jobs = this.mockData.demandPlanning.dataIngestionJobs;

      if (status) {
        jobs = jobs.filter(j => j.status === status);
      }

      return jobs;
    }

    let query = this.getClient()
      .from('data_ingestion_jobs')
      .select('*');

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query.order('receivedAt', {
      ascending: false,
    });

    if (error) {
      console.error('Error fetching data ingestion jobs:', error);
      return [];
    }

    return (data as DataIngestionJob[]) || [];
  }

  /**
   * Fetch demand planning metrics.
   */
  async getDemandPlanningMetrics(): Promise<DemandPlanningMetrics> {
    if (this.useMockData && this.mockData) {
      return this.mockData.demandPlanning.metrics;
    }

    // In production, query aggregated metrics table
    const { data, error } = await this.getClient()
      .from('demand_planning_metrics')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      console.warn('Error fetching demand planning metrics:', error);
      // Return zeros if not available
      return {
        overallMape: 0,
        forecastBias: 0,
        serviceLevel: 0,
        fillRate: 0,
        stockoutRate: 0,
        weeksOfSupply: 0,
        inventoryTurns: 0,
        dataQualityAvg: 0,
        customersReporting: 0,
        totalCustomers: 0,
        activeExceptions: 0,
        replenishmentsPending: 0,
      };
    }

    return data as DemandPlanningMetrics;
  }

  // ========== WRITE OPERATIONS ==========

  /**
   * Update truck status and details.
   * In mock mode, updates local data only.
   */
  async updateTruck(truckId: string, updates: Partial<Truck>): Promise<boolean> {
    if (this.useMockData && this.mockData) {
      const truck = this.mockData.yard.trucks.find(t => t.id === truckId);
      if (truck) {
        Object.assign(truck, updates);
        return true;
      }
      return false;
    }

    const { error } = await this.getClient()
      .from('trucks')
      .update(updates)
      .eq('id', truckId);

    if (error) {
      console.error('Error updating truck:', error);
      return false;
    }

    return true;
  }

  /**
   * Create a new yard exception.
   */
  async createException(exception: Omit<YardException, 'id'>): Promise<YardException | null> {
    if (this.useMockData) {
      const newException: YardException = {
        ...exception,
        id: `exc-${Date.now()}`,
      };
      if (this.mockData) {
        this.mockData.yard.exceptions.push(newException);
      }
      return newException;
    }

    const { data, error } = await this.getClient()
      .from('yard_exceptions')
      .insert([exception])
      .select()
      .single();

    if (error) {
      console.error('Error creating exception:', error);
      return null;
    }

    return (data as YardException) || null;
  }

  /**
   * Regenerate mock data (useful for testing/demos).
   */
  regenerateMockData(): void {
    this.mockData = generateFullDataset();
  }
}

/**
 * Global singleton instance of SupabaseManager.
 */
let supabaseManager: SupabaseManager | null = null;

/**
 * Get or create the Supabase manager instance.
 */
export function getSupabaseManager(): SupabaseManager {
  if (!supabaseManager) {
    supabaseManager = new SupabaseManager();
  }
  return supabaseManager;
}

/**
 * Export helper for quickly getting client.
 */
export function getSupabaseClient(): SupabaseClient {
  return getSupabaseManager().getClient();
}

/**
 * Check if in demo/mock mode.
 */
export function isUsingMockData(): boolean {
  return getSupabaseManager().isUsingMockData();
}
