import { TreeItem, Uri } from 'vscode'
import { Scrap, ScrapKind, ScrapKindMeta, ScrapState } from '../Scrap'
import { UUID } from 'crypto'

export interface LinkScrapState extends ScrapState {
  uri: Uri
}

export class LinkScrap extends Scrap<LinkScrapState> {
  readonly kind = 'Link'

  get treeItem(): TreeItem {
    return this._treeItemWith({
      command: {
        command: 'vscode.open',
        title: 'Open',
        arguments: [this.state.uri],
      },
      description: this.state.description,
      label: this.state.name ?? this.state.uri.authority,
      resourceUri: this.state.uri
    })
  }
}
