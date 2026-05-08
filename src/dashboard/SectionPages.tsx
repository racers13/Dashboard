import type { ReactNode } from 'react'
import type { DashboardAction } from './dashboardReducer'
import type { DashboardMetrics } from './filterModel'
import { formatMoneyShort } from './filterModel'
import { KanbanPage } from './KanbanPage'
import type { NavPageId } from './navConfig'
import {
  FakeBarChart,
  FakeDonut,
  FakeLineChart,
  KeyMetricsList,
  ProjectsTable,
  TasksPanel,
} from './widgets'
import type { ChartViz, GlobalFilters, KanbanCard, KanbanStatus } from './types'

type SectionProps = {
  metrics: DashboardMetrics
  vizLine: ChartViz
  vizSales: ChartViz
  filters: GlobalFilters
  kanbanStatuses: KanbanStatus[]
  kanbanCards: KanbanCard[]
  kanbanFocusStatusId: string
  onKanbanAction: (action: DashboardAction) => void
}

function Card({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <section className="card section-card">
      <h2 className="section-card-h">{title}</h2>
      {children}
    </section>
  )
}

/** Страницы кроме «Главная»: свой контент, те же глобальные фильтры учтены в metrics */
export function SectionPageContent({
  pageId,
  metrics,
  vizLine,
  vizSales,
  filters,
  kanbanStatuses,
  kanbanCards,
  kanbanFocusStatusId,
  onKanbanAction,
}: SectionProps & { pageId: NavPageId }) {
  switch (pageId) {
    case 'finance':
      return (
        <div className="section-grid cols-2">
          <Card title="Сводка">
            <ul className="section-kpi-list">
              <li>
                <span>Выручка</span>
                <strong>{formatMoneyShort(metrics.revenueM)}</strong>
              </li>
              <li>
                <span>Прибыль</span>
                <strong>{formatMoneyShort(metrics.profitM)}</strong>
              </li>
              <li>
                <span>Опер. прибыль</span>
                <strong>{formatMoneyShort(metrics.operatingM)}</strong>
              </li>
              <li>
                <span>Денежный поток</span>
                <strong>{formatMoneyShort(metrics.cashFlowM)}</strong>
              </li>
            </ul>
          </Card>
          <Card title="Структура выручки">
            <FakeDonut metrics={metrics} />
          </Card>
          <Card title="Ключевые метрики">
            <KeyMetricsList metrics={metrics} />
          </Card>
          <Card title="Динамика (обзор)">
            <FakeLineChart viz={vizLine} revenueScale={metrics.revenueScale} />
          </Card>
        </div>
      )
    case 'sales':
      return (
        <div className="section-grid cols-2">
          <Card title="Продажи по месяцам">
            <FakeBarChart viz={vizSales} revenueScale={metrics.revenueScale} />
            <p className="section-cap">
              Итого за период: <strong>{formatMoneyShort(metrics.salesM)}</strong>
            </p>
          </Card>
          <Card title="Структура по продуктам">
            <FakeDonut metrics={metrics} />
          </Card>
          <Card title="Динамика выручки">
            <FakeLineChart viz={vizLine} revenueScale={metrics.revenueScale} />
          </Card>
        </div>
      )
    case 'clients':
      return (
        <div className="section-grid cols-2">
          <Card title="Клиентские метрики">
            <KeyMetricsList metrics={metrics} />
          </Card>
          <Card title="Выручка по выбранным фильтрам">
            <p className="section-lead">
              Суммарная выручка по текущему срезу:{' '}
              <strong>{formatMoneyShort(metrics.revenueM)}</strong>
            </p>
            <FakeDonut metrics={metrics} />
          </Card>
        </div>
      )
    case 'operations':
      return (
        <div className="section-grid cols-2">
          <Card title="Операционная нагрузка (демо)">
            <FakeBarChart viz="bar" revenueScale={metrics.revenueScale} />
          </Card>
          <Card title="Задачи и риски">
            <TasksPanel />
          </Card>
        </div>
      )
    case 'hr':
      return (
        <div className="section-grid cols-3">
          <Card title="Численность">
            <p className="section-big">428</p>
            <p className="muted small">сотрудников · демо</p>
          </Card>
          <Card title="Текучесть, %">
            <p className="section-big">8,2%</p>
            <p className="muted small">скользящие 12 мес.</p>
          </Card>
          <Card title="ФОТ / выручка">
            <p className="section-big">{(18.4 * metrics.revenueScale).toFixed(1)}%</p>
            <p className="muted small">зависит от масштаба выручки в фильтре</p>
          </Card>
        </div>
      )
    case 'projects':
      return (
        <div className="section-grid one">
          <Card title="Портфель проектов">
            <ProjectsTable metrics={metrics} />
          </Card>
        </div>
      )
    case 'kanban':
      return (
        <KanbanPage
          statuses={kanbanStatuses}
          cards={kanbanCards}
          filters={filters}
          focusedStatusId={kanbanFocusStatusId}
          onAction={onKanbanAction}
        />
      )
    case 'analytics':
      return (
        <div className="section-grid cols-2">
          <Card title="Сравнение периодов">
            <FakeLineChart viz="area" revenueScale={metrics.revenueScale} />
          </Card>
          <Card title="Распределение">
            <FakeDonut metrics={metrics} />
          </Card>
        </div>
      )
    case 'reports':
      return (
        <div className="section-grid one">
          <Card title="Доступные отчёты">
            <ul className="reports-list">
              {[
                'Управленческий P&L (месяц)',
                'Продажи по регионам',
                'Дебиторка и кассовые разрывы',
                'План-факт по проектам',
                'Выгрузка в Excel (все метрики)',
              ].map((name) => (
                <li key={name} className="reports-row">
                  <span>{name}</span>
                  <button type="button" className="btn secondary sm">
                    Сформировать
                  </button>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      )
    case 'notifications':
      return (
        <div className="section-grid one">
          <Card title="Все уведомления">
            <TasksPanel />
            <ul className="tasks-list" style={{ marginTop: 12 }}>
              <li className="task info">
                <span className="task-ico">✓</span>
                Согласован отчёт по СПб за май
              </li>
              <li className="task warn">
                <span className="task-ico">!</span>
                Проверка лимитов по Экспорту
              </li>
            </ul>
          </Card>
        </div>
      )
    case 'settings':
      return (
        <div className="section-grid cols-2">
          <Card title="Профиль">
            <p className="section-lead">
              Алексей К., генеральный директор. Email и OTP настраиваются в
              продуктовой версии.
            </p>
          </Card>
          <Card title="Отображение">
            <p className="section-lead">
              Тема, плотность сетки и язык — заглушка прототипа. Раздел «Главная»
              содержит настройку вида дэшборда (профили и layout).
            </p>
          </Card>
        </div>
      )
    case 'home':
      return null
    default:
      return null
  }
}

/** Показывать ли панель фильтров / профилей как на главной */
export function showFullDashboardChrome(pageId: NavPageId): boolean {
  return pageId === 'home'
}
