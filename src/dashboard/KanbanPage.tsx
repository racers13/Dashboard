import { useEffect, useMemo, useState } from 'react'
import type { DashboardAction } from './dashboardReducer'
import { formatMoneyShort } from './filterModel'
import type {
  GlobalFilters,
  KanbanCard,
  KanbanStatus,
  KanbanViewMode,
} from './types'

const DEMO_TODAY = '2024-06-01'

type KanbanPageProps = {
  statuses: KanbanStatus[]
  cards: KanbanCard[]
  filters: GlobalFilters
  focusedStatusId: string
  onAction: (action: DashboardAction) => void
}

function priorityLabel(priority: KanbanCard['priority']): string {
  const map: Record<KanbanCard['priority'], string> = {
    high: 'Высокий',
    medium: 'Средний',
    low: 'Низкий',
  }
  return map[priority]
}

function matchesFilters(card: KanbanCard, filters: GlobalFilters): boolean {
  const regionOk = filters.regions.length === 0 || filters.regions.includes(card.region)
  const clientOk = filters.clients.length === 0 || filters.clients.includes(card.client)
  const categoryOk =
    filters.categories.length === 0 || filters.categories.includes(card.category)
  return regionOk && clientOk && categoryOk
}

function isOverdue(card: KanbanCard): boolean {
  return (
    card.dueDate < DEMO_TODAY &&
    card.statusId !== 'done' &&
    card.statusId !== 'cancelled'
  )
}

function uniqueSorted(values: string[]): string[] {
  return [...new Set(values)].sort((a, b) => a.localeCompare(b, 'ru'))
}

