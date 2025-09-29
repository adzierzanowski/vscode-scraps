import {randomUUID, UUID} from 'crypto'
import {QuickPickItem, TreeItem, Uri} from 'vscode'
import {Output} from '../extension'
import {dateFmt} from '../utils'
import {
  ScrapDTO,
  ScrapKind,
  ScrapKindMeta,
  ScrapLike,
  ScrapQpItem,
  ScrapState,
} from './types'

export abstract class Scrap<T> {
  abstract readonly kind: ScrapKind

  private _id: UUID
  protected _parent: ScrapLike | undefined
  state: ScrapState<T>
  abstract get treeItem(): TreeItem
  abstract get qpItem(): ScrapQpItem
  protected _treeItemWith(overrides: TreeItem): TreeItem {
    return {
      contextValue: this.kind,
      description: this.state.description,
      iconPath: ScrapKindMeta[this.kind].icon,
      id: this.id,
      label: this.state.name ?? `Untitled ${this.kind}`,
      ...overrides,
    }
  }

  get id() {
    return this._id
  }

  protected get _qpDescription() {
    let desc = `created ${this.createdAtString} `

    if (this.state.modifiedAt !== this.state.createdAt) {
      desc += `$(dash) changed ${this.modifiedAtString} `
    }

    return desc
  }

  protected _qpItemWith(overrides: QuickPickItem): ScrapQpItem {
    return {
      id: this.id,
      detail: this.state.description,
      iconPath: ScrapKindMeta[this.kind].icon,
      description: this._qpDescription,
      ...overrides,
    }
  }

  get parent() {
    return this._parent
  }

  set parent(parent: ScrapLike | undefined) {
    Output.debug(`Setting parent of ${this.toString()} to ${parent}`)
    this._parent = parent
  }

  constructor(state: ScrapState<T>, id?: UUID) {
    this.state = state
    if (!this.state.createdAt) {
      this.state.createdAt = new Date().getTime()
    }
    if (!this.state.modifiedAt) {
      this.state.modifiedAt = this.state.createdAt
    }
    this._id = id ?? randomUUID()
  }

  rehash() {
    this._id = randomUUID()
  }

  update(state: ScrapState<T>, id?: UUID) {
    for (const [k, v] of Object.entries(state)) {
      this.state[k as keyof ScrapState<T>] = v
    }
  }

  toString() {
    return `[${this.kind}:${this.state.name ?? this.id}]`
  }

  get acceptsChildren(): boolean {
    return ScrapKindMeta[this.kind].acceptsChildren
  }

  isDescendantOf(scrap: ScrapLike): boolean {
    let p = this.parent
    while (p !== scrap) {
      p = p?.parent
      if (p === undefined) {
        return false
      }
    }
    return true
  }

  get createdAtString() {
    if (this.state.createdAt === undefined) {
      return ''
    }
    const createdAt = new Date(this.state.createdAt)
    return dateFmt(createdAt)
  }

  get modifiedAtString() {
    if (this.state.modifiedAt === undefined) {
      return ''
    }
    const modifiedAt = new Date(this.state.modifiedAt)
    return dateFmt(modifiedAt)
  }

  get dto(): ScrapDTO<T> {
    const _dto = {
      id: this.id,
      parentId: this.parent?.id,
      kind: this.kind,
      ...this.state,
    }

    return Object.fromEntries(
      Object.entries(_dto).map(([k, v]) => [
        k,
        v instanceof Array ? JSON.stringify(v) : v?.toString(),
      ]),
    ) as ScrapDTO<T>
  }

  get uri(): Uri {
    return Uri.from({
      scheme: 'scrap',
      path: this.id,
    })
  }
}
