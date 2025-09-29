import {
  QuickPickItem,
  ThemeColor,
  ThemeIcon,
  TreeItem,
  TreeItemCollapsibleState,
} from 'vscode'
import {ScrapKindMeta, ScrapStateBase} from '../types'
import {Scrap} from '../Scrap'

export interface GroupScrapState extends ScrapStateBase {
  collapsed: boolean
  color?: string
}

export class GroupScrap extends Scrap<GroupScrapState> {
  readonly kind = 'Group'

  get treeItem(): TreeItem {
    const icon = ScrapKindMeta.Group.icon
    return this._treeItemWith({
      collapsibleState: this.state.collapsed
        ? TreeItemCollapsibleState.Collapsed
        : TreeItemCollapsibleState.Expanded,
      label: this.state.name ?? 'Untitled Group',
      iconPath: this.state.color
        ? new ThemeIcon(
            icon.id,
            new ThemeColor(`doublefloat.scraps.color.${this.state.color}`),
          )
        : icon,
    })
  }

  get qpItem() {
    return this._qpItemWith({
      label: this.state.name ?? 'Untitled Group',
      iconPath: ScrapKindMeta.Group.icon,
    })
  }
}
