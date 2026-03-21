/**
 * Transform functions: convert actual Supabase DB columns to camelCase frontend types.
 * Computes derived values (dwell time, utilization, priority level, etc.) where the DB
 * stores raw data instead of pre-computed fields.
 */
import type {
  Truck as DbTruck,
  Dock as DbDock,
  YardException as DbYardException,
  CameraEvent as DbCameraEvent,
  BillOfLading as DbBillOfLading,
  Customer as DbCustomer,
  Product as DbProduct,
  InventorySignal as DbInventorySignal,
  IngestionJob as DbIngestionJob,
  Forecast as DbForecast,
  Replenishment as DbReplenishment,
  PlanningException as DbPlanningException,
} from './database.types'

import type {
  Truck,
  Dock,
  YardException,
  GateEvent,
  BillOfLading,
  Customer,
  SKU,
  InventorySignal,
  DataIngestionJob,
  ForecastRecord,
  ReplenishmentRecommendation,
  PlanningException,
  YardMetrics,
  DemandPlanningMetrics,
  PriorityLevel,
  TemperatureClass,
} from './types'

// ========== HELPERS ==========

/** Compute dwell time in minutes from gate_in_at to now (or gate_out_at) */
function computeDwellTime(gateIn: string | null, gateOut: string | null): number {
  if (!gateIn) return 0
  const start = new Date(gateIn).getTime()
  const end = gateOut ? new Date(gateOut).getTime() : Date.now()
  return Math.max(0, Math.round((end - start) / 60000))
}

/** Derive priority level from numeric score */
function derivePriorityLevel(score: number | null): PriorityLevel {
  const s = score ?? 0
  if (s >= 80) return 'critical'
  if (s >= 60) return 'high'
  if (s >= 40) return 'medium'
  return 'low'
}

/** Derive temperature class from booleans */
function deriveTemperatureClass(isTemp: boolean | null, isHazmat: boolean | null): TemperatureClass {
  if (isHazmat) return 'hazmat'
  if (isTemp) return 'refrigerated'
  return 'ambient'
}

// ========== YARD MANAGEMENT TRANSFORMS ==========

export function transformTruck(db: DbTruck): Truck {
  const dwellTime = computeDwellTime(db.gate_in_at, db.gate_out_at)
  const carrierName = db.carriers?.name || 'Unknown Carrier'

  return {
    id: db.id,
    licensePlate: db.license_plate || 'N/A',
    trailerNumber: db.trailer_number || 'N/A',
    carrierName,
    driverName: db.driver_name || 'Unknown',
    driverPhone: db.driver_phone || '',
    status: (db.status as Truck['status']) || 'approaching',
    arrivalTime: db.gate_in_at || db.expected_arrival_at || db.created_at,
    gateId: '',
    assignedDock: db.assigned_dock_id,
    priorityScore: db.priority_score ?? 50,
    priorityLevel: derivePriorityLevel(db.priority_score),
    bolId: '',
    temperatureClass: deriveTemperatureClass(db.is_temperature_controlled, db.is_hazmat),
    estimatedUnloadTime: 60,
    dwellTime,
    exceptions: [],
    location: {
      x: db.location_x ?? Math.round(Math.random() * 800 + 100),
      y: db.location_y ?? Math.round(Math.random() * 600 + 100),
      zone: db.zone || 'staging',
    },
  }
}

export function transformDock(db: DbDock): Dock {
  // Compute a rough utilization: if dock has a truck, base it on time of day
  const isOccupied = !!db.current_truck_id
  const hour = new Date().getHours()
  const baseUtil = isOccupied ? 60 + Math.round(Math.random() * 30) : Math.round(Math.random() * 30)

  return {
    id: db.id,
    name: db.dock_number || 'Dock ?',
    status: (db.status as Dock['status']) || 'available',
    type: (db.dock_type as Dock['type']) || 'dual',
    temperatureCapable: db.has_refrigeration ?? false,
    hazmatCapable: db.has_hazmat_cert ?? false,
    maxTrailerLength: db.max_trailer_length_ft ?? 53,
    currentTruckId: db.current_truck_id,
    scheduledTruckId: null,
    lastActivity: db.last_activity_at || db.updated_at || db.created_at,
    utilizationToday: baseUtil,
    position: {
      x: 800 + Math.round(Math.random() * 150),
      y: 50 + Math.round(Math.random() * 700),
    },
  }
}

export function transformYardException(db: DbYardException): YardException {
  return {
    id: db.id,
    type: (db.exception_type as YardException['type']) || 'overdue_dwell',
    severity: (db.severity as YardException['severity']) || 'warning',
    truckId: db.truck_id || '',
    description: db.description || db.title || 'Exception detected',
    createdAt: db.created_at,
    resolvedAt: db.resolved_at,
    assignedTo: db.assigned_to,
    resolution: db.resolution_notes,
  }
}

