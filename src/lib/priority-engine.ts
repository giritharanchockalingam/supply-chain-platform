import { Truck, BillOfLading, Dock, PriorityLevel } from './types';

/**
 * Represents one factor in the priority calculation with its contribution.
 */
export interface PriorityFactor {
  /** Name of the factor being scored */
  name: string;
  /** Weight applied to this factor (0-1) */
  weight: number;
  /** Raw value from data before normalization */
  rawValue: number;
  /** Normalized score (0-100) for this factor */
  normalizedScore: number;
  /** Weighted contribution to final score */
  weightedScore: number;
  /** Explanation of why this score was assigned */
  explanation: string;
}

/**
 * Result of priority scoring with detailed breakdown.
 */
export interface PriorityScoreResult {
  /** Final priority score (0-100) */
  score: number;
  /** Categorized priority level */
  level: PriorityLevel;
  /** Detailed factors contributing to score */
  factors: PriorityFactor[];
}

/**
 * Result of dock assignment optimization.
 */
export interface DockAssignmentResult {
  /** Dock ID that matches this truck best */
  dockId: string;
  /** Quality score of this assignment (0-100) */
  score: number;
  /** Human-readable reasons for this assignment */
  reasons: string[];
}

// ========== CONSTANTS ==========

const CUSTOMER_PRIORITY_SCORES: Record<string, number> = {
  platinum: 40,
  gold: 30,
  silver: 20,
  standard: 10,
};

const TEMPERATURE_SENSITIVITY_SCORES: Record<string, number> = {
  frozen: 90,
  hazmat: 80,
  refrigerated: 70,
  ambient: 10,
};

const WEIGHTS = {
  customerPriority: 0.25,
  deliveryUrgency: 0.3,
  dwellTime: 0.15,
  temperatureSensitivity: 0.15,
  productValue: 0.1,
  dockCompatibility: 0.05,
};

// ========== PRIORITY CALCULATION ==========

/**
 * Calculates the priority score for a truck based on multiple factors.
 *
 * The score is a weighted combination of:
 * - Customer priority (platinum/gold/silver/standard)
 * - Delivery deadline urgency (how soon deadline is)
 * - Dwell time (how long truck has been waiting)
 * - Temperature sensitivity (frozen/hazmat/refrigerated/ambient)
 * - Product value (derived from quantity and weight)
 *
 * @param truck - Truck to score
 * @param bol - Associated bill of lading
 * @param docks - Available docks for compatibility check
 * @returns Priority score result with factors breakdown
 */
