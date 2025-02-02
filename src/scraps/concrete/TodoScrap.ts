import { TreeItem, TreeItemCheckboxState, TreeItemCollapsibleState } from 'vscode'
import { Scrap, ScrapKind, ScrapKindMeta, ScrapState } from '../Scrap'

export interface TodoScrapState extends ScrapState {
  checked: boolean
  collapsed: boolean
  description?: string
}

export class TodoScrap extends Scrap<TodoScrapState> {
  readonly kind = 'Todo'

  get treeItem(): TreeItem {
    return this._treeItemWith({
      checkboxState: this.state.checked
        ? TreeItemCheckboxState.Checked
        : TreeItemCheckboxState.Unchecked,
      collapsibleState: this.state.collapsed
        ? TreeItemCollapsibleState.Collapsed
        : TreeItemCollapsibleState.Expanded,
      iconPath: undefined
    })
  }
}
