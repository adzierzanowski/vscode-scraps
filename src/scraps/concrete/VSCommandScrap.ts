import { commands, TreeItem, Uri } from 'vscode'
import { Scrap, ScrapKind, ScrapKindMeta, ScrapState } from '../Scrap'
import { UUID } from 'crypto'
import { ScrapFactory } from '../ScrapFactory'

export interface VSCommandScrapState extends ScrapState {
  commandId: string
}

export class VSCommandScrap extends Scrap<VSCommandScrapState> {
  readonly kind = 'VSCommand'


  get treeItem(): TreeItem {
    return this._treeItemWith({
      description: this.state.description ?? this.state.commandId,
      label: this.state.name
    })
  }
}
