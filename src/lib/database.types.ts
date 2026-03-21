/**
 * Supabase Database Types - Auto-generated from supply_chain schema
 * These types represent the structure of tables in the supply_chain schema
 */

// ========== YARD MANAGEMENT TABLES ==========

export interface DistributionCenter {
  id: string
  code: string
  name: string
  address: string
  city: string
  state: string
  zip_code: string
  country: string
  latitude: number
  longitude: number
  total_docks: number
  active_docks: number
  operating_hours: string
  created_at: string
  updated_at: string
}

export interface Dock {
  id: string
  dc_id: string
  name: string
  status: 'available' | 'assigned' | 'occupied' | 'maintenance' | 'blocked'
  type: 'inbound' | 'outbound' | 'dual'
  temperature_capable: boolean
  hazmat_capable: boolean
  max_trailer_length: number
  current_truck_id: string | null
  scheduled_truck_id: string | null
  last_activity: string
  utilization_today: number
  position_x: number
  position_y: number
  created_at: string
  updated_at: string
}

export interface Carrier {
  id: string
  code: string
  name: string
  contact_name: string
  phone: string
  email: string
  account_manager: string
  contracted_lanes: number
  on_time_percentage: number
  rating: number
  active: boolean
  created_at: string
  updated_at: string
}

export interface Truck {
  id: string
  dc_id: string
  license_plate: string
  trailer_number: string
  carrier_id: string
  carrier_name: string
  driver_name: string
  driver_phone: string
  status: 'approaching' | 'at_gate' | 'checked_in' | 'in_yard' | 'at_dock' | 'unloading' | 'loading' | 'completed' | 'departed'
  arrival_time: string
  gate_id: string
  assigned_dock_id: string | null
  priority_score: number
  priority_level: 'critical' | 'high' | 'medium' | 'low'
  bol_id: string
  temperature_class: 'ambient' | 'refrigerated' | 'frozen' | 'hazmat'
  estimated_unload_time: number
  dwell_time: number
  location_x: number
  location_y: number
  zone: string
  created_at: string
  updated_at: string
}

export interface BillOfLading {
  id: string
  truck_id: string
  bol_number: string
  customer_name: string
  customer_priority: 'platinum' | 'gold' | 'silver' | 'standard'
  product_type: string
  product_category: string
  quantity: number
  weight: number
  temperature_class: 'ambient' | 'refrigerated' | 'frozen' | 'hazmat'
  delivery_deadline: string
  unloading_constraints: string
  special_instructions: string
  hazmat: boolean
  hazmat_class: string | null
  created_at: string
  updated_at: string
}

export interface CameraEvent {
  id: string
  dc_id: string
  camera_id: string
  event_type: 'arrival' | 'departure'
  timestamp: string
  license_plate: string
  trailer_number: string
  ocr_confidence: number
  image_url: string
  truck_id: string | null
  processed: boolean
  created_at: string
  updated_at: string
}

export interface YardException {
  id: string
  dc_id: string
  type: 'missing_bol' | 'mismatched_trailer' | 'late_arrival' | 'temperature_breach' | 'dock_congestion' | 'hazmat_violation' | 'overdue_dwell' | 'damaged_load'
  severity: 'critical' | 'warning' | 'info'
  truck_id: string
  description: string
  created_at: string
  resolved_at: string | null
  assigned_to: string | null
  resolution: string | null
  updated_at: string
}

export interface YardActivityLog {
  id: string
  dc_id: string
  truck_id: string
  event_type: string
  details: Record<string, unknown>
  created_by: string
  created_at: string
}

// ========== DEMAND PLANNING TABLES ==========

export interface Customer {
  id: string
  name: string
  segment: 'enterprise' | 'mid_market' | 'boutique'
  region: string
  data_quality_score: number
  primary_data_source: 'edi' | 'email' | 'spreadsheet' | 'pdf' | 'manual' | 'api'
  account_manager: string
  total_locations: number
  active_locations: number
  last_data_received: string
  created_at: string
  updated_at: string
}

export interface Product {
  id: string
  sku: string
  name: string
  category: string
  subcategory: string
  unit_of_measure: string
  unit_cost: number
  lead_time_days: number
  shelf_life_days: number
  min_order_quantity: number
  safety_stock_days: number
  created_at: string
  updated_at: string
}

export interface InventorySignal {
  id: string
  customer_id: string
  customer_name: string
  product_id: string
  location_id: string
  location_name: string
  source: 'edi' | 'email' | 'spreadsheet' | 'pdf' | 'manual' | 'api'
  reported_date: string
  received_date: string
  on_hand_quantity: number
  sell_through_quantity: number
  on_order_quantity: number
  data_quality_score: number
  validation_status: 'valid' | 'warning' | 'error' | 'pending'
  validation_issues: string
  raw_payload: string
  created_at: string
  updated_at: string
}

export interface IngestionJob {
  id: string
  source: 'edi' | 'email' | 'spreadsheet' | 'pdf' | 'manual' | 'api'
  customer_id: string
  customer_name: string
  file_name: string
  received_at: string
  processed_at: string | null
  status: 'queued' | 'processing' | 'completed' | 'failed' | 'needs_review'
  records_total: number
  records_valid: number
  records_invalid: number
  error_message: string | null
  created_at: string
  updated_at: string
}

export interface Forecast {
  id: string
  product_id: string
  product_name: string
  customer_id: string
  customer_name: string
  location_id: string
  period: string
  forecast_quantity: number
  actual_quantity: number | null
  method: 'holt_winters' | 'arima' | 'xgboost' | 'ensemble' | 'crostons'
  confidence_low: number
  confidence_high: number
  status: 'draft' | 'reviewed' | 'approved' | 'published'
  mape: number | null
  bias: number | null
  last_updated: string
  adjusted_by: string | null
  adjustment_reason: string | null
  created_at: string
  updated_at: string
}

export interface Replenishment {
  id: string
  product_id: string
  product_name: string
  customer_id: string
  customer_name: string
  location_id: string
  location_name: string
  current_inventory: number
  reorder_point: number
  safety_stock: number
  recommended_quantity: number
  urgency: 'critical' | 'high' | 'medium' | 'low'
  expected_stockout_date: string | null
  lead_time_days: number
  order_by_date: string
  status: 'pending' | 'approved' | 'ordered' | 'shipped' | 'delivered'
  approved_at: string | null
  approved_by: string | null
  created_at: string
  updated_at: string
}

export interface PlanningException {
  id: string
  type: 'missing_data' | 'duplicate_signal' | 'demand_spike' | 'demand_drop' | 'stale_data' | 'quality_issue' | 'stockout_risk' | 'overstock_risk'
  severity: 'critical' | 'warning' | 'info'
  product_id: string
  customer_id: string
  description: string
  detected_at: string
  resolved_at: string | null
  auto_resolution: string | null
  created_at: string
  updated_at: string
}

// ========== ENTERPRISE INTEGRATION TABLES ==========

export interface EdiTransaction {
  id: string
  customer_id: string
  transaction_type: string
  document_number: string
  transaction_date: string
  status: 'received' | 'processing' | 'validated' | 'failed'
  raw_data: string
  parsed_data: Record<string, unknown>
  validation_errors: string | null
  created_at: string
  updated_at: string
}

export interface WmsEvent {
  id: string
  dc_id: string
  truck_id: string | null
  dock_id: string | null
  event_type: 'receipt' | 'putaway' | 'pick' | 'ship'
  bol_id: string | null
  product_id: string | null
  quantity: number
  location_code: string
  user_id: string
  details: Record<string, unknown>
  created_at: string
  updated_at: string
}
