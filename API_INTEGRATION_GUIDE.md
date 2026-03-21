# Supply Chain Platform - API Integration Layer

This document describes the complete API integration layer and Supabase data access layer for the supply chain platform.

## Architecture Overview

The application uses a layered architecture:

1. **Supabase Client Layer** - Direct database connections
2. **Data Access Layer** - Business logic and query functions
3. **API Routes** - Next.js API endpoints for client/third-party integration
4. **Server-side Client** - Admin operations with service role key

## File Structure

```
src/lib/
  ├── supabase.ts              # Client-side Supabase connection
  ├── supabase-server.ts       # Server-side admin client
  ├── database.types.ts        # TypeScript types for all tables
  ├── data-access.ts           # Data access functions
  └── types.ts                 # Legacy application types

src/app/api/
  ├── yard/
  │   ├── trucks/
  │   │   ├── route.ts         # GET/POST trucks
  │   │   └── [id]/route.ts    # GET/PATCH individual truck
  │   ├── docks/route.ts       # GET/PATCH docks
  │   ├── exceptions/route.ts  # GET/POST/PATCH yard exceptions
  │   └── camera/route.ts      # POST camera OCR events
  ├── planning/
  │   ├── forecasts/route.ts   # GET/PATCH forecasts
  │   ├── intake/route.ts      # GET/POST ingestion jobs
  │   ├── replenishments/route.ts # GET/POST replenishments
  │   └── exceptions/route.ts  # GET/PATCH planning exceptions
  └── integrations/
      ├── edi/route.ts         # POST EDI transactions
      ├── wms/route.ts         # POST WMS events
      └── ocr/route.ts         # POST OCR camera detection
```

## Supabase Configuration

### Connection Details

- **Project ID**: `ysesfztvcexufoogjgth`
- **Schema**: `supply_chain`
- **Environment Variables Required**:
  - `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Anonymous/public key
  - `SUPABASE_SERVICE_ROLE_KEY` - Service role key for write operations

### Client Initialization

#### Client-side (Browser/Client Components)
```typescript
import { supabase } from '@/lib/supabase'

const { data, error } = await supabase
  .from('trucks')
  .select('*')
```

#### Server-side (API Routes/Server Components)
```typescript
import { supabaseAdmin } from '@/lib/supabase-server'

const { data, error } = await supabaseAdmin
  .from('trucks')
  .insert([{ ... }])
```

## Database Schema Overview

### Yard Management Tables

- **distribution_centers** - Distribution center locations
- **docks** - Loading/unloading bays
- **carriers** - Trucking carriers
- **trucks** - Truck records
- **bills_of_lading** - Shipping documents
- **camera_events** - OCR camera detections
- **yard_exceptions** - Yard management exceptions
- **yard_activity_log** - Audit trail for yard operations

### Demand Planning Tables

- **customers** - Customer records
- **products** - SKU/product information
- **inventory_signals** - Inventory data submissions
- **ingestion_jobs** - Data intake processing
- **forecasts** - Demand forecasts
- **replenishments** - Replenishment recommendations
- **planning_exceptions** - Demand planning exceptions

### Integration Tables

- **edi_transactions** - EDI document tracking
- **wms_events** - Warehouse management events

## Data Access Functions

### Yard Management Functions

```typescript
// Get yard dashboard data
const dashboardData = await getYardDashboardData(dcCode: string)

// Query trucks with filters
const trucks = await getTrucks(filters?: TruckFilters)
// Filters: status, dcId, priority, limit, offset

// Get single truck
const truck = await getTruckById(id: string)

// Get docks for distribution center
const docks = await getDocks(dcCode: string)

// Get yard exceptions
const exceptions = await getYardExceptions(dcCode: string, status?: 'open'|'resolved')

// Calculate yard metrics
const metrics = await getYardMetrics(dcCode: string)

// Check in new truck
const truck = await checkInTruck(data: CheckInData)

// Assign truck to dock
const success = await assignDock(truckId: string, dockId: string)

// Update truck status
const success = await updateTruckStatus(truckId: string, status: string)

// Get camera events
const events = await getCameraEvents(dcCode: string, limit?: number)
```

### Demand Planning Functions

```typescript
// Get planning dashboard data
const dashboardData = await getPlanningDashboardData()

