/**
 * Supabase Database Types - Matches actual supply_chain schema columns
 * Generated from: SELECT column_name, data_type FROM information_schema.columns WHERE table_schema = 'supply_chain'
 */

// ========== YARD MANAGEMENT TABLES ==========

export interface DistributionCenter {
  id: string
  code: string
  name: string
  address: string | null
  city: string | null
  state: string | null
  zip: string | null
  timezone: string | null
  total_docks: number | null
  is_active: boolean | null
  created_at: string
  updated_at: string
}

export interface Dock {
  id: string
  dc_id: string | null
  dock_number: string
  dock_type: string
  status: string | null
  has_refrigeration: boolean | null
  has_hazmat_cert: boolean | null
  max_trailer_length_ft: number | null
  current_truck_id: string | null
  last_activity_at: string | null
  created_at: string
  updated_at: string
}

export interface Carrier {
  id: string
  code: string
  name: string
  scac_code: string | null
  dot_number: string | null
  mc_number: string | null
  contact_name: string | null
  contact_phone: string | null
  contact_email: string | null
  is_preferred: boolean | null
  rating: number | null
  created_at: string
}

export interface Truck {
  id: string
  dc_id: string | null
  carrier_id: string | null
  license_plate: string | null
  trailer_number: string | null
  container_id: string | null
  driver_name: string | null
  driver_phone: string | null
  driver_license: string | null
  truck_type: string | null
  status: string | null
  priority_score: number | null
  is_temperature_controlled: boolean | null
  is_hazmat: boolean | null
  is_oversize: boolean | null
  seal_number: string | null
  assigned_dock_id: string | null
  yard_location: string | null
  gate_in_at: string | null
  dock_assigned_at: string | null
  dock_arrived_at: string | null
  unload_started_at: string | null
  unload_completed_at: string | null
  gate_out_at: string | null
  expected_arrival_at: string | null
  appointment_at: string | null
  created_at: string
  updated_at: string
  location_x: number | null
  location_y: number | null
  zone: string | null
  // Joined from carriers table (optional)
  carriers?: { name: string } | null
}

export interface BillOfLading {
  id: string
  truck_id: string | null
  bol_number: string
  po_number: string | null
  ship_from: string | null
  ship_to: string | null
  customer_name: string | null
  customer_priority: string | null
  product_type: string | null
  commodity_code: string | null
  total_weight_lbs: number | null
  total_pallets: number | null
  total_cases: number | null
  is_temperature_sensitive: boolean | null
  required_temp_min_f: number | null
  required_temp_max_f: number | null
  is_hazmat: boolean | null
  hazmat_class: string | null
  un_number: string | null
  delivery_deadline: string | null
  special_instructions: string | null
  status: string | null
  verified_at: string | null
  verified_by: string | null
  created_at: string
}

export interface CameraEvent {
  id: string
  dc_id: string | null
  camera_id: string
  camera_location: string | null
  event_type: string | null
  license_plate_detected: string | null
  trailer_number_detected: string | null
  container_id_detected: string | null
  confidence_score: number | null
  matched_truck_id: string | null
  image_url: string | null
  raw_ocr_data: unknown | null
  captured_at: string | null
  processed_at: string | null
  created_at: string
}

export interface YardException {
  id: string
  dc_id: string | null
  truck_id: string | null
  bol_id: string | null
  exception_type: string
  severity: string | null
  title: string
  description: string | null
  status: string | null
  assigned_to: string | null
  resolved_at: string | null
  resolved_by: string | null
  resolution_notes: string | null
  created_at: string
  updated_at: string
}

// ========== DEMAND PLANNING TABLES ==========

export interface Customer {
  id: string
  code: string
  name: string
  segment: string | null
  region: string | null
  state: string | null
  city: string | null
  data_quality_score: number | null
  preferred_channels: string[] | null
  edi_capable: boolean | null
  edi_partner_id: string | null
  primary_contact: string | null
  contact_email: string | null
  contact_phone: string | null
  payment_terms: string | null
  is_active: boolean | null
  created_at: string
  updated_at: string
}

export interface Product {
  id: string
  sku: string
  name: string
  category: string | null
  subcategory: string | null
  brand: string | null
  uom: string | null
  case_pack: number | null
  weight_lbs: number | null
  is_temperature_sensitive: boolean | null
  is_hazmat: boolean | null
  shelf_life_days: number | null
  lead_time_days: number | null
  min_order_qty: number | null
  standard_cost: number | null
  list_price: number | null
  lifecycle_stage: string | null
  forecast_method: string | null
  created_at: string
  updated_at: string
}

export interface InventorySignal {
  id: string
  customer_id: string | null
  product_id: string | null
  location_code: string | null
  location_name: string | null
  source_type: string | null
  source_file: string | null
  report_date: string
  on_hand_qty: number | null
  on_order_qty: number | null
  sold_qty: number | null
  lost_sales_qty: number | null
  days_of_supply: number | null
  data_quality_score: number | null
  is_validated: boolean | null
  validation_errors: unknown | null
  raw_data: unknown | null
  ingested_at: string | null
  validated_at: string | null
  created_at: string
}

export interface IngestionJob {
  id: string
  source_type: string
  customer_id: string | null
  file_name: string | null
  file_size_bytes: number | null
  status: string | null
  total_records: number | null
  valid_records: number | null
  error_records: number | null
  error_details: unknown | null
  processing_started_at: string | null
  processing_completed_at: string | null
  created_at: string
}

export interface Forecast {
  id: string
  product_id: string | null
  customer_id: string | null
  location_code: string | null
  forecast_date: string
  period_type: string | null
  forecast_qty: number
  confidence_low: number | null
  confidence_high: number | null
  actual_qty: number | null
  forecast_method: string | null
  mape: number | null
  bias: number | null
  status: string | null
  adjusted_qty: number | null
  adjusted_by: string | null
  adjustment_reason: string | null
  created_at: string
  updated_at: string
}

export interface Replenishment {
  id: string
  product_id: string | null
  customer_id: string | null
  location_code: string | null
  urgency: string | null
  current_inventory: number | null
  reorder_point: number | null
  safety_stock: number | null
  recommended_qty: number
  expected_stockout_date: string | null
  order_by_date: string | null
  estimated_value: number | null
  status: string | null
  approved_by: string | null
  approved_at: string | null
  po_number: string | null
  created_at: string
  updated_at: string
}

export interface PlanningException {
  id: string
  customer_id: string | null
  product_id: string | null
  exception_type: string
  severity: string | null
  title: string
  description: string | null
  affected_skus: string[] | null
  status: string | null
  assigned_to: string | null
  resolved_at: string | null
  resolution_notes: string | null
  created_at: string
  updated_at: string
}

// ========== ADDITIONAL TABLES ==========

export interface YardActivityLog {
  id: string
  dc_id: string | null
  truck_id: string | null
  event_type: string
  event_data: unknown | null
  performed_by: string | null
  created_at: string
}

export interface EdiTransaction {
  id: string
  transaction_type: string
  direction: string | null
  trading_partner_id: string | null
  customer_id: string | null
  isa_control_number: string | null
  gs_control_number: string | null
  raw_content: string | null
  parsed_data: unknown | null
  status: string | null
  error_message: string | null
  received_at: string | null
  processed_at: string | null
  created_at: string
}

export interface WmsEvent {
  id: string
  dc_id: string | null
  event_type: string
  reference_number: string | null
  truck_id: string | null
  bol_id: string | null
  product_id: string | null
  quantity: number | null
  location_code: string | null
  status: string | null
  event_data: unknown | null
  wms_timestamp: string | null
  created_at: string
}