export function calculatePriorityScore(
  truck: Truck,
  bol: BillOfLading,
  docks: Dock[]
): PriorityScoreResult {
  const factors: PriorityFactor[] = [];
  let totalWeightedScore = 0;

  // ===== FACTOR 1: Customer Priority =====
  const customerPriorityRaw = CUSTOMER_PRIORITY_SCORES[bol.customerPriority] || 10;
  const customerPriorityNormalized = (customerPriorityRaw / 40) * 100; // Normalize to 0-100
  const customerPriorityWeighted = customerPriorityNormalized * WEIGHTS.customerPriority;

  factors.push({
    name: 'Customer Priority',
    weight: WEIGHTS.customerPriority,
    rawValue: customerPriorityRaw,
    normalizedScore: customerPriorityNormalized,
    weightedScore: customerPriorityWeighted,
    explanation: `Customer tier ${bol.customerPriority} assigned priority score ${customerPriorityRaw}`,
  });

  totalWeightedScore += customerPriorityWeighted;

  // ===== FACTOR 2: Delivery Deadline Urgency =====
  const now = new Date();
  const deadline = new Date(bol.deliveryDeadline);
  const hoursUntilDeadline = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60);
  const daysUntilDeadline = hoursUntilDeadline / 24;

  let deliveryUrgencyScore: number;
  if (daysUntilDeadline < 0) {
    // Overdue - critical
    deliveryUrgencyScore = 100;
  } else if (daysUntilDeadline <= 1) {
    // Due within 24 hours
    deliveryUrgencyScore = 100 - (daysUntilDeadline * 10);
  } else if (daysUntilDeadline <= 3) {
    // Due within 3 days
    deliveryUrgencyScore = 90 - ((daysUntilDeadline - 1) * 15);
  } else {
    // More than 3 days
    deliveryUrgencyScore = Math.max(20, 60 - (daysUntilDeadline * 5));
  }

  const deliveryWeightedScore = deliveryUrgencyScore * WEIGHTS.deliveryUrgency;

  factors.push({
    name: 'Delivery Urgency',
    weight: WEIGHTS.deliveryUrgency,
    rawValue: hoursUntilDeadline,
    normalizedScore: deliveryUrgencyScore,
    weightedScore: deliveryWeightedScore,
    explanation:
      daysUntilDeadline < 0
        ? 'Delivery is OVERDUE - critical priority'
        : `Delivery deadline in ${daysUntilDeadline.toFixed(1)} days`,
  });

  totalWeightedScore += deliveryWeightedScore;

  // ===== FACTOR 3: Dwell Time =====
  // Longer wait = higher priority
  const dwellMinutes = truck.dwellTime;
  const dwellHours = dwellMinutes / 60;

  let dwellScore: number;
  if (dwellHours < 0.5) {
    dwellScore = 10; // Just arrived
  } else if (dwellHours < 2) {
    dwellScore = 30 + (dwellHours * 15); // Ramping up
  } else if (dwellHours < 6) {
    dwellScore = 50 + ((dwellHours - 2) * 8); // Significant wait
  } else {
    dwellScore = Math.min(100, 70 + ((dwellHours - 6) * 3)); // Excessive wait
  }

  const dwellWeightedScore = dwellScore * WEIGHTS.dwellTime;

  factors.push({
    name: 'Dwell Time',
    weight: WEIGHTS.dwellTime,
    rawValue: dwellMinutes,
    normalizedScore: dwellScore,
    weightedScore: dwellWeightedScore,
    explanation: `Truck has been waiting ${dwellHours.toFixed(1)} hours (${dwellMinutes} minutes)`,
  });

  totalWeightedScore += dwellWeightedScore;

  // ===== FACTOR 4: Temperature Sensitivity =====
  const tempSensitivityRaw = TEMPERATURE_SENSITIVITY_SCORES[bol.temperatureClass] || 10;
  const tempSensitivityNormalized = Math.min(100, (tempSensitivityRaw / 90) * 100);
  const tempWeightedScore = tempSensitivityNormalized * WEIGHTS.temperatureSensitivity;

  factors.push({
    name: 'Temperature Sensitivity',
    weight: WEIGHTS.temperatureSensitivity,
    rawValue: tempSensitivityRaw,
    normalizedScore: tempSensitivityNormalized,
    weightedScore: tempWeightedScore,
    explanation:
      bol.temperatureClass === 'hazmat'
        ? 'Hazmat cargo requires immediate handling'
        : bol.temperatureClass === 'frozen'
          ? 'Frozen cargo at risk of thaw'
          : bol.temperatureClass === 'refrigerated'
            ? 'Refrigerated cargo requires controlled environment'
            : 'Ambient temperature cargo - standard handling',
  });

  totalWeightedScore += tempWeightedScore;

  // ===== FACTOR 5: Product Value =====
  // Estimated value = (weight * unit cost) or based on quantity
  // Note: We estimate this from BOL data; in production would use actual product pricing
  const estimatedValue = bol.weight * 0.5 + bol.quantity * 10; // Rough estimate
  const valueScore = Math.min(100, (estimatedValue / 50000) * 100); // Normalize to 50k baseline
  const valueWeightedScore = valueScore * WEIGHTS.productValue;

  factors.push({
    name: 'Product Value',
    weight: WEIGHTS.productValue,
    rawValue: estimatedValue,
    normalizedScore: valueScore,
    weightedScore: valueWeightedScore,
    explanation: `Estimated cargo value: $${estimatedValue.toFixed(0)}`,
  });

  totalWeightedScore += valueWeightedScore;

  // ===== FACTOR 6: Dock Compatibility =====
  const compatibleDock = findOptimalDock(truck, bol, docks);
  const dockCompatibilityScore = compatibleDock ? 100 : 50; // Bonus for compatible dock
  const dockWeightedScore = dockCompatibilityScore * WEIGHTS.dockCompatibility;

  factors.push({
    name: 'Dock Compatibility',
    weight: WEIGHTS.dockCompatibility,
    rawValue: compatibleDock ? 1 : 0,
    normalizedScore: dockCompatibilityScore,
    weightedScore: dockWeightedScore,
    explanation: compatibleDock
      ? `Compatible dock ${compatibleDock.dockId} available`
      : 'No ideal dock match - may require special handling',
  });

  totalWeightedScore += dockWeightedScore;

  // ===== DETERMINE PRIORITY LEVEL =====
  let level: PriorityLevel;
  if (totalWeightedScore >= 85) {
    level = 'critical';
  } else if (totalWeightedScore >= 65) {
    level = 'high';
  } else if (totalWeightedScore >= 40) {
    level = 'medium';
  } else {
    level = 'low';
  }

  return {
    score: Math.round(totalWeightedScore * 100) / 100,
    level,
    factors,
  };
}

