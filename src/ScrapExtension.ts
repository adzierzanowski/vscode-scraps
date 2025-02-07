import {
  commands,
  Disposable,
  env,
  ExtensionContext,
  ExtensionMode,
  TreeItemCheckboxState,
  TreeView,
  Uri,
  ViewColumn,
  window,
  workspace,
} from 'vscode'
import {Scrap, ScrapFactory, ScrapRepository} from './scraps'
import {Output} from './extension'
import {extensionId} from './utils'
import {
  showEditScrapPanel,
  showKindQuickPick,
  showRenameInput,
} from './UIHelpers'

export class ScrapExtension implements Disposable {
  private _context: ExtensionContext
  repository = new ScrapRepository()

  constructor(context: ExtensionContext) {
    this._context = context

    if (context.extensionMode === ExtensionMode.Development) {
      Output.show()
    }

    context.subscriptions.push(
      commands.registerCommand(
        extensionId('refresh'),
        this.repository.refresh,
        this.repository,
      ),
      commands.registerCommand(
        extensionId('remove'),
        this.repository.remove,
        this.repository,
      ),
      commands.registerCommand(extensionId('add'), this.addScrap, this),
      commands.registerCommand(extensionId('edit'), this.edit, this),
      commands.registerCommand(extensionId('save'), this.save, this),
      commands.registerCommand(extensionId('load'), this.load, this),
      commands.registerCommand(extensionId('copy'), this.copy, this),
      commands.registerCommand(extensionId('paste'), this.paste, this),
      commands.registerCommand(extensionId('rename'), this.rename, this),
      commands.registerCommand(
        extensionId('runShellCommand'),
        this.runShellCommand,
        this,
      ),
    )

    Output.info('Creating Scrap Extension')
    this.load()
  }

  dispose() {
    Output.info('Disposing of Scrap Extension')
    this.repository.dispose()
  }

  async addScrap() {
    const kind = await showKindQuickPick()
    if (kind !== undefined) {
      return await this.edit(ScrapFactory.createDefault(kind))
    }
  }

  async edit(scrap: Scrap<any>) {
    Output.info(`Editing ${scrap}`)
    const result = await showEditScrapPanel(scrap)
    Output.info(`Scrap edit result ${result}`)
    if (result !== undefined) {
      await this.repository.addOrUpdate(result)
    }
  }

  private async _getScrapsPath() {
    const fsPath = workspace.getConfiguration(extensionId()).get<string>('path')
    if (fsPath) {
      const path = Uri.file(
        fsPath.replaceAll(
          '${workspaceFolder}',
          workspace.workspaceFolders?.[0].uri.fsPath ?? '',
        ),
      )
      return path
    }
    return undefined
  }

  async save() {
    const path = await this._getScrapsPath()
    if (path === undefined) {
      Output.error('save: Cannot resolve scraps path')
      return
    }
    Output.info(`Saving scraps to ${path}`)
    const te = new TextEncoder()
    const data = this.repository.serialize()
    const content =
      this._context.extensionMode === ExtensionMode.Development
        ? JSON.stringify(data, undefined, 2)
        : JSON.stringify(data)
    Output.debug(content)
    await workspace.fs.writeFile(path, te.encode(content))
  }

  async load() {
    const path = await this._getScrapsPath()
    if (path === undefined) {
      Output.error('load: Cannot resolve scraps path')
      return
    }
    Output.info(`Loading scraps from ${path}`)
    const td = new TextDecoder()
    const data = td.decode(await workspace.fs.readFile(path))
    await this.repository.deserialize(JSON.parse(data))
  }

  async runShellCommand(command: string) {
    let terminal =
      window.activeTerminal ??
      window.createTerminal({location: {viewColumn: ViewColumn.Beside}})
    terminal.show()
    terminal.sendText(command, true)
  }

  async copy(...args: Scrap<any>[]) {
    Output.info(`copy: ${args}`)
    await this.repository.copyToClipboard(...args.filter(x => x !== undefined))
  }

  async paste(...args: Scrap<any>[]) {
    Output.info(`paste: ${args}`)
    await this.repository.pasteFromClipboard(
      ...args.filter(x => x !== undefined),
    )
  }

  async rename(scrap: Scrap<any>) {
    const name = await showRenameInput(scrap)
    if (name === undefined) {
      return
    }

    scrap.state.name = name
    await this.repository.addOrUpdate(scrap)
  }
}
