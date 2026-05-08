import type { BlockLayout, GlobalFilters, KanbanCard, KanbanStatus } from './types'

export const REGION_OPTIONS = ['Москва', 'СПб', 'Регионы', 'Экспорт']
export const CLIENT_OPTIONS = ['Альфа ООО', 'Бета', 'Гамма Трейд', 'Ключевые (топ-10)']
export const CATEGORY_OPTIONS = ['Продукт A', 'Продукт B', 'Услуги', 'Прочее']

export const DEFAULT_FILTERS: GlobalFilters = {
  regions: [],
  clients: [],
  categories: [],
}

export const BASE_BLOCKS: BlockLayout[] = [
  { id: 'b-kpis', kind: 'kpis', hidden: false, span: 12 },
  { id: 'b-rev-line', kind: 'revenue_line', hidden: false, span: 8 },
  { id: 'b-rev-donut', kind: 'revenue_donut', hidden: false, span: 4 },
  { id: 'b-sales', kind: 'sales_bar', hidden: false, span: 4 },
  { id: 'b-keym', kind: 'key_metrics', hidden: false, span: 4 },
  { id: 'b-tasks', kind: 'tasks', hidden: false, span: 4 },
  { id: 'b-kanban', kind: 'kanban_summary', hidden: false, span: 12 },
  { id: 'b-projects', kind: 'projects', hidden: false, span: 12 },
]

export const STORAGE_KEY = 'exec-dashboard-prototype-v1'

export const SALES_LOCAL_OPTIONS = [
  { value: 'all', label: 'Все сегменты' },
  { value: 'a', label: 'Продукт A' },
  { value: 'b', label: 'Продукт B' },
  { value: 'srv', label: 'Услуги' },
]

export const BASE_KANBAN_STATUSES: KanbanStatus[] = [
  { id: 'all', label: 'Все задачи', locked: true },
  { id: 'in_progress', label: 'В работе' },
  { id: 'done', label: 'Выполненные' },
  { id: 'failed', label: 'Проваленные' },
  { id: 'cancelled', label: 'Отменённые' },
]

export const BASE_KANBAN_SUMMARY_PANELS = BASE_KANBAN_STATUSES.map((s) => s.id)

export const BASE_KANBAN_CARDS: KanbanCard[] = [
  {
    id: 'task-001',
    title: 'Сверить план-факт по маркетинговым каналам',
    department: 'Маркетинг',
    employee: 'Анна М.',
    region: 'Москва',
    client: 'Ключевые (топ-10)',
    category: 'Услуги',
    owner: 'Анна М.',
    dueDate: '2024-06-03',
    priority: 'high',
    statusId: 'in_progress',
    valueM: 3.4,
  },
  {
    id: 'task-002',
    title: 'Подготовить витрину цен для продукта B',
    department: 'Ценообразование',
    employee: 'Илья Р.',
    region: 'СПб',
    client: 'Бета',
    category: 'Продукт B',
    owner: 'Илья Р.',
    dueDate: '2024-06-07',
    priority: 'medium',
    statusId: 'in_progress',
    valueM: 5.1,
  },
  {
    id: 'task-003',
    title: 'Закрыть интеграцию отчётности с CRM',
    department: 'Разработка',
    employee: 'Павел С.',
    region: 'Москва',
    client: 'Альфа ООО',
    category: 'Продукт A',
    owner: 'Павел С.',
    dueDate: '2024-06-12',
    priority: 'high',
    statusId: 'done',
    valueM: 8.8,
  },
  {
    id: 'task-004',
    title: 'Проверить просадку маржи по экспорту',
    department: 'Аналитики',
    employee: 'Мария К.',
    region: 'Экспорт',
    client: 'Гамма Трейд',
    category: 'Прочее',
    owner: 'Мария К.',
    dueDate: '2024-05-29',
    priority: 'high',
    statusId: 'failed',
    valueM: 6.2,
  },
  {
    id: 'task-005',
    title: 'Согласовать резерв поставщиков на июнь',
    department: 'Снабжение',
    employee: 'Олег В.',
    region: 'Регионы',
    client: 'Ключевые (топ-10)',
    category: 'Услуги',
    owner: 'Олег В.',
    dueDate: '2024-06-10',
    priority: 'medium',
    statusId: 'in_progress',
    valueM: 4.7,
  },
  {
    id: 'task-006',
    title: 'Отменить устаревший отчёт по сегменту A',
    department: 'Аналитики',
    employee: 'Мария К.',
    region: 'Москва',
    client: 'Альфа ООО',
    category: 'Продукт A',
    owner: 'Мария К.',
    dueDate: '2024-05-25',
    priority: 'low',
    statusId: 'cancelled',
    valueM: 1.1,
  },
  {
    id: 'task-007',
    title: 'Дособрать требования директоров филиалов',
    department: 'Директора',
    employee: 'Алексей К.',
    region: 'Регионы',
    client: 'Ключевые (топ-10)',
    category: 'Услуги',
    owner: 'Алексей К.',
    dueDate: '2024-06-14',
    priority: 'medium',
    statusId: 'in_progress',
    valueM: 2.9,
  },
]