// ========== DOCK ASSIGNMENT OPTIMIZATION ==========

/**
 * Finds the optimal dock for a truck based on cargo and dock capabilities.
 *
 * Dock matching prioritizes:
 * 1. Temperature capability match (required for refrigerated/frozen)
 * 2. Hazmat capability (required for hazmat cargo)
 * 3. Dock type match (inbound vs outbound)
 * 4. Available capacity (space for trailer length)
 * 5. Current availability status
 *
 * @param truck - Truck to assign
 * @param bol - Associated bill of lading
 * @param docks - Available docks to search
 * @returns Best dock assignment or null if no suitable dock found
 */
export function findOptimalDock(
  truck: Truck,
  bol: BillOfLading,
  docks: Dock[]
): DockAssignmentResult | null {
  const reasons: string[] = [];
  let bestDock: Dock | null = null;
  let bestScore = 0;

  for (const dock of docks) {
    let dockScore = 0;
    const dockReasons: string[] = [];

    // Skip if dock is not available or blocked
    if (['maintenance', 'blocked'].includes(dock.status)) {
      continue;
    }

    // Temperature capability check
    if (
      (bol.temperatureClass === 'refrigerated' || bol.temperatureClass === 'frozen') &&
      !dock.temperatureCapable
    ) {
      dockReasons.push('Missing temperature capability');
      continue; // Skip this dock - it's not suitable
    }

    // Hazmat capability check
    if (bol.hazmat && !dock.hazmatCapable) {
      dockReasons.push('Missing hazmat capability');
      continue; // Skip this dock - it's not suitable
    }

    // Trailer length compatibility
    if (truck.trailerNumber && truck.trailerNumber.length > 0) {
      const trailerLength = 53; // Standard assumption
      if (trailerLength > dock.maxTrailerLength) {
        dockReasons.push(`Trailer too long for dock capacity (${dock.maxTrailerLength}ft max)`);
        continue;
      }
    }

    // Base score from dock status
    if (dock.status === 'available') {
      dockScore = 100;
      dockReasons.push('Dock is available');
    } else if (dock.status === 'assigned') {
      dockScore = 60;
      dockReasons.push('Dock is assigned but not yet occupied');
    } else if (dock.status === 'occupied') {
      dockScore = 30;
      dockReasons.push('Dock is currently occupied');
    }

    // Type preference
    if (dock.type === 'dual') {
      dockScore += 15;
      dockReasons.push('Dock is flexible (dual use)');
    }

    // Temperature capability bonus
    if (dock.temperatureCapable && bol.temperatureClass !== 'ambient') {
      dockScore += 20;
      dockReasons.push('Dock has matching temperature capability');
    }

    // Hazmat capability bonus
    if (dock.hazmatCapable && bol.hazmat) {
      dockScore += 15;
      dockReasons.push('Dock has hazmat certification');
    }

    // Utilization consideration (avoid overloaded docks)
    if (dock.utilizationToday < 70) {
      dockScore += 10;
      dockReasons.push('Dock utilization is reasonable');
    }

    if (dockScore > bestScore) {
      bestScore = dockScore;
      bestDock = dock;
      reasons.length = 0;
      reasons.push(...dockReasons);
    }
  }

  if (!bestDock) {
    return null;
  }

  return {
    dockId: bestDock.id,
    score: Math.round(bestScore),
    reasons,
  };
}

