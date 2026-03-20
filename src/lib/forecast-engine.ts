/**
 * Forecast engine implementing multiple time series forecasting algorithms.
 * Provides both individual methods and ensemble approaches.
 */

// ========== TYPES ==========

/**
 * Result from a forecast operation.
 */
export interface ForecastResult {
  /** Forecasted values for each period */
  forecast: number[];
  /** Lower confidence interval bounds */
  confidenceLow: number[];
  /** Upper confidence interval bounds */
  confidenceHigh: number[];
  /** Mean Absolute Percentage Error on historical data */
  mape: number;
  /** Forecast bias (positive = overestimate, negative = underestimate) */
  bias: number;
  /** Method used for forecasting */
  method: string;
}

/**
 * Configuration for Holt-Winters forecasting.
 */
export interface HoltWintersConfig {
  alpha?: number; // Level smoothing (0-1)
  beta?: number; // Trend smoothing (0-1)
  gamma?: number; // Seasonal smoothing (0-1)
  seasonalPeriod?: number; // Length of seasonal cycle
  confidenceLevel?: number; // Z-score for confidence intervals (default 1.96 for 95%)
}

/**
 * Configuration for ARIMA-like forecasting.
 */
export interface ArimaConfig {
  p?: number; // Autoregressive order
  d?: number; // Differencing order
  q?: number; // Moving average order
  confidenceLevel?: number;
}

/**
 * Configuration for ensemble forecasting.
 */
export interface EnsembleConfig {
  methods?: Array<'exponentialSmoothing' | 'movingAverage' | 'linearRegression' | 'hwinters'>;
  weights?: number[];
  confidenceLevel?: number;
}

// ========== SIMPLE EXPONENTIAL SMOOTHING ==========

/**
 * Simple exponential smoothing - good for data with no trend or seasonality.
 *
 * Formula: F(t+1) = α * Y(t) + (1-α) * F(t)
 *
 * @param historical - Historical demand values
 * @param periods - Number of periods to forecast
 * @param alpha - Smoothing constant (default 0.3). Lower = more weight to history.
 * @param confidenceLevel - Z-score for confidence intervals (default 1.96 for 95%)
 * @returns Forecast result with confidence intervals
 */
export function simpleExponentialSmoothing(
  historical: number[],
  periods: number = 3,
  alpha: number = 0.3,
  confidenceLevel: number = 1.96
): ForecastResult {
  if (historical.length === 0) {
    throw new Error('Historical data cannot be empty');
  }

  if (alpha < 0 || alpha > 1) {
    throw new Error('Alpha must be between 0 and 1');
  }

  // Initialize
  let level = historical[0];
  const forecasts: number[] = [];
  const errors: number[] = [];

  // Fit to historical data
  for (let i = 1; i < historical.length; i++) {
    const forecast = level;
    errors.push(historical[i] - forecast);
    level = alpha * historical[i] + (1 - alpha) * level;
  }

  // Generate future forecasts
  let nextForecast = level;
  for (let i = 0; i < periods; i++) {
    forecasts.push(nextForecast);
    // In simple exponential smoothing, all future forecasts converge to the last level
  }

  // Calculate metrics
  const mape = calculateMAPE(historical.slice(1), errors);
  const bias = calculateBias(errors);

  // Calculate standard error for confidence intervals
  const mse = errors.reduce((sum, e) => sum + e * e, 0) / Math.max(1, errors.length - 1);
  const se = Math.sqrt(mse);

  const confidenceLow = forecasts.map(f => Math.max(0, f - confidenceLevel * se));
  const confidenceHigh = forecasts.map(f => f + confidenceLevel * se);

  return {
    forecast: forecasts,
    confidenceLow,
    confidenceHigh,
    mape,
    bias,
    method: 'exponential_smoothing',
  };
}

// ========== HOLT-WINTERS (TRIPLE EXPONENTIAL SMOOTHING) ==========

