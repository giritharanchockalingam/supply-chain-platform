// ========== YARD MANAGEMENT TYPES ==========

export type TruckStatus =
  | 'approaching'
  | 'at_gate'
  | 'checked_in'
  | 'in_yard'
  | 'at_dock'
  | 'unloading'
  | 'loading'
  | 'completed'
  | 'departed';

export type DockStatus = 'available' | 'assigned' | 'occupied' | 'maintenance' | 'blocked';

export type PriorityLevel = 'critical' | 'high' | 'medium' | 'low';

export type TemperatureClass = 'ambient' | 'refrigerated' | 'frozen' | 'hazmat';

export type ExceptionType =
  | 'missing_bol'
  | 'mismatched_trailer'
  | 'late_arrival'
  | 'temperature_breach'
  | 'dock_congestion'
  | 'hazmat_violation'
  | 'overdue_dwell'
  | 'damaged_load';

/**
 * Represents a truck in the yard management system.
 * Tracks location, status, assignments, and associated exceptions.
 */
export interface Truck {
  /** Unique identifier for the truck */
  id: string;
  /** Vehicle license plate */
  licensePlate: string;
  /** Trailer identification number */
  trailerNumber: string;
  /** Name of the carrier company */
  carrierName: string;
  /** Driver's full name */
  driverName: string;
  /** Driver's contact phone number */
  driverPhone: string;
  /** Current status in the yard */
  status: TruckStatus;
  /** ISO 8601 timestamp when truck arrived */
  arrivalTime: string;
  /** Gate ID through which truck entered */
  gateId: string;
  /** Currently assigned dock ID, null if not assigned */
  assignedDock: string | null;
  /** Priority score (0-100) calculated by priority engine */
  priorityScore: number;
  /** Categorized priority level */
  priorityLevel: PriorityLevel;
  /** Associated Bill of Lading ID */
  bolId: string;
  /** Temperature requirements for cargo */
  temperatureClass: TemperatureClass;
  /** Estimated time to complete unloading (minutes) */
  estimatedUnloadTime: number;
  /** Time truck has been in yard since arrival (minutes) */
  dwellTime: number;
  /** Array of active exceptions for this truck */
  exceptions: YardException[];
  /** Current location within yard (x, y coordinates and zone) */
  location: { x: number; y: number; zone: string };
}

/**
 * Bill of Lading - shipping document with cargo and delivery details.
 */
export interface BillOfLading {
  /** Unique identifier */
  id: string;
  /** BOL document number */
  bolNumber: string;
  /** Associated truck ID */
  truckId: string;
  /** Receiving customer name */
  customerName: string;
  /** Customer tier for prioritization */
  customerPriority: 'platinum' | 'gold' | 'silver' | 'standard';
  /** Type of product being shipped */
  productType: string;
  /** Product category for inventory management */
  productCategory: string;
  /** Quantity of products */
  quantity: number;
  /** Total weight in pounds */
  weight: number;
  /** Temperature control requirements */
  temperatureClass: TemperatureClass;
  /** ISO 8601 deadline for delivery */
  deliveryDeadline: string;
  /** Special handling requirements during unloading */
  unloadingConstraints: string[];
  /** Additional instructions for warehouse staff */
  specialInstructions: string;
  /** Whether cargo contains hazardous materials */
  hazmat: boolean;
  /** Hazmat classification if applicable (e.g., "Class 8 - Corrosive") */
  hazmatClass?: string;
}

/**
 * Dock represents a loading/unloading bay in the yard.
 */
export interface Dock {
  /** Unique identifier */
  id: string;
  /** Human-readable dock name (e.g., "Dock A-01") */
  name: string;
  /** Current operational status */
  status: DockStatus;
  /** Whether dock is for inbound, outbound, or both */
  type: 'inbound' | 'outbound' | 'dual';
  /** Whether dock can maintain refrigerated/frozen temperatures */
  temperatureCapable: boolean;
  /** Whether dock is approved for hazmat unloading */
  hazmatCapable: boolean;
  /** Maximum trailer length the dock can accommodate (feet) */
  maxTrailerLength: number;
  /** Currently assigned truck ID, null if unoccupied */
  currentTruckId: string | null;
  /** Next scheduled truck ID, null if no assignment */
  scheduledTruckId: string | null;
  /** ISO 8601 timestamp of last activity */
  lastActivity: string;
  /** Percentage of dock utilization today (0-100) */
  utilizationToday: number;
  /** Physical position of dock in yard */
  position: { x: number; y: number };
}

/**
 * Exception represents an issue or alert in the yard management system.
 */
export interface YardException {
  /** Unique identifier */
  id: string;
  /** Type of exception that occurred */
  type: ExceptionType;
  /** Severity level of the exception */
  severity: 'critical' | 'warning' | 'info';
  /** Associated truck ID */
  truckId: string;
  /** Human-readable description */
  description: string;
  /** ISO 8601 timestamp when exception was created */
  createdAt: string;
  /** ISO 8601 timestamp when resolved, null if open */
  resolvedAt: string | null;
  /** User ID assigned to resolve this exception */
  assignedTo: string | null;
  /** Notes on how the exception was resolved */
  resolution: string | null;
}

