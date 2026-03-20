import {
  Truck,
  BillOfLading,
  Dock,
  YardException,
  GateEvent,
  YardMetrics,
  TruckStatus,
  DockStatus,
  PriorityLevel,
  TemperatureClass,
  ExceptionType,
  SKU,
  Customer,
  InventorySignal,
  ForecastRecord,
  ReplenishmentRecommendation,
  DemandPlanningMetrics,
  PlanningException,
  DataIngestionJob,
  DataSourceType,
  ForecastMethod,
  AlertSeverity,
  ForecastStatus,
} from './types';

// ========== SEEDED RANDOM UTILITIES ==========

/**
 * Seeded random number generator for reproducibility.
 * Returns numbers between 0 and 1.
 */
function seededRandom(seed: number): number {
  const x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
}

/**
 * Simple seeded random generator - call repeatedly with increasing seed.
 */
let randomSeed = 12345;
function getRandom(): number {
  randomSeed = (randomSeed * 9301 + 49297) % 233280;
  return randomSeed / 233280;
}

/**
 * Shuffle seed to ensure variety while maintaining reproducibility.
 */
function resetRandom(seed = 12345): void {
  randomSeed = seed;
}

/**
 * Get random element from array.
 */
function pickRandom<T>(items: T[]): T {
  return items[Math.floor(getRandom() * items.length)];
}

/**
 * Get random integer between min and max (inclusive).
 */
function randomInt(min: number, max: number): number {
  return Math.floor(getRandom() * (max - min + 1)) + min;
}

/**
 * Get weighted random choice.
 */
function weightedRandom<T>(items: { item: T; weight: number }[]): T {
  const totalWeight = items.reduce((sum, { weight }) => sum + weight, 0);
  let rand = getRandom() * totalWeight;
  for (const { item, weight } of items) {
    rand -= weight;
    if (rand <= 0) return item;
  }
  return items[items.length - 1].item;
}

// ========== CONSTANTS ==========

const CARRIER_NAMES = [
  'Swift Transportation',
  'JB Hunt Transport',
  'Werner Enterprises',
  'Knight-Swift',
  'Schneider National',
  'Marten Transport',
  'PAM Transport',
  'TMC Transportation',
  'Celadon Group',
  'Stevens Transport',
  'Universal Truckload',
  'Central Refrigerated',
  'TransAm Trucking',
  'Melton Truck Lines',
  'May Trucking',
];

const DRIVER_NAMES = [
  'John Smith',
  'Michael Johnson',
  'David Williams',
  'Robert Brown',
  'James Davis',
  'Richard Miller',
  'Charles Wilson',
  'Joseph Moore',
  'Thomas Taylor',
  'Christopher Anderson',
  'Maria Garcia',
  'Patricia Martinez',
  'Jennifer Lee',
  'Linda Rodriguez',
  'Barbara Johnson',
];

const CUSTOMER_NAMES = [
  'Walmart Supercenter',
  'Target Distribution',
  'Costco Wholesale',
  'The Home Depot',
  'Kroger Company',
  'Amazon Fulfillment',
  'Best Buy Distribution',
  'CVS Pharmacy',
  'Walgreens Distribution',
  'Whole Foods Markets',
  'Albertsons Distribution',
  'Sprouts Farmers Market',
  'Five Below',
  'Dollar Tree',
  'Ollies Bargain Outlet',
  'Big Lots',
  'Family Dollar',
  'TJ Maxx Distribution',
  'Ulta Beauty',
  'Dick\'s Sporting Goods',
];

const PRODUCT_CATEGORIES = [
  'Beverages',
  'Snacks',
  'Confectionery',
  'Dairy',
  'Frozen Foods',
  'Meat & Poultry',
  'Personal Care',
  'Health & Wellness',
  'Paper Products',
  'Household Chemicals',
  'Pet Food',
  'Baby Products',
];

const PRODUCT_NAMES_BY_CATEGORY: Record<string, string[]> = {
  Beverages: ['Orange Juice', 'Cola', 'Bottled Water', 'Iced Tea', 'Energy Drink', 'Coffee'],
  Snacks: ['Potato Chips', 'Granola Bars', 'Pretzels', 'Popcorn', 'Mixed Nuts', 'Cookies'],
  Confectionery: ['Chocolate Bars', 'Gummy Bears', 'Hard Candy', 'Caramels', 'Mints'],
  Dairy: ['Milk', 'Yogurt', 'Cheese', 'Butter', 'Cream', 'Ice Cream'],
  'Frozen Foods': ['Frozen Pizza', 'Frozen Vegetables', 'Ice Cream', 'Frozen Meals', 'Frozen Berries'],
  'Meat & Poultry': ['Chicken Breast', 'Ground Beef', 'Turkey', 'Pork Chops', 'Bacon'],
  'Personal Care': ['Shampoo', 'Soap', 'Toothpaste', 'Deodorant', 'Lotion'],
  'Health & Wellness': ['Vitamins', 'Supplements', 'Protein Powder', 'Electrolytes'],
  'Paper Products': ['Toilet Paper', 'Paper Towels', 'Napkins', 'Tissues'],
  'Household Chemicals': ['Dish Soap', 'Laundry Detergent', 'Bleach', 'All-Purpose Cleaner'],
  'Pet Food': ['Dog Food', 'Cat Food', 'Bird Seed', 'Pet Treats'],
  'Baby Products': ['Diapers', 'Baby Formula', 'Wipes', 'Baby Food'],
};

