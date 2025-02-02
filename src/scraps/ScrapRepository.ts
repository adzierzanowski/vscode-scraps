import {
  CancellationToken,
  DataTransfer,
  DataTransferItem,
  EventEmitter,
  TreeDataProvider,
  TreeDragAndDropController,
  Uri
} from 'vscode'
import { Scrap } from './Scrap'
import { Output } from '../extension'
import {
  FileScrap,
  GroupScrap,
  LinkScrap,
  NoteScrap,
  ShellScrap,
  TodoScrap,
  VSCommandScrap
} from './concrete'
import { UUID } from 'crypto'

export type ScrapEventArg = void | null | undefined | Scrap<any> | Scrap<any>[]

export class ScrapRepository implements TreeDragAndDropController<Scrap<any>> {
  readonly scrapMime = 'application/vnd.code.tree.doublefloat.scraps.view'
  // readonly scrapMime = 'application/scraps'
  private _onDidChangeTreeData: EventEmitter<ScrapEventArg> = new EventEmitter()

  readonly provider: TreeDataProvider<Scrap<any>> = {
    getChildren: (item) => this.items.filter(i => i.parent === item),
    getTreeItem: (item) => item.treeItem,
    getParent: (item) => item.parent,
    onDidChangeTreeData: this._onDidChangeTreeData.event
  }

  readonly dndController: TreeDragAndDropController<Scrap<any>> = this

  private items: Scrap<any>[] = []

  constructor() {
    this.items.push(
      new FileScrap({uri: Uri.file('~/.vimrc')}),
      new GroupScrap({collapsed: true}),
      new LinkScrap({uri:Uri.parse('https://google.com')}),
      new NoteScrap({content: '# Hello world\n\nHello!'}),
      new ShellScrap({command: 'echo hello'}),
      new TodoScrap({checked: true, collapsed: true}),
      new VSCommandScrap({commandId: 'perfview.show'})
    )
  }
  readonly dropMimeTypes = [this.scrapMime]
  readonly dragMimeTypes = [this.scrapMime]
  async handleDrag(
    src: readonly Scrap<any>[], dt: DataTransfer, token: CancellationToken) {
    dt.set(this.scrapMime, new DataTransferItem(src.map(s => s.id)))
  }

  async handleDrop(
    dst: Scrap<any> | undefined, dt: DataTransfer, token: CancellationToken) {
    const srcDT = dt.get(this.scrapMime)
    if (srcDT === undefined) {
      Output.info('DT unparsable')
    }

    const src = (srcDT!.value as UUID[])
      .map(id => this.items.find(s => s.id === id))
      .filter(s => s !== undefined)

    const notify: Set<Scrap<any> | undefined> = new Set([dst])
    for (const scrap of src) {
      notify.add(scrap.parent)
      await this.move(dst, scrap)
    }
    for (const scrap of notify) {
      this._onDidChangeTreeData.fire(scrap)
    }
  }

  refresh() {
    this._onDidChangeTreeData.fire()
  }

  remove(scrap: Scrap<any>) {
    const i = this.items.findIndex(s => s.id === scrap.id)
    if (i > -1) {
      const removed = this.items.splice(i, 1)
      this._onDidChangeTreeData.fire(removed?.[0].parent)
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
}
