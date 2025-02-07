import {TreeItem, TreeItemCollapsibleState} from 'vscode'
import {Scrap, ScrapState} from '../Scrap'

export interface GroupScrapState extends ScrapState {
  collapsed: boolean
}

export class GroupScrap extends Scrap<GroupScrapState> {
  readonly kind = 'Group'

  get treeItem(): TreeItem {
    return this._treeItemWith({
      collapsibleState: this.state.collapsed
        ? TreeItemCollapsibleState.Collapsed
        : TreeItemCollapsibleState.Expanded,
      label: this.state.name ?? 'Untitled Group',
    })
  }
}
