import {TreeItem} from 'vscode'
import {Scrap, ScrapState} from '../Scrap'
import {extensionId} from '../../utils'

export interface ShellScrapState extends ScrapState {
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
}
