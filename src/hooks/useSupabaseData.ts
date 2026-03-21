'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import {
  transformTruck,
  transformDock,
  transformYardException,
  transformCameraEvent,
  transformBillOfLading,
  transformCustomer,
  transformProduct,
  transformInventorySignal,
  transformIngestionJob,
  transformForecast,
  transformReplenishment,
  transformPlanningException,
  buildYardMetrics,
  buildDemandMetrics,
} from '@/lib/transforms'
import type {
  Truck,
  Dock,
  YardException,
  YardMetrics,
  GateEvent,
  BillOfLading,
  Customer,
  SKU,
  InventorySignal,
  DataIngestionJob,
  ForecastRecord,
  ReplenishmentRecommendation,
  PlanningException,
  DemandPlanningMetrics,
} from '@/lib/types'
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
} from '@/lib/database.types'

// Generic hook for Supabase queries
function useSupabaseQuery<TDb, TFrontend>(
  tableName: string,
  transform: (db: TDb) => TFrontend,
  options?: {
    orderBy?: string
    ascending?: boolean
    limit?: number
    filters?: Record<string, string | number | boolean | null>
    select?: string
  }
): { data: TFrontend[]; loading: boolean; error: string | null; refetch: () => void } {
  const [data, setData] = useState<TFrontend[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(async () => {
    try {
      setLoading(true)
      let query = supabase.from(tableName).select(options?.select || '*')

      if (options?.filters) {
        Object.entries(options.filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            query = query.eq(key, value)
          }
        })
      }

      if (options?.orderBy) {
        query = query.order(options.orderBy, { ascending: options.ascending ?? false })
      }

      if (options?.limit) {
        query = query.limit(options.limit)
      }

      const { data: result, error: err } = await query

      if (err) {
        console.error(`Error fetching ${tableName}:`, err)
        setError(err.message)
        setData([])
      } else {
        setData((result as TDb[] || []).map(transform))
        setError(null)
      }
    } catch (e) {
      console.error(`Error in useSupabaseQuery(${tableName}):`, e)
      setError(e instanceof Error ? e.message : 'Unknown error')
      setData([])
    } finally {
      setLoading(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tableName])

  useEffect(() => {
    fetch()
  }, [fetch])

  return { data, loading, error, refetch: fetch }
}

// ========== YARD MANAGEMENT HOOKS ==========

export function useTrucks(limit = 100) {
  return useSupabaseQuery<DbTruck, Truck>('trucks', transformTruck, {
    orderBy: 'priority_score',
    ascending: false,
    limit,
    select: '*, carriers(name)',
  })
}

export function useDocks(limit = 50) {
  return useSupabaseQuery<DbDock, Dock>('docks', transformDock, {
    orderBy: 'dock_number',
    ascending: true,
    limit,
  })
}

export function useYardExceptions(limit = 50) {
  return useSupabaseQuery<DbYardException, YardException>('yard_exceptions', transformYardException, {
    orderBy: 'created_at',
    ascending: false,
    limit,
  })
}

export function useCameraEvents(limit = 20) {
  return useSupabaseQuery<DbCameraEvent, GateEvent>('camera_events', transformCameraEvent, {
    orderBy: 'captured_at',
    ascending: false,
    limit,
  })
}

export function useBillsOfLading(limit = 50) {
  return useSupabaseQuery<DbBillOfLading, BillOfLading>('bills_of_lading', transformBillOfLading, {
    orderBy: 'created_at',
    ascending: false,
    limit,
  })
}

export function useYardDashboard() {
  const { data: trucks, loading: trucksLoading } = useTrucks(100)
  const { data: docks, loading: docksLoading } = useDocks(50)
  const { data: exceptions, loading: exceptionsLoading } = useYardExceptions(50)

  const loading = trucksLoading || docksLoading || exceptionsLoading
  const metrics: YardMetrics | null = !loading ? buildYardMetrics(trucks, docks, exceptions) : null

  // Generate throughput data from trucks
  const throughputData = !loading ? generateThroughputFromTrucks(trucks) : []
  const dwellTimeData = !loading ? generateDwellDistribution(trucks) : []

  return { trucks, docks, exceptions, metrics, loading, throughputData, dwellTimeData }
}

// ========== DEMAND PLANNING HOOKS ==========

export function useCustomers(limit = 50) {
  return useSupabaseQuery<DbCustomer, Customer>('customers', transformCustomer, {
    orderBy: 'name',
    ascending: true,
    limit,
  })
}

export function useProducts(limit = 50) {
  return useSupabaseQuery<DbProduct, SKU>('products', transformProduct, {
    orderBy: 'sku',
    ascending: true,
    limit,
  })
}

export function useInventorySignals(limit = 100) {
  return useSupabaseQuery<DbInventorySignal, InventorySignal>('inventory_signals', transformInventorySignal, {
    orderBy: 'report_date',
    ascending: false,
    limit,
  })
}

export function useIngestionJobs(limit = 50) {
  return useSupabaseQuery<DbIngestionJob, DataIngestionJob>('ingestion_jobs', transformIngestionJob, {
    orderBy: 'created_at',
    ascending: false,
    limit,
  })
}

export function useForecasts(limit = 200) {
  return useSupabaseQuery<DbForecast, ForecastRecord>('forecasts', transformForecast, {
    orderBy: 'forecast_date',
    ascending: false,
    limit,
  })
}

export function useReplenishments(limit = 100) {
  return useSupabaseQuery<DbReplenishment, ReplenishmentRecommendation>('replenishments', transformReplenishment, {
    orderBy: 'urgency',
    ascending: false,
    limit,
  })
}

export function usePlanningExceptions(limit = 50) {
  return useSupabaseQuery<DbPlanningException, PlanningException>('planning_exceptions', transformPlanningException, {
    orderBy: 'created_at',
    ascending: false,
    limit,
  })
}

export function usePlanningDashboard() {
  const { data: forecasts, loading: forecastsLoading } = useForecasts(200)
  const { data: replenishments, loading: repsLoading } = useReplenishments(100)
  const { data: exceptions, loading: exceptionsLoading } = usePlanningExceptions(50)
  const { data: customers, loading: customersLoading } = useCustomers(50)
  const { data: signals, loading: signalsLoading } = useInventorySignals(100)

  const loading = forecastsLoading || repsLoading || exceptionsLoading || customersLoading || signalsLoading
  const metrics: DemandPlanningMetrics | null = !loading
    ? buildDemandMetrics(forecasts, replenishments, exceptions, customers, signals)
    : null

  return { forecasts, replenishments, exceptions, customers, signals, metrics, loading }
}

// ========== HELPER FUNCTIONS ==========

function generateThroughputFromTrucks(trucks: Truck[]) {
  const hours: Record<string, { trucks: number; onTime: number }> = {}

  for (let i = 23; i >= 0; i--) {
    const hour = new Date()
    hour.setHours(hour.getHours() - i)
    const key = hour.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    hours[key] = { trucks: 0, onTime: 0 }
  }

  trucks.forEach(t => {
    const arrivalHour = new Date(t.arrivalTime)
    const key = arrivalHour.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    if (hours[key]) {
      hours[key].trucks++
      if (t.dwellTime <= 240) hours[key].onTime++
    }
  })

  return Object.entries(hours).map(([time, data]) => ({
    time,
    trucks: data.trucks,
    onTime: data.onTime,
  }))
}

function generateDwellDistribution(trucks: Truck[]) {
  const ranges = [
    { range: '0-60m', min: 0, max: 60 },
    { range: '60-120m', min: 60, max: 120 },
    { range: '120-180m', min: 120, max: 180 },
    { range: '180-240m', min: 180, max: 240 },
    { range: '240-360m', min: 240, max: 360 },
    { range: '360m+', min: 360, max: Infinity },
  ]

  return ranges.map(r => ({
    range: r.range,
    count: trucks.filter(t => t.dwellTime >= r.min && t.dwellTime < r.max).length,
  }))
}