// Query forecasts with filters
const forecasts = await getForecasts(filters?: ForecastFilters)
// Filters: customerId, productId, status, limit, offset

// Get forecast for specific SKU
const forecasts = await getForecastForSku(sku: string, customerId?: string)

// Update forecast
const success = await updateForecast(id: string, data: Partial<Forecast>)

// Get inventory signals
const signals = await getInventorySignals(filters?: SignalFilters)
// Filters: customerId, daysBack, validationStatus, limit, offset

// Get data ingestion jobs
const jobs = await getIngestionJobs(filters?: JobFilters)
// Filters: status, customerId, limit, offset

// Get replenishment recommendations
const reps = await getReplenishments(filters?: ReplenishmentFilters)
// Filters: urgency, status, customerId, limit, offset

// Approve single replenishment
const success = await approveReplenishment(id: string, approvedBy: string)

// Bulk approve replenishments
const success = await bulkApproveReplenishments(ids: string[], approvedBy: string)

// Get planning exceptions
const exceptions = await getPlanningExceptions(filters?: ExceptionFilters)
// Filters: type, severity, resolved, limit, offset

// Resolve exception
const success = await resolveException(id: string, notes: string, resolvedBy: string)

// Get all customers
const customers = await getCustomers()

// Get all products
const products = await getProducts()

// Calculate customer data quality
const quality = await getCustomerDataQuality()
```

### Metrics & Aggregation Functions

```typescript
// Get forecast accuracy trend over time
const trend = await getForecastAccuracyTrend(weeks?: number)

// Get service level metrics
const metrics = await getServiceLevelMetrics()

// Get ingestion summary statistics
const summary = await getIngestionSummary()

