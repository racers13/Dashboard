import type { GlobalFilters } from './types'
import { CATEGORY_OPTIONS } from './constants'

/** Выручка по регионам (млн ₽), в сумме = полный портфель */
export const REGION_REV_MN: Record<string, number> = {
  Москва: 58.2,
  СПб: 27.5,
  Регионы: 24.0,
  Экспорт: 15.7,
}

const FULL_REV_MN = Object.values(REGION_REV_MN).reduce((a, b) => a + b, 0)

/** Доля выручки по категории продукта (сумма = 1) */
export const CATEGORY_SHARE: Record<string, number> = {
  'Продукт A': 0.42,
  'Продукт B': 0.28,
  Услуги: 0.2,
  Прочее: 0.1,
}

/** Доля выручки по клиенту (сумма = 1) */
export const CLIENT_SHARE: Record<string, number> = {
  'Альфа ООО': 0.38,
  Бета: 0.22,
  'Гамма Трейд': 0.18,
  'Ключевые (топ-10)': 0.22,
}

const DONUT_COLORS = ['#2563eb', '#3b82f6', '#60a5fa', '#93c5fd', '#64748b']

/** Локальный фильтр блока «Продажи»: доля от базовых продаж дэшборда */
const SALES_LOCAL_MUL: Record<string, number> = {
  all: 1,
  a: 0.58,
  b: 0.36,
  srv: 0.22,
}

function sumMapKeys(map: Record<string, number>, keys: string[]): number {
  return keys.reduce((s, k) => s + (map[k] ?? 0), 0)
}

export type DonutSlice = { key: string; label: string; pct: number; color: string }

export type DashboardMetrics = {
  revenueM: number
  profitM: number
  operatingM: number
  cashFlowM: number
  /** Базовые продажи (млн) после глобальных фильтров */
  salesM: number
  /** Значение в блоке «Продажи» с учётом локального селекта */
  salesBlockM: number
  donutTotalM: number
  donutSlices: DonutSlice[]
  grossMarginPct: number
  avgCheckRub: number
  retentionPct: number
  conversionPct: number
  nps: number
  /** revenue / полный портфель — для мелких правок графиков */
  revenueScale: number
}

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n))
}

/**
 * Глобальные фильтры: пустой список = «все» (вся компания).
 * Несколько значений в одном измерении — сумма долей (OR).
 */
export function computeDashboardMetrics(
  filters: GlobalFilters,
  salesLocalFilter: string,
): DashboardMetrics {
  const revRegion =
    filters.regions.length === 0
      ? FULL_REV_MN
      : sumMapKeys(REGION_REV_MN, filters.regions)

  const catMul =
    filters.categories.length === 0
      ? 1
      : clamp(sumMapKeys(CATEGORY_SHARE, filters.categories), 0.01, 1.25)

  const cliMul =
    filters.clients.length === 0
      ? 1
      : clamp(sumMapKeys(CLIENT_SHARE, filters.clients), 0.01, 1.2)

  const revenueM = revRegion * catMul * cliMul

  const r0 = FULL_REV_MN
  const revenueScale = revenueM / r0

  const profitM = revenueM * (23.7 / r0)
  const operatingM = revenueM * (19.8 / r0)
  const cashFlowM = revenueM * (15.3 / r0)
  const salesM = revenueM * (98.7 / r0)

  const localMul = SALES_LOCAL_MUL[salesLocalFilter] ?? 1
  const salesBlockM = salesM * localMul

  const donutSlices = buildDonutSlices(filters.categories)
  const donutTotalM = revenueM

  const gmBase = 32.1
  const grossMarginPct = clamp(
    gmBase + (revenueScale - 1) * 4.5 + (filters.regions.includes('Экспорт') ? 1.2 : 0),
    24,
    42,
  )

  const avgCheckRub = Math.round(45600 * (0.88 + revenueScale * 0.14))
  const retentionPct = Math.round(clamp(84 * (0.96 + revenueScale * 0.06), 68, 94))
  const conversionPct = clamp(3.2 * (0.9 + revenueScale * 0.12), 1.8, 5.5)
  const nps = Math.round(clamp(42 + (revenueScale - 1) * 18, 12, 72))

  return {
    revenueM,
    profitM,
    operatingM,
    cashFlowM,
    salesM,
    salesBlockM,
    donutTotalM,
    donutSlices,
    grossMarginPct,
    avgCheckRub,
    retentionPct,
    conversionPct,
    nps,
    revenueScale,
  }
}

function buildDonutSlices(selectedCategories: string[]): DonutSlice[] {
  const keys =
    selectedCategories.length === 0
      ? CATEGORY_OPTIONS
      : CATEGORY_OPTIONS.filter((c) => selectedCategories.includes(c))

  const raw = keys.map((k) => ({ k, w: CATEGORY_SHARE[k] ?? 0 }))
  const sumW = raw.reduce((s, x) => s + x.w, 0) || 1
  const slices = raw.map((x, i) => ({
    key: x.k,
    label: x.k,
    pct: (x.w / sumW) * 100,
    color: DONUT_COLORS[i % DONUT_COLORS.length],
  }))
  const sumP = slices.reduce((s, x) => s + x.pct, 0)
  if (slices.length && Math.abs(sumP - 100) > 0.02) {
    slices[slices.length - 1] = {
      ...slices[slices.length - 1],
      pct: slices[slices.length - 1].pct + (100 - sumP),
    }
  }
  return slices
}

export function formatMoneyShort(millions: number): string {
  return `${millions.toFixed(1).replace('.', ',')} млн ₽`
}
