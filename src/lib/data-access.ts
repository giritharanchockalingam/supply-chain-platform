import { supabase } from './supabase'
import {
  DistributionCenter,
  Dock,
  Carrier,
  Truck,
  BillOfLading,
  CameraEvent,
  YardException,
  YardActivityLog,
  Customer,
  Product,
  InventorySignal,
  IngestionJob,
  Forecast,
  Replenishment,
  PlanningException,
  EdiTransaction,
  WmsEvent,
} from './database.types'

// ========== TYPES FOR FILTERS ==========

export interface TruckFilters {
  status?: string
  dcId?: string
  priority?: string
  limit?: number
  offset?: number
}

export interface ForecastFilters {
  customerId?: string
  productId?: string
  status?: string
  limit?: number
  offset?: number
}

export interface SignalFilters {
  customerId?: string
  daysBack?: number
  validationStatus?: string
  limit?: number
  offset?: number
}

export interface JobFilters {
  status?: string
  customerId?: string
  limit?: number
  offset?: number
}

export interface ReplenishmentFilters {
  urgency?: string
  status?: string
  customerId?: string
  limit?: number
  offset?: number
}

export interface ExceptionFilters {
  type?: string
  severity?: string
  resolved?: boolean
  limit?: number
  offset?: number
}

export interface CheckInData {
  dcId: string
  licensePlate: string
  trailerNumber: string
  carrierId: string
  carrierName: string
  driverName: string
  driverPhone: string
  bolId: string
  gateId: string
  temperatureClass: string
}

// ========== YARD MANAGEMENT QUERIES ==========

