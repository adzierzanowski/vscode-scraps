import {TreeItem, TreeItemCollapsibleState, Uri} from 'vscode'
import {Scrap, ScrapState} from '../Scrap'

export interface FileScrapState extends ScrapState {
  uri: Uri
}

export class FileScrap extends Scrap<FileScrapState> {
  readonly kind = 'File'

  get treeItem(): TreeItem {
    return this._treeItemWith({
      command: {
        command: 'vscode.open',
        title: 'Open',
        arguments: [this.state.uri],
      },
      collapsibleState: TreeItemCollapsibleState.None,
      resourceUri: this.state.uri,
    })
  }
}