const TRUCK_STATUSES: TruckStatus[] = [
  'approaching',
  'at_gate',
  'checked_in',
  'in_yard',
  'at_dock',
  'unloading',
  'loading',
  'completed',
];

const TEMPERATURE_CLASSES: TemperatureClass[] = ['ambient', 'refrigerated', 'frozen', 'hazmat'];

const EXCEPTION_TYPES: ExceptionType[] = [
  'missing_bol',
  'mismatched_trailer',
  'late_arrival',
  'temperature_breach',
  'dock_congestion',
  'hazmat_violation',
  'overdue_dwell',
  'damaged_load',
];

const GATE_IDS = ['Gate-01', 'Gate-02', 'Gate-03', 'Gate-04'];

const DOCK_NAMES = [
  'Dock A-01',
  'Dock A-02',
  'Dock A-03',
  'Dock B-01',
  'Dock B-02',
  'Dock B-03',
  'Dock C-01',
  'Dock C-02',
  'Dock C-03',
  'Dock D-01',
  'Dock D-02',
  'Dock D-03',
];

const YARD_ZONES = ['Zone-A', 'Zone-B', 'Zone-C', 'Zone-D', 'Zone-E'];

const DATA_SOURCES: DataSourceType[] = ['edi', 'email', 'spreadsheet', 'pdf', 'manual', 'api'];

const FORECAST_METHODS: ForecastMethod[] = [
  'holt_winters',
  'arima',
  'xgboost',
  'ensemble',
  'crostons',
];

// ========== TRUCK GENERATION ==========

/**
 * Generate a single truck with realistic data.
 */
function generateTruck(index: number): Truck {
  const now = new Date();
  const arrivalTime = new Date(now.getTime() - randomInt(15, 480) * 60 * 1000); // Last 8 hours

  const status = weightedRandom<TruckStatus>([
    { item: 'approaching', weight: 0.1 },
    { item: 'at_gate', weight: 0.05 },
    { item: 'checked_in', weight: 0.1 },
    { item: 'in_yard', weight: 0.15 },
    { item: 'at_dock', weight: 0.2 },
    { item: 'unloading', weight: 0.25 },
    { item: 'loading', weight: 0.1 },
    { item: 'completed', weight: 0.05 },
  ]);

  const temperatureClass = weightedRandom<TemperatureClass>([
    { item: 'ambient', weight: 0.5 },
    { item: 'refrigerated', weight: 0.25 },
    { item: 'frozen', weight: 0.15 },
    { item: 'hazmat', weight: 0.1 },
  ]);

  const dwellMinutes = randomInt(5, 360);
  const estimatedUnload = randomInt(30, 240);

  return {
    id: `truck-${String(index).padStart(3, '0')}`,
    licensePlate: `${String.fromCharCode(65 + randomInt(0, 25))}${String.fromCharCode(65 + randomInt(0, 25))}${randomInt(10000, 99999)}`,
    trailerNumber: `TR-${randomInt(100000, 999999)}`,
    carrierName: pickRandom(CARRIER_NAMES),
    driverName: pickRandom(DRIVER_NAMES),
    driverPhone: `555-${randomInt(1000, 9999)}-${randomInt(1000, 9999)}`,
    status,
    arrivalTime: arrivalTime.toISOString(),
    gateId: pickRandom(GATE_IDS),
    assignedDock: ['at_dock', 'unloading', 'loading', 'completed'].includes(status)
      ? pickRandom(DOCK_NAMES)
      : null,
    priorityScore: randomInt(20, 95),
    priorityLevel: randomInt(0, 100) < 20 ? 'critical' : randomInt(0, 100) < 40 ? 'high' : 'medium',
    bolId: `BOL-${randomInt(1000000, 9999999)}`,
    temperatureClass,
    estimatedUnloadTime: estimatedUnload,
    dwellTime: dwellMinutes,
    exceptions: [],
    location: {
      x: randomInt(0, 100),
      y: randomInt(0, 100),
      zone: pickRandom(YARD_ZONES),
    },
  };
}

/**
 * Generate array of trucks for yard.
 */
export function generateTrucks(count = 20): Truck[] {
  resetRandom(12345);
  const trucks: Truck[] = [];
  for (let i = 0; i < count; i++) {
    trucks.push(generateTruck(i));
  }
  return trucks;
}

// ========== BILL OF LADING GENERATION ==========

/**
 * Generate a BOL for a truck.
 */