/**
 * Holt-Winters triple exponential smoothing with trend and seasonality.
 * Best for data with both trend and seasonal patterns.
 *
 * @param historical - Historical demand values
 * @param periods - Number of periods to forecast
 * @param config - Configuration options
 * @returns Forecast result with confidence intervals
 */
export function holtWinters(
  historical: number[],
  periods: number = 3,
  config: HoltWintersConfig = {}
): ForecastResult {
  const {
    alpha = 0.3, // Level
    beta = 0.1, // Trend
    gamma = 0.1, // Seasonality
    seasonalPeriod = 12, // 12 months
    confidenceLevel = 1.96,
  } = config;

  if (historical.length < seasonalPeriod * 2) {
    // Fall back to simpler method if not enough data
    return simpleExponentialSmoothing(historical, periods, alpha, confidenceLevel);
  }

  // Initialize level, trend, and seasonal components
  let level = historical.slice(0, seasonalPeriod).reduce((a, b) => a + b, 0) / seasonalPeriod;
  let trend =
    (historical.slice(seasonalPeriod, seasonalPeriod * 2).reduce((a, b) => a + b, 0) -
      historical.slice(0, seasonalPeriod).reduce((a, b) => a + b, 0)) /
    (seasonalPeriod * seasonalPeriod);

  const seasonal: number[] = [];
  for (let i = 0; i < seasonalPeriod; i++) {
    seasonal[i] = historical[i] / level;
  }

  const errors: number[] = [];
  const forecasts: number[] = [];

  // Fit to historical data
  for (let i = seasonalPeriod; i < historical.length; i++) {
    const seasonalIndex = i % seasonalPeriod;
    const forecast = (level + trend) * seasonal[seasonalIndex];
    errors.push(historical[i] - forecast);

    // Update components
    const prevLevel = level;
    level = alpha * (historical[i] / seasonal[seasonalIndex]) + (1 - alpha) * (level + trend);
    trend = beta * (level - prevLevel) + (1 - beta) * trend;
    seasonal[seasonalIndex] = gamma * (historical[i] / level) + (1 - gamma) * seasonal[seasonalIndex];
  }

  // Generate future forecasts
  for (let i = 0; i < periods; i++) {
    const seasonalIndex = (historical.length + i) % seasonalPeriod;
    forecasts.push((level + trend * (i + 1)) * seasonal[seasonalIndex]);
  }

  // Calculate metrics
  const mape = calculateMAPE(
    historical.slice(seasonalPeriod),
    errors
  );
  const bias = calculateBias(errors);

  const mse = errors.reduce((sum, e) => sum + e * e, 0) / Math.max(1, errors.length - 1);
  const se = Math.sqrt(mse);

  const confidenceLow = forecasts.map(f => Math.max(0, f - confidenceLevel * se));
  const confidenceHigh = forecasts.map(f => f + confidenceLevel * se);

  return {
    forecast: forecasts,
    confidenceLow,
    confidenceHigh,
    mape,
    bias,
    method: 'holt_winters',
  };
}

// ========== MOVING AVERAGE ==========

/**
 * Simple moving average - smooths data by averaging recent periods.
 * Good baseline for comparison.
 *
 * @param historical - Historical demand values
 * @param periods - Number of periods to forecast
 * @param windowSize - Number of periods for moving average (default 3)
 * @param confidenceLevel - Z-score for confidence intervals (default 1.96)
 * @returns Forecast result
 */
