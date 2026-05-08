import type { DashboardState } from './dashboardReducer'
import { initialDashboardState, loadPersisted } from './dashboardReducer'
import type { SavedProfile } from './types'

function cloneSaved(p: SavedProfile): SavedProfile {
  return {
    ...p,
    filters: {
      regions: [...p.filters.regions],
      clients: [...p.filters.clients],
      categories: [...p.filters.categories],
    },
    blocks: p.blocks.map((b) => ({ ...b })),
  }
}

export function buildInitialState(): DashboardState {
  const partial = loadPersisted()
  const profiles = partial?.profiles?.length ? partial.profiles.map(cloneSaved) : []
  let state: DashboardState = {
    ...initialDashboardState,
    profiles,
    kanbanStatuses: partial?.kanbanStatuses
      ? partial.kanbanStatuses.map((s) => ({ ...s }))
      : initialDashboardState.kanbanStatuses.map((s) => ({ ...s })),
    kanbanCards: partial?.kanbanCards
      ? partial.kanbanCards.map((c) => ({ ...c }))
      : initialDashboardState.kanbanCards.map((c) => ({ ...c })),
    kanbanSummaryPanels: partial?.kanbanSummaryPanels
      ? [...partial.kanbanSummaryPanels]
      : [...initialDashboardState.kanbanSummaryPanels],
  }
  const aid = partial?.activeProfileId
  if (aid) {
    const p = profiles.find((x) => x.id === aid)
    if (p) {
      state = {
        ...state,
        activeProfileId: p.id,
        filters: cloneSaved(p).filters,
        blocks: cloneSaved(p).blocks,
        salesLocalFilter: p.salesLocalFilter,
      }
    }
  }
  return state
}
