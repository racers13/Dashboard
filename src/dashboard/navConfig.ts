export type NavPageId =
  | 'home'
  | 'finance'
  | 'sales'
  | 'clients'
  | 'operations'
  | 'hr'
  | 'projects'
  | 'kanban'
  | 'analytics'
  | 'reports'
  | 'notifications'
  | 'settings'

export type NavItem = {
  id: NavPageId
  label: string
  badge?: number
}

/** Порядок и подписи — как в боковом меню */
export const PRIMARY_NAV: NavItem[] = [
  { id: 'home', label: 'Главная' },
  { id: 'finance', label: 'Финансы' },
  { id: 'sales', label: 'Продажи' },
  { id: 'clients', label: 'Клиенты' },
  { id: 'operations', label: 'Операции' },
  { id: 'hr', label: 'Персонал' },
  { id: 'projects', label: 'Проекты' },
  { id: 'kanban', label: 'Доска задач' },
  { id: 'analytics', label: 'Аналитика' },
  { id: 'reports', label: 'Отчёты' },
]

export const SECONDARY_NAV: NavItem[] = [
  { id: 'notifications', label: 'Уведомления', badge: 3 },
  { id: 'settings', label: 'Настройки' },
]

export const PAGE_HEAD: Record<
  NavPageId,
  { title: string; subtitle: string }
> = {
  home: {
    title: 'Добро пожаловать, Алексей',
    subtitle: 'Обзор ключевых показателей вашего бизнеса',
  },
  finance: {
    title: 'Финансы',
    subtitle: 'Маржа, прибыль, денежный поток и структура расходов',
  },
  sales: {
    title: 'Продажи',
    subtitle: 'Динамика, воронка и выполнение плана по направлениям',
  },
  clients: {
    title: 'Клиенты',
    subtitle: 'Сегменты, удержание и ключевые контрагенты',
  },
  operations: {
    title: 'Операции',
    subtitle: 'Поставки, SLA и операционные KPI',
  },
  hr: {
    title: 'Персонал',
    subtitle: 'Численность, текучесть и ФОТ (агрегировано)',
  },
  projects: {
    title: 'Проекты',
    subtitle: 'Портфель, бюджеты и сроки',
  },
  kanban: {
    title: 'Доска задач',
    subtitle: 'Контроль задач по подразделениям и сотрудникам',
  },
  analytics: {
    title: 'Аналитика',
    subtitle: 'Срезы и сравнения периодов',
  },
  reports: {
    title: 'Отчёты',
    subtitle: 'Сохранённые отчёты и расписание выгрузок',
  },
  notifications: {
    title: 'Уведомления',
    subtitle: 'Задачи, сроки и системные сообщения',
  },
  settings: {
    title: 'Настройки',
    subtitle: 'Профиль, уведомления и параметры отображения',
  },
}