export async function getYardDashboardData(dcCode: string) {
  try {
    const [trucks, docks, exceptions, metrics] = await Promise.all([
      getTrucks({ dcId: dcCode, limit: 100 }),
      getDocks(dcCode),
      getYardExceptions(dcCode),
      getYardMetrics(dcCode),
    ])

    return {
      trucks,
      docks,
      exceptions,
      metrics,
      success: true,
    }
  } catch (error) {
    console.error('Error fetching yard dashboard data:', error)
    return {
      trucks: [],
      docks: [],
      exceptions: [],
      metrics: null,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

export async function getTrucks(filters?: TruckFilters): Promise<Truck[]> {
  try {
    let query = supabase.from('trucks').select('*')

    if (filters?.dcId) {
      query = query.eq('dc_id', filters.dcId)
    }
    if (filters?.status) {
      query = query.eq('status', filters.status)
    }
    if (filters?.priority) {
      query = query.eq('priority_level', filters.priority)
    }

    query = query.order('arrival_time', { ascending: false })

    if (filters?.limit) {
      query = query.limit(filters.limit)
    }
    if (filters?.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching trucks:', error)
      return []
    }

    return (data as Truck[]) || []
  } catch (error) {
    console.error('Error in getTrucks:', error)
    return []
  }
}

export async function getTruckById(id: string): Promise<Truck | null> {
  try {
    const { data, error } = await supabase
      .from('trucks')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching truck:', error)
      return null
    }

    return (data as Truck) || null
  } catch (error) {
    console.error('Error in getTruckById:', error)
    return null
  }
}

export async function getDocks(dcCode: string): Promise<Dock[]> {
  try {
    const { data, error } = await supabase
      .from('docks')
      .select('*')
      .eq('dc_id', dcCode)
      .order('name')

    if (error) {
      console.error('Error fetching docks:', error)
      return []
    }

    return (data as Dock[]) || []
  } catch (error) {
    console.error('Error in getDocks:', error)
    return []
  }
}

export async function getYardExceptions(dcCode: string, status?: string): Promise<YardException[]> {
  try {
    let query = supabase.from('yard_exceptions').select('*').eq('dc_id', dcCode)

    if (status === 'open') {
      query = query.is('resolved_at', null)
    } else if (status === 'resolved') {
      query = query.not('resolved_at', 'is', null)
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching exceptions:', error)
      return []
    }

    return (data as YardException[]) || []
  } catch (error) {
    console.error('Error in getYardExceptions:', error)
    return []
  }
}

export async function getYardMetrics(dcCode: string) {
  try {
    const [trucks, docks, exceptions] = await Promise.all([
      getTrucks({ dcId: dcCode }),
      getDocks(dcCode),
      getYardExceptions(dcCode, 'open'),
    ])

    const docsOccupied = docks.filter((d) => d.current_truck_id).length
    const trucksWaiting = trucks.filter((t) => t.status === 'in_yard' || t.status === 'checked_in').length
    const trucksUnloading = trucks.filter((t) => t.status === 'unloading').length

    return {
      totalTrucksInYard: trucks.length,
      trucksWaiting,
      trucksUnloading,
      averageDwellTime: trucks.length > 0 ? trucks.reduce((sum, t) => sum + t.dwell_time, 0) / trucks.length : 0,
      docksOccupied: docsOccupied,
      docksAvailable: docks.length - docsOccupied,
      exceptionsOpen: exceptions.length,
      exceptionsCritical: exceptions.filter((e) => e.severity === 'critical').length,
      throughputToday: trucks.filter((t) => t.status === 'departed').length,
      avgTurnaroundTime: trucks.length > 0 ? trucks.reduce((sum, t) => sum + t.dwell_time, 0) / trucks.length : 0,
      detentionAtRisk: trucks.filter((t) => t.dwell_time > 180).length,
      onTimeUnload: 0,
    }
  } catch (error) {
    console.error('Error in getYardMetrics:', error)
    return null
  }
}

export async function checkInTruck(data: CheckInData): Promise<Truck | null> {
  try {
    const { data: result, error } = await supabase
      .from('trucks')
      .insert([
        {
          dc_id: data.dcId,
          license_plate: data.licensePlate,
          trailer_number: data.trailerNumber,
          carrier_id: data.carrierId,
          carrier_name: data.carrierName,
          driver_name: data.driverName,
          driver_phone: data.driverPhone,
          status: 'checked_in',
          arrival_time: new Date().toISOString(),
          gate_id: data.gateId,
          bol_id: data.bolId,
          temperature_class: data.temperatureClass,
          priority_score: 50,
          priority_level: 'medium',
          estimated_unload_time: 120,
          dwell_time: 0,
          location_x: 0,
          location_y: 0,
          zone: 'entry',
        },
      ])
      .select()
      .single()

    if (error) {
      console.error('Error checking in truck:', error)
      return null
    }

    return (result as Truck) || null
  } catch (error) {
    console.error('Error in checkInTruck:', error)
    return null
  }
}

export async function assignDock(truckId: string, dockId: string): Promise<boolean> {
  try {
    const { error: truckError } = await supabase
      .from('trucks')
      .update({ assigned_dock_id: dockId, status: 'at_dock' })
      .eq('id', truckId)

    if (truckError) {
      console.error('Error assigning dock:', truckError)
      return false
    }

    const { error: dockError } = await supabase
      .from('docks')
      .update({ current_truck_id: truckId, status: 'occupied' })
      .eq('id', dockId)

    if (dockError) {
      console.error('Error updating dock:', dockError)
      return false
    }

    return true
  } catch (error) {
    console.error('Error in assignDock:', error)
    return false
  }
}

export async function updateTruckStatus(truckId: string, status: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('trucks')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', truckId)

    if (error) {
      console.error('Error updating truck status:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error in updateTruckStatus:', error)
    return false
  }
}

export async function getCameraEvents(dcCode: string, limit = 50): Promise<CameraEvent[]> {
  try {
    const { data, error } = await supabase
      .from('camera_events')
      .select('*')
      .eq('dc_id', dcCode)
      .order('timestamp', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching camera events:', error)
      return []
    }

    return (data as CameraEvent[]) || []
  } catch (error) {
    console.error('Error in getCameraEvents:', error)
    return []
  }
}

// ========== DEMAND PLANNING QUERIES ==========

export async function getPlanningDashboardData() {
  try {
    const [forecasts, inventorySignals, replenishments, exceptions, customers] = await Promise.all([
      getForecasts({ limit: 100 }),
      getInventorySignals({ limit: 100 }),
      getReplenishments({ limit: 100 }),
      getPlanningExceptions({ limit: 50 }),
      getCustomers(),
    ])

    return {
      forecasts,
      inventorySignals,
      replenishments,
      exceptions,
      customers,
      success: true,
    }
  } catch (error) {
    console.error('Error fetching planning dashboard data:', error)
    return {
      forecasts: [],
      inventorySignals: [],
      replenishments: [],
      exceptions: [],
      customers: [],
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

export async function getForecasts(filters?: ForecastFilters): Promise<Forecast[]> {
  try {
    let query = supabase.from('forecasts').select('*')

    if (filters?.customerId) {
      query = query.eq('customer_id', filters.customerId)
    }
    if (filters?.productId) {
      query = query.eq('product_id', filters.productId)
    }
    if (filters?.status) {
      query = query.eq('status', filters.status)
    }

    query = query.order('period', { ascending: false })

    if (filters?.limit) {
      query = query.limit(filters.limit)
    }
    if (filters?.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching forecasts:', error)
      return []
    }

    return (data as Forecast[]) || []
  } catch (error) {
    console.error('Error in getForecasts:', error)
    return []
  }
}

export async function getForecastForSku(sku: string, customerId?: string): Promise<Forecast[]> {
  try {
    let query = supabase.from('forecasts').select('*').eq('product_id', sku)

    if (customerId) {
      query = query.eq('customer_id', customerId)
    }

    const { data, error } = await query.order('period', { ascending: false })

    if (error) {
      console.error('Error fetching forecast for SKU:', error)
      return []
    }

    return (data as Forecast[]) || []
  } catch (error) {
    console.error('Error in getForecastForSku:', error)
    return []
  }
}

export async function updateForecast(id: string, data: Partial<Forecast>): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('forecasts')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (error) {
      console.error('Error updating forecast:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error in updateForecast:', error)
    return false
  }
}

export async function getInventorySignals(filters?: SignalFilters): Promise<InventorySignal[]> {
  try {
    const daysBack = filters?.daysBack || 7
    const cutoffDate = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000).toISOString()

    let query = supabase
      .from('inventory_signals')
      .select('*')
      .gte('received_date', cutoffDate)

    if (filters?.customerId) {
      query = query.eq('customer_id', filters.customerId)
    }
    if (filters?.validationStatus) {
      query = query.eq('validation_status', filters.validationStatus)
    }

    query = query.order('received_date', { ascending: false })

    if (filters?.limit) {
      query = query.limit(filters.limit)
    }
    if (filters?.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching inventory signals:', error)
      return []
    }

    return (data as InventorySignal[]) || []
  } catch (error) {
    console.error('Error in getInventorySignals:', error)
    return []
  }
}

export async function getIngestionJobs(filters?: JobFilters): Promise<IngestionJob[]> {
  try {
    let query = supabase.from('ingestion_jobs').select('*')

    if (filters?.status) {
      query = query.eq('status', filters.status)
    }
    if (filters?.customerId) {
      query = query.eq('customer_id', filters.customerId)
    }

    query = query.order('received_at', { ascending: false })

    if (filters?.limit) {
      query = query.limit(filters.limit)
    }
    if (filters?.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching ingestion jobs:', error)
      return []
    }

    return (data as IngestionJob[]) || []
  } catch (error) {
    console.error('Error in getIngestionJobs:', error)
    return []
  }
}

export async function getReplenishments(filters?: ReplenishmentFilters): Promise<Replenishment[]> {
  try {
    let query = supabase.from('replenishments').select('*')

    if (filters?.urgency) {
      query = query.eq('urgency', filters.urgency)
    }
    if (filters?.status) {
      query = query.eq('status', filters.status)
    }
    if (filters?.customerId) {
      query = query.eq('customer_id', filters.customerId)
    }

    query = query.order('urgency', { ascending: false })

    if (filters?.limit) {
      query = query.limit(filters.limit)
    }
    if (filters?.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching replenishments:', error)
      return []
    }

    return (data as Replenishment[]) || []
  } catch (error) {
    console.error('Error in getReplenishments:', error)
    return []
  }
}

export async function approveReplenishment(id: string, approvedBy: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('replenishments')
      .update({
        status: 'approved',
        approved_at: new Date().toISOString(),
        approved_by: approvedBy,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)

    if (error) {
      console.error('Error approving replenishment:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error in approveReplenishment:', error)
    return false
  }
}

export async function bulkApproveReplenishments(ids: string[], approvedBy: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('replenishments')
      .update({
        status: 'approved',
        approved_at: new Date().toISOString(),
        approved_by: approvedBy,
        updated_at: new Date().toISOString(),
      })
      .in('id', ids)

    if (error) {
      console.error('Error bulk approving replenishments:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error in bulkApproveReplenishments:', error)
    return false
  }
}

export async function getPlanningExceptions(filters?: ExceptionFilters): Promise<PlanningException[]> {
  try {
    let query = supabase.from('planning_exceptions').select('*')

    if (filters?.type) {
      query = query.eq('type', filters.type)
    }
    if (filters?.severity) {
      query = query.eq('severity', filters.severity)
    }

    if (filters?.resolved === false) {
      query = query.is('resolved_at', null)
    } else if (filters?.resolved === true) {
      query = query.not('resolved_at', 'is', null)
    }

    query = query.order('detected_at', { ascending: false })

    if (filters?.limit) {
      query = query.limit(filters.limit)
    }
    if (filters?.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching planning exceptions:', error)
      return []
    }

    return (data as PlanningException[]) || []
  } catch (error) {
    console.error('Error in getPlanningExceptions:', error)
    return []
  }
}

export async function resolveException(
  id: string,
  notes: string,
  resolvedBy: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('planning_exceptions')
      .update({
        resolved_at: new Date().toISOString(),
        auto_resolution: notes,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)

    if (error) {
      console.error('Error resolving exception:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error in resolveException:', error)
    return false
  }
}

export async function getCustomers(): Promise<Customer[]> {
  try {
    const { data, error } = await supabase.from('customers').select('*').order('name')

    if (error) {
      console.error('Error fetching customers:', error)
      return []
    }

    return (data as Customer[]) || []
  } catch (error) {
    console.error('Error in getCustomers:', error)
    return []
  }
}

export async function getProducts(): Promise<Product[]> {
  try {
    const { data, error } = await supabase.from('products').select('*').order('sku')

    if (error) {
      console.error('Error fetching products:', error)
      return []
    }

    return (data as Product[]) || []
  } catch (error) {
    console.error('Error in getProducts:', error)
    return []
  }
}

export async function getCustomerDataQuality() {
  try {
    const customers = await getCustomers()

    if (customers.length === 0) {
      return {
        average: 0,
        bySegment: {},
        byRegion: {},
      }
    }

    const average = customers.reduce((sum, c) => sum + c.data_quality_score, 0) / customers.length

    const bySegment: Record<string, number> = {}
    const byRegion: Record<string, number> = {}

    customers.forEach((c) => {
      if (!bySegment[c.segment]) {
        bySegment[c.segment] = 0
      }
      bySegment[c.segment] += c.data_quality_score

      if (!byRegion[c.region]) {
        byRegion[c.region] = 0
      }
      byRegion[c.region] += c.data_quality_score
    })

    Object.keys(bySegment).forEach((key) => {
      bySegment[key] = bySegment[key] / customers.filter((c) => c.segment === key).length
    })

    Object.keys(byRegion).forEach((key) => {
      byRegion[key] = byRegion[key] / customers.filter((c) => c.region === key).length
    })

    return {
      average,
      bySegment,
      byRegion,
    }
  } catch (error) {
    console.error('Error in getCustomerDataQuality:', error)
    return {
      average: 0,
      bySegment: {},
      byRegion: {},
    }
  }
}

// ========== METRICS & AGGREGATIONS ==========

export async function getForecastAccuracyTrend(weeks = 12) {
  try {
    const { data, error } = await supabase
      .from('forecasts')
      .select('period, mape')
      .not('mape', 'is', null)
      .order('period', { ascending: true })
      .limit(weeks)

    if (error) {
      console.error('Error fetching forecast accuracy:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error in getForecastAccuracyTrend:', error)
    return []
  }
}

export async function getServiceLevelMetrics() {
  try {
    const replenishments = await getReplenishments({ limit: 1000 })
    const totalReps = replenishments.length
    const stockoutRisk = replenishments.filter(
      (r) => r.urgency === 'critical' && r.expected_stockout_date
    ).length

    return {
      serviceLevel: totalReps > 0 ? ((totalReps - stockoutRisk) / totalReps) * 100 : 100,
      stockoutRiskCount: stockoutRisk,
      totalReplenishments: totalReps,
    }
  } catch (error) {
    console.error('Error in getServiceLevelMetrics:', error)
    return {
      serviceLevel: 0,
      stockoutRiskCount: 0,
      totalReplenishments: 0,
    }
  }
}

export async function getIngestionSummary() {
  try {
    const jobs = await getIngestionJobs({ limit: 1000 })

    const summary = {
      total: jobs.length,
      completed: jobs.filter((j) => j.status === 'completed').length,
      failed: jobs.filter((j) => j.status === 'failed').length,
      needsReview: jobs.filter((j) => j.status === 'needs_review').length,
      processing: jobs.filter((j) => j.status === 'processing').length,
      totalRecords: jobs.reduce((sum, j) => sum + j.records_total, 0),
      validRecords: jobs.reduce((sum, j) => sum + j.records_valid, 0),
      invalidRecords: jobs.reduce((sum, j) => sum + j.records_invalid, 0),
    }

    return summary
  } catch (error) {
    console.error('Error in getIngestionSummary:', error)
    return {
      total: 0,
      completed: 0,
      failed: 0,
      needsReview: 0,
      processing: 0,
      totalRecords: 0,
      validRecords: 0,
      invalidRecords: 0,
    }
  }
}

export async function getReplenishmentPipeline() {
  try {
    const replenishments = await getReplenishments({ limit: 1000 })

    return {
      pending: replenishments.filter((r) => r.status === 'pending').length,
      approved: replenishments.filter((r) => r.status === 'approved').length,
      ordered: replenishments.filter((r) => r.status === 'ordered').length,
      shipped: replenishments.filter((r) => r.status === 'shipped').length,
      delivered: replenishments.filter((r) => r.status === 'delivered').length,
      critical: replenishments.filter((r) => r.urgency === 'critical').length,
      high: replenishments.filter((r) => r.urgency === 'high').length,
      medium: replenishments.filter((r) => r.urgency === 'medium').length,
      low: replenishments.filter((r) => r.urgency === 'low').length,
    }
  } catch (error) {
    console.error('Error in getReplenishmentPipeline:', error)
    return {
      pending: 0,
      approved: 0,
      ordered: 0,
      shipped: 0,
      delivered: 0,
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
    }
  }
}
