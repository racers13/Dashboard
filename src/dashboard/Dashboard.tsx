import { useCallback, useEffect, useReducer, useRef, useState } from 'react'
import {
  dashboardReducer,
  persistSlice,
  type DashboardAction,
  type DashboardState,
} from './dashboardReducer'
import { buildInitialState } from './buildInitialState'
import type {
  BlockKind,
  BlockLayout,
  ChartViz,
  GlobalFilters,
  KanbanCard,
  KanbanStatus,
} from './types'
import {
  CATEGORY_OPTIONS,
  CLIENT_OPTIONS,
  REGION_OPTIONS,
  SALES_LOCAL_OPTIONS,
} from './constants'
import {
  FakeBarChart,
  FakeDonut,
  FakeLineChart,
  KeyMetricsList,
  KpiRow,
  ProjectsTable,
  TasksPanel,
} from './widgets'
import { computeDashboardMetrics, formatMoneyShort } from './filterModel'
import {
  PAGE_HEAD,
  PRIMARY_NAV,
  SECONDARY_NAV,
  type NavPageId,
} from './navConfig'
import { SectionPageContent, showFullDashboardChrome } from './SectionPages'
import './dashboard.css'

function useClickOutside(
  ref: React.RefObject<HTMLElement | null>,
  onOutside: () => void,
) {
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (!ref.current || ref.current.contains(e.target as Node)) return
      onOutside()
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [ref, onOutside])
}