export function movingAverage(
  historical: number[],
  periods: number = 3,
  windowSize: number = 3,
  confidenceLevel: number = 1.96
): ForecastResult {
  if (historical.length < windowSize) {
    windowSize = Math.max(1, historical.length - 1);
  }

  // Calculate moving averages
  const mas: number[] = [];
  for (let i = windowSize - 1; i < historical.length; i++) {
    const window = historical.slice(i - windowSize + 1, i + 1);
    mas.push(window.reduce((a, b) => a + b, 0) / window.length);
  }

  // Forecast by using last MA value (no trend assumption)
  const lastMA = mas[mas.length - 1] || historical[historical.length - 1];
  const forecasts = Array(periods).fill(lastMA);

  // Calculate errors
  const errors: number[] = [];
  for (let i = 0; i < mas.length; i++) {
    errors.push(historical[windowSize + i] - mas[i]);
  }

  const mape = calculateMAPE(historical.slice(windowSize), errors);
  const bias = calculateBias(errors);

  const mse = errors.reduce((sum, e) => sum + e * e, 0) / Math.max(1, errors.length - 1);
  const se = Math.sqrt(mse);

  const confidenceLow = forecasts.map(f => Math.max(0, f - confidenceLevel * se));
  const confidenceHigh = forecasts.map(f => f + confidenceLevel * se);

  return {
    forecast: forecasts,
    confidenceLow,
    confidenceHigh,
    mape,
    bias,
    method: 'moving_average',
  };
}

// ========== LINEAR REGRESSION ==========

/**
 * Linear regression trend forecasting.
 * Good for data with clear upward or downward trends.
 *
 * Fits line: y = mx + b
 *
 * @param historical - Historical demand values
 * @param periods - Number of periods to forecast
 * @param confidenceLevel - Z-score for confidence intervals (default 1.96)
 * @returns Forecast result
 */
export function linearRegression(
  historical: number[],
  periods: number = 3,
  confidenceLevel: number = 1.96
): ForecastResult {
  if (historical.length < 2) {
    throw new Error('Need at least 2 data points for linear regression');
  }

  const n = historical.length;
  const xMean = (n - 1) / 2;
  const yMean = historical.reduce((a, b) => a + b, 0) / n;

  // Calculate slope (m) and intercept (b)
  let sumXY = 0;
  let sumX2 = 0;

  for (let i = 0; i < n; i++) {
    const x = i;
    const y = historical[i];
    sumXY += (x - xMean) * (y - yMean);
    sumX2 += (x - xMean) * (x - xMean);
  }

  const slope = sumX2 > 0 ? sumXY / sumX2 : 0;
  const intercept = yMean - slope * xMean;

  // Generate forecasts
  const forecasts: number[] = [];
  for (let i = 0; i < periods; i++) {
    const x = n + i;
    forecasts.push(Math.max(0, intercept + slope * x)); // No negative forecasts
  }

  // Calculate errors
  const errors: number[] = [];
  for (let i = 0; i < n; i++) {
    const predicted = intercept + slope * i;
    errors.push(historical[i] - predicted);
  }

  const mape = calculateMAPE(historical, errors);
  const bias = calculateBias(errors);

  const mse = errors.reduce((sum, e) => sum + e * e, 0) / Math.max(1, n - 2);
  const se = Math.sqrt(mse);

  const confidenceLow = forecasts.map(f => Math.max(0, f - confidenceLevel * se));
  const confidenceHigh = forecasts.map(f => f + confidenceLevel * se);

  return {
    forecast: forecasts,
    confidenceLow,
    confidenceHigh,
    mape,
    bias,
    method: 'linear_regression',
  };
}

// ========== ENSEMBLE FORECASTING ==========

/**
 * Combines multiple forecast methods with optional weighting.
 * Generally produces more robust forecasts than single methods.
 *
 * @param historical - Historical demand values
 * @param periods - Number of periods to forecast
 * @param config - Configuration for ensemble
 * @returns Combined forecast result
 */
