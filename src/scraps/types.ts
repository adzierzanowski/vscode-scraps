import {QuickPickItem, ThemeIcon} from 'vscode'
import {Scrap} from './Scrap'
import {UUID} from 'crypto'

export type ScrapState<T> = T extends ScrapStateBase ? T : never
export type ScrapLike = Scrap<ScrapStateBase>
export interface ScrapStateBase {
  name?: string
  description?: string
  createdAt?: number
  modifiedAt?: number
}

export type ScrapEventArg = void | null | undefined | Scrap<any> | Scrap<any>[]
export type ScrapSorter = (a: ScrapLike, b: ScrapLike) => number

export const ScrapKindMeta = {
  File: {
    icon: ThemeIcon.File,
    acceptsChildren: false,
    description: '',
  },
  Group: {
    icon: new ThemeIcon('archive'),
    acceptsChildren: true,
    description: 'Container for any Scrap',
  },
  Link: {
    icon: new ThemeIcon('link'),
    acceptsChildren: false,
    description: 'Website Link',
  },
  Note: {
    icon: new ThemeIcon('markdown'),
    acceptsChildren: true,
    description: 'Markdown Note',
  },
  Shell: {
    icon: new ThemeIcon('terminal'),
    acceptsChildren: false,
    description: 'Shell Command',
  },
  Todo: {
    icon: new ThemeIcon('checklist'),
    acceptsChildren: true,
    description: 'Todo Item',
  },
  VSCommand: {
    icon: new ThemeIcon('vscode'),
    acceptsChildren: false,
    description: 'VSCode Command',
  },
} as const

export type ScrapKind = keyof typeof ScrapKindMeta

export type ScrapDTO<T> = {
  [key in keyof (ScrapState<T> & {
    kind: ScrapKind
    id?: UUID
    parentId?: UUID
  })]: string | undefined
}

export type ScrapQpItem = QuickPickItem & {id: UUID}

export const ScrapSortingMethods = {
  Default: ((a, b) => 0) as ScrapSorter,
  NameAsc: ((a, b) => {
    const [aName, bName] = [a.state.name ?? '', b.state.name ?? '']
    if (aName === bName) {
      return 0
    } else if (aName < bName) {
      return -1
    }
    return 1
  }) as ScrapSorter,
  NameDesc: ((a, b) => {
    const [aName, bName] = [a.state.name ?? '', b.state.name ?? '']
    if (aName === bName) {
      return 0
    } else if (aName < bName) {
      return 1
    }
    return -1
  }) as ScrapSorter,
  CreatedAtAsc: ((a, b) =>
    (a.state.createdAt ?? 0) - (b.state.createdAt ?? 0)) as ScrapSorter,
  CreatedAtDesc: ((a, b) =>
    (b.state.createdAt ?? 0) - (a.state.createdAt ?? 0)) as ScrapSorter,
  ModifiedAtAsc: ((a, b) =>
    (a.state.modifiedAt ?? 0) - (b.state.modifiedAt ?? 0)) as ScrapSorter,
  ModifiedAtDesc: ((a, b) =>
    (b.state.modifiedAt ?? 0) - (a.state.modifiedAt ?? 0)) as ScrapSorter,
} as const
export type ScrapSortingMethod = keyof typeof ScrapSortingMethods