function generateBOL(truck: Truck): BillOfLading {
  const category = pickRandom(PRODUCT_CATEGORIES);
  const products = PRODUCT_NAMES_BY_CATEGORY[category] || [];
  const product = pickRandom(products);

  const now = new Date();
  const deadline = new Date(now.getTime() + randomInt(2, 72) * 60 * 60 * 1000);

  return {
    id: `bol-${randomInt(1000000, 9999999)}`,
    bolNumber: truck.bolId,
    truckId: truck.id,
    customerName: pickRandom(CUSTOMER_NAMES),
    customerPriority: weightedRandom<'platinum' | 'gold' | 'silver' | 'standard'>([
      { item: 'platinum', weight: 0.15 },
      { item: 'gold', weight: 0.25 },
      { item: 'silver', weight: 0.35 },
      { item: 'standard', weight: 0.25 },
    ]),
    productType: product,
    productCategory: category,
    quantity: randomInt(100, 10000),
    weight: randomInt(5000, 45000),
    temperatureClass: truck.temperatureClass,
    deliveryDeadline: deadline.toISOString(),
    unloadingConstraints:
      truck.temperatureClass === 'hazmat'
        ? ['Hazmat team required', 'Spill containment', 'Ventilation required']
        : truck.temperatureClass === 'frozen'
          ? ['Keep frozen', 'Use dock door with freezer', 'Minimize door open time']
          : [],
    specialInstructions: randomInt(0, 100) < 30 ? 'Handle with care - fragile items' : '',
    hazmat: truck.temperatureClass === 'hazmat',
    hazmatClass: truck.temperatureClass === 'hazmat' ? 'Class 3 - Flammable' : undefined,
  };
}

/**
 * Generate BOLs for trucks.
 */
export function generateBOLs(trucks: Truck[]): BillOfLading[] {
  return trucks.map(truck => generateBOL(truck));
}

// ========== DOCK GENERATION ==========

/**
 * Generate dock configurations.
 */
export function generateDocks(): Dock[] {
  resetRandom(54321);
  const docks: Dock[] = [];
  let xPos = 10;

  for (const name of DOCK_NAMES) {
    const status = weightedRandom<DockStatus>([
      { item: 'available', weight: 0.3 },
      { item: 'assigned', weight: 0.2 },
      { item: 'occupied', weight: 0.4 },
      { item: 'maintenance', weight: 0.05 },
      { item: 'blocked', weight: 0.05 },
    ]);

    const hasTemp = getRandom() < 0.4;
    const hasHazmat = getRandom() < 0.25;

    docks.push({
      id: `dock-${docks.length.toString().padStart(2, '0')}`,
      name,
      status,
      type: randomInt(0, 100) < 50 ? 'inbound' : randomInt(0, 100) < 70 ? 'outbound' : 'dual',
      temperatureCapable: hasTemp,
      hazmatCapable: hasHazmat,
      maxTrailerLength: randomInt(40, 53),
      currentTruckId: ['occupied', 'assigned'].includes(status)
        ? `truck-${randomInt(0, 19).toString().padStart(3, '0')}`
        : null,
      scheduledTruckId: status === 'assigned' ? `truck-${randomInt(0, 19).toString().padStart(3, '0')}` : null,
      lastActivity: new Date(Date.now() - randomInt(0, 120) * 60 * 1000).toISOString(),
      utilizationToday: randomInt(30, 95),
      position: { x: xPos, y: randomInt(10, 90) },
    });

    xPos += 8;
  }

  return docks;
}

// ========== EXCEPTION GENERATION ==========

/**
 * Generate exceptions for trucks.
 */
export function generateExceptions(trucks: Truck[]): YardException[] {
  resetRandom(99999);
  const exceptions: YardException[] = [];
  const numExceptions = randomInt(5, 8);
  const now = new Date();

  for (let i = 0; i < numExceptions; i++) {
    const truck = pickRandom(trucks);
    const type = pickRandom(EXCEPTION_TYPES);

    const severity = weightedRandom<'critical' | 'warning' | 'info'>([
      { item: 'critical', weight: 0.2 },
      { item: 'warning', weight: 0.5 },
      { item: 'info', weight: 0.3 },
    ]);

    const createdAt = new Date(now.getTime() - randomInt(5, 180) * 60 * 1000);
    const isResolved = getRandom() < 0.3;
    const resolvedAt = isResolved
      ? new Date(createdAt.getTime() + randomInt(15, 120) * 60 * 1000)
      : null;

    exceptions.push({
      id: `exc-${String(i).padStart(4, '0')}`,
      type,
      severity,
      truckId: truck.id,
      description: `${type.replace(/_/g, ' ')}: ${truck.trailerNumber}`,
      createdAt: createdAt.toISOString(),
      resolvedAt: resolvedAt?.toISOString() ?? null,
      assignedTo: isResolved ? null : randomInt(0, 100) < 70 ? `staff-${randomInt(1, 10)}` : null,
      resolution: isResolved ? 'Resolved by dock manager' : null,
    });
  }

  return exceptions;
}

// ========== GATE EVENT GENERATION ==========

/**
 * Generate gate events for the last 24 hours.
 */