export function KanbanPage({
  statuses,
  cards,
  filters,
  focusedStatusId,
  onAction,
}: KanbanPageProps) {
  const [viewMode, setViewMode] = useState<KanbanViewMode>('departments')
  const [selectedGroup, setSelectedGroup] = useState('all')
  const [activeStatusId, setActiveStatusId] = useState(focusedStatusId || 'all')
  const [dragCardId, setDragCardId] = useState<string | null>(null)
  const [dragOverStatusId, setDragOverStatusId] = useState<string | null>(null)

  useEffect(() => {
    setActiveStatusId(focusedStatusId || 'all')
  }, [focusedStatusId])

  const filteredByGlobal = useMemo(
    () => cards.filter((card) => matchesFilters(card, filters)),
    [cards, filters],
  )

  const groupOptions = useMemo(() => {
    const field = viewMode === 'departments' ? 'department' : 'employee'
    return uniqueSorted(filteredByGlobal.map((card) => card[field]))
  }, [filteredByGlobal, viewMode])

  const visibleCards = useMemo(() => {
    return filteredByGlobal.filter((card) => {
      const groupValue = viewMode === 'departments' ? card.department : card.employee
      const groupOk = selectedGroup === 'all' || groupValue === selectedGroup
      const statusOk = activeStatusId === 'all' || card.statusId === activeStatusId
      return groupOk && statusOk
    })
  }, [activeStatusId, filteredByGlobal, selectedGroup, viewMode])

  const boardStatuses = statuses.filter((status) => status.id !== 'all')
  const visibleStatuses =
    activeStatusId === 'all'
      ? boardStatuses
      : boardStatuses.filter((status) => status.id === activeStatusId)

  const overdueCount = visibleCards.filter(isOverdue).length
  const highPriorityCount = visibleCards.filter((card) => card.priority === 'high').length
  const totalValue = visibleCards.reduce((sum, card) => sum + card.valueM, 0)

  const addStatus = () => {
    const label = window.prompt('Название нового вида задач', 'На согласовании')
    if (label === null) return
    onAction({ type: 'KANBAN_ADD_STATUS', label })
  }

  const renameStatus = (status: KanbanStatus) => {
    const label = window.prompt('Новое название вида задач', status.label)
    if (label === null) return
    onAction({ type: 'KANBAN_RENAME_STATUS', statusId: status.id, label })
  }

  const deleteStatus = (status: KanbanStatus) => {
    if (status.id === 'all') return
    if (!window.confirm(`Удалить вид задач «${status.label}»? Задачи перейдут в работу.`)) {
      return
    }
    onAction({ type: 'KANBAN_DELETE_STATUS', statusId: status.id })
    if (activeStatusId === status.id) setActiveStatusId('all')
  }

  const dropToStatus = (statusId: string) => {
    if (!dragCardId) return
    onAction({ type: 'KANBAN_MOVE_CARD', cardId: dragCardId, statusId })
    setDragCardId(null)
    setDragOverStatusId(null)
  }

  return (
    <div className="kanban-page">
      <section className="card kanban-control-panel">
        <div>
          <h2 className="section-card-h">Контроль задач</h2>
          <p className="section-lead">
            Переключайте управленческий срез между подразделениями и сотрудниками.
          </p>
        </div>
        <div className="kanban-controls">
          <div className="btn-group">
            <button
              type="button"
              className={`btn ${viewMode === 'departments' ? 'primary' : 'secondary'}`}
              onClick={() => {
                setViewMode('departments')
                setSelectedGroup('all')
              }}
            >
              Подразделения
            </button>
            <button
              type="button"
              className={`btn ${viewMode === 'employees' ? 'primary' : 'secondary'}`}
              onClick={() => {
                setViewMode('employees')
                setSelectedGroup('all')
              }}
            >
              Сотрудники
            </button>
          </div>
          <label className="local-filter-label">
            {viewMode === 'departments' ? 'Подразделение' : 'Сотрудник'}
            <select
              value={selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value)}
            >
              <option value="all">
                {viewMode === 'departments' ? 'Все подразделения' : 'Все сотрудники'}
              </option>
              {groupOptions.map((group) => (
                <option key={group} value={group}>
                  {group}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <div className="kanban-status-tabs">
        {statuses.map((status) => (
          <button
            key={status.id}
            type="button"
            className={`kanban-tab ${activeStatusId === status.id ? 'active' : ''}`}
            onClick={() => setActiveStatusId(status.id)}
          >
            {status.label}
            <span>
              {status.id === 'all'
                ? filteredByGlobal.length
                : filteredByGlobal.filter((card) => card.statusId === status.id).length}
            </span>
          </button>
        ))}
      </div>

      <div className="kanban-stats">
        <div className="card kanban-stat">
          <span>Задач в срезе</span>
          <strong>{visibleCards.length}</strong>
        </div>
        <div className="card kanban-stat danger">
          <span>Просрочено</span>
          <strong>{overdueCount}</strong>
        </div>
        <div className="card kanban-stat warn">
          <span>Высокий приоритет</span>
          <strong>{highPriorityCount}</strong>
        </div>
        <div className="card kanban-stat">
          <span>Влияние</span>
          <strong>{formatMoneyShort(totalValue)}</strong>
        </div>
      </div>

      <section className="card kanban-status-editor">
        <div>
          <h2 className="section-card-h">Виды задач</h2>
          <p className="section-lead">
            `Все задачи` всегда остаётся агрегирующим разделом, остальные виды можно
            менять.
          </p>
        </div>
        <div className="kanban-status-list">
          {statuses.map((status) => (
            <div key={status.id} className="kanban-status-row">
              <span className="badge prog">{status.label}</span>
              <button
                type="button"
                className="btn secondary sm"
                onClick={() => renameStatus(status)}
              >
                Переименовать
              </button>
              {status.id !== 'all' && (
                <button
                  type="button"
                  className="btn secondary sm"
                  onClick={() => deleteStatus(status)}
                >
                  Удалить
                </button>
              )}
            </div>
          ))}
          <button type="button" className="btn primary sm" onClick={addStatus}>
            Добавить вид задач
          </button>
        </div>
      </section>

      <div className="kanban-board">
        {visibleStatuses.map((status) => {
          const columnCards = visibleCards.filter((card) => card.statusId === status.id)
          return (
            <section
              key={status.id}
              className={`kanban-column ${dragOverStatusId === status.id ? 'drag-over' : ''}`}
              onDragOver={(e) => {
                e.preventDefault()
                setDragOverStatusId(status.id)
              }}
              onDragLeave={() => setDragOverStatusId(null)}
              onDrop={() => dropToStatus(status.id)}
            >
              <header className="kanban-column-head">
                <h3>{status.label}</h3>
                <span>{columnCards.length}</span>
              </header>
              <div className="kanban-column-body">
                {columnCards.length === 0 ? (
                  <div className="kanban-empty">Нет задач в этом статусе</div>
                ) : (
                  columnCards.map((card) => (
                    <article
                      key={card.id}
                      className={`kanban-card ${isOverdue(card) ? 'is-overdue' : ''}`}
                      draggable
                      onDragStart={() => setDragCardId(card.id)}
                      onDragEnd={() => {
                        setDragCardId(null)
                        setDragOverStatusId(null)
                      }}
                    >
                      <div className="kanban-card-top">
                        <strong>{card.title}</strong>
                        <span className={`badge priority-${card.priority}`}>
                          {priorityLabel(card.priority)}
                        </span>
                      </div>
                      <div className="kanban-card-meta">
                        <span>{card.department}</span>
                        <span>{card.employee}</span>
                        <span>{card.client}</span>
                        <span>{formatMoneyShort(card.valueM)}</span>
                      </div>
                      <div className="kanban-card-foot">
                        <span>Срок: {card.dueDate}</span>
                        {isOverdue(card) && <strong>Просрочено</strong>}
                      </div>
                    </article>
                  ))
                )}
              </div>
            </section>
          )
        })}
      </div>
    </div>
  )
}