export function ensembleForecasting(
  historical: number[],
  periods: number = 3,
  config: EnsembleConfig = {}
): ForecastResult {
  const {
    methods = ['exponentialSmoothing', 'movingAverage', 'linearRegression'],
    weights = undefined,
    confidenceLevel = 1.96,
  } = config;

  const results: ForecastResult[] = [];

  // Generate forecasts from each method
  if (methods.includes('exponentialSmoothing')) {
    results.push(simpleExponentialSmoothing(historical, periods, 0.3, confidenceLevel));
  }

  if (methods.includes('movingAverage')) {
    results.push(movingAverage(historical, periods, 3, confidenceLevel));
  }

  if (methods.includes('linearRegression') && historical.length >= 2) {
    results.push(linearRegression(historical, periods, confidenceLevel));
  }

  if (methods.includes('hwinters') && historical.length >= 24) {
    results.push(holtWinters(historical, periods, { confidenceLevel }));
  }

  if (results.length === 0) {
    throw new Error('No valid forecasting methods could be applied');
  }

  // Calculate weights (default: equal)
  const finalWeights = weights || Array(results.length).fill(1 / results.length);

  // Combine forecasts
  const combinedForecast: number[] = Array(periods).fill(0);
  const combinedLow: number[] = Array(periods).fill(0);
  const combinedHigh: number[] = Array(periods).fill(0);

  for (let i = 0; i < results.length; i++) {
    const weight = finalWeights[i] || 1 / results.length;
    for (let j = 0; j < periods; j++) {
      combinedForecast[j] += results[i].forecast[j] * weight;
      combinedLow[j] += results[i].confidenceLow[j] * weight;
      combinedHigh[j] += results[i].confidenceHigh[j] * weight;
    }
  }

  // Average metrics
  const avgMape = results.reduce((sum, r) => sum + r.mape, 0) / results.length;
  const avgBias = results.reduce((sum, r) => sum + r.bias, 0) / results.length;

  return {
    forecast: combinedForecast,
    confidenceLow: combinedLow,
    confidenceHigh: combinedHigh,
    mape: avgMape,
    bias: avgBias,
    method: 'ensemble',
  };
}

// ========== SAFETY STOCK CALCULATION ==========

/**
 * Calculates safety stock using z-score method.
 * Safety stock protects against demand variability and lead time uncertainty.
 *
 * Formula: SS = Z * sqrt(LT * variance(D) + D^2 * variance(LT))
 *
 * Where:
 * - Z = z-score for service level
 * - LT = lead time in days
 * - D = average daily demand
 * - variance(D) = variance of daily demand
 * - variance(LT) = variance of lead time
 *
 * @param dailyDemand - Array of daily demand observations
 * @param leadTimeDays - Average lead time in days
 * @param serviceLevel - Service level (0-1, e.g., 0.95 for 95%)
 * @param leadTimeVariancePercent - Lead time variability as % of average (default 10%)
 * @returns Safety stock quantity
 */
export function calculateSafetyStock(
  dailyDemand: number[],
  leadTimeDays: number,
  serviceLevel: number = 0.95,
  leadTimeVariancePercent: number = 10
): number {
  if (dailyDemand.length === 0) {
    return 0;
  }

  // Get z-score for service level
  const zScore = getZScore(serviceLevel);

  // Calculate mean and variance of demand
  const meanDemand = dailyDemand.reduce((a, b) => a + b, 0) / dailyDemand.length;
  const variance =
    dailyDemand.reduce((sum, d) => sum + Math.pow(d - meanDemand, 2), 0) / dailyDemand.length;

  // Lead time variance
  const ltVariance = Math.pow(meanDemand * (leadTimeVariancePercent / 100), 2);

  // Safety stock formula
  const safetyStock = zScore * Math.sqrt(leadTimeDays * variance + Math.pow(meanDemand, 2) * ltVariance);

  return Math.ceil(safetyStock);
}

// ========== REORDER POINT CALCULATION ==========

/**
 * Calculates reorder point - inventory level at which to place new order.
 *
 * Formula: ROP = (Average Daily Demand × Lead Time Days) + Safety Stock
 *
 * @param avgDailyDemand - Average daily demand
 * @param leadTimeDays - Lead time in days
 * @param safetyStock - Safety stock quantity
 * @returns Reorder point quantity
 */
