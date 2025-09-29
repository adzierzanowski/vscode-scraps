import {TreeItem} from 'vscode'
import {Scrap} from '../Scrap'
import {ScrapStateBase} from '../types'

export interface VSCommandScrapState extends ScrapStateBase {
  commandId: string
  args: any
}

export class VSCommandScrap extends Scrap<VSCommandScrapState> {
  readonly kind = 'VSCommand'

  get treeItem(): TreeItem {
    return this._treeItemWith({
      description: this.state.description ?? this.state.commandId,
      label: this.state.name,
      tooltip: this.state.args?.toString() ?? 'undefi',
      command: {
        command: this.state.commandId,
        title: this.state.name ?? this.state.commandId,
        arguments: this.state.args,
      },
    })
  }

  get qpItem() {
    return this._qpItemWith({
      label: this.state.name ?? this.state.commandId,
      detail: this.state.commandId,
    })
  }
}