// Get replenishment pipeline breakdown
const pipeline = await getReplenishmentPipeline()
```

## API Routes

### Yard Management APIs

#### GET /api/yard/trucks
List trucks with optional filters.

**Query Parameters**:
- `status` - Truck status (optional)
- `dcId` - Distribution center code (optional)
- `priority` - Priority level (optional)
- `limit` - Results per page (default: 50)
- `offset` - Pagination offset (default: 0)

**Response**:
```json
{
  "success": true,
  "data": [...],
  "count": 0
}
```

#### POST /api/yard/trucks
Check in a new truck (gate entry).

**Request Body**:
```json
{
  "dcId": "DC001",
  "licensePlate": "AB-1234",
  "trailerNumber": "TRL-123456",
  "carrierId": "CARRIER001",
  "carrierName": "Express Freight",
  "driverName": "John Doe",
  "driverPhone": "555-1234",
  "bolId": "BOL-001",
  "gateId": "GATE-A",
  "temperatureClass": "ambient"
}
```

#### GET /api/yard/trucks/[id]
Get details for a specific truck.

#### PATCH /api/yard/trucks/[id]
Update truck status.

**Request Body**:
```json
{
  "status": "at_dock"
}
```

#### GET /api/yard/docks
List docks for a distribution center.

**Query Parameters**:
- `dcId` - Distribution center code (required)

#### PATCH /api/yard/docks
Assign truck to dock.

**Request Body**:
```json
{
  "truckId": "truck-123",
  "dockId": "dock-456"
}
```

#### GET /api/yard/exceptions
List yard exceptions.

**Query Parameters**:
- `dcId` - Distribution center code (required)
- `status` - Filter by status: 'open' or 'resolved' (optional)

#### POST /api/yard/exceptions
Create new yard exception.

**Request Body**:
```json
{
  "dcId": "DC001",
  "type": "temperature_breach",
  "severity": "critical",
  "truckId": "truck-123",
  "description": "Temperature dropped below threshold"
}
```

#### PATCH /api/yard/exceptions
Update exception status.

**Request Body**:
```json
{
  "id": "exception-123",
  "status": "resolved",
  "assignedTo": "user-456",
  "resolution": "Issue resolved by warehouse team"
}
```

#### POST /api/yard/camera
Simulate camera OCR detection event.

**Request Body**:
```json
{
  "dcId": "DC001",
  "cameraId": "CAM-001",
  "licensePlate": "AB-1234",
  "trailerNumber": "TRL-123456",
  "imageUrl": "s3://bucket/image.jpg"
}
```

### Planning APIs

#### GET /api/planning/forecasts
List forecasts with filters.

**Query Parameters**:
- `customerId` - Filter by customer (optional)
- `productId` - Filter by product (optional)
- `status` - Forecast status (optional)
- `limit` - Results per page (default: 50)
- `offset` - Pagination offset (default: 0)

#### PATCH /api/planning/forecasts
Adjust forecast value.

**Request Body**:
```json
{
  "id": "forecast-123",
  "adjustedQuantity": 500,
  "adjustmentReason": "Sales team input",
  "status": "reviewed"
}
```

#### GET /api/planning/intake
List ingestion jobs.

**Query Parameters**:
- `status` - Job status (optional)
- `customerId` - Filter by customer (optional)
- `limit` - Results per page (default: 50)
- `offset` - Pagination offset (default: 0)

#### POST /api/planning/intake
Simulate data ingestion.

**Request Body**:
```json
{
  "sourceType": "edi",
  "customerId": "CUST-001",
  "fileName": "inventory_2024-03-20.edi",
  "recordsTotal": 150,
  "recordsValid": 145,
  "recordsInvalid": 5
}
```

#### GET /api/planning/replenishments
List replenishment recommendations.

**Query Parameters**:
- `urgency` - Filter by urgency level (optional)
- `status` - Replenishment status (optional)
- `customerId` - Filter by customer (optional)
- `limit` - Results per page (default: 50)
- `offset` - Pagination offset (default: 0)

#### POST /api/planning/replenishments
Bulk approve/reject replenishments.

**Request Body**:
```json
{
  "action": "approve",
  "ids": ["rep-001", "rep-002"],
  "approvedBy": "user-123"
}
```

#### GET /api/planning/exceptions
List planning exceptions.

**Query Parameters**:
- `type` - Exception type (optional)
- `severity` - Severity level (optional)
- `resolved` - "true" or "false" to filter (optional)
- `limit` - Results per page (default: 50)
- `offset` - Pagination offset (default: 0)

#### PATCH /api/planning/exceptions
Resolve exception.

**Request Body**:
```json
{
  "id": "exception-123",
  "notes": "Resolved by manually adjusting forecast",
  "resolvedBy": "user-456"
}
```

### Integration APIs

#### POST /api/integrations/edi
Simulate receiving EDI transaction.

**Request Body**:
```json
{
  "customerId": "CUST-001",
  "transactionType": "852",
  "documentNumber": "DOC-2024-001",
  "rawData": {
    "items": [...],
    "locations": [...]
  }
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "transaction": {...},
    "inventorySignal": {...}
  }
}
```

#### POST /api/integrations/wms
Simulate WMS event (receipt, putaway, pick, ship).

**Request Body**:
```json
{
  "dcId": "DC001",
  "truckId": "truck-123",
  "dockId": "dock-456",
  "eventType": "receipt",
  "bolId": "BOL-001",
  "productId": "SKU-001",
  "quantity": 100,
  "locationCode": "A-1-1",
  "userId": "user-123"
}
```

#### POST /api/integrations/ocr
Simulate OCR camera detection.

**Request Body**:
```json
{
  "dcId": "DC001",
  "cameraId": "CAM-001",
  "imageData": {
    "licensePlate": "AB-1234",
    "trailerNumber": "TRL-123456",
    "imageUrl": "s3://bucket/image.jpg"
  }
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "event": {...},
    "detectedPlate": "AB-1234",
    "detectedTrailer": "TRL-123456",
    "confidence": 0.92,
    "matched": true,
    "matchedTruck": {...}
  }
}
```

## Error Handling

All API routes return consistent error responses:

```json
{
  "success": false,
  "error": "Error message describing what went wrong"
}
```

HTTP Status Codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request (missing/invalid parameters)
- `404` - Not Found
- `500` - Server Error

## Type Safety

### TypeScript Types

All database operations are fully typed using the `database.types.ts` file. This provides:

- IntelliSense in your IDE
- Compile-time type checking
- Auto-completion for database fields
- Type-safe filter parameters

Example:
```typescript
import { Truck, Forecast } from '@/lib/database.types'

