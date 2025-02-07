import {TreeItem} from 'vscode'
import {Scrap, ScrapState} from '../Scrap'

export interface VSCommandScrapState extends ScrapState {
  commandId: string
  args?: string[]
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
}
