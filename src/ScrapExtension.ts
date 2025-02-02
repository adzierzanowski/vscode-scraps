import {
  commands,
  Disposable,
  ExtensionContext,
  ExtensionMode,
  window,
  workspace
} from 'vscode'
import { ScrapKindMeta, ScrapRepository } from './scraps'
import { Output } from './extension'

export class ScrapExtension implements Disposable {
  repository = new ScrapRepository()

  view = window.createTreeView(this.idWith('view'), {
    treeDataProvider: this.repository.provider,
    canSelectMany: true,
    manageCheckboxStateManually: true,
    showCollapseAll: true,
    dragAndDropController: this.repository.dndController,
  })

  constructor(context: ExtensionContext) {
    if (context.extensionMode === ExtensionMode.Development) {
      Output.show()
    }

    context.subscriptions.push(
      commands.registerCommand(
        this.idWith('refresh'), this.repository.refresh, this.repository),
      commands.registerCommand(
        this.idWith('remove'), this.repository.remove, this.repository),
      commands.registerCommand(
        this.idWith('add'), this.addScrap, this
      ),
      commands.registerCommand(
        this.idWith('edit'), this.editScrap, this
      )
    )

    Output.info('Creating Scrap Extension')
  }

  dispose() {
    Output.info('Disposing of Scrap Extension')
    this.view.dispose()
  }

  idWith(...parts: string[]) {
    return ['doublefloat', 'scraps', ...parts].join('.')
  }

  async addScrap() {
    const qp = window.createQuickPick()
    qp.items = Object.entries(ScrapKindMeta).map(([kind, meta]) => ({
      label: kind,
      alwaysShow: true,
      iconPath: meta.icon,
      description: meta.description,
    }))
    qp.onDidAccept(() => {
      qp.dispose()
    })
    qp.onDidHide(() => {
      qp.dispose()
    })
    qp.show()
  }

  async editScrap() {

  }
}