function MultiFilterDropdown({
  label,
  options,
  selected,
  onChange,
  disabled,
}: {
  label: string
  options: string[]
  selected: string[]
  onChange: (next: string[]) => void
  disabled?: boolean
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useClickOutside(ref, () => setOpen(false))

  const toggle = (v: string) => {
    if (selected.includes(v)) onChange(selected.filter((x) => x !== v))
    else onChange([...selected, v])
  }

  const summary =
    selected.length === 0
      ? 'Все'
      : selected.length === 1
        ? selected[0]
        : `${selected[0]} +${selected.length - 1}`

  return (
    <div className={`filter-dd ${open ? 'open' : ''}`} ref={ref}>
      <button
        type="button"
        className="filter-dd-btn"
        disabled={disabled}
        onClick={() => !disabled && setOpen((o) => !o)}
      >
        <span className="filter-dd-label">{label}</span>
        <span className="filter-dd-value">{summary}</span>
        <span className="chev" aria-hidden>
          ▾
        </span>
      </button>
      {open && (
        <div className="filter-dd-panel" role="listbox">
          {options.map((opt) => (
            <label key={opt} className="filter-check">
              <input
                type="checkbox"
                checked={selected.includes(opt)}
                onChange={() => toggle(opt)}
              />
              {opt}
            </label>
          ))}
        </div>
      )}
    </div>
  )
}

function blockTitle(kind: BlockKind): string {
  const map: Record<BlockKind, string> = {
    kpis: 'Ключевые показатели',
    revenue_line: 'Динамика выручки',
    revenue_donut: 'Структура выручки',
    sales_bar: 'Продажи',
    key_metrics: 'Ключевые метрики',
    tasks: 'Задачи и уведомления',
    projects: 'Последние проекты',
    kanban_summary: 'Доска задач',
  }
  return map[kind]
}

const DEMO_TODAY = '2024-06-01'

function isKanbanCardOverdue(card: KanbanCard): boolean {
  return (
    card.dueDate < DEMO_TODAY &&
    card.statusId !== 'done' &&
    card.statusId !== 'cancelled'
  )
}

function cardsForPanel(cards: KanbanCard[], statusId: string): KanbanCard[] {
  return statusId === 'all' ? cards : cards.filter((card) => card.statusId === statusId)
}

function KanbanSummaryBlock({
  statuses,
  cards,
  panelIds,
  editable,
  onOpenStatus,
  onAction,
}: {
  statuses: KanbanStatus[]
  cards: KanbanCard[]
  panelIds: string[]
  editable: boolean
  onOpenStatus: (statusId: string) => void
  onAction: (action: DashboardAction) => void
}) {
  const visibleStatuses = panelIds
    .map((id) => statuses.find((status) => status.id === id))
    .filter((status): status is KanbanStatus => Boolean(status))

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

  return (
    <div className="kanban-summary">
      <div className="kanban-summary-grid">
        {visibleStatuses.map((status) => {
          const scopedCards = cardsForPanel(cards, status.id)
          const overdue = scopedCards.filter(isKanbanCardOverdue).length
          const valueM = scopedCards.reduce((sum, card) => sum + card.valueM, 0)
          return (
            <button
              key={status.id}
              type="button"
              className="kanban-summary-tile"
              onClick={() => onOpenStatus(status.id)}
            >
              <span>{status.label}</span>
              <strong>{scopedCards.length}</strong>
              <small>
                {overdue > 0
                  ? `Просрочено: ${overdue}`
                  : `Влияние: ${formatMoneyShort(valueM)}`}
              </small>
            </button>
          )
        })}
      </div>
      {editable && (
        <div className="kanban-summary-editor">
          <div className="kanban-summary-editor-head">
            <span className="muted small">Настройка панелей блока</span>
            <button type="button" className="btn primary sm" onClick={addStatus}>
              Добавить вид
            </button>
          </div>
          <div className="kanban-summary-editor-list">
            {statuses.map((status) => {
              const checked = panelIds.includes(status.id)
              return (
                <div key={status.id} className="kanban-summary-editor-row">
                  <label className="filter-check">
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={status.id === 'all'}
                      onChange={() =>
                        onAction({
                          type: 'KANBAN_TOGGLE_SUMMARY_PANEL',
                          statusId: status.id,
                        })
                      }
                    />
                    {status.label}
                  </label>
                  <button
                    type="button"
                    className="btn secondary sm"
                    onClick={() => renameStatus(status)}
                  >
                    Переименовать
                  </button>
                </div>
              )
            })}
          </div>
          <p className="muted small">
            `Все задачи` можно переименовать, но нельзя убрать из блока.
          </p>
        </div>
      )}
    </div>
  )
}

function chartVizFor(
  state: DashboardState,
  kind: BlockKind,
  fallback: ChartViz,
): ChartViz {
  const o = state.vizOverrides[kind]
  return o ?? fallback
}

export default function Dashboard() {
  const [state, dispatch] = useReducer(
    dashboardReducer,
    undefined,
    buildInitialState,
  )
  const [dragId, setDragId] = useState<string | null>(null)
  const [activePage, setActivePage] = useState<NavPageId>('home')
  const [kanbanFocusStatusId, setKanbanFocusStatusId] = useState('all')

  useEffect(() => {
    persistSlice(state)
  }, [
    state.profiles,
    state.activeProfileId,
    state.kanbanStatuses,
    state.kanbanCards,
    state.kanbanSummaryPanels,
  ])

  const act = useCallback((a: DashboardAction) => dispatch(a), [])

  const metrics = computeDashboardMetrics(state.filters, state.salesLocalFilter)
  const filterDisabled = state.uiMode === 'admin_edit'

  const setFilters = (patch: Partial<GlobalFilters>) => {
    act({
      type: 'SET_FILTERS',
      filters: { ...state.filters, ...patch },
    })
  }

  const canCustomize = state.role === 'user' || state.role === 'admin'
  const canAdminEdit = state.role === 'admin'

  const onDragStart = (e: React.DragEvent, id: string) => {
    if (state.uiMode !== 'customize' && state.uiMode !== 'admin_edit') {
      e.preventDefault()
      return
    }
    e.dataTransfer.setData('text/plain', id)
    e.dataTransfer.effectAllowed = 'move'
    setDragId(id)
  }
  const onDragEnd = () => setDragId(null)

  const onDragOver = (e: React.DragEvent) => {
    if (state.uiMode === 'customize' || state.uiMode === 'admin_edit') {
      e.preventDefault()
      e.dataTransfer.dropEffect = 'move'
    }
  }

  const onDropOn = (e: React.DragEvent, targetId: string) => {
    e.preventDefault()
    const from = e.dataTransfer.getData('text/plain')
    setDragId(null)
    if (!from || from === targetId) return
    act({ type: 'REORDER', fromId: from, toId: targetId })
  }

  const saveAs = () => {
    const name = window.prompt('Название профиля (вида)', 'Мой вид')
    if (name === null) return
    act({ type: 'SAVE_PROFILE', name: name || 'Мой вид' })
  }

  const activeProfile = state.profiles.find((p) => p.id === state.activeProfileId)

  const goPage = (id: NavPageId, kanbanStatusId = 'all') => {
    if (id === 'kanban') setKanbanFocusStatusId(kanbanStatusId)
    setActivePage(id)
    if (id !== 'home') act({ type: 'SET_UI_MODE', mode: 'view' })
  }

  const vizLine = chartVizFor(state, 'revenue_line', 'line')
  const vizSales = chartVizFor(state, 'sales_bar', 'bar')

  const renderBlock = (b: BlockLayout) => {
    if (b.hidden && state.uiMode === 'view') return null

    const chrome =
      state.uiMode === 'customize' ||
      (state.uiMode === 'admin_edit' && canAdminEdit)

    const showGhost = b.hidden && state.uiMode === 'customize'

    const inner = (() => {
      switch (b.kind) {
        case 'kpis':
          return <KpiRow metrics={metrics} />
        case 'revenue_line':
          return <FakeLineChart viz={vizLine} revenueScale={metrics.revenueScale} />
        case 'revenue_donut':
          return <FakeDonut metrics={metrics} />
        case 'sales_bar':
          return (
            <div className="sales-block-inner">
              <div className="local-filter-row">
                <label className="local-filter-label">
                  Фильтр блока (сегмент)
                  <select
                    value={state.salesLocalFilter}
                    onChange={(e) =>
                      act({ type: 'SET_SALES_LOCAL', value: e.target.value })
                    }
                  >
                    {SALES_LOCAL_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </label>
                <span className="muted small">
                  Не влияет на остальные виджеты
                </span>
              </div>
              <FakeBarChart viz={vizSales} revenueScale={metrics.revenueScale} />
              <div className="sales-cap">
                <strong>
                  {metrics.salesBlockM.toFixed(1).replace('.', ',')} млн ₽
                </strong>
                <span className="kpi-delta up">+11,3%</span>
              </div>
            </div>
          )
        case 'key_metrics':
          return <KeyMetricsList metrics={metrics} />
        case 'tasks':
          return <TasksPanel />
        case 'projects':
          return <ProjectsTable metrics={metrics} />
        case 'kanban_summary':
          return (
            <KanbanSummaryBlock
              statuses={state.kanbanStatuses}
              cards={state.kanbanCards}
              panelIds={state.kanbanSummaryPanels}
              editable={chrome}
              onOpenStatus={(statusId) => goPage('kanban', statusId)}
              onAction={act}
            />
          )
        default:
          return null
      }
    })()

    return (
      <div
        key={b.id}
        className={`dash-block ${showGhost ? 'is-hidden-tile' : ''} ${dragId === b.id ? 'is-dragging' : ''}`}
        style={{ gridColumn: `span ${b.span}` }}
        onDragOver={onDragOver}
        onDrop={(e) => onDropOn(e, b.id)}
      >
        <div className="card block-card">
          {chrome && (
            <div className="block-chrome">
              {(state.uiMode === 'customize' || state.uiMode === 'admin_edit') && (
                <span
                  className="drag-h"
                  draggable
                  onDragStart={(e) => onDragStart(e, b.id)}
                  onDragEnd={onDragEnd}
                  title="Перетащить"
                  aria-label="Перетащить блок"
                >
                  ⠿
                </span>
              )}
              <span className="block-title">{blockTitle(b.kind)}</span>
              <div className="chrome-actions">
                {state.uiMode === 'customize' && b.kind !== 'kpis' && (
                  <>
                    <button
                      type="button"
                      className="icon-btn"
                      title="Ширина колонок"
                      onClick={() => act({ type: 'CYCLE_SPAN', id: b.id })}
                    >
                      ⇔
                    </button>
                    <button
                      type="button"
                      className="icon-btn"
                      title={b.hidden ? 'Показать' : 'Скрыть'}
                      onClick={() => act({ type: 'TOGGLE_HIDDEN', id: b.id })}
                    >
                      {b.hidden ? '👁' : '🚫'}
                    </button>
                  </>
                )}
                {state.uiMode === 'admin_edit' && canAdminEdit && (
                  <>
                    {(b.kind === 'revenue_line' || b.kind === 'sales_bar') && (
                      <select
                        className="mini-select"
                        value={chartVizFor(
                          state,
                          b.kind,
                          b.kind === 'revenue_line' ? 'line' : 'bar',
                        )}
                        onChange={(e) =>
                          act({
                            type: 'ADMIN_SET_VIZ',
                            kind: b.kind,
                            viz: e.target.value as ChartViz,
                          })
                        }
                      >
                        <option value="line">Линия</option>
                        <option value="bar">Столбцы</option>
                        <option value="area">Область</option>
                      </select>
                    )}
                    <button
                      type="button"
                      className="icon-btn danger"
                      title="Удалить с страницы"
                      onClick={() => act({ type: 'ADMIN_REMOVE_BLOCK', id: b.id })}
                    >
                      ✕
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
          {!chrome && b.kind !== 'kpis' && (
            <div className="block-title-standalone">{blockTitle(b.kind)}</div>
          )}
          {showGhost ? (
            <div className="hidden-placeholder">Скрыто на этом виде</div>
          ) : (
            inner
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="dash-app">
      <aside className="dash-side">
        <div className="side-brand">
          <div className="logo-dot" />
          <div>
            <div className="side-title">Company Dashboard</div>
            <div className="muted tiny">прототип</div>
          </div>
        </div>
        <nav className="side-nav" aria-label="Разделы">
          {PRIMARY_NAV.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`nav-item ${activePage === item.id ? 'active' : ''}`}
              aria-current={activePage === item.id ? 'page' : undefined}
              onClick={() => goPage(item.id)}
            >
              {item.label}
            </button>
          ))}
          {SECONDARY_NAV.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`nav-item ${item.id === 'notifications' ? 'notify' : ''} ${activePage === item.id ? 'active' : ''}`}
              aria-current={activePage === item.id ? 'page' : undefined}
              onClick={() => goPage(item.id)}
            >
              {item.label}
              {item.badge != null ? (
                <span className="badge-num">{item.badge}</span>
              ) : null}
            </button>
          ))}
        </nav>
        <div className="side-user">
          <div className="avatar">AK</div>
          <div>
            <div className="side-name">Алексей К.</div>
            <div className="muted tiny">Генеральный директор</div>
          </div>
        </div>
      </aside>

      <div className="dash-main">
        <header className="dash-top">
          <div>
            <h1 className="welcome">{PAGE_HEAD[activePage].title}</h1>
            <p className="muted sub">{PAGE_HEAD[activePage].subtitle}</p>
          </div>
          <div className="top-actions">
            <label className="demo-role">
              Демо-роль
              <select
                value={state.role}
                onChange={(e) =>
                  act({ type: 'SET_ROLE', role: e.target.value as 'user' | 'admin' })
                }
              >
                <option value="user">Пользователь</option>
                <option value="admin">Администратор</option>
              </select>
            </label>
            <div className="period-pill">
              <span className="muted small">Период</span>
              <strong>01 мая — 31 мая 2024</strong>
            </div>
            <button type="button" className="btn secondary">
              Экспорт
            </button>
          </div>
        </header>

        <div className="toolbar">
          <div className="toolbar-row filters-toolbar">
            <span className="toolbar-label">Фильтры страницы</span>
            <MultiFilterDropdown
              label="Регион"
              options={REGION_OPTIONS}
              selected={state.filters.regions}
              onChange={(regions) => setFilters({ regions })}
              disabled={filterDisabled}
            />
            <MultiFilterDropdown
              label="Клиент"
              options={CLIENT_OPTIONS}
              selected={state.filters.clients}
              onChange={(clients) => setFilters({ clients })}
              disabled={filterDisabled}
            />
            <MultiFilterDropdown
              label="Категория"
              options={CATEGORY_OPTIONS}
              selected={state.filters.categories}
              onChange={(categories) => setFilters({ categories })}
              disabled={filterDisabled}
            />
            {state.uiMode === 'admin_edit' && (
              <span className="hint warn">
                В режиме редактирования глобальные фильтры отключены (демо)
              </span>
            )}
          </div>

          {showFullDashboardChrome(activePage) && (
          <div className="toolbar-row modes-toolbar">
            <div className="profile-cluster">
              <span className="toolbar-label">Мой вид</span>
              <select
                className="profile-select"
                value={state.activeProfileId ?? ''}
                onChange={(e) => {
                  const v = e.target.value
                  act({ type: 'SELECT_PROFILE', profileId: v === '' ? null : v })
                }}
              >
                <option value="">Базовый дэшборд</option>
                {state.profiles.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              {activeProfile && (
                <button
                  type="button"
                  className="btn link-type"
                  onClick={() => {
                    if (window.confirm(`Удалить профиль «${activeProfile.name}»?`))
                      act({ type: 'DELETE_PROFILE', id: activeProfile.id })
                  }}
                >
                  Удалить профиль
                </button>
              )}
            </div>
            <div className="btn-group">
              <button type="button" className="btn primary" onClick={saveAs}>
                Сохранить как мой вид
              </button>
              {activeProfile && (
                <button
                  type="button"
                  className="btn secondary"
                  onClick={() => act({ type: 'UPDATE_ACTIVE_PROFILE' })}
                >
                  Обновить «{activeProfile.name}»
                </button>
              )}
              <button
                type="button"
                className="btn secondary"
                onClick={() => {
                  if (
                    window.confirm(
                      'Сбросить фильтры, расположение и локальный фильтр продаж к базовому?',
                    )
                  )
                    act({ type: 'RESET_BASE' })
                }}
              >
                Сбросить к базовому
              </button>
            </div>
            <div className="btn-group push-right">
              {canCustomize && state.uiMode === 'view' && (
                <button
                  type="button"
                  className="btn secondary"
                  onClick={() => act({ type: 'SET_UI_MODE', mode: 'customize' })}
                >
                  Настроить экран
                </button>
              )}
              {canCustomize && state.uiMode === 'customize' && (
                <button
                  type="button"
                  className="btn primary"
                  onClick={() => act({ type: 'SET_UI_MODE', mode: 'view' })}
                >
                  Готово
                </button>
              )}
              {canAdminEdit && state.uiMode !== 'admin_edit' && (
                <button
                  type="button"
                  className="btn warn"
                  onClick={() => act({ type: 'SET_UI_MODE', mode: 'admin_edit' })}
                >
                  Редактировать дэшборд
                </button>
              )}
              {canAdminEdit && state.uiMode === 'admin_edit' && (
                <button
                  type="button"
                  className="btn primary"
                  onClick={() => act({ type: 'SET_UI_MODE', mode: 'view' })}
                >
                  Выйти из редактирования
                </button>
              )}
            </div>
          </div>
          )}

          {showFullDashboardChrome(activePage) && state.uiMode === 'admin_edit' && canAdminEdit && (
            <div className="toolbar-row admin-bar">
              <span className="toolbar-label">Админ: блоки</span>
              <select id="add-kind" className="profile-select" defaultValue="sales_bar">
                {(
                  [
                    'kpis',
                    'revenue_line',
                    'revenue_donut',
                    'sales_bar',
                    'key_metrics',
                    'tasks',
                    'kanban_summary',
                    'projects',
                  ] as BlockKind[]
                ).map((k) => (
                  <option key={k} value={k}>
                    {blockTitle(k)}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="btn secondary"
                onClick={() => {
                  const sel = document.getElementById('add-kind') as HTMLSelectElement
                  act({ type: 'ADMIN_ADD_BLOCK', kind: sel.value as BlockKind })
                }}
              >
                Добавить блок
              </button>
              <span className="hint">
                Метрики и источники данных — отдельные экраны (не в этом прототипе)
              </span>
            </div>
          )}

          {showFullDashboardChrome(activePage) &&
            (state.uiMode === 'customize' || state.uiMode === 'admin_edit') && (
            <div className="banner soft">
              {state.uiMode === 'customize' && (
                <>
                  Режим настройки: перетаскивайте блоки за ручку ⠿, меняйте ширину и
                  скрывайте виджеты. Это не меняет базовый дэшборд для других
                  пользователей, пока вы не сохраните профиль.
                </>
              )}
              {state.uiMode === 'admin_edit' && (
                <>
                  Админ-режим: тип графика, удаление и добавление блоков. Глобальные
                  фильтры в демо отключены.
                </>
              )}
            </div>
          )}
        </div>

        <main
          className={activePage === 'home' ? 'dash-grid' : 'section-main'}
          id="main-content"
        >
          {activePage === 'home' ? (
            state.blocks.map(renderBlock)
          ) : (
            <SectionPageContent
              pageId={activePage}
              metrics={metrics}
              vizLine={vizLine}
              vizSales={vizSales}
              filters={state.filters}
              kanbanStatuses={state.kanbanStatuses}
              kanbanCards={state.kanbanCards}
              kanbanFocusStatusId={kanbanFocusStatusId}
              onKanbanAction={act}
            />
          )}
        </main>
      </div>

      <span className="dash-wmark dash-wmark--lb" aria-hidden="true">
        made by HIM
      </span>
      <span className="dash-wmark dash-wmark--rb" aria-hidden="true">
        made by HIM
      </span>
    </div>
  )
}