/**
 * Gate event from OCR-based truck entry/exit detection.
 */
export interface GateEvent {
  /** Unique identifier */
  id: string;
  /** Gate ID where event occurred */
  gateId: string;
  /** Associated truck ID (from matching logic) */
  truckId: string;
  /** Type of gate event */
  eventType: 'arrival' | 'departure';
  /** ISO 8601 timestamp of event */
  timestamp: string;
  /** License plate detected by OCR */
  licensePlate: string;
  /** Trailer number detected by OCR */
  trailerNumber: string;
  /** OCR confidence level (0-1) */
  ocrConfidence: number;
  /** Camera ID that captured image */
  cameraId: string;
  /** URL to evidence image */
  imageUrl: string;
}

/**
 * Real-time metrics for yard operations dashboard.
 */
export interface YardMetrics {
  /** Total trucks currently in yard */
  totalTrucksInYard: number;
  /** Trucks waiting for dock assignment */
  trucksWaiting: number;
  /** Trucks currently being unloaded */
  trucksUnloading: number;
  /** Average dwell time in minutes */
  averageDwellTime: number;
  /** Docks currently occupied */
  docksOccupied: number;
  /** Docks available for assignment */
  docksAvailable: number;
  /** Unresolved exceptions count */
  exceptionsOpen: number;
  /** Critical severity exceptions count */
  exceptionsCritical: number;
  /** Trucks that completed processing today */
  throughputToday: number;
  /** Average time from arrival to departure (minutes) */
  avgTurnaroundTime: number;
  /** Trucks at risk of detention charges */
  detentionAtRisk: number;
  /** Percentage of on-time unloads today */
  onTimeUnload: number;
}

// ========== DEMAND PLANNING TYPES ==========

export type ForecastMethod = 'holt_winters' | 'arima' | 'xgboost' | 'ensemble' | 'crostons';

export type DataSourceType = 'edi' | 'email' | 'spreadsheet' | 'pdf' | 'manual' | 'api';

export type ForecastStatus = 'draft' | 'reviewed' | 'approved' | 'published';

export type AlertSeverity = 'critical' | 'warning' | 'info';

/**
 * Stock Keeping Unit - represents a distinct product.
 */
export interface SKU {
  /** Unique identifier */
  id: string;
  /** SKU code */
  sku: string;
  /** Product name */
  name: string;
  /** Product category */
  category: string;
  /** Product subcategory for filtering */
  subcategory: string;
  /** Unit of measurement (each, case, pallet, etc.) */
  unitOfMeasure: string;
  /** Cost per unit */
  unitCost: number;
  /** Days required between order and delivery */
  leadTimeDays: number;
  /** Days product remains fresh/sellable */
  shelfLifeDays: number;
  /** Minimum order quantity from supplier */
  minOrderQuantity: number;
  /** Days of safety stock to maintain */
  safetyStockDays: number;
}

/**
 * Customer in the demand planning system.
 */
export interface Customer {
  /** Unique identifier */
  id: string;
  /** Customer company name */
  name: string;
  /** Customer segmentation for prioritization */
  segment: 'enterprise' | 'mid_market' | 'boutique';
  /** Geographic region */
  region: string;
  /** Data quality score (0-100) based on signal validation */
  dataQualityScore: number;
  /** Primary method of data transmission */
  primaryDataSource: DataSourceType;
  /** Account manager assigned to this customer */
  accountManager: string;
  /** Total number of locations this customer has */
  totalLocations: number;
  /** Number of locations with active signals */
  activeLocations: number;
  /** ISO 8601 timestamp of last received data */
  lastDataReceived: string;
}

/**
 * Inventory signal - a point-in-time snapshot of customer inventory.
 */
export interface InventorySignal {
  /** Unique identifier */
  id: string;
  /** Customer ID that reported this signal */
  customerId: string;
  /** Customer name for quick reference */
  customerName: string;
  /** SKU ID of the product */
  skuId: string;
  /** Store/location ID */
  locationId: string;
  /** Location name for quick reference */
  locationName: string;
  /** Data source method */
  source: DataSourceType;
  /** Date when customer reports this data */
  reportedDate: string;
  /** ISO 8601 timestamp when signal was received */
  receivedDate: string;
  /** Current quantity on hand */
  onHandQuantity: number;
  /** Quantity sold/consumed since last signal */
  sellThroughQuantity: number;
  /** Quantity on order from suppliers */
  onOrderQuantity: number;
  /** Quality score of this specific signal (0-100) */
  dataQualityScore: number;
  /** Validation result of this signal */
  validationStatus: 'valid' | 'warning' | 'error' | 'pending';
  /** List of validation issues if any */
  validationIssues: string[];
  /** Original raw data payload for audit trail */
  rawPayload: string;
}

/**
 * Forecast record - predicted demand for a SKU at a location.
 */