const truck: Truck = await getTruckById('truck-123')
const forecasts: Forecast[] = await getForecasts({ customerId: 'CUST-001' })
```

## Best Practices

### 1. Always Use Server-side Client for Write Operations
```typescript
// ✓ Correct - Server-side route
import { supabaseAdmin } from '@/lib/supabase-server'

const { data } = await supabaseAdmin
  .from('trucks')
  .insert([...])
```

### 2. Use Data Access Functions
```typescript
// ✓ Correct - Use abstraction layer
const trucks = await getTrucks({ dcId: 'DC001' })

// ✗ Avoid - Direct queries from components
import { supabase } from '@/lib/supabase'
const { data } = await supabase.from('trucks').select('*')
```

### 3. Implement Proper Error Handling
```typescript
try {
  const result = await updateTruckStatus(id, 'at_dock')
  if (!result) {
    return NextResponse.json({ error: 'Update failed' }, { status: 500 })
  }
} catch (error) {
  console.error('Error:', error)
  return NextResponse.json({ error: 'Server error' }, { status: 500 })
}
```

### 4. Validate User Input
```typescript
if (!dcId || !licensePlate) {
  return NextResponse.json(
    { error: 'Missing required fields' },
    { status: 400 }
  )
}
```

### 5. Use Type Guards
```typescript
import { Truck } from '@/lib/database.types'

const truck = await getTruckById(id)
if (!truck) {
  return NextResponse.json({ error: 'Not found' }, { status: 404 })
}

// truck is now guaranteed to be Truck type
```

## Testing API Routes

### Using cURL

```bash
# Get trucks
curl "http://localhost:3000/api/yard/trucks?dcId=DC001&limit=10"

# Check in truck
curl -X POST http://localhost:3000/api/yard/trucks \
  -H "Content-Type: application/json" \
  -d '{
    "dcId": "DC001",
    "licensePlate": "AB-1234",
    "trailerNumber": "TRL-123456",
    "carrierId": "CARRIER001",
    "carrierName": "Express Freight",
    "driverName": "John Doe",
    "driverPhone": "555-1234",
    "bolId": "BOL-001",
    "gateId": "GATE-A"
  }'

# Update truck status
curl -X PATCH http://localhost:3000/api/yard/trucks/truck-123 \
  -H "Content-Type: application/json" \
  -d '{"status": "at_dock"}'
```

### Using JavaScript/Fetch

```typescript
// Check in truck
const response = await fetch('/api/yard/trucks', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    dcId: 'DC001',
    licensePlate: 'AB-1234',
    trailerNumber: 'TRL-123456',
    carrierId: 'CARRIER001',
    carrierName: 'Express Freight',
    driverName: 'John Doe',
    driverPhone: '555-1234',
    bolId: 'BOL-001',
    gateId: 'GATE-A',
  }),
})

const result = await response.json()
```

## Performance Considerations

### Pagination
Always use `limit` and `offset` for large result sets:
```typescript
const trucks = await getTrucks({
  dcId: 'DC001',
  limit: 50,
  offset: 0
})
```

### Filtering
Filter at the database level, not in application code:
```typescript
// ✓ Efficient - Filtered at database
const forecasts = await getForecasts({ status: 'approved' })

// ✗ Inefficient - All data fetched then filtered
const allForecasts = await getForecasts()
const approved = allForecasts.filter(f => f.status === 'approved')
```

### Connection Pooling
Supabase handles connection pooling automatically. No additional configuration needed.

## Deployment Checklist

- [ ] Set `NEXT_PUBLIC_SUPABASE_URL` environment variable
- [ ] Set `NEXT_PUBLIC_SUPABASE_ANON_KEY` environment variable
- [ ] Set `SUPABASE_SERVICE_ROLE_KEY` environment variable (server-side only)
- [ ] Verify Supabase project is accessible from deployment environment
- [ ] Test API routes with real data
- [ ] Enable Row Level Security (RLS) policies in Supabase
- [ ] Set up monitoring/alerting for API errors
- [ ] Document any custom filters or business logic

## Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
