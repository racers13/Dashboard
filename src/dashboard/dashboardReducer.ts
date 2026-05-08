import type {
  BlockLayout,
  BlockKind,
  GlobalFilters,
  Role,
  SavedProfile,
  UiMode,
  ChartViz,
  BlockVizOverride,
  KanbanCard,
  KanbanStatus,
} from './types'
import {
  BASE_KANBAN_CARDS,
  BASE_KANBAN_STATUSES,
  BASE_KANBAN_SUMMARY_PANELS,
  BASE_BLOCKS,
  DEFAULT_FILTERS,
  STORAGE_KEY,
} from './constants'

export type DashboardState = {
  role: Role
  uiMode: UiMode
  activeProfileId: string | null
  profiles: SavedProfile[]
  filters: GlobalFilters
  salesLocalFilter: string
  blocks: BlockLayout[]
  /** Админ: визуальный тип графика для блоков (демо) */
  vizOverrides: BlockVizOverride
  kanbanStatuses: KanbanStatus[]
  kanbanCards: KanbanCard[]
  kanbanSummaryPanels: string[]
}

export const initialDashboardState: DashboardState = {
  role: 'user',
  uiMode: 'view',
  activeProfileId: null,
  profiles: [],
  filters: { ...DEFAULT_FILTERS },
  salesLocalFilter: 'all',
  blocks: BASE_BLOCKS.map((b) => ({ ...b })),
  vizOverrides: {},
  kanbanStatuses: BASE_KANBAN_STATUSES.map((s) => ({ ...s })),
  kanbanCards: BASE_KANBAN_CARDS.map((c) => ({ ...c })),
  kanbanSummaryPanels: [...BASE_KANBAN_SUMMARY_PANELS],
}

function cloneBlocks(blocks: BlockLayout[]): BlockLayout[] {
  return blocks.map((b) => ({ ...b }))
}

function cloneFilters(f: GlobalFilters): GlobalFilters {
  return {
    regions: [...f.regions],
    clients: [...f.clients],
    categories: [...f.categories],
  }
}

function cloneStatuses(statuses: KanbanStatus[]): KanbanStatus[] {
  return statuses.map((s) => ({ ...s }))
}

function cloneCards(cards: KanbanCard[]): KanbanCard[] {
  return cards.map((c) => ({ ...c }))
}

function normalizeSummaryPanels(panels: string[], statuses: KanbanStatus[]): string[] {
  const existing = new Set(statuses.map((s) => s.id))
  const next = panels.filter((id, idx) => existing.has(id) && panels.indexOf(id) === idx)
  if (!next.includes('all')) next.unshift('all')
  return next
}

function makeStatusId(label: string): string {
  const suffix = label
    .toLowerCase()
    .replace(/[^a-zа-яё0-9]+/gi, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 24)
  return `custom-${suffix || Date.now()}-${Math.random().toString(36).slice(2, 6)}`
}

export type DashboardAction =
  | { type: 'SET_ROLE'; role: Role }
  | { type: 'SET_UI_MODE'; mode: UiMode }
  | { type: 'SET_FILTERS'; filters: GlobalFilters }
  | { type: 'SET_SALES_LOCAL'; value: string }
  | { type: 'REORDER'; fromId: string; toId: string }
  | { type: 'TOGGLE_HIDDEN'; id: string }
  | { type: 'CYCLE_SPAN'; id: string }
  | { type: 'SELECT_PROFILE'; profileId: string | null }
  | { type: 'SAVE_PROFILE'; name: string }
  | { type: 'UPDATE_ACTIVE_PROFILE' }
  | { type: 'DELETE_PROFILE'; id: string }
  | { type: 'RESET_BASE' }
  | { type: 'ADMIN_REMOVE_BLOCK'; id: string }
  | { type: 'ADMIN_ADD_BLOCK'; kind: BlockKind }
  | { type: 'ADMIN_SET_VIZ'; kind: BlockKind; viz: ChartViz }
  | { type: 'KANBAN_MOVE_CARD'; cardId: string; statusId: string }
  | { type: 'KANBAN_RENAME_STATUS'; statusId: string; label: string }
  | { type: 'KANBAN_ADD_STATUS'; label: string }
  | { type: 'KANBAN_DELETE_STATUS'; statusId: string }
  | { type: 'KANBAN_TOGGLE_SUMMARY_PANEL'; statusId: string }
  | { type: 'HYDRATE'; payload: Partial<DashboardState> }

const SPAN_CYCLE: BlockLayout['span'][] = [4, 6, 8, 12]

function nextSpan(current: BlockLayout['span']): BlockLayout['span'] {
  const i = SPAN_CYCLE.indexOf(current)
  return SPAN_CYCLE[(i + 1) % SPAN_CYCLE.length]
}