/**
 * Ranks all available docks for a truck in order of preference.
 * Useful for showing alternative dock options.
 *
 * @param truck - Truck to assign
 * @param bol - Associated bill of lading
 * @param docks - Available docks to rank
 * @returns Sorted array of dock assignments
 */
export function rankDocks(
  truck: Truck,
  bol: BillOfLading,
  docks: Dock[]
): DockAssignmentResult[] {
  const rankings: DockAssignmentResult[] = [];

  for (const dock of docks) {
    let score = 0;
    const reasons: string[] = [];

    // Hard constraints - skip if not met
    if (['maintenance', 'blocked'].includes(dock.status)) {
      continue;
    }

    if (
      (bol.temperatureClass === 'refrigerated' || bol.temperatureClass === 'frozen') &&
      !dock.temperatureCapable
    ) {
      continue;
    }

    if (bol.hazmat && !dock.hazmatCapable) {
      continue;
    }

    // Scoring
    if (dock.status === 'available') {
      score += 100;
      reasons.push('Available');
    } else if (dock.status === 'assigned') {
      score += 60;
      reasons.push('Assigned');
    } else if (dock.status === 'occupied') {
      score += 30;
      reasons.push('Occupied');
    }

    if (dock.type === 'dual') {
      score += 15;
      reasons.push('Dual-use');
    }

    if (dock.temperatureCapable && bol.temperatureClass !== 'ambient') {
      score += 20;
      reasons.push('Temp-capable');
    }

    if (dock.hazmatCapable && bol.hazmat) {
      score += 15;
      reasons.push('Hazmat-certified');
    }

    if (dock.utilizationToday < 70) {
      score += 10;
      reasons.push('Low utilization');
    }

    rankings.push({
      dockId: dock.id,
      score: Math.round(score),
      reasons,
    });
  }

  // Sort by score descending
  return rankings.sort((a, b) => b.score - a.score);
}

/**
 * Calculates estimated turnaround time for a truck based on various factors.
 * Used for real-time ETA calculations.
 *
 * @param truck - Truck being analyzed
 * @param bol - Associated bill of lading
 * @param currentDwellMinutes - Minutes truck has already waited
 * @returns Estimated minutes from now until truck can depart
 */
export function estimateTurnaroundTime(
  truck: Truck,
  bol: BillOfLading,
  currentDwellMinutes: number
): number {
  let estimatedMinutes = 0;

  // Unload time (primary factor)
  estimatedMinutes += truck.estimatedUnloadTime;

  // Dock assignment delay (if not at dock yet)
  if (!truck.assignedDock) {
    estimatedMinutes += randomInt(15, 45); // Average wait for dock
  }

  // Temperature handling adds time
  if (bol.temperatureClass === 'hazmat') {
    estimatedMinutes += randomInt(30, 60); // Hazmat processing
  } else if (bol.temperatureClass === 'frozen' || bol.temperatureClass === 'refrigerated') {
    estimatedMinutes += randomInt(15, 30); // Temperature stabilization
  }

  // Documentation review
  estimatedMinutes += randomInt(5, 15);

  return estimatedMinutes;
}

/**
 * Helper function for estimates (in production would be from actual data).
 */
function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Checks if a truck meets all requirements to be processed.
 * Used for validation before assignment.
 *
 * @param truck - Truck to validate
 * @param bol - Associated bill of lading
 * @returns Object with validation status and any errors
 */
export function validateTruckForProcessing(
  truck: Truck,
  bol: BillOfLading
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check BOL exists and matches
  if (!bol.bolNumber || bol.bolNumber !== truck.bolId) {
    errors.push('Bill of lading number mismatch');
  }

  // Check essential info
  if (!truck.licensePlate) {
    errors.push('Missing license plate');
  }

  if (!truck.trailerNumber) {
    errors.push('Missing trailer number');
  }

  if (!truck.carrierName) {
    errors.push('Missing carrier information');
  }

  if (!bol.customerName) {
    errors.push('Missing customer information');
  }

  if (!bol.productType) {
    errors.push('Missing product information');
  }

  // Check delivery deadline
  const now = new Date();
  const deadline = new Date(bol.deliveryDeadline);
  if (deadline < new Date(now.getTime() - 24 * 60 * 60 * 1000)) {
    errors.push('Delivery deadline is excessively overdue (more than 24 hours)');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
