import { TreeItem, Uri } from 'vscode'
import { Scrap, ScrapKind, ScrapKindMeta, ScrapState } from '../Scrap'
import { UUID } from 'crypto'

export interface ShellScrapState extends ScrapState {
  command: string
}

export class ShellScrap extends Scrap<ShellScrapState> {
  readonly kind = 'Shell'

  get treeItem(): TreeItem {
    return this._treeItemWith({
    })
  }
}
