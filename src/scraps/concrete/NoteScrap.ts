import { TreeItem, Uri } from 'vscode'
import { Scrap, ScrapKind, ScrapKindMeta, ScrapState } from '../Scrap'
import { UUID } from 'crypto'

export interface NoteScrapState extends ScrapState {
  content: string
}

export class NoteScrap extends Scrap<NoteScrapState> {
  readonly kind = 'Note'

  get treeItem(): TreeItem {
    return this._treeItemWith({
      label: this.state.name ?? 'Untitled Note',
    })
  }
}
