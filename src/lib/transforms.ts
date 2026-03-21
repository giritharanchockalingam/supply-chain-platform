/**
 * Transform functions: convert snake_case Supabase DB types to camelCase frontend types
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
} from './types'

// ========== YARD MANAGEMENT TRANSFORMS ==========

export function transformTruck(db: DbTruck): Truck {
  return {
    id: db.id,
    licensePlate: db.license_plate,
    trailerNumber: db.trailer_number,
    carrierName: db.carrier_name,
    driverName: db.driver_name,
    driverPhone: db.driver_phone,
    status: db.status,
    arrivalTime: db.arrival_time,
    gateId: db.gate_id,
    assignedDock: db.assigned_dock_id,
    priorityScore: db.priority_score,
    priorityLevel: db.priority_level,
    bolId: db.bol_id,
    temperatureClass: db.temperature_class,
    estimatedUnloadTime: db.estimated_unload_time,
    dwellTime: db.dwell_time,
    exceptions: [],
    location: { x: db.location_x, y: db.location_y, zone: db.zone },
  }
}

export function transformDock(db: DbDock): Dock {
  return {
    id: db.id,
    name: db.name,
    status: db.status,
    type: db.type,
    temperatureCapable: db.temperature_capable,
    hazmatCapable: db.hazmat_capable,
    maxTrailerLength: db.max_trailer_length,
    currentTruckId: db.current_truck_id,
    scheduledTruckId: db.scheduled_truck_id,
    lastActivity: db.last_activity,
    utilizationToday: db.utilization_today,
    position: { x: db.position_x, y: db.position_y },
  }
}

export function transformYardException(db: DbYardException): YardException {
  return {
    id: db.id,
    type: db.type,
    severity: db.severity,
    truckId: db.truck_id,
    description: db.description,
    createdAt: db.created_at,
    resolvedAt: db.resolved_at,
    assignedTo: db.assigned_to,
    resolution: db.resolution,
  }
}

export function transformCameraEvent(db: DbCameraEvent): GateEvent {
  return {
    id: db.id,
    gateId: db.camera_id,
    truckId: db.truck_id || '',
    eventType: db.event_type,
    timestamp: db.timestamp,
    licensePlate: db.license_plate,
    trailerNumber: db.trailer_number,
    ocrConfidence: db.ocr_confidence,
    cameraId: db.camera_id,
    imageUrl: db.image_url,
  }
}

export function transformBillOfLading(db: DbBillOfLading): BillOfLading {
  return {
    id: db.id,
    bolNumber: db.bol_number,
    truckId: db.truck_id,
    customerName: db.customer_name,
    customerPriority: db.customer_priority,
    productType: db.product_type,
    productCategory: db.product_category,
    quantity: db.quantity,
    weight: db.weight,
    temperatureClass: db.temperature_class,
    deliveryDeadline: db.delivery_deadline,
    unloadingConstraints: db.unloading_constraints ? db.unloading_constraints.split(',').map(s => s.trim()) : [],
    specialInstructions: db.special_instructions,
    hazmat: db.hazmat,
    hazmatClass: db.hazmat_class || undefined,
  }
}

// ========== DEMAND PLANNING TRANSFORMS ==========

export function transformCustomer(db: DbCustomer): Customer {
  return {
    id: db.id,
    name: db.name,
    segment: db.segment,
    region: db.region,
    dataQualityScore: db.data_quality_score,
    primaryDataSource: db.primary_data_source,
    accountManager: db.account_manager,
    totalLocations: db.total_locations,
    activeLocations: db.active_locations,
    lastDataReceived: db.last_data_received,
  }
}

export function transformProduct(db: DbProduct): SKU {
  return {
    id: db.id,
    sku: db.sku,
    name: db.name,
    category: db.category,
    subcategory: db.subcategory,
    unitOfMeasure: db.unit_of_measure,
    unitCost: db.unit_cost,
    leadTimeDays: db.lead_time_days,
    shelfLifeDays: db.shelf_life_days,
    minOrderQuantity: db.min_order_quantity,
    safetyStockDays: db.safety_stock_days,
  }
}

export function transformInventorySignal(db: DbInventorySignal): InventorySignal {
  return {
    id: db.id,
    customerId: db.customer_id,
    customerName: db.customer_name,
    skuId: db.product_id,
    locationId: db.location_id,
    locationName: db.location_name,
    source: db.source,
    reportedDate: db.reported_date,
    receivedDate: db.received_date,
    onHandQuantity: db.on_hand_quantity,
    sellThroughQuantity: db.sell_through_quantity,
    onOrderQuantity: db.on_order_quantity,
    dataQualityScore: db.data_quality_score,
    validationStatus: db.validation_status,
    validationIssues: db.validation_issues ? db.validation_issues.split(',').map(s => s.trim()) : [],
    rawPayload: db.raw_payload,
  }
}

export function transformIngestionJob(db: DbIngestionJob): DataIngestionJob {
  return {
    id: db.id,
    source: db.source,
    customerId: db.customer_id,
    customerName: db.customer_name,
    fileName: db.file_name,
    receivedAt: db.received_at,
    processedAt: db.processed_at,
    status: db.status,
    recordsTotal: db.records_total,
    recordsValid: db.records_valid,
    recordsInvalid: db.records_invalid,
    errorMessage: db.error_message,
  }
}

export function transformForecast(db: DbForecast): ForecastRecord {
  return {
    id: db.id,
    skuId: db.product_id,
    skuName: db.product_name,
    customerId: db.customer_id,
    customerName: db.customer_name,
    locationId: db.location_id,
    period: db.period,
    forecastQuantity: db.forecast_quantity,
    actualQuantity: db.actual_quantity,
    method: db.method,
    confidenceLow: db.confidence_low,
    confidenceHigh: db.confidence_high,
    status: db.status,
    mape: db.mape,
    bias: db.bias,
    lastUpdated: db.last_updated,
    adjustedBy: db.adjusted_by,
    adjustmentReason: db.adjustment_reason,
  }
}

export function transformReplenishment(db: DbReplenishment): ReplenishmentRecommendation {
  return {
    id: db.id,
    skuId: db.product_id,
    skuName: db.product_name,
    customerId: db.customer_id,
    customerName: db.customer_name,
    locationId: db.location_id,
    locationName: db.location_name,
    currentInventory: db.current_inventory,
    reorderPoint: db.reorder_point,
    safetyStock: db.safety_stock,
    recommendedQuantity: db.recommended_quantity,
    urgency: db.urgency,
    expectedStockoutDate: db.expected_stockout_date,
    leadTimeDays: db.lead_time_days,
    orderByDate: db.order_by_date,
    status: db.status,
  }
}

export function transformPlanningException(db: DbPlanningException): PlanningException {
  return {
    id: db.id,
    type: db.type,
    severity: db.severity,
    skuId: db.product_id,
    customerId: db.customer_id,
    description: db.description,
    detectedAt: db.detected_at,
    resolvedAt: db.resolved_at,
    autoResolution: db.auto_resolution,
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
    throughputToday: trucks.filter(t => t.status === 'departed').length,
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
  const withMape = forecasts.filter(f => f.mape !== null)
  const overallMape = withMape.length > 0
    ? Math.round(withMape.reduce((sum, f) => sum + (f.mape || 0), 0) / withMape.length * 100 * 10) / 10
    : 0

  const withBias = forecasts.filter(f => f.bias !== null)
  const forecastBias = withBias.length > 0
    ? Math.round(withBias.reduce((sum, f) => sum + (f.bias || 0), 0) / withBias.length * 10) / 10
    : 0

  const openExceptions = exceptions.filter(e => !e.resolvedAt)
  const pendingReps = replenishments.filter(r => r.status === 'pending')
  const criticalReps = replenishments.filter(r => r.urgency === 'critical' && r.expectedStockoutDate)

  const avgQuality = signals.length > 0
    ? Math.round(signals.reduce((sum, s) => sum + s.dataQualityScore, 0) / signals.length)
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