export function generateGateEvents(trucks: Truck[]): GateEvent[] {
  resetRandom(55555);
  const events: GateEvent[] = [];
  const now = new Date();

  for (const truck of trucks) {
    const arrivalTime = new Date(truck.arrivalTime);

    // Arrival event
    events.push({
      id: `evt-${randomInt(1000000, 9999999)}`,
      gateId: truck.gateId,
      truckId: truck.id,
      eventType: 'arrival',
      timestamp: arrivalTime.toISOString(),
      licensePlate: truck.licensePlate,
      trailerNumber: truck.trailerNumber,
      ocrConfidence: 0.85 + getRandom() * 0.15,
      cameraId: `cam-${randomInt(1, 4)}`,
      imageUrl: `https://example.com/images/gate-${randomInt(1000, 9999)}.jpg`,
    });

    // Departure event if departed
    if (['completed', 'departed'].includes(truck.status)) {
      events.push({
        id: `evt-${randomInt(1000000, 9999999)}`,
        gateId: truck.gateId,
        truckId: truck.id,
        eventType: 'departure',
        timestamp: new Date(arrivalTime.getTime() + randomInt(60, 480) * 60 * 1000).toISOString(),
        licensePlate: truck.licensePlate,
        trailerNumber: truck.trailerNumber,
        ocrConfidence: 0.88 + getRandom() * 0.12,
        cameraId: `cam-${randomInt(1, 4)}`,
        imageUrl: `https://example.com/images/gate-${randomInt(1000, 9999)}.jpg`,
      });
    }
  }

  return events;
}

// ========== YARD METRICS GENERATION ==========

/**
 * Generate real-time yard metrics.
 */
export function generateYardMetrics(trucks: Truck[], exceptions: YardException[]): YardMetrics {
  const trucksInYard = trucks.length;
  const waiting = trucks.filter(t => t.status === 'in_yard').length;
  const unloading = trucks.filter(t => ['at_dock', 'unloading'].includes(t.status)).length;
  const completed = trucks.filter(t => ['completed', 'departed'].includes(t.status)).length;

  const avgDwell = trucks.reduce((sum, t) => sum + t.dwellTime, 0) / trucks.length || 0;
  const avgTurnaround = trucks
    .filter(t => ['completed', 'departed'].includes(t.status))
    .reduce((sum, t) => sum + t.dwellTime, 0) /
    Math.max(1, trucks.filter(t => ['completed', 'departed'].includes(t.status)).length) ||
  0;

  const openExceptions = exceptions.filter(e => !e.resolvedAt).length;
  const criticalExceptions = exceptions.filter(e => !e.resolvedAt && e.severity === 'critical').length;

  return {
    totalTrucksInYard: trucksInYard,
    trucksWaiting: waiting,
    trucksUnloading: unloading,
    averageDwellTime: Math.round(avgDwell),
    docksOccupied: randomInt(4, 10),
    docksAvailable: randomInt(2, 8),
    exceptionsOpen: openExceptions,
    exceptionsCritical: criticalExceptions,
    throughputToday: completed,
    avgTurnaroundTime: Math.round(avgTurnaround),
    detentionAtRisk: randomInt(1, 4),
    onTimeUnload: randomInt(75, 98),
  };
}

// ========== SKU GENERATION ==========

/**
 * Generate master SKU list.
 */
export function generateSKUs(count = 100): SKU[] {
  resetRandom(11111);
  const skus: SKU[] = [];

  const allProducts: { category: string; name: string }[] = [];
  for (const [category, names] of Object.entries(PRODUCT_NAMES_BY_CATEGORY)) {
    for (const name of names) {
      allProducts.push({ category, name });
    }
  }

  for (let i = 0; i < count; i++) {
    const product = pickRandom(allProducts);
    const baseUOM = weightedRandom([
      { item: 'case', weight: 0.5 },
      { item: 'pallet', weight: 0.2 },
      { item: 'each', weight: 0.2 },
      { item: 'unit', weight: 0.1 },
    ]);

    skus.push({
      id: `sku-${String(i).padStart(5, '0')}`,
      sku: `SKU${randomInt(100000, 999999)}`,
      name: product.name,
      category: product.category,
      subcategory: product.category.includes('Frozen')
        ? 'Frozen'
        : product.category.includes('Dairy')
          ? 'Dairy'
          : 'Ambient',
      unitOfMeasure: baseUOM,
      unitCost: randomInt(2, 500) + getRandom(),
      leadTimeDays: randomInt(3, 21),
      shelfLifeDays: product.category === 'Frozen Foods' ? randomInt(180, 365) : randomInt(30, 365),
      minOrderQuantity: randomInt(5, 100),
      safetyStockDays: randomInt(3, 14),
    });
  }

  return skus;
}

// ========== CUSTOMER GENERATION ==========

/**
 * Generate customer master data.
 */
