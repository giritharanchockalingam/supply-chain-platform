# Supply Chain Platform - Core Library

This directory contains the foundational types, algorithms, and data management for the supply chain platform's yard management and demand planning modules.

## Files Overview

### 1. **types.ts** (15 KB)
Comprehensive TypeScript type definitions for the entire platform.

**Yard Management Types:**
- `Truck` - Vehicle with location, status, and assigned dock
- `BillOfLading` - Shipping document with cargo details
- `Dock` - Loading/unloading bays with capabilities
- `YardException` - Issues requiring attention
- `GateEvent` - OCR-based entry/exit records
- `YardMetrics` - Real-time aggregated statistics

**Demand Planning Types:**
- `SKU` - Product with inventory parameters
- `Customer` - Retail customer with data quality metrics
- `InventorySignal` - Point-in-time inventory submissions
- `ForecastRecord` - Demand predictions with accuracy metrics
- `ReplenishmentRecommendation` - Suggested purchase orders
- `PlanningException` - Data anomalies and stockout risks
- `DataIngestionJob` - Customer data file processing pipeline
- `DemandPlanningMetrics` - KPIs for forecast accuracy and inventory health

All types are fully documented with JSDoc comments explaining purpose and usage.

### 2. **mock-data.ts** (32 KB)
Realistic mock data generators for development and testing without a database.

**Key Features:**
- Seeded random generation for reproducibility while maintaining variety
- 20+ trucks in various yard states with realistic carrier names and driver data
- 12 docks with different temperature/hazmat capabilities
- 5-8 active yard exceptions with severity levels
- 50+ customers across multiple regions with varying data quality
- 100+ SKUs across 12 product categories
- 300+ inventory signals simulating customer data submissions
- 500+ forecast records spanning 12 months historical + 3 months forward
- 100+ replenishment recommendations with urgency levels
- Data ingestion jobs showing realistic ETL patterns

**Exported Functions:**
- `generateTrucks(count)` - Generate truck fleet
- `generateBOLs(trucks)` - Generate bills of lading
- `generateDocks()` - Generate dock configurations
- `generateExceptions(trucks)` - Generate yard exceptions
- `generateGateEvents(trucks)` - Generate OCR gate events
- `generateYardMetrics()` - Calculate yard KPIs
- `generateSKUs(count)` - Generate product master data
- `generateCustomers(count)` - Generate customer accounts
- `generateInventorySignals()` - Generate inventory submissions
- `generateForecastRecords()` - Generate demand forecasts
- `generateReplenishmentRecommendations()` - Generate purchase suggestions
- `generatePlanningExceptions()` - Generate planning issues
- `generateDataIngestionJobs()` - Generate file processing records
- `generateYardDataset()` - Complete yard management dataset
- `generateDemandPlanningDataset()` - Complete demand planning dataset
- `generateFullDataset()` - All platform data at once

### 3. **priority-engine.ts** (16 KB)
Real-world priority scoring algorithm for truck processing sequence.

**Priority Factors (weighted):**
1. **Customer Priority (25%)** - Platinum/Gold/Silver/Standard tier
2. **Delivery Urgency (30%)** - Hours until deadline (exponential scoring)
3. **Dwell Time (15%)** - Minutes waiting in yard (increases with time)
4. **Temperature Sensitivity (15%)** - Hazmat/Frozen/Refrigerated/Ambient
5. **Product Value (10%)** - Estimated cargo value
6. **Dock Compatibility (5%)** - Availability of matching dock capabilities

**Exported Functions:**
- `calculatePriorityScore(truck, bol, docks)` - Returns score (0-100) + level + factor breakdown
- `findOptimalDock(truck, bol, docks)` - Finds best dock with reasoning
- `rankDocks(truck, bol, docks)` - Ranks all docks by suitability
- `estimateTurnaroundTime(truck, bol, dwellMinutes)` - ETA calculation
- `validateTruckForProcessing(truck, bol)` - Pre-flight checks

**Score Ranges:**
- 85-100: Critical - Process immediately
- 65-84: High - Process within 2 hours
- 40-64: Medium - Process within 6 hours
- 0-39: Low - Process when capacity available

### 4. **forecast-engine.ts** (18 KB)
Time series forecasting with multiple algorithms and ensemble methods.

**Forecasting Methods:**
1. **Simple Exponential Smoothing** - Baseline for no trend/seasonality
2. **Holt-Winters** - Triple exponential for trend + seasonality
3. **Moving Average** - Simple trend following
4. **Linear Regression** - Captures directional trends
5. **Ensemble** - Weighted combination of above methods

