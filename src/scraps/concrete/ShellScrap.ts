import {QuickPickItem, TreeItem} from 'vscode'
import {extensionId} from '../../utils'
import {Scrap} from '../Scrap'
import {ScrapStateBase} from '../types'

export interface ShellScrapState extends ScrapStateBase {
  command: string
}

export class ShellScrap extends Scrap<ShellScrapState> {
  readonly kind = 'Shell'

  get treeItem(): TreeItem {
    return this._treeItemWith({
      command: {
        command: extensionId('runShellCommand'),
        title: 'Run Shell Command',
        arguments: [this.state.command],
      },
    })
  }

  get qpItem() {
    return this._qpItemWith({
      label: this.state.name ?? this.state.command,
      detail: this.state.command,
    })
  }
}