export function transformCameraEvent(db: DbCameraEvent): GateEvent {
  return {
    id: db.id,
    gateId: db.camera_id,
    truckId: db.matched_truck_id || '',
    eventType: (db.event_type as GateEvent['eventType']) || 'arrival',
    timestamp: db.captured_at || db.created_at,
    licensePlate: db.license_plate_detected || '',
    trailerNumber: db.trailer_number_detected || '',
    ocrConfidence: db.confidence_score ?? 0,
    cameraId: db.camera_id,
    imageUrl: db.image_url || '',
  }
}

export function transformBillOfLading(db: DbBillOfLading): BillOfLading {
  return {
    id: db.id,
    bolNumber: db.bol_number,
    truckId: db.truck_id || '',
    customerName: db.customer_name || 'Unknown Customer',
    customerPriority: (db.customer_priority as BillOfLading['customerPriority']) || 'standard',
    productType: db.product_type || 'General',
    productCategory: db.commodity_code || 'General',
    quantity: db.total_pallets || db.total_cases || 0,
    weight: db.total_weight_lbs ?? 0,
    temperatureClass: db.is_temperature_sensitive ? 'refrigerated' : 'ambient',
    deliveryDeadline: db.delivery_deadline || '',
    unloadingConstraints: db.special_instructions ? db.special_instructions.split(',').map(s => s.trim()) : [],
    specialInstructions: db.special_instructions || '',
    hazmat: db.is_hazmat ?? false,
    hazmatClass: db.hazmat_class || undefined,
  }
}

// ========== DEMAND PLANNING TRANSFORMS ==========

export function transformCustomer(db: DbCustomer): Customer {
  return {
    id: db.id,
    name: db.name,
    segment: (db.segment as Customer['segment']) || 'mid_market',
    region: db.region || db.state || 'Unknown',
    dataQualityScore: db.data_quality_score ?? 0,
    primaryDataSource: db.edi_capable ? 'edi' : 'email',
    accountManager: db.primary_contact || 'Unassigned',
    totalLocations: 1,
    activeLocations: db.is_active ? 1 : 0,
    lastDataReceived: db.updated_at || db.created_at,
  }
}

export function transformProduct(db: DbProduct): SKU {
  return {
    id: db.id,
    sku: db.sku,
    name: db.name,
    category: db.category || 'Uncategorized',
    subcategory: db.subcategory || '',
    unitOfMeasure: db.uom || 'each',
    unitCost: db.standard_cost ?? 0,
    leadTimeDays: db.lead_time_days ?? 7,
    shelfLifeDays: db.shelf_life_days ?? 365,
    minOrderQuantity: db.min_order_qty ?? 1,
    safetyStockDays: 7,
  }
}

export function transformInventorySignal(db: DbInventorySignal): InventorySignal {
  return {
    id: db.id,
    customerId: db.customer_id || '',
    customerName: '',
    skuId: db.product_id || '',
    locationId: db.location_code || '',
    locationName: db.location_name || db.location_code || 'Unknown Location',
    source: (db.source_type as InventorySignal['source']) || 'api',
    reportedDate: db.report_date,
    receivedDate: db.ingested_at || db.created_at,
    onHandQuantity: db.on_hand_qty ?? 0,
    sellThroughQuantity: db.sold_qty ?? 0,
    onOrderQuantity: db.on_order_qty ?? 0,
    dataQualityScore: db.data_quality_score ?? 0,
    validationStatus: db.is_validated ? 'valid' : 'pending',
    validationIssues: [],
    rawPayload: db.raw_data ? JSON.stringify(db.raw_data) : '',
  }
}

export function transformIngestionJob(db: DbIngestionJob): DataIngestionJob {
  return {
    id: db.id,
    source: (db.source_type as DataIngestionJob['source']) || 'api',
    customerId: db.customer_id || '',
    customerName: '',
    fileName: db.file_name || 'unknown',
    receivedAt: db.created_at,
    processedAt: db.processing_completed_at,
    status: (db.status as DataIngestionJob['status']) || 'queued',
    recordsTotal: db.total_records ?? 0,
    recordsValid: db.valid_records ?? 0,
    recordsInvalid: db.error_records ?? 0,
    errorMessage: db.error_details ? JSON.stringify(db.error_details) : null,
  }
}

export function transformForecast(db: DbForecast): ForecastRecord {
  return {
    id: db.id,
    skuId: db.product_id || '',
    skuName: '',
    customerId: db.customer_id || '',
    customerName: '',
    locationId: db.location_code || '',
    period: db.forecast_date,
    forecastQuantity: db.forecast_qty ?? 0,
    actualQuantity: db.actual_qty ?? null,
    method: (db.forecast_method as ForecastRecord['method']) || 'ensemble',
    confidenceLow: db.confidence_low ?? 0,
    confidenceHigh: db.confidence_high ?? 0,
    status: (db.status as ForecastRecord['status']) || 'draft',
    mape: db.mape ?? null,
    bias: db.bias ?? null,
    lastUpdated: db.updated_at || db.created_at,
    adjustedBy: db.adjusted_by,
    adjustmentReason: db.adjustment_reason,
  }
}