export function generateCustomers(count = 50): Customer[] {
  resetRandom(22222);
  const customers: Customer[] = [];

  for (let i = 0; i < count; i++) {
    const now = new Date();
    const lastReceived = new Date(now.getTime() - randomInt(1, 168) * 60 * 60 * 1000); // Last 7 days

    customers.push({
      id: `cust-${String(i).padStart(4, '0')}`,
      name: `${pickRandom(CUSTOMER_NAMES)} - DC${randomInt(1, 50)}`,
      segment: weightedRandom<'enterprise' | 'mid_market' | 'boutique'>([
        { item: 'enterprise', weight: 0.3 },
        { item: 'mid_market', weight: 0.45 },
        { item: 'boutique', weight: 0.25 },
      ]),
      region: pickRandom(['Northeast', 'Southeast', 'Midwest', 'Southwest', 'West']),
      dataQualityScore: randomInt(60, 98),
      primaryDataSource: pickRandom(DATA_SOURCES),
      accountManager: `AM-${randomInt(1, 20)}`,
      totalLocations: randomInt(1, 50),
      activeLocations: randomInt(1, 45),
      lastDataReceived: lastReceived.toISOString(),
    });
  }

  return customers;
}

// ========== INVENTORY SIGNAL GENERATION ==========

/**
 * Generate inventory signals from customers.
 */
export function generateInventorySignals(
  count = 300,
  customers: Customer[] = [],
  skus: SKU[] = []
): InventorySignal[] {
  if (customers.length === 0) customers = generateCustomers(50);
  if (skus.length === 0) skus = generateSKUs(100);

  resetRandom(33333);
  const signals: InventorySignal[] = [];

  for (let i = 0; i < count; i++) {
    const customer = pickRandom(customers);
    const sku = pickRandom(skus);
    const now = new Date();
    const reportedDate = new Date(now.getTime() - randomInt(1, 72) * 60 * 60 * 1000);
    const receivedDate = new Date(reportedDate.getTime() + randomInt(0, 480) * 60 * 1000);

    const isValid = getRandom() < 0.85;
    const onHand = randomInt(0, 10000);
    const sellThrough = randomInt(0, onHand);

    signals.push({
      id: `sig-${String(i).padStart(6, '0')}`,
      customerId: customer.id,
      customerName: customer.name,
      skuId: sku.id,
      locationId: `loc-${customer.id}-${randomInt(1, customer.activeLocations)}`,
      locationName: `Store ${randomInt(100, 999)}`,
      source: pickRandom(DATA_SOURCES),
      reportedDate: reportedDate.toISOString().split('T')[0],
      receivedDate: receivedDate.toISOString(),
      onHandQuantity: onHand,
      sellThroughQuantity: sellThrough,
      onOrderQuantity: randomInt(0, 5000),
      dataQualityScore: isValid ? randomInt(85, 99) : randomInt(40, 75),
      validationStatus: isValid
        ? 'valid'
        : weightedRandom([
            { item: 'warning', weight: 0.6 },
            { item: 'error', weight: 0.3 },
            { item: 'pending', weight: 0.1 },
          ]),
      validationIssues: !isValid
        ? [
            'Quantity unusual compared to history',
            'Missing location identifier',
            'Data older than expected',
          ].slice(0, randomInt(1, 2))
        : [],
      rawPayload: JSON.stringify({ onHand, sellThrough, timestamp: Date.now() }),
    });
  }

  return signals;
}

// ========== FORECAST RECORD GENERATION ==========

/**
 * Generate historical and forward forecast records.
 */
export function generateForecastRecords(
  count = 500,
  customers: Customer[] = [],
  skus: SKU[] = []
): ForecastRecord[] {
  if (customers.length === 0) customers = generateCustomers(50);
  if (skus.length === 0) skus = generateSKUs(100);

  resetRandom(44444);
  const records: ForecastRecord[] = [];

  for (let i = 0; i < count; i++) {
    const customer = pickRandom(customers);
    const sku = pickRandom(skus);
    const monthsAgo = randomInt(-3, 12); // 12 months back to 3 months forward

    const date = new Date();
    date.setMonth(date.getMonth() - monthsAgo);
    const period = date.toISOString().slice(0, 7);

    const forecast = randomInt(100, 10000);
    const actual = monthsAgo > 0 ? null : randomInt(forecast * 0.8, forecast * 1.3);
    const method = pickRandom(FORECAST_METHODS);

    let mape = null;
    let bias = null;
    if (actual !== null) {
      mape = Math.abs((actual - forecast) / forecast) * 100;
      bias = ((actual - forecast) / forecast) * 100;
    }

    records.push({
      id: `fcst-${String(i).padStart(6, '0')}`,
      skuId: sku.id,
      skuName: sku.name,
      customerId: customer.id,
      customerName: customer.name,
      locationId: `loc-${customer.id}-${randomInt(1, customer.activeLocations)}`,
      period,
      forecastQuantity: forecast,
      actualQuantity: actual,
      method,
      confidenceLow: Math.max(0, forecast * 0.7),
      confidenceHigh: forecast * 1.3,
      status: monthsAgo > 3 ? 'published' : monthsAgo > 0 ? 'approved' : 'draft',
      mape,
      bias,
      lastUpdated: new Date().toISOString(),
      adjustedBy: getRandom() < 0.1 ? `user-${randomInt(1, 10)}` : null,
      adjustmentReason: getRandom() < 0.1 ? 'Manual adjustment based on sales event' : null,
    });
  }

  return records;
}

