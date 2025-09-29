import {
  QuickPickItem,
  TreeItem,
  TreeItemCollapsibleState,
  Uri,
  workspace,
} from 'vscode'
import {ScrapStateBase} from '../types'
import {Scrap} from '../Scrap'
import path from 'path'

export interface FileScrapState extends ScrapStateBase {
  uri: Uri
}

export class FileScrap extends Scrap<FileScrapState> {
  readonly kind = 'File'

  get qpItem() {
    return this._qpItemWith({
      label: this.state.name ?? this.state.uri.path,
      detail: workspace.asRelativePath(this.state.uri),
    })
  }

  get treeItem(): TreeItem {
    return this._treeItemWith({
      command: {
        command: 'vscode.open',
        title: 'Open',
        arguments: [this.state.uri],
      },
      collapsibleState: TreeItemCollapsibleState.None,
      resourceUri: this.state.uri,
      description:
        (this.state.description ?? '') === ''
          ? workspace.asRelativePath(this.state.uri)
          : this.state.description,
    })
  }
}
