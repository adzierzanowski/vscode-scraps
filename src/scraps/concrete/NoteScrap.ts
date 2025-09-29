import {QuickPickItem, TreeItem, TreeItemCollapsibleState} from 'vscode'
import {Scrap} from '../Scrap'
import {extensionId} from '../../utils'
import {ScrapStateBase} from '../types'

export interface NoteScrapState extends ScrapStateBase {
  content: string
  collapsed: boolean
}

export class NoteScrap extends Scrap<NoteScrapState> {
  readonly kind = 'Note'

  get treeItem(): TreeItem {
    return this._treeItemWith({
      label: this.state.name ?? 'Untitled Note',
      collapsibleState: this.state.collapsed
        ? TreeItemCollapsibleState.Collapsed
        : TreeItemCollapsibleState.Expanded,
      command: {
        command: extensionId('showNote'),
        title: 'Show Note Scrap',
        arguments: [this],
      },
    })
  }

  get qpItem() {
    return this._qpItemWith({label: this.state.name ?? 'Untitled Note'})
  }
}