export function calculateReorderPoint(
  avgDailyDemand: number,
  leadTimeDays: number,
  safetyStock: number
): number {
  return Math.ceil(avgDailyDemand * leadTimeDays + safetyStock);
}

/**
 * Calculates economic order quantity using EOQ formula.
 *
 * Formula: EOQ = sqrt(2DS/H)
 *
 * Where:
 * - D = annual demand
 * - S = cost per order
 * - H = holding cost per unit per year
 *
 * @param annualDemand - Total annual demand
 * @param orderCost - Cost to place one order
 * @param holdingCostPerUnit - Annual holding/storage cost per unit
 * @returns Economical order quantity
 */
export function calculateEOQ(
  annualDemand: number,
  orderCost: number,
  holdingCostPerUnit: number
): number {
  if (holdingCostPerUnit === 0) {
    return Math.ceil(annualDemand); // No holding cost - order all at once
  }

  const eoq = Math.sqrt((2 * annualDemand * orderCost) / holdingCostPerUnit);
  return Math.ceil(eoq);
}

// ========== METRIC CALCULATIONS ==========

/**
 * Calculates Mean Absolute Percentage Error.
 * Measures accuracy of forecast as % of actual values.
 * Lower is better (0% = perfect).
 */
function calculateMAPE(actual: number[], errors: number[]): number {
  if (actual.length === 0) return 0;

  const percentErrors = actual.map((a, i) => {
    if (a === 0) return 0;
    return Math.abs(errors[i] / a) * 100;
  });

  return percentErrors.reduce((a, b) => a + b, 0) / actual.length;
}

/**
 * Calculates forecast bias.
 * Positive = consistent overestimation, Negative = consistent underestimation.
 */
function calculateBias(errors: number[]): number {
  if (errors.length === 0) return 0;
  return (errors.reduce((a, b) => a + b, 0) / errors.length);
}

/**
 * Gets z-score for a given service level.
 * Service level = probability of not stockouting in a given period.
 */
function getZScore(serviceLevel: number): number {
  const zScores: Record<number, number> = {
    0.80: 0.84,
    0.85: 1.04,
    0.90: 1.28,
    0.95: 1.65,
    0.97: 1.88,
    0.99: 2.33,
    0.999: 3.09,
  };

  // Find closest service level
  let closest = 0.90;
  let minDiff = Math.abs(serviceLevel - closest);

  for (const [level, _] of Object.entries(zScores)) {
    const levelNum = parseFloat(level);
    const diff = Math.abs(serviceLevel - levelNum);
    if (diff < minDiff) {
      minDiff = diff;
      closest = levelNum;
    }
  }

  return zScores[closest] || 1.65;
}

/**
 * Validation helper - checks if forecast makes sense.
 */
export function validateForecast(result: ForecastResult): { isValid: boolean; warnings: string[] } {
  const warnings: string[] = [];

  // Check for NaN or Infinity
  if (result.forecast.some(f => !Number.isFinite(f))) {
    return { isValid: false, warnings: ['Forecast contains invalid values (NaN or Infinity)'] };
  }

  // Check MAPE is reasonable
  if (result.mape > 100) {
    warnings.push(`Very high MAPE (${result.mape.toFixed(1)}%) - forecast may be unreliable`);
  }

  // Check for excessive bias
  if (Math.abs(result.bias) > 50) {
    warnings.push(
      result.bias > 0
        ? 'Forecast consistently overestimates (positive bias)'
        : 'Forecast consistently underestimates (negative bias)'
    );
  }

  // Check confidence intervals make sense
  if (result.confidenceLow.some((l, i) => l > result.forecast[i])) {
    warnings.push('Confidence intervals are inverted');
  }

  return {
    isValid: warnings.length === 0,
    warnings,
  };
}
