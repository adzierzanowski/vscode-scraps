import {QuickPickItem, TreeItem, Uri} from 'vscode'
import {ScrapStateBase} from '../types'
import {Scrap} from '../Scrap'

export interface LinkScrapState extends ScrapStateBase {
  uri: Uri
}

export class LinkScrap extends Scrap<LinkScrapState> {
  readonly kind = 'Link'

  get qpItem() {
    return this._qpItemWith({
      label: this.state.name ?? this.state.uri.path,
      detail: this.state.uri.authority,
    })
  }

  get treeItem(): TreeItem {
    return this._treeItemWith({
      command: {
        command: 'vscode.open',
        title: 'Open',
        arguments: [this.state.uri],
      },
      description: this.state.description,
      label: this.state.name ?? this.state.uri.authority,
      resourceUri: this.state.uri,
    })
  }
}
