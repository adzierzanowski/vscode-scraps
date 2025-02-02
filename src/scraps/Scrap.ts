import { randomUUID, UUID } from 'crypto'
import { OutgoingMessage } from 'http'
import { isContext } from 'vm'
import { ThemeIcon, TreeItem } from 'vscode'
import { Output } from '../extension'

export interface ScrapState {
  name?: string,
  description?: string
}

export const ScrapKindMeta = {
  File: {
    icon: ThemeIcon.File,
    acceptsChildren: false,
    description: ''
  },
  Group: {
    icon: new ThemeIcon('archive'),
    acceptsChildren: true,
    description: 'Container for any Scrap'
  },
  Link: {
    icon: new ThemeIcon('link'),
    acceptsChildren: false,
    description: 'Website Link'
  },
  Note: {
    icon: new ThemeIcon('markdown'),
    acceptsChildren: true,
    description: 'Markdown Note'
  },
  Shell: {
    icon: new ThemeIcon('terminal'),
    acceptsChildren: false,
    description: 'Shell Command'
  },
  Todo: {
    icon: new ThemeIcon('checklist'),
    acceptsChildren: true,
    description: 'Todo Item'
  },
  VSCommand: {
    icon: new ThemeIcon('vscode'),
    acceptsChildren: false,
    description: 'VSCode Command'
  },
} as const

export type ScrapKind = keyof typeof ScrapKindMeta

export abstract class Scrap<T extends ScrapState> {
  abstract readonly kind: ScrapKind

  readonly id: UUID
  protected _parent: Scrap<any> | undefined
  state: T
  abstract get treeItem(): TreeItem
  protected _treeItemWith(overrides: TreeItem): TreeItem {
    return {
      contextValue: this.kind,
      description: this.state.description,
      iconPath: ScrapKindMeta[this.kind].icon,
      id: this.id,
      label: this.state.name ?? `Untitled ${this.kind}`,
      ...overrides
    }
  }

  get parent() {
    return this._parent
  }
  set parent(parent: Scrap<any> | undefined) {
    Output.debug(`Setting parent of ${this.toString()} to ${parent}`)
    this._parent = parent
  }

  constructor(state: T, id?: UUID) {
    this.state = state
    this.id = id ?? randomUUID()
  }

  toString() {
    return `[${this.kind}:${this.state.name??this.id}]`
  }

  get acceptsChildren(): boolean {
    return ScrapKindMeta[this.kind].acceptsChildren
  }

  isDescendantOf(scrap: Scrap<any>): boolean {
    let p = this.parent
    while (p !== scrap) {
      p = p?.parent
      if (p === undefined) {
        return false
      }
    }
    return true
  }
}