export interface ForecastRecord {
  /** Unique identifier */
  id: string;
  /** SKU ID being forecasted */
  skuId: string;
  /** SKU name for quick reference */
  skuName: string;
  /** Customer ID */
  customerId: string;
  /** Customer name for quick reference */
  customerName: string;
  /** Location ID within customer's network */
  locationId: string;
  /** Period label (YYYY-MM format) */
  period: string;
  /** Forecasted quantity for this period */
  forecastQuantity: number;
  /** Actual demand if period is in past */
  actualQuantity: number | null;
  /** Forecasting method used */
  method: ForecastMethod;
  /** Lower confidence interval bound */
  confidenceLow: number;
  /** Upper confidence interval bound */
  confidenceHigh: number;
  /** Approval status of this forecast */
  status: ForecastStatus;
  /** Mean Absolute Percentage Error if available */
  mape: number | null;
  /** Forecast bias (positive = over, negative = under) */
  bias: number | null;
  /** ISO 8601 timestamp of last update */
  lastUpdated: string;
  /** User ID who adjusted forecast if manual override */
  adjustedBy: string | null;
  /** Reason for manual adjustment */
  adjustmentReason: string | null;
}

/**
 * Replenishment recommendation for a SKU at a location.
 */
export interface ReplenishmentRecommendation {
  /** Unique identifier */
  id: string;
  /** SKU ID to replenish */
  skuId: string;
  /** SKU name for quick reference */
  skuName: string;
  /** Customer ID */
  customerId: string;
  /** Customer name for quick reference */
  customerName: string;
  /** Location ID */
  locationId: string;
  /** Location name for quick reference */
  locationName: string;
  /** Current on-hand inventory */
  currentInventory: number;
  /** Point at which to place new order */
  reorderPoint: number;
  /** Minimum inventory to keep for contingency */
  safetyStock: number;
  /** Recommended order quantity */
  recommendedQuantity: number;
  /** Urgency of this replenishment */
  urgency: PriorityLevel;
  /** Date forecast predicts inventory will hit zero */
  expectedStockoutDate: string | null;
  /** Days between order and receipt */
  leadTimeDays: number;
  /** Date by which order should be placed */
  orderByDate: string;
  /** Current status of replenishment */
  status: 'pending' | 'approved' | 'ordered' | 'shipped' | 'delivered';
}

/**
 * Metrics for demand planning operations dashboard.
 */
export interface DemandPlanningMetrics {
  /** Overall Mean Absolute Percentage Error across all forecasts */
  overallMape: number;
  /** Average forecast bias (positive = overstocking, negative = understocking) */
  forecastBias: number;
  /** Percentage of demand met without stockout */
  serviceLevel: number;
  /** Percentage of orders filled from inventory */
  fillRate: number;
  /** Percentage of locations experiencing stockout */
  stockoutRate: number;
  /** Average weeks of supply on hand */
  weeksOfSupply: number;
  /** Times inventory completely turned over in period */
  inventoryTurns: number;
  /** Average data quality score across all signals */
  dataQualityAvg: number;
  /** Customers actively reporting data */
  customersReporting: number;
  /** Total customers in system */
  totalCustomers: number;
  /** Unresolved planning exceptions */
  activeExceptions: number;
  /** Replenishment recommendations awaiting action */
  replenishmentsPending: number;
}

/**
 * Planning exception - anomaly or issue in demand planning.
 */
export interface PlanningException {
  /** Unique identifier */
  id: string;
  /** Type of planning exception */
  type:
    | 'missing_data'
    | 'duplicate_signal'
    | 'demand_spike'
    | 'demand_drop'
    | 'stale_data'
    | 'quality_issue'
    | 'stockout_risk'
    | 'overstock_risk';
  /** Severity of the exception */
  severity: AlertSeverity;
  /** Associated SKU ID */
  skuId: string;
  /** Associated customer ID */
  customerId: string;
  /** Human-readable description */
  description: string;
  /** ISO 8601 timestamp when detected */
  detectedAt: string;
  /** ISO 8601 timestamp when resolved, null if open */
  resolvedAt: string | null;
  /** System-generated resolution if automatically resolved */
  autoResolution: string | null;
}

/**
 * Data ingestion job - tracks processing of customer data submissions.
 */
export interface DataIngestionJob {
  /** Unique identifier */
  id: string;
  /** Data source method */
  source: DataSourceType;
  /** Customer ID that submitted data */
  customerId: string;
  /** Customer name for quick reference */
  customerName: string;
  /** Name of file received */
  fileName: string;
  /** ISO 8601 timestamp when data received */
  receivedAt: string;
  /** ISO 8601 timestamp when processing completed */
  processedAt: string | null;
  /** Current processing status */
  status: 'queued' | 'processing' | 'completed' | 'failed' | 'needs_review';
  /** Total records in the submission */
  recordsTotal: number;
  /** Records that passed validation */
  recordsValid: number;
  /** Records that failed validation */
  recordsInvalid: number;
  /** Error message if status is failed */
  errorMessage: string | null;
}
