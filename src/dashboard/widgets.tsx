import type { ChartViz } from './types'
import type { DashboardMetrics, DonutSlice } from './filterModel'
import { formatMoneyShort } from './filterModel'

export { formatMoneyShort } from './filterModel'

export function KpiRow({ metrics }: { metrics: DashboardMetrics }) {
  const items = [
    { label: 'Выручка', value: metrics.revenueM, delta: 14.2 },
    { label: 'Прибыль', value: metrics.profitM, delta: 18.6 },
    { label: 'Опер. прибыль', value: metrics.operatingM, delta: 12.4 },
    { label: 'Денежный поток', value: metrics.cashFlowM, delta: 9.7 },
  ]
  return (
    <div className="kpi-grid">
      {items.map((k) => (
        <div key={k.label} className="card kpi-card">
          <div className="kpi-label">{k.label}</div>
          <div className="kpi-value">{formatMoneyShort(k.value)}</div>
          <div className="kpi-delta up">+{k.delta.toFixed(1)}%</div>
          <div className="kpi-sub">Сравнение с апрелём</div>
        </div>
      ))}
    </div>
  )
}

function conicFromSlices(slices: DonutSlice[]): string {
  if (slices.length === 0) {
    return '#e2e8f0'
  }
  let deg = 0
  const stops: string[] = []
  for (const s of slices) {
    const next = deg + s.pct * 3.6
    stops.push(`${s.color} ${deg}deg ${next}deg`)
    deg = next
  }
  return `conic-gradient(${stops.join(', ')})`
}

export function FakeDonut({ metrics }: { metrics: DashboardMetrics }) {
  const total = metrics.donutTotalM
  const bg = conicFromSlices(metrics.donutSlices)
  return (
    <div className="donut-wrap">
      <div className="donut" style={{ background: bg }}>
        <div className="donut-hole">
          <div className="donut-total">{formatMoneyShort(total)}</div>
          <div className="muted small">всего</div>
        </div>
      </div>
      <ul className="legend">
        {metrics.donutSlices.map((s) => (
          <li key={s.key}>
            <span className="dot" style={{ background: s.color }} />
            {s.label} — {s.pct.toFixed(0)}%
          </li>
        ))}
      </ul>
      <button type="button" className="linkish">
        Смотреть детали
      </button>
    </div>
  )
}

export function FakeLineChart({
  viz,
  revenueScale,
}: {
  viz: ChartViz
  revenueScale: number
}) {
  if (viz === 'bar') {
    return (
      <div className="chart-wrap">
        <FakeBarChart viz="bar" revenueScale={revenueScale} />
        <div className="chart-foot">
          <span className="muted">По дням</span>
          <span className="pill">май 2024</span>
        </div>
      </div>
    )
  }
  const lift = Math.min(18, Math.max(-10, (1 - revenueScale) * 40))
  return (
    <div className="chart-wrap">
      <svg viewBox="0 0 400 140" className="fake-svg" aria-hidden>
        <defs>
          <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(37,99,235,0.35)" />
            <stop offset="100%" stopColor="rgba(37,99,235,0)" />
          </linearGradient>
        </defs>
        {viz === 'area' && (
          <path
            d={`M0,${100 + lift} L40,${95 + lift} L80,${88 + lift} L120,${75 + lift} L160,${70 + lift} L200,${55 + lift} L240,${48 + lift} L280,${42 + lift} L320,${38 + lift} L360,${32 + lift} L400,${28 + lift} L400,140 L0,140 Z`}
            fill="url(#grad)"
          />
        )}
        <path
          d={`M0,${100 + lift} L40,${95 + lift} L80,${88 + lift} L120,${75 + lift} L160,${70 + lift} L200,${55 + lift} L240,${48 + lift} L280,${42 + lift} L320,${38 + lift} L360,${32 + lift} L400,${28 + lift}`}
          fill="none"
          stroke="#2563eb"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </svg>
      <div className="chart-foot">
        <span className="muted">По дням</span>
        <span className="pill">май 2024 · масштаб {(revenueScale * 100).toFixed(0)}%</span>
      </div>
    </div>
  )
}

