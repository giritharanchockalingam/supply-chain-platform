# Quick Start Guide - Supply Chain Platform APIs

## Setup

1. **Environment Variables**
```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://ysesfztvcexufoogjgth.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

2. **Start Development Server**
```bash
npm run dev
```

3. **Verify API Routes**
```bash
curl http://localhost:3000/api/yard/trucks?dcId=DC001
```

## Common Tasks

### Check In a Truck
```typescript
import { checkInTruck } from '@/lib/data-access'

const truck = await checkInTruck({
  dcId: 'DC001',
  licensePlate: 'AB-1234',
  trailerNumber: 'TRL-123456',
  carrierId: 'CARRIER001',
  carrierName: 'Express Freight',
  driverName: 'John Doe',
  driverPhone: '555-1234',
  bolId: 'BOL-001',
  gateId: 'GATE-A',
  temperatureClass: 'refrigerated',
})
```

### Get Trucks for Distribution Center
```typescript
import { getTrucks } from '@/lib/data-access'

const trucks = await getTrucks({
  dcId: 'DC001',
  status: 'in_yard',
  priority: 'high',
  limit: 50,
  offset: 0,
})
```

### Assign Dock to Truck
```typescript
import { assignDock } from '@/lib/data-access'

const success = await assignDock('truck-123', 'dock-A-01')
```

### Get Forecasts
```typescript
import { getForecasts } from '@/lib/data-access'

const forecasts = await getForecasts({
  customerId: 'CUST-001',
  status: 'approved',
  limit: 100,
})
```

### Approve Replenishments
```typescript
import { bulkApproveReplenishments } from '@/lib/data-access'

const success = await bulkApproveReplenishments(
  ['rep-001', 'rep-002', 'rep-003'],
  'user-123'
)
```

### Get Yard Metrics
```typescript
import { getYardMetrics } from '@/lib/data-access'

const metrics = await getYardMetrics('DC001')
// Returns: totalTrucksInYard, trucksWaiting, docksAvailable, etc.
```

## API Examples

### POST Check-in Truck (cURL)
```bash
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
```

### GET Trucks (JavaScript)
```javascript
async function getTrucksList(dcId) {
  const response = await fetch(
    `/api/yard/trucks?dcId=${dcId}&limit=50`
  )
  const result = await response.json()
  return result.data
}
```

### POST EDI Transaction (JavaScript)
```javascript
async function processEDI(customerId, transactionData) {
  const response = await fetch('/api/integrations/edi', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      customerId,
      transactionType: '852',
      documentNumber: 'DOC-2024-001',
      rawData: transactionData,
    }),
  })
  return await response.json()
}
```

## File Reference

| File | Purpose | Used By |
|------|---------|---------|
| `/src/lib/supabase.ts` | Client-side Supabase connection | Components, Client Pages |
| `/src/lib/supabase-server.ts` | Server-side admin client | API Routes |
| `/src/lib/database.types.ts` | TypeScript types for database | All files |
| `/src/lib/data-access.ts` | Data access layer functions | API Routes, Server Components |
| `/src/app/api/yard/*` | Yard management endpoints | External clients, Frontend |
| `/src/app/api/planning/*` | Demand planning endpoints | External clients, Frontend |
| `/src/app/api/integrations/*` | Enterprise integration endpoints | EDI, WMS, OCR systems |

## Key Concepts

### Layered Architecture
```
UI Components
    ↓
API Routes (/api/...)
    ↓
Data Access Functions (/lib/data-access.ts)
    ↓
Supabase Clients (/lib/supabase.ts, /lib/supabase-server.ts)
    ↓
Supabase Database (supply_chain schema)
```

### Client vs Admin Client
- **Client** (`supabase`): Read-only, browser-safe, anonymous key
- **Admin** (`supabaseAdmin`): Full access, server-side only, service role key

### Error Handling Pattern
```typescript
try {
  const data = await someDataAccessFunction()
  if (!data) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  return NextResponse.json({ success: true, data })
} catch (error) {
  console.error('Error:', error)
  return NextResponse.json(
    { error: error instanceof Error ? error.message : 'Unknown error' },
    { status: 500 }
  )
}
```

## Debugging

### Check Supabase Connection
```typescript
import { supabase } from '@/lib/supabase'

// Test query
const { data, error } = await supabase
  .from('trucks')
  .select('count(*)', { count: 'exact' })

console.log('Connected:', !error)
console.log('Truck count:', data)
```

### View TypeScript Errors
```bash
npx tsc --noEmit
```

### Check API Response
```bash
curl -v http://localhost:3000/api/yard/trucks?dcId=DC001
```

## Common HTTP Status Codes

| Code | Meaning | Example |
|------|---------|---------|
| 200 | Success | GET request returns data |
| 201 | Created | POST request creates record |
| 400 | Bad Request | Missing required parameter |
| 404 | Not Found | Truck ID doesn't exist |
| 500 | Server Error | Database connection failed |

## Next Steps

1. **Update Environment Variables** - Add Supabase credentials
2. **Test API Routes** - Use cURL or Postman to verify endpoints
3. **Integrate with Frontend** - Call API routes from components
4. **Set Up Monitoring** - Add error tracking (e.g., Sentry)
5. **Configure RLS** - Set up Row Level Security policies in Supabase

## Documentation

- Full API documentation: `API_INTEGRATION_GUIDE.md`
- Supabase docs: https://supabase.com/docs
- Next.js docs: https://nextjs.org/docs
