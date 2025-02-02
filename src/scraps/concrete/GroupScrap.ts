import { TreeItem, TreeItemCollapsibleState, Uri } from 'vscode'
import { Scrap, ScrapKind, ScrapKindMeta, ScrapState } from '../Scrap'

export interface GroupScrapState extends ScrapState {
  collapsed: true
}

export class GroupScrap extends Scrap<GroupScrapState> {
  readonly kind = 'Group'

  get treeItem(): TreeItem {
    return this._treeItemWith({
      collapsibleState: this.state.collapsed
        ? TreeItemCollapsibleState.Collapsed
        : TreeItemCollapsibleState.Expanded,
      label: this.state.name ?? 'Untitled Group'
    })
  }
}