**Exported Functions:**
- `simpleExponentialSmoothing(historical, periods, alpha, confidence)` - Single method
- `holtWinters(historical, periods, config)` - Advanced seasonal method
- `movingAverage(historical, periods, windowSize, confidence)` - Simple averaging
- `linearRegression(historical, periods, confidence)` - Trend fitting
- `ensembleForecasting(historical, periods, config)` - Combined forecasts

**Safety Stock & Reorder Points:**
- `calculateSafetyStock(dailyDemand, leadDays, serviceLevel, ltVariance)` - Z-score based
- `calculateReorderPoint(avgDailyDemand, leadTimeDays, safetyStock)` - ROP formula
- `calculateEOQ(annualDemand, orderCost, holdingCost)` - Economic order quantity

**Metrics:**
- `calculateMAPE()` - Mean Absolute Percentage Error
- `calculateBias()` - Forecast bias (over/under estimation)
- `validateForecast()` - Sanity checking on results
- Confidence intervals (95% by default, configurable)

All algorithms include error handling and edge case management.

### 5. **supabase.ts** (14 KB)
Supabase database client with intelligent fallback to mock data.

**Features:**
- Automatic detection of Supabase credentials
- Seamless fallback to mock data when database unavailable
- Single source of truth for all data access
- Type-safe queries for all entities

**Yard Management Queries:**
- `getTrucks()` - All trucks in yard
- `getTruckById(id)` - Single truck with exceptions
- `getDocks()` - All dock configurations
- `getYardExceptions(resolved?)` - Filtered exception list
- `getGateEvents(hoursBack)` - Recent OCR events
- `getYardMetrics()` - Current KPIs
- `updateTruck(id, updates)` - Update truck status

**Demand Planning Queries:**
- `getSKUs()` - All products
- `getCustomers()` - All customers
- `getInventorySignals(daysBack)` - Recent submissions
- `getForecastRecords(skuId?, customerId?, limit)` - Forecast history
- `getReplenishmentRecommendations(urgency?)` - Purchase suggestions
- `getPlanningExceptions(resolved?)` - Exception list
- `getDataIngestionJobs(status?)` - File processing status
- `getDemandPlanningMetrics()` - KPIs

**Usage:**
```typescript
import { getSupabaseManager, isUsingMockData } from '@/lib/supabase';

const manager = getSupabaseManager();
const trucks = await manager.getTrucks();
const isMocked = isUsingMockData(); // Check if using demo data
```

## Environment Variables

For production use with real database:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Without these variables, the platform automatically uses mock data in demo mode.

## Data Quality & Realism

**Mock Data Characteristics:**
- Seeded random generation ensures reproducible test scenarios
- Realistic company names (Swift Transportation, JB Hunt, Walmart, etc.)
- Product names from actual CPG categories
- Time-based data (dwell times, wait queues) reflects real logistics
- Customer data quality varies (60-98% quality scores)
- Exceptions distributed realistically (30% resolved, 70% open)
- Forecast accuracy metrics (MAPE 5-20%) match real-world performance
- Temperature/hazmat cargo properly routed to capable docks

## Performance Notes

- Mock data generation is instantaneous (< 10ms)
- Complete dataset with 20 trucks + 100 SKUs + 50 customers < 100KB
- All functions are deterministic and thread-safe
- No external dependencies for core algorithms
- Supabase queries use connection pooling (production only)

## Testing & Development

All components can be tested in isolation:

```typescript
// Test priority engine
import { calculatePriorityScore, findOptimalDock } from '@/lib/priority-engine';
import { generateTrucks, generateBOLs, generateDocks } from '@/lib/mock-data';

const trucks = generateTrucks(1);
const bols = generateBOLs(trucks);
const docks = generateDocks();

const score = calculatePriorityScore(trucks[0], bols[0], docks);
const dock = findOptimalDock(trucks[0], bols[0], docks);

// Test forecasting
import { ensembleForecasting } from '@/lib/forecast-engine';

const historical = [100, 120, 110, 140, 130, 150];
const forecast = ensembleForecasting(historical, 3, {
  methods: ['exponentialSmoothing', 'movingAverage', 'linearRegression']
});
```

## Integration Points

- **Pages/API Routes** - Use `getSupabaseManager()` for data access
- **Components** - Use typed hooks that call manager methods
- **Server Actions** - Direct database operations via manager
- **Real-time Updates** - Supabase subscriptions via client
- **Error Handling** - All methods return null/empty on error (never throw)
