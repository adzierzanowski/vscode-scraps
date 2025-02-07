import {TreeItem, TreeItemCollapsibleState} from 'vscode'
import {Scrap, ScrapState} from '../Scrap'

export interface NoteScrapState extends ScrapState {
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
    })
  }
}
