import {
  commands,
  Disposable,
  env,
  ExtensionContext,
  ExtensionMode,
  MessageItem,
  TreeItemCheckboxState,
  TreeView,
  Uri,
  ViewColumn,
  window,
  workspace,
  WorkspaceConfiguration,
} from 'vscode'
import {NoteScrap, Scrap, ScrapFactory, ScrapRepository} from './scraps'
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
      commands.registerCommand(extensionId('remove'), this.remove, this),
      commands.registerCommand(extensionId('add'), this.addScrap, this),
      commands.registerCommand(extensionId('edit'), this.edit, this),
      commands.registerCommand(extensionId('save'), this.save, this),
      commands.registerCommand(extensionId('load'), this.load, this),
      commands.registerCommand(extensionId('copy'), this.copy, this),
      commands.registerCommand(extensionId('paste'), this.paste, this),
      commands.registerCommand(extensionId('rename'), this.rename, this),
      commands.registerCommand(extensionId('showNote'), this.showNote, this),
      commands.registerCommand(
        extensionId('addCurrentLineAsScrap'),
        this.addCurrentLineAsScrap,
        this,
      ),
      commands.registerCommand(
        extensionId('runShellCommand'),
        this.runShellCommand,
        this,
      ),
      workspace.registerTextDocumentContentProvider('scrap', this.repository),
    )

    this.repository.onDidChangeTreeData(
      async () => {
        if (this.config.get<boolean>('saveOnChange')) {
          await this.save()
        }
      },
      this,
      this._context.subscriptions,
    )

    Output.info('Creating Scrap Extension')
    this.load()
  }

  dispose() {
    Output.info('Disposing of Scrap Extension')
    this.repository.dispose()
  }

  get config(): WorkspaceConfiguration {
    return workspace.getConfiguration(extensionId())
  }

  private async _getScrapsPath() {
    const fsPath = this.config.get<string>('path')
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

  async remove(...scraps: Scrap<any>[]) {
    const scrapsToRemove = scraps
      .filter(s => s !== undefined)
      .flatMap(s => [s, ...this.repository.getDescendants(s)])
    const confirmSetting = this.config.get<string>('confirmRemoval')
    const showConfirm =
      confirmSetting === 'always' ||
      (scrapsToRemove.length > 1 && confirmSetting === 'many')
    const doRemove = showConfirm
      ? (
          await window.showWarningMessage<MessageItem>(
            `Are you sure you want to remove ${scrapsToRemove.length} scrap${
              scrapsToRemove.length > 1 ? 's' : ''
            }?`,
            {modal: true},
            {title: 'Yes'},
            {title: 'No', isCloseAffordance: true},
          )
        )?.title
      : 'Yes'
    if (doRemove === 'Yes') {
      this.repository.remove(scrapsToRemove)
    }
  }

  async showNote(note: NoteScrap) {
    Output.info(`showing ${note}`)
    await commands.executeCommand(
      'markdown.showPreview',
      Uri.from({scheme: 'scrap', path: note.id}),
    )
  }

  async addCurrentLineAsScrap() {
    let uri = window.activeTextEditor?.document.uri

    if (uri !== undefined) {
      const fragment = `L${window.activeTextEditor?.selection.start.line}`
      uri = Uri.from({scheme: uri.scheme, path: uri.path, fragment})
      this.repository.addOrUpdate(ScrapFactory.fromUri(uri))
    }
  }
}