// ========== REPLENISHMENT RECOMMENDATION GENERATION ==========

/**
 * Generate replenishment recommendations.
 */
export function generateReplenishmentRecommendations(
  count = 100,
  customers: Customer[] = [],
  skus: SKU[] = []
): ReplenishmentRecommendation[] {
  if (customers.length === 0) customers = generateCustomers(50);
  if (skus.length === 0) skus = generateSKUs(100);

  resetRandom(55556);
  const recommendations: ReplenishmentRecommendation[] = [];

  for (let i = 0; i < count; i++) {
    const customer = pickRandom(customers);
    const sku = pickRandom(skus);
    const currentInventory = randomInt(0, 5000);
    const safetyStock = sku.safetyStockDays * 100; // Simplified
    const reorderPoint = safetyStock + sku.minOrderQuantity;
    const isUrgent = currentInventory < reorderPoint;

    const now = new Date();
    const daysToStockout = isUrgent ? randomInt(1, 7) : randomInt(7, 30);
    const expectedStockoutDate = new Date(now.getTime() + daysToStockout * 24 * 60 * 60 * 1000);
    const orderByDate = new Date(expectedStockoutDate.getTime() - sku.leadTimeDays * 24 * 60 * 60 * 1000);

    recommendations.push({
      id: `rep-${String(i).padStart(6, '0')}`,
      skuId: sku.id,
      skuName: sku.name,
      customerId: customer.id,
      customerName: customer.name,
      locationId: `loc-${customer.id}-${randomInt(1, customer.activeLocations)}`,
      locationName: `Store ${randomInt(100, 999)}`,
      currentInventory,
      reorderPoint: Math.round(reorderPoint),
      safetyStock: Math.round(safetyStock),
      recommendedQuantity: Math.max(sku.minOrderQuantity, Math.round(safetyStock * 2)),
      urgency: isUrgent ? 'critical' : getRandom() < 0.3 ? 'high' : 'medium',
      expectedStockoutDate: expectedStockoutDate.toISOString(),
      leadTimeDays: sku.leadTimeDays,
      orderByDate: orderByDate.toISOString(),
      status: weightedRandom<'pending' | 'approved' | 'ordered' | 'shipped' | 'delivered'>([
        { item: 'pending', weight: 0.4 },
        { item: 'approved', weight: 0.25 },
        { item: 'ordered', weight: 0.2 },
        { item: 'shipped', weight: 0.1 },
        { item: 'delivered', weight: 0.05 },
      ]),
    });
  }

  return recommendations;
}

// ========== PLANNING EXCEPTION GENERATION ==========

/**
 * Generate demand planning exceptions.
 */
export function generatePlanningExceptions(
  count = 30,
  customers: Customer[] = [],
  skus: SKU[] = []
): PlanningException[] {
  if (customers.length === 0) customers = generateCustomers(50);
  if (skus.length === 0) skus = generateSKUs(100);

  resetRandom(66666);
  const exceptions: PlanningException[] = [];
  const exceptionTypes = [
    'missing_data',
    'duplicate_signal',
    'demand_spike',
    'demand_drop',
    'stale_data',
    'quality_issue',
    'stockout_risk',
    'overstock_risk',
  ] as const;

  for (let i = 0; i < count; i++) {
    const customer = pickRandom(customers);
    const sku = pickRandom(skus);
    const now = new Date();
    const detectedAt = new Date(now.getTime() - randomInt(1, 168) * 60 * 60 * 1000);
    const isResolved = getRandom() < 0.4;
    const resolvedAt = isResolved
      ? new Date(detectedAt.getTime() + randomInt(30, 1440) * 60 * 1000)
      : null;

    const exceptionType = pickRandom([...exceptionTypes]) as typeof exceptionTypes[number];
    const typeDescriptions: Record<typeof exceptionTypes[number], string[]> = {
      missing_data: ['No data received from location', 'Missing inventory count'],
      duplicate_signal: ['Duplicate signals detected', 'Conflicting reports from same location'],
      demand_spike: ['Unusual demand increase detected', 'Sales spike outside normal range'],
      demand_drop: ['Significant demand decrease', 'Sales abnormally low'],
      stale_data: ['Data not received for 5+ days', 'Outdated inventory information'],
      quality_issue: ['Data quality score below threshold', 'Multiple validation failures'],
      stockout_risk: ['Imminent stockout predicted', 'Safety stock at critical level'],
      overstock_risk: ['Excess inventory detected', 'Overstock situation likely'],
    };

    exceptions.push({
      id: `pex-${String(i).padStart(5, '0')}`,
      type: exceptionType,
      severity: isResolved ? 'info' : getRandom() < 0.2 ? 'critical' : 'warning',
      skuId: sku.id,
      customerId: customer.id,
      description: pickRandom(typeDescriptions[exceptionType]),
      detectedAt: detectedAt.toISOString(),
      resolvedAt: resolvedAt?.toISOString() ?? null,
      autoResolution: isResolved ? 'Automatically resolved by system' : null,
    });
  }

  return exceptions;
}

