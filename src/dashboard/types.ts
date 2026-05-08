export type Role = 'user' | 'admin'

export type UiMode = 'view' | 'customize' | 'admin_edit'

export type BlockKind =
  | 'kpis'
  | 'revenue_line'
  | 'revenue_donut'
  | 'sales_bar'
  | 'key_metrics'
  | 'tasks'
  | 'projects'
  | 'kanban_summary'

export type BlockLayout = {
  id: string
  kind: BlockKind
  hidden: boolean
  /** Columns out of 12 */
  span: 4 | 6 | 8 | 12
}

export type GlobalFilters = {
  regions: string[]
  clients: string[]
  categories: string[]
}

export type SavedProfile = {
  id: string
  name: string
  filters: GlobalFilters
  blocks: BlockLayout[]
  salesLocalFilter: string
}

export type ChartViz = 'line' | 'bar' | 'area'

export type BlockVizOverride = Partial<Record<BlockKind, ChartViz>>

export type KanbanViewMode = 'departments' | 'employees'

export type KanbanPriority = 'high' | 'medium' | 'low'

export type KanbanStatus = {
  id: string
  label: string
  locked?: boolean
}

export type KanbanCard = {
  id: string
  title: string
  department: string
  employee: string
  region: string
  client: string
  category: string
  owner: string
  dueDate: string
  priority: KanbanPriority
  statusId: string
  valueM: number
}