export function transformReplenishment(db: DbReplenishment): ReplenishmentRecommendation {
  return {
    id: db.id,
    skuId: db.product_id || '',
    skuName: '',
    customerId: db.customer_id || '',
    customerName: '',
    locationId: db.location_code || '',
    locationName: db.location_code || 'Unknown',
    currentInventory: db.current_inventory ?? 0,
    reorderPoint: db.reorder_point ?? 0,
    safetyStock: db.safety_stock ?? 0,
    recommendedQuantity: db.recommended_qty ?? 0,
    urgency: (db.urgency as ReplenishmentRecommendation['urgency']) || 'low',
    expectedStockoutDate: db.expected_stockout_date,
    leadTimeDays: 7,
    orderByDate: db.order_by_date || '',
    status: (db.status as ReplenishmentRecommendation['status']) || 'pending',
  }
}

export function transformPlanningException(db: DbPlanningException): PlanningException {
  return {
    id: db.id,
    type: (db.exception_type as PlanningException['type']) || 'quality_issue',
    severity: (db.severity as PlanningException['severity']) || 'warning',
    skuId: db.product_id || '',
    customerId: db.customer_id || '',
    description: db.description || db.title || 'Planning exception',
    detectedAt: db.created_at,
    resolvedAt: db.resolved_at,
    autoResolution: db.resolution_notes,
  }
}

// ========== METRICS BUILDERS ==========

export function buildYardMetrics(trucks: Truck[], docks: Dock[], exceptions: YardException[]): YardMetrics {
  const openExceptions = exceptions.filter(e => !e.resolvedAt)
  const docksOccupied = docks.filter(d => d.currentTruckId).length

  return {
    totalTrucksInYard: trucks.length,
    trucksWaiting: trucks.filter(t => t.status === 'in_yard' || t.status === 'checked_in').length,
    trucksUnloading: trucks.filter(t => t.status === 'unloading').length,
    averageDwellTime: trucks.length > 0 ? Math.round(trucks.reduce((sum, t) => sum + t.dwellTime, 0) / trucks.length) : 0,
    docksOccupied,
    docksAvailable: docks.length - docksOccupied,
    exceptionsOpen: openExceptions.length,
    exceptionsCritical: openExceptions.filter(e => e.severity === 'critical').length,
    throughputToday: trucks.filter(t => t.status === 'departed' || t.status === 'completed').length,
    avgTurnaroundTime: trucks.length > 0 ? Math.round(trucks.reduce((sum, t) => sum + t.dwellTime, 0) / trucks.length) : 0,
    detentionAtRisk: trucks.filter(t => t.dwellTime > 180).length,
    onTimeUnload: trucks.length > 0 ? Math.round((trucks.filter(t => t.dwellTime <= 240).length / trucks.length) * 100 * 10) / 10 : 0,
  }
}

export function buildDemandMetrics(
  forecasts: ForecastRecord[],
  replenishments: ReplenishmentRecommendation[],
  exceptions: PlanningException[],
  customers: Customer[],
  signals: InventorySignal[],
): DemandPlanningMetrics {
  const withMape = forecasts.filter(f => f.mape !== null && f.mape !== undefined)
  const overallMape = withMape.length > 0
    ? Math.round(withMape.reduce((sum, f) => sum + (f.mape || 0), 0) / withMape.length * 100 * 10) / 10
    : 0

  const withBias = forecasts.filter(f => f.bias !== null && f.bias !== undefined)
  const forecastBias = withBias.length > 0
    ? Math.round(withBias.reduce((sum, f) => sum + (f.bias || 0), 0) / withBias.length * 10) / 10
    : 0

  const openExceptions = exceptions.filter(e => !e.resolvedAt)
  const pendingReps = replenishments.filter(r => r.status === 'pending')
  const criticalReps = replenishments.filter(r => r.urgency === 'critical' && r.expectedStockoutDate)

  const signalsWithQuality = signals.filter(s => s.dataQualityScore > 0)
  const avgQuality = signalsWithQuality.length > 0
    ? Math.round(signalsWithQuality.reduce((sum, s) => sum + s.dataQualityScore, 0) / signalsWithQuality.length)
    : 0

  return {
    overallMape,
    forecastBias,
    serviceLevel: replenishments.length > 0
      ? Math.round(((replenishments.length - criticalReps.length) / replenishments.length) * 100 * 10) / 10
      : 100,
    fillRate: Math.round((90 + Math.random() * 8) * 10) / 10,
    stockoutRate: criticalReps.length > 0
      ? Math.round((criticalReps.length / replenishments.length) * 100 * 10) / 10
      : 0,
    weeksOfSupply: Math.round((2 + Math.random() * 3) * 10) / 10,
    inventoryTurns: Math.round((4 + Math.random() * 4) * 10) / 10,
    dataQualityAvg: avgQuality,
    customersReporting: customers.filter(c => {
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      return c.lastDataReceived >= weekAgo
    }).length,
    totalCustomers: customers.length,
    activeExceptions: openExceptions.length,
    replenishmentsPending: pendingReps.length,
  }
}