// ========== DATA INGESTION JOB GENERATION ==========

/**
 * Generate data ingestion job records.
 */
export function generateDataIngestionJobs(
  count = 50,
  customers: Customer[] = []
): DataIngestionJob[] {
  if (customers.length === 0) customers = generateCustomers(50);

  resetRandom(77777);
  const jobs: DataIngestionJob[] = [];

  for (let i = 0; i < count; i++) {
    const customer = pickRandom(customers);
    const now = new Date();
    const receivedAt = new Date(now.getTime() - randomInt(1, 168) * 60 * 60 * 1000);

    const status = weightedRandom<'queued' | 'processing' | 'completed' | 'failed' | 'needs_review'>([
      { item: 'completed', weight: 0.7 },
      { item: 'queued', weight: 0.1 },
      { item: 'processing', weight: 0.1 },
      { item: 'needs_review', weight: 0.07 },
      { item: 'failed', weight: 0.03 },
    ]);

    const totalRecords = randomInt(50, 2000);
    const validRecords =
      status === 'completed'
        ? Math.round(totalRecords * (0.9 + getRandom() * 0.09))
        : Math.round(totalRecords * (0.5 + getRandom() * 0.4));
    const invalidRecords = totalRecords - validRecords;

    jobs.push({
      id: `job-${String(i).padStart(6, '0')}`,
      source: customer.primaryDataSource,
      customerId: customer.id,
      customerName: customer.name,
      fileName: `inventory_${customer.id}_${receivedAt.getTime()}.${customer.primaryDataSource === 'email' ? 'xlsx' : 'csv'}`,
      receivedAt: receivedAt.toISOString(),
      processedAt:
        status === 'processing' || status === 'queued'
          ? null
          : new Date(receivedAt.getTime() + randomInt(60, 3600) * 1000).toISOString(),
      status,
      recordsTotal: totalRecords,
      recordsValid: validRecords,
      recordsInvalid: invalidRecords,
      errorMessage:
        status === 'failed'
          ? 'CSV parsing error: unexpected delimiter in row 42'
          : status === 'needs_review'
            ? 'Multiple validation warnings detected'
            : null,
    });
  }

  return jobs;
}

// ========== DEMAND PLANNING METRICS GENERATION ==========

/**
 * Generate aggregate demand planning metrics.
 */
export function generateDemandPlanningMetrics(
  forecastRecords: ForecastRecord[] = [],
  exceptions: PlanningException[] = []
): DemandPlanningMetrics {
  if (forecastRecords.length === 0) forecastRecords = generateForecastRecords(500);
  if (exceptions.length === 0) exceptions = generatePlanningExceptions(30);

  // Calculate MAPE from forecast records
  const completedRecords = forecastRecords.filter(r => r.mape !== null);
  const overallMape =
    completedRecords.length > 0
      ? completedRecords.reduce((sum, r) => sum + (r.mape || 0), 0) / completedRecords.length
      : randomInt(5, 20);

  const overallBias =
    completedRecords.length > 0
      ? completedRecords.reduce((sum, r) => sum + (r.bias || 0), 0) / completedRecords.length
      : randomInt(-10, 10);

  return {
    overallMape: Math.round(overallMape * 100) / 100,
    forecastBias: Math.round(overallBias * 100) / 100,
    serviceLevel: randomInt(92, 99),
    fillRate: randomInt(94, 99),
    stockoutRate: randomInt(1, 6),
    weeksOfSupply: Math.round((randomInt(4, 12) + getRandom()) * 100) / 100,
    inventoryTurns: Math.round((randomInt(8, 20) + getRandom()) * 100) / 100,
    dataQualityAvg: randomInt(75, 92),
    customersReporting: randomInt(40, 50),
    totalCustomers: 50,
    activeExceptions: exceptions.filter(e => !e.resolvedAt).length,
    replenishmentsPending: randomInt(15, 35),
  };
}

// ========== COMPREHENSIVE YARD DATASET ==========

export interface YardDataset {
  trucks: Truck[];
  bols: BillOfLading[];
  docks: Dock[];
  exceptions: YardException[];
  gateEvents: GateEvent[];
  metrics: YardMetrics;
}

/**
 * Generate complete yard management dataset.
 */
export function generateYardDataset(truckCount = 20): YardDataset {
  const trucks = generateTrucks(truckCount);
  const bols = generateBOLs(trucks);
  const docks = generateDocks();
  const exceptions = generateExceptions(trucks);
  const gateEvents = generateGateEvents(trucks);
  const metrics = generateYardMetrics(trucks, exceptions);

  // Attach exceptions to trucks
  for (const exception of exceptions) {
    const truck = trucks.find(t => t.id === exception.truckId);
    if (truck) {
      truck.exceptions.push(exception);
    }
  }

  return { trucks, bols, docks, exceptions, gateEvents, metrics };
}

