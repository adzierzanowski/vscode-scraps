import {
  QuickPickItem,
  ThemeIcon,
  TreeItem,
  TreeItemCheckboxState,
  TreeItemCollapsibleState,
} from 'vscode'
import {Scrap} from '../Scrap'
import {ScrapStateBase} from '../types'

export interface TodoScrapState extends ScrapStateBase {
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
      iconPath: undefined,
    })
  }

  get qpItem() {
    return this._qpItemWith({
      label: this.state.name ?? 'Todo',
      iconPath: new ThemeIcon(this.state.checked ? 'check' : 'x'),
    })
  }
}
