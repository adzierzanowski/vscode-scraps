import {
  CancellationToken,
  Disposable,
  DataTransfer,
  DataTransferItem,
  Event,
  EventEmitter,
  ProviderResult,
  TreeDataProvider,
  TreeDragAndDropController,
  TreeItem,
  TreeItemCollapsibleState,
  Uri,
  TreeView,
  window,
  TreeItemCheckboxState,
  env,
  TextDocumentContentProvider,
} from 'vscode'
import {Scrap, ScrapDTO} from './Scrap'
import {Output} from '../extension'
import {UUID} from 'crypto'
import {ScrapFactory} from './ScrapFactory'
import {extensionId} from '../utils'
import {NoteScrap} from './concrete'

export type ScrapEventArg = void | null | undefined | Scrap<any> | Scrap<any>[]

export class ScrapRepository
  implements
    TreeDragAndDropController<Scrap<any>>,
    TreeDataProvider<Scrap<any>>,
    TextDocumentContentProvider,
    Disposable
{
  private view: TreeView<Scrap<any>>
  private items: Scrap<any>[] = []
  private disposables: Disposable[] = []
  readonly scrapMime = 'application/vnd.code.tree.doublefloat.scraps.view'
  private _onDidChangeTreeData: EventEmitter<ScrapEventArg> = new EventEmitter()
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event
  private _onDidChange = new EventEmitter<Uri>()
  readonly onDidChange = this._onDidChange.event

  readonly dropMimeTypes = [this.scrapMime, 'text/uri-list', 'files']
  readonly dragMimeTypes = [this.scrapMime]
  async handleDrag(
    src: readonly Scrap<any>[],
    dt: DataTransfer,
    token: CancellationToken,
  ) {
    dt.set(this.scrapMime, new DataTransferItem(src.map(s => s.id)))
  }

  constructor() {
    this.view = window.createTreeView(extensionId('view'), {
      treeDataProvider: this,
      canSelectMany: true,
      dragAndDropController: this,
      manageCheckboxStateManually: true,
      showCollapseAll: true,
    })
    this.disposables.push(this.view)
    this._subscribeToViewEvents()
  }

  provideTextDocumentContent(
    uri: Uri,
    token: CancellationToken,
  ): ProviderResult<string> {
    const scrapId = uri.path
    const scrap = this.items.find(s => s.id === scrapId)

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

  getChildren(element?: Scrap<any> | undefined): ProviderResult<Scrap<any>[]> {
    return this.items.filter(s => s.parent === element)
  }

  getDescendants(element: Scrap<any>) {
    return this.items.filter(s => s.isDescendantOf(element))
  }

  getTreeItem(element: Scrap<any>): TreeItem | Thenable<TreeItem> {
    const treeItem = element.treeItem

    if ('collapsibleState' in treeItem && !this._scrapHasChildren(element)) {
      treeItem.collapsibleState = TreeItemCollapsibleState.None
    }

    return treeItem
  }

  getParent(element: Scrap<any>): ProviderResult<Scrap<any>> {
    return element.parent
  }

  resolveTreeItem(
    item: TreeItem,
    element: Scrap<any>,
    token: CancellationToken,
  ): ProviderResult<TreeItem> {
    return item
  }

  async handleDrop(
    dst: Scrap<any> | undefined,
    dt: DataTransfer,
    token: CancellationToken,
  ) {
    const src = await this._parseDataTransferSrc(dt)

    const scrapsToNotify: Set<Scrap<any> | undefined> = new Set([dst])
    for (const scrap of src) {
      scrapsToNotify.add(scrap.parent)
      if (this.items.find(s => s === scrap)) {
        await this.move(dst, scrap)
      } else {
        await this.addOrUpdate(scrap, dst)
      }
    }
    for (const scrap of scrapsToNotify) {
      this._onDidChangeTreeData.fire(scrap)
    }
  }

  private _subscribeToViewEvents() {
    this.view.onDidChangeCheckboxState(
      e => {
        for (const [scrap, checkState] of e.items) {
          scrap.state.checked =
            checkState === TreeItemCheckboxState.Checked ? true : false
          this._onDidChangeTreeData.fire(scrap)
        }
      },
      this,
      this.disposables,
    )

    this.view.onDidCollapseElement(
      e => {
        e.element.state.collapsed = true
      },
      this,
      this.disposables,
    )

    this.view.onDidExpandElement(
      e => {
        e.element.state.collapsed = false
      },
      this,
      this.disposables,
    )
  }

  private async _parseDataTransferSrc(dt: DataTransfer) {
    for (const [mime, item] of dt) {
      Output.debug(`drop mime: ${mime}`)
    }

    let srcDT = dt.get(this.scrapMime)
    if (srcDT !== undefined) {
      return (srcDT!.value as UUID[])
        .map(id => this.items.find(s => s.id === id))
        .filter(s => s !== undefined)
    }

    srcDT = dt.get('text/uri-list')
    if (srcDT !== undefined) {
      const dtValue = await srcDT.asString()
      Output.info(`text/uri-list: ${dtValue}`)
      return dtValue
        .split('\r\n')
        .map(uriString => ScrapFactory.fromUri(Uri.parse(uriString)))
    }

    return []
  }

  refresh() {
    this._onDidChangeTreeData.fire()
  }

  remove(scraps: Scrap<any>[]) {
    Output.debug(`${scraps}`)
    const parentsToNotify = new Set<Scrap<any>>()
    let notifyRoot = false
    for (const scrap of scraps) {
      if (scrap.parent === undefined) {
        notifyRoot = true
        break
      }
      parentsToNotify.add(scrap.parent)
    }
    this.items = this.items.filter(s => !scraps.includes(s))
    Output.info(`Removed ${scraps.length} item(s)`)
    if (notifyRoot) {
      this.refresh()
    } else {
      this._onDidChangeTreeData.fire(Array.from(parentsToNotify))
    }
  }

  async move(dst: Scrap<any> | undefined, src: Scrap<any>) {
    Output.debug(`Attempting to move ${src} -> ${dst}`)
    if (dst === src || dst?.isDescendantOf(src)) {
      Output.warn('Cannot move a scrap to its descendant or itself')
      return
    }

    if (dst?.acceptsChildren ?? true) {
      src.parent = dst
    } else {
      await this.move(dst?.parent, src)
    }
  }

  /**
   * Add `scrap` to the list if it doesn't exist or update existing one.
   * @param scrap
   * @param dst destination of the scrap:
   * - tree root if `null`
   * - unchanged if `undefined`
   */
  async addOrUpdate(scrap: Scrap<any>, dst?: Scrap<any> | null) {
    const existing = this.items.findIndex(s => s.id === scrap.id)
    Output.info(`addOrUpdate existing index: ${existing}`)

    if (existing > -1) {
      this.items[existing] = scrap
      if (dst !== undefined) {
        scrap.parent = dst ?? undefined
      }
      if (scrap instanceof NoteScrap) {
        this._onDidChange.fire(scrap.uri)
      }
      this._onDidChangeTreeData.fire(scrap.parent)
    } else {
      this.items.push(scrap)
      if (dst !== undefined) {
        scrap.parent = dst ?? undefined
      }
      this.refresh()
    }
  }

  serialize() {
    return this.items.map(item => item.dto)
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

    // XXX:
    // Clear Tree so that collapsible state is preserved when reloading items
    // with the same ID
    // this.items = []
    // this.refresh()
    // await new Promise(resolve => setTimeout(resolve, 0))

    this.items = items
    this.refresh()
  }

  private _scrapHasChildren(scrap: Scrap<any>) {
    return this.items.find(s => s.parent?.id === scrap.id) !== undefined
  }

  async copyToClipboard(...args: Scrap<any>[]) {
    const sources = args.length > 0 ? args : this.view.selection

    Output.trace(`copy sources: ${sources}`)

    const sourcesWithDescendants = new Set<Scrap<any>>()
    for (const scrap of sources) {
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
    const clipboardContents = await env.clipboard.readText()
    Output.trace(`clipboard content: ${clipboardContents}`)
    const parsed = ScrapFactory.fromString(clipboardContents)
    if (parsed instanceof Array) {
      for (const s of parsed) {
        await this.addOrUpdate(s, args?.[0])
      }
    } else {
      await this.addOrUpdate(
        ScrapFactory.fromString(clipboardContents) as Scrap<any>,
        args?.[0],
      )
    }
  }
}