// ========== COMPREHENSIVE DEMAND PLANNING DATASET ==========

export interface DemandPlanningDataset {
  skus: SKU[];
  customers: Customer[];
  inventorySignals: InventorySignal[];
  forecastRecords: ForecastRecord[];
  replenishmentRecommendations: ReplenishmentRecommendation[];
  planningExceptions: PlanningException[];
  dataIngestionJobs: DataIngestionJob[];
  metrics: DemandPlanningMetrics;
}

/**
 * Generate complete demand planning dataset.
 */
export function generateDemandPlanningDataset(): DemandPlanningDataset {
  const skus = generateSKUs(100);
  const customers = generateCustomers(50);
  const inventorySignals = generateInventorySignals(300, customers, skus);
  const forecastRecords = generateForecastRecords(500, customers, skus);
  const replenishmentRecommendations = generateReplenishmentRecommendations(100, customers, skus);
  const planningExceptions = generatePlanningExceptions(30, customers, skus);
  const dataIngestionJobs = generateDataIngestionJobs(50, customers);
  const metrics = generateDemandPlanningMetrics(forecastRecords, planningExceptions);

  return {
    skus,
    customers,
    inventorySignals,
    forecastRecords,
    replenishmentRecommendations,
    planningExceptions,
    dataIngestionJobs,
    metrics,
  };
}

// ========== FULL PLATFORM DATASET ==========

export interface FullPlatformDataset {
  yard: YardDataset;
  demandPlanning: DemandPlanningDataset;
}

/**
 * Generate all data for the supply chain platform.
 */
export function generateFullDataset(): FullPlatformDataset {
  return {
    yard: generateYardDataset(20),
    demandPlanning: generateDemandPlanningDataset(),
  };
}

// ========== EXPORT ALIASES FOR BACKWARD COMPATIBILITY ==========

export const generateMockTrucks = (count: number = 20) => generateTrucks(count);
export const generateMockDocks = (count: number = 20) => {
  // generateDocks doesn't accept a count param, but we generate a fixed set and return the first 'count'
  const allDocks = generateDocks();
  return count ? allDocks.slice(0, Math.min(count, allDocks.length)) : allDocks;
};
export const generateMockYardMetrics = (trucks: Truck[] = [], exceptions: YardException[] = []) => {
  if (trucks.length === 0) trucks = generateTrucks(20);
  if (exceptions.length === 0) exceptions = generateExceptions(trucks);
  return generateYardMetrics(trucks, exceptions);
};
export const generateMockExceptions = (count: number = 30, trucks: Truck[] = []) => {
  if (trucks.length === 0) trucks = generateTrucks(20);
  return generateExceptions(trucks).slice(0, count);
};
export const generateMockBOL = generateBOLs;

// ========== OCR AND THROUGHPUT DATA GENERATION ==========

/**
 * Generate OCR data for gate events.
 */
export interface OCRData {
  licensePlate: string;
  trailerNumber: string;
  confidence: number;
  cameraId: string;
  timestamp: string;
}

export function generateOCRData(count = 50): OCRData[] {
  resetRandom(77777);
  const data: OCRData[] = [];

  const cameras = ['CAM-01', 'CAM-02', 'CAM-03', 'CAM-04'];

  for (let i = 0; i < count; i++) {
    const now = new Date();
    data.push({
      licensePlate: `${String.fromCharCode(65 + randomInt(0, 25))}${String.fromCharCode(65 + randomInt(0, 25))}${randomInt(100, 999)}`,
      trailerNumber: `TR${String(randomInt(10000, 99999))}`,
      confidence: 0.85 + getRandom() * 0.15,
      cameraId: pickRandom(cameras),
      timestamp: new Date(now.getTime() - randomInt(0, 1440) * 60 * 1000).toISOString(),
    });
  }

  return data;
}

/**
 * Generate throughput data for the last 24 hours.
 */
export interface ThroughputData {
  hour: string;
  trucks: number;
}

export function generateThroughputData(): ThroughputData[] {
  resetRandom(88888);
  const data: ThroughputData[] = [];
  const now = new Date();

  for (let i = 23; i >= 0; i--) {
    const hour = new Date(now.getTime() - i * 60 * 60 * 1000);
    const hourStr = hour.toLocaleString('en-US', { hour: '2-digit', hour12: false });
    data.push({
      hour: `${hourStr}:00`,
      trucks: randomInt(5, 15),
    });
  }

  return data;
}

/**
 * Generate dwell time distribution data.
 */
export interface DwellTimeDistribution {
  range: string;
  count: number;
}

export function generateDwellTimeDistribution(): DwellTimeDistribution[] {
  resetRandom(99999);
  return [
    { range: '0-30min', count: randomInt(5, 15) },
    { range: '30-60min', count: randomInt(10, 25) },
    { range: '60-120min', count: randomInt(15, 35) },
    { range: '120-240min', count: randomInt(8, 20) },
    { range: '240min+', count: randomInt(2, 8) },
  ];
}