export function FakeBarChart({
  viz,
  revenueScale,
}: {
  viz: ChartViz
  revenueScale: number
}) {
  const base = [40, 52, 48, 61, 55, 72]
  const heights = base.map((h) =>
    clampPct(h * (0.92 + revenueScale * 0.1)),
  )
  const color = viz === 'line' ? '#64748b' : '#2563eb'
  return (
    <div className="bar-chart">
      {heights.map((h, i) => (
        <div key={i} className="bar-col">
          <div className="bar" style={{ height: `${h}%`, background: color }} />
        </div>
      ))}
    </div>
  )
}

function clampPct(h: number) {
  return Math.max(8, Math.min(92, h))
}

export function KeyMetricsList({ metrics }: { metrics: DashboardMetrics }) {
  const rows = [
    { label: 'Валовая маржа', v: `${metrics.grossMarginPct.toFixed(1)}%` },
    {
      label: 'Средний чек',
      v: `${metrics.avgCheckRub.toLocaleString('ru-RU')} ₽`,
    },
    { label: 'Удержание клиентов', v: `${metrics.retentionPct}%` },
    { label: 'Конверсия', v: `${metrics.conversionPct.toFixed(1)}%` },
    { label: 'NPS', v: `${metrics.nps}` },
  ]
  return (
    <ul className="metric-list">
      {rows.map((r) => (
        <li key={r.label}>
          <span>{r.label}</span>
          <strong>{r.v}</strong>
        </li>
      ))}
    </ul>
  )
}

export function TasksPanel() {
  return (
    <ul className="tasks-list">
      <li className="task danger">
        <span className="task-ico">!</span>
        Просроченный платёж — Альфа ООО
      </li>
      <li className="task info">
        <span className="task-ico">i</span>
        Подготовить отчёт по проекту X
      </li>
      <li className="task warn">
        <span className="task-ico">~</span>
        План-факт за май
      </li>
    </ul>
  )
}

export function ProjectsTable({ metrics }: { metrics: DashboardMetrics }) {
  const k = metrics.revenueScale
  const budget = (12.4 * k).toFixed(1)
  const actual = (11.1 * k).toFixed(1)
  const b2 = (8.2 * k).toFixed(1).replace('.', ',')
  const a2 = (8.0 * k).toFixed(1).replace('.', ',')
  const b3 = (21.0 * k).toFixed(1).replace('.', ',')
  const a3 = (14.2 * k).toFixed(1).replace('.', ',')
  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            <th>Проект</th>
            <th>Статус</th>
            <th>Бюджет</th>
            <th>Факт</th>
            <th>Прогресс</th>
            <th>Срок</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Проект X</td>
            <td>
              <span className="badge prog">В работе</span>
            </td>
            <td>{budget} млн</td>
            <td>{actual} млн</td>
            <td>
              <div className="prog-bar">
                <i style={{ width: '72%' }} />
              </div>
            </td>
            <td>15.06.2024</td>
          </tr>
          <tr>
            <td>Проект Y</td>
            <td>
              <span className="badge ok">Завершён</span>
            </td>
            <td>{b2} млн</td>
            <td>{a2} млн</td>
            <td>
              <div className="prog-bar">
                <i style={{ width: '100%' }} />
              </div>
            </td>
            <td>01.05.2024</td>
          </tr>
          <tr>
            <td>Проект Z</td>
            <td>
              <span className="badge prog">В работе</span>
            </td>
            <td>{b3} млн</td>
            <td>{a3} млн</td>
            <td>
              <div className="prog-bar">
                <i style={{ width: '48%' }} />
              </div>
            </td>
            <td>30.09.2024</td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}
