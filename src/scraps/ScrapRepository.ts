import {
  CancellationToken,
  Disposable,
  EventEmitter,
  ProviderResult,
  Uri,
  window,
  TreeItemCheckboxState,
  env,
  TextDocumentContentProvider,
  workspace,
  TreeCheckboxChangeEvent,
  TreeViewExpansionEvent,
  ThemeColor,
  Color,
  ColorInformation,
  ColorPresentation,
} from 'vscode'
import {Output} from '../extension'
import {UUID} from 'crypto'
import {ScrapFactory} from './ScrapFactory'
import {extensionId} from '../utils'
import {NoteScrap} from './concrete'
import {
  ScrapDTO,
  ScrapKind,
  ScrapKindMeta,
  ScrapLike,
  ScrapSorter,
  ScrapSortingMethod,
  ScrapSortingMethods,
} from './types'
import {Scrap} from './Scrap'

export class ScrapRepository
  implements TextDocumentContentProvider, Disposable
{
  private _items: Scrap<any>[] = []
  private disposables: Disposable[] = []

  private _onDidChangeData = new EventEmitter<Scrap<any>[] | undefined>()
  onDataChange = this._onDidChangeData.event
  private affectedScraps: Set<Scrap<any> | undefined> = new Set()

  constructor() {
    // this._subscribeToViewEvents()
    workspace.onDidChangeConfiguration(
      e => {
        if (e.affectsConfiguration(extensionId('sortingMethod'))) {
          const methodName = workspace
            .getConfiguration(extensionId())
            .get('sortingMethod')
          Output.debug('Sorting method changed to', methodName)
          this.notifyDataChange(undefined)
        }
      },
      this,
      this.disposables,
    )
  }

  get items(): Readonly<Scrap<any>[]> {
    return [...this._items].sort(this.sortingMethod)
  }

  get sortingMethod(): undefined | ScrapSorter {
    const sortingMethodName = workspace
      .getConfiguration(extensionId())
      .get('sortingMethod')
    return sortingMethodName
      ? ScrapSortingMethods[sortingMethodName as ScrapSortingMethod]
      : undefined
  }

  provideTextDocumentContent(
    uri: Uri,
    token: CancellationToken,
  ): ProviderResult<string> {
    const scrapId = uri.path
    const scrap = this._items.find(s => s.id === scrapId)

    if (scrap instanceof NoteScrap) {
      return scrap.state.content
    }

    return undefined
  }

  dispose() {
    for (const disposable of this.disposables) {
      disposable.dispose()
    }
  }
  getDescendants(element: Scrap<any>) {
    return this._items.filter(s => s.isDescendantOf(element))
  }

  onDidChangeCheckboxState(e: TreeCheckboxChangeEvent<Scrap<any>>) {
    for (const [scrap, checkState] of e.items) {
      scrap.state.checked =
        checkState === TreeItemCheckboxState.Checked ? true : false
      scrap.state.modifiedAt = new Date().getTime()
      this.notifyDataChange(e.items.map(x => x[0]))
    }
  }

  onCollapse(e: TreeViewExpansionEvent<Scrap<any>>) {
    e.element.state.collapsed = true
    this.notifyDataChange([e.element])
  }

  onExpand(e: TreeViewExpansionEvent<Scrap<any>>) {
    e.element.state.collapsed = false
    this.notifyDataChange([e.element])
  }

  remove(scraps: Scrap<any>[]) {
    this._items = this._items.filter(s => !scraps.includes(s))
    Output.info(`Removed ${scraps.length} item(s)`)
    this.notifyDataChange(undefined)
  }

  async move(dst: Scrap<any> | undefined, src: Scrap<any>) {
    Output.debug(`Attempting to move ${src} -> ${dst}`)
    if (dst === src || dst?.isDescendantOf(src)) {
      Output.warn('Cannot move a scrap to its descendant or itself')
      return
    }

    if (dst?.acceptsChildren || dst === undefined) {
      src.parent = dst
    } else {
      await this.move(dst?.parent, src)
    }
  }

  async rename(scrap: ScrapLike, name: string) {
    if (scrap.state.name === name) {
      return
    }

    scrap.state.name = name
    this.notifyDataChange([scrap])
  }

  serialize() {
    return this._items.map(item => item.dto)
  }

  async deserialize(dtos: ScrapDTO<any>[]) {
    const parentMap: [Scrap<any>, UUID | undefined][] = []

    const items = dtos.map(dto => {
      const scrap = ScrapFactory.fromDTO(dto)
      if (dto.parentId !== undefined) {
        parentMap.push([scrap, dto.parentId as UUID])
      }
      return scrap
    })

    for (const [scrap, parentId] of parentMap) {
      const parent = items.find(s => s.id === parentId)
      if (parent !== undefined) {
        scrap.parent = parent
      }
    }

    this._items = items
    this.notifyDataChange(undefined)
  }

  async copyToClipboard(scraps: readonly Scrap<any>[]) {
    const sourcesWithDescendants = new Set<Scrap<any>>()
    for (const scrap of scraps) {
      sourcesWithDescendants.add(scrap)
      for (const descendant of this.getDescendants(scrap)) {
        sourcesWithDescendants.add(descendant)
      }
    }

    const serialized = JSON.stringify(
      Array.from(sourcesWithDescendants).map(s => s.dto),
    )

    await env.clipboard.writeText(serialized)
  }

  async pasteFromClipboard(...args: Scrap<any>[]) {
    console.log(args)
    const clipboardContents = await env.clipboard.readText()
    Output.trace(`clipboard content: ${clipboardContents}`)
    const parsed = ScrapFactory.fromString(clipboardContents)
    if (parsed instanceof Array) {
      await this.add(args?.[0], parsed)
    } else {
      await this.add(args?.[0], [
        ScrapFactory.fromString(clipboardContents) as Scrap<any>,
      ])
    }
  }

  search(
    query_: string,
    kindFilters?: ScrapKind[],
    sortingMethod?: ScrapSortingMethod,
  ) {
    const query = query_.toLowerCase()
    const kinds = kindFilters ?? Object.keys(ScrapKindMeta)

    const result = (this._items as ScrapLike[]).filter(
      scrap =>
        kinds.includes(scrap.kind) &&
        (scrap.state.name?.toLowerCase().includes(query) ||
          scrap.state.description?.toLowerCase().includes(query)),
    )
    if (sortingMethod) {
      result.sort(ScrapSortingMethods[sortingMethod])
    }
    return result
  }

  private notifyAffected() {
    if (this.affectedScraps.has(undefined)) {
      Output.trace('Notifying affected root')
      this.notifyDataChange(undefined)
    } else {
      const affected = [...this.affectedScraps.values()].filter(
        s => s !== undefined,
      )
      Output.trace(`Notifying affected: ${affected}`)
      this.notifyDataChange(affected)
    }
    this.affectedScraps.clear()
  }

  private notifyDataChange(data: Scrap<any>[] | undefined) {
    this._onDidChangeData.fire(data)
  }

  childrenOf(scrap: Scrap<any> | undefined) {
    return this.items.filter(s => s.parent?.id === scrap?.id)
  }

  getScrapById(id: UUID) {
    return this._items.find(s => s.id === id)
  }

  refresh() {
    this.notifyDataChange(undefined)
  }

  private getScrapIndexById(id: UUID) {
    return this._items.findIndex(s => s.id === id)
  }

  private detach(scrap: Scrap<any>) {
    const idx = this.getScrapIndexById(scrap.id)
    if (idx > -1) {
      this._items.splice(idx, 1)
      this.notifyDataChange(scrap.parent ? [scrap.parent] : undefined)
      scrap.parent = undefined
    }
    return idx
  }

  async add(dst: Scrap<any> | undefined, src: Scrap<any>[]) {
    for (const s of src) {
      const existingIndex = this.getScrapIndexById(s.id)
      if (existingIndex > -1) {
        const oldS = this._items[existingIndex]

        if (dst === s || dst?.isDescendantOf(s)) {
          await window.showErrorMessage(
            'Cannot move Scrap into its descendant or itself',
          )
          continue
        }

        if (dst === s.parent) {
          this._items[existingIndex] = s
          this.notifyDataChange(dst ? [dst] : undefined)
          return
        }

        while (dst !== undefined && !dst.acceptsChildren) {
          dst = dst?.parent
        }

        // Remove the old scrap to prevent TreeItem id duplication
        this.detach(oldS)
      }

      s.parent = dst
      this._items.push(s)
      this.notifyDataChange(dst ? [dst] : undefined)
    }
  }
}
