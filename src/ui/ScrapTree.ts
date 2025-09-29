import {
  CancellationToken,
  DataTransfer,
  DataTransferItem,
  Disposable,
  Event,
  EventEmitter,
  ProviderResult,
  TreeDataProvider,
  TreeDragAndDropController,
  TreeItem,
  TreeItemCollapsibleState,
  TreeView,
  Uri,
  window,
  workspace,
} from 'vscode'
import {extensionId} from '../utils'
import {Output} from '../extension'
import {UUID} from 'crypto'
import {Scrap, ScrapEventArg, ScrapFactory, ScrapRepository} from '../scraps'

export class ScrapTree
  implements
    Disposable,
    TreeDataProvider<Scrap<any>>,
    TreeDragAndDropController<Scrap<any>>
{
  readonly scrapMime = 'application/vnd.code.tree.doublefloat.scraps.view'
  private view: TreeView<Scrap<any>>
  private repo: ScrapRepository
  private disposables: Disposable[] = []
  private _onDidChangeTreeData: EventEmitter<ScrapEventArg> = new EventEmitter()
  onDidChangeTreeData: Event<ScrapEventArg> = this._onDidChangeTreeData.event

  dropMimeTypes: readonly string[] = [this.scrapMime, 'text/uri-list', 'files']

  dragMimeTypes: readonly string[] = [this.scrapMime]

  constructor(repo: ScrapRepository) {
    this.repo = repo

    this.repo.onDataChange(this.onRepoDataChange, this, this.disposables)

    this.view = window.createTreeView(extensionId('view'), {
      treeDataProvider: this,
      dragAndDropController: this,
      canSelectMany: true,
      showCollapseAll: true,
      manageCheckboxStateManually: true,
    })
    this.disposables.push(this.view)

    this.view.onDidChangeCheckboxState(
      this.repo.onDidChangeCheckboxState,
      this.repo,
      this.disposables,
    )
    this.view.onDidCollapseElement(
      this.repo.onCollapse,
      this.repo,
      this.disposables,
    )
    this.view.onDidExpandElement(
      this.repo.onExpand,
      this.repo,
      this.disposables,
    )
  }

  get selection() {
    return this.view.selection
  }

  dispose() {
    for (const d of this.disposables) {
      d.dispose()
    }
  }

  handleDrag(
    src: readonly Scrap<any>[],
    dt: DataTransfer,
    token: CancellationToken,
  ): Thenable<void> | void {
    dt.set(this.scrapMime, new DataTransferItem(src.map(s => s.id)))
  }

  async handleDrop(
    dst: Scrap<any> | undefined,
    dt: DataTransfer,
    token: CancellationToken,
  ) {
    const src = await this.parseDataTransferSrc(dt)

    this.repo.add(dst, src)
  }

  private async parseDataTransferSrc(dt: DataTransfer) {
    for (const [mime, item] of dt) {
      Output.debug(`drop mime: ${mime}`)
    }

    let srcDT = dt.get(this.scrapMime)
    if (srcDT !== undefined) {
      return (srcDT.value as UUID[])
        .map(id => this.repo.getScrapById(id))
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

  getTreeItem(element: Scrap<any>): TreeItem | Thenable<TreeItem> {
    const item = element.treeItem
    if (item.collapsibleState && this.repo.childrenOf(element).length === 0) {
      item.collapsibleState = TreeItemCollapsibleState.None
    }
    return item
  }

  getChildren(element?: Scrap<any> | undefined): ProviderResult<Scrap<any>[]> {
    return this.repo.childrenOf(element)
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

  onRepoDataChange(data: Scrap<any>[] | undefined) {
    if (data === undefined) {
      this._onDidChangeTreeData.fire(undefined)
      return
    }

    this._onDidChangeTreeData.fire(data)
  }

  async reveal(scrap: Scrap<any>) {
    return this.view.reveal(scrap)
  }
}
