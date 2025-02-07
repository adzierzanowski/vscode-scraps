import {window, ViewColumn, Uri, workspace, commands} from 'vscode'
import {Output} from './extension'
import {
  ScrapState,
  Scrap,
  ScrapFactory,
  ScrapKind,
  ScrapKindMeta,
} from './scraps'
import {extensionId, extensionPath} from './utils'
import {off} from 'process'

export const showEditScrapPanel = async <T extends ScrapState>(
  scrap: Scrap<T>,
): Promise<Scrap<T> | undefined> => {
  return await new Promise(async resolve => {
    const panel = window.createWebviewPanel(
      extensionId('editor'),
      `Edit Scrap: ${scrap}`,
      {
        viewColumn: ViewColumn.Active,
        preserveFocus: false,
        // this._context.extensionMode === ExtensionMode.Development
        //   ? ViewColumn.Active
        //   : ViewColumn.Beside,
      },
      {enableScripts: true}, //, retainContextWhenHidden: true}
    )
    panel.iconPath = extensionPath('assets', 'icons', 'file-media.svg')
    const editorsPath = extensionPath('assets', 'editors')

    const webview = panel.webview

    const headerUri = Uri.joinPath(editorsPath, 'header.html')
    const contentUri = Uri.joinPath(editorsPath, `${scrap.kind}.html`)
    const footerUri = Uri.joinPath(editorsPath, 'footer.html')

    const header = await workspace.fs.readFile(headerUri)
    const content = await workspace.fs.readFile(contentUri)
    const footer = await workspace.fs.readFile(footerUri)

    const td = new TextDecoder()
    webview.html = td.decode(header) + td.decode(content) + td.decode(footer)
    webview.postMessage(JSON.stringify(scrap.dto, undefined, 2))
    webview.onDidReceiveMessage(e => {
      Output.info(e)
      switch (e.action) {
        case 'save':
          const editedScrap = ScrapFactory.fromDTO(e.payload)
          Output.info(`Edited scrap: ${editedScrap}`)
          resolve(editedScrap as unknown as Scrap<T>)
          break
        case 'discard':
          resolve(undefined)
          break
      }

      panel.dispose()
    })
  })
}

export const showKindQuickPick = async (): Promise<ScrapKind | undefined> => {
  return new Promise(async resolve => {
    const qp = window.createQuickPick()
    qp.items = Object.entries(ScrapKindMeta).map(([kind, meta]) => ({
      label: kind,
      alwaysShow: true,
      iconPath: meta.icon,
      description: meta.description,
    }))
    qp.onDidAccept(() => {
      resolve(qp.activeItems?.[0].label as ScrapKind)
      qp.dispose()
    })
    qp.onDidHide(() => {
      resolve(undefined)
      qp.dispose()
    })
    qp.show()
  })
}
export const showRenameInput = async (
  scrap: Scrap<any>,
): Promise<string | undefined> => {
  return await window.showInputBox({
    prompt: 'prompt',
    title: 'title',
    value: scrap.state.name,
  })
}