function applyProfile(state: DashboardState, profile: SavedProfile): DashboardState {
  return {
    ...state,
    activeProfileId: profile.id,
    filters: cloneFilters(profile.filters),
    blocks: cloneBlocks(profile.blocks),
    salesLocalFilter: profile.salesLocalFilter,
  }
}

export function dashboardReducer(
  state: DashboardState,
  action: DashboardAction,
): DashboardState {
  switch (action.type) {
    case 'SET_ROLE': {
      const role = action.role
      let uiMode = state.uiMode
      if (role === 'user' && uiMode === 'admin_edit') uiMode = 'view'
      return { ...state, role, uiMode }
    }
    case 'SET_UI_MODE':
      return { ...state, uiMode: action.mode }
    case 'SET_FILTERS':
      return { ...state, filters: cloneFilters(action.filters) }
    case 'SET_SALES_LOCAL':
      return { ...state, salesLocalFilter: action.value }
    case 'REORDER': {
      const { fromId, toId } = action
      if (fromId === toId) return state
      const blocks = [...state.blocks]
      const fi = blocks.findIndex((b) => b.id === fromId)
      const ti = blocks.findIndex((b) => b.id === toId)
      if (fi < 0 || ti < 0) return state
      const [removed] = blocks.splice(fi, 1)
      const newTi = blocks.findIndex((b) => b.id === toId)
      blocks.splice(newTi, 0, removed)
      return { ...state, blocks }
    }
    case 'TOGGLE_HIDDEN': {
      return {
        ...state,
        blocks: state.blocks.map((b) =>
          b.id === action.id ? { ...b, hidden: !b.hidden } : b,
        ),
      }
    }
    case 'CYCLE_SPAN': {
      return {
        ...state,
        blocks: state.blocks.map((b) =>
          b.id === action.id ? { ...b, span: nextSpan(b.span) } : b,
        ),
      }
    }
    case 'SELECT_PROFILE': {
      if (action.profileId === null) {
        return {
          ...state,
          activeProfileId: null,
          filters: { ...DEFAULT_FILTERS },
          blocks: BASE_BLOCKS.map((b) => ({ ...b })),
          salesLocalFilter: 'all',
        }
      }
      const p = state.profiles.find((x) => x.id === action.profileId)
      if (!p) return state
      return applyProfile(state, p)
    }
    case 'SAVE_PROFILE': {
      const name = action.name.trim()
      if (!name) return state
      const snapshot: SavedProfile = {
        id: `p-${Date.now()}`,
        name,
        filters: cloneFilters(state.filters),
        blocks: cloneBlocks(state.blocks),
        salesLocalFilter: state.salesLocalFilter,
      }
      return {
        ...state,
        activeProfileId: snapshot.id,
        profiles: [...state.profiles, snapshot],
      }
    }
    case 'UPDATE_ACTIVE_PROFILE': {
      const id = state.activeProfileId
      if (!id) return state
      const idx = state.profiles.findIndex((p) => p.id === id)
      if (idx < 0) return state
      const prev = state.profiles[idx]
      const updated: SavedProfile = {
        ...prev,
        filters: cloneFilters(state.filters),
        blocks: cloneBlocks(state.blocks),
        salesLocalFilter: state.salesLocalFilter,
      }
      const profiles = [...state.profiles]
      profiles[idx] = updated
      return { ...state, profiles }
    }
    case 'DELETE_PROFILE': {
      const profiles = state.profiles.filter((p) => p.id !== action.id)
      if (state.activeProfileId === action.id) {
        return {
          ...state,
          profiles,
          activeProfileId: null,
          filters: { ...DEFAULT_FILTERS },
          blocks: BASE_BLOCKS.map((b) => ({ ...b })),
          salesLocalFilter: 'all',
        }
      }
      return { ...state, profiles }
    }
    case 'RESET_BASE':
      return {
        ...state,
        activeProfileId: null,
        filters: { ...DEFAULT_FILTERS },
        blocks: BASE_BLOCKS.map((b) => ({ ...b })),
        salesLocalFilter: 'all',
        uiMode: 'view',
      }
    case 'ADMIN_REMOVE_BLOCK':
      return {
        ...state,
        blocks: state.blocks.filter((b) => b.id !== action.id),
      }
    case 'ADMIN_ADD_BLOCK': {
      const id = `b-${Math.random().toString(36).slice(2, 9)}`
      const span: BlockLayout['span'] = 6
      const row: BlockLayout = { id, kind: action.kind, hidden: false, span }
      return { ...state, blocks: [...state.blocks, row] }
    }
    case 'ADMIN_SET_VIZ': {
      return {
        ...state,
        vizOverrides: { ...state.vizOverrides, [action.kind]: action.viz },
      }
    }
    case 'KANBAN_MOVE_CARD': {
      if (action.statusId === 'all') return state
      if (!state.kanbanStatuses.some((s) => s.id === action.statusId)) return state
      return {
        ...state,
        kanbanCards: state.kanbanCards.map((c) =>
          c.id === action.cardId ? { ...c, statusId: action.statusId } : c,
        ),
      }
    }
    case 'KANBAN_RENAME_STATUS': {
      const label = action.label.trim()
      if (!label) return state
      return {
        ...state,
        kanbanStatuses: state.kanbanStatuses.map((s) =>
          s.id === action.statusId ? { ...s, label } : s,
        ),
      }
    }
    case 'KANBAN_ADD_STATUS': {
      const label = action.label.trim()
      if (!label) return state
      const status: KanbanStatus = { id: makeStatusId(label), label }
      return {
        ...state,
        kanbanStatuses: [...state.kanbanStatuses, status],
        kanbanSummaryPanels: normalizeSummaryPanels(
          [...state.kanbanSummaryPanels, status.id],
          [...state.kanbanStatuses, status],
        ),
      }
    }
    case 'KANBAN_DELETE_STATUS': {
      if (action.statusId === 'all') return state
      const exists = state.kanbanStatuses.some((s) => s.id === action.statusId)
      if (!exists) return state
      const statuses = state.kanbanStatuses.filter((s) => s.id !== action.statusId)
      const fallback = statuses.some((s) => s.id === 'in_progress')
        ? 'in_progress'
        : statuses.find((s) => s.id !== 'all')?.id
      return {
        ...state,
        kanbanStatuses: statuses,
        kanbanCards: fallback
          ? state.kanbanCards.map((c) =>
              c.statusId === action.statusId ? { ...c, statusId: fallback } : c,
            )
          : state.kanbanCards,
        kanbanSummaryPanels: normalizeSummaryPanels(
          state.kanbanSummaryPanels.filter((id) => id !== action.statusId),
          statuses,
        ),
      }
    }
    case 'KANBAN_TOGGLE_SUMMARY_PANEL': {
      if (!state.kanbanStatuses.some((s) => s.id === action.statusId)) return state
      if (action.statusId === 'all') return state
      const panels = state.kanbanSummaryPanels.includes(action.statusId)
        ? state.kanbanSummaryPanels.filter((id) => id !== action.statusId)
        : [...state.kanbanSummaryPanels, action.statusId]
      return {
        ...state,
        kanbanSummaryPanels: normalizeSummaryPanels(panels, state.kanbanStatuses),
      }
    }
    case 'HYDRATE':
      return {
        ...state,
        ...action.payload,
        blocks: action.payload.blocks ?? state.blocks,
        kanbanStatuses: action.payload.kanbanStatuses
          ? cloneStatuses(action.payload.kanbanStatuses)
          : state.kanbanStatuses,
        kanbanCards: action.payload.kanbanCards
          ? cloneCards(action.payload.kanbanCards)
          : state.kanbanCards,
        kanbanSummaryPanels: action.payload.kanbanSummaryPanels
          ? normalizeSummaryPanels(
              action.payload.kanbanSummaryPanels,
              action.payload.kanbanStatuses ?? state.kanbanStatuses,
            )
          : state.kanbanSummaryPanels,
      }
    default:
      return state
  }
}

export type PersistedShape = {
  profiles: SavedProfile[]
  activeProfileId: string | null
  kanbanStatuses?: KanbanStatus[]
  kanbanCards?: KanbanCard[]
  kanbanSummaryPanels?: string[]
}

export function loadPersisted(): Partial<DashboardState> | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const data = JSON.parse(raw) as PersistedShape
    return {
      profiles: data.profiles ?? [],
      activeProfileId: data.activeProfileId ?? null,
      kanbanStatuses: data.kanbanStatuses
        ? cloneStatuses(data.kanbanStatuses)
        : undefined,
      kanbanCards: data.kanbanCards ? cloneCards(data.kanbanCards) : undefined,
      kanbanSummaryPanels: data.kanbanSummaryPanels
        ? [...data.kanbanSummaryPanels]
        : undefined,
    }
  } catch {
    return null
  }
}

export function persistSlice(state: DashboardState) {
  const payload: PersistedShape = {
    profiles: state.profiles,
    activeProfileId: state.activeProfileId,
    kanbanStatuses: state.kanbanStatuses,
    kanbanCards: state.kanbanCards,
    kanbanSummaryPanels: state.kanbanSummaryPanels,
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
}
