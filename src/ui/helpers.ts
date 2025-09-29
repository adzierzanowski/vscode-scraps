import {Uri, ViewColumn, window, workspace} from 'vscode'
import {Scrap, ScrapFactory} from '../scraps'
import {extensionId, extensionPath} from '../utils'
import {Output} from '../extension'

export const showEditScrapPanel = async <T extends {}>(
  scrap: Scrap<T>,
): Promise<Scrap<T> | undefined> => {
  return await new Promise(async resolve => {
    const panel = window.createWebviewPanel(
      extensionId('editor'),
      `Edit Scrap: ${scrap}`,
      {
        viewColumn: ViewColumn.Active,
        preserveFocus: false,
      },
      {enableScripts: true},
    )
    panel.iconPath = extensionPath('assets', 'icons', 'file-media.svg')
    const editorsPath = extensionPath('assets', 'editors')

    const webview = panel.webview

    const headerUri = Uri.joinPath(editorsPath, 'header.html')
    const formHeaderUri = Uri.joinPath(editorsPath, 'formHeader.html')
    const contentUri = Uri.joinPath(editorsPath, `${scrap.kind}.html`)
    const footerUri = Uri.joinPath(editorsPath, 'footer.html')

    const header = await workspace.fs.readFile(headerUri)
    const formHeader = await workspace.fs.readFile(formHeaderUri)
    const content = await workspace.fs.readFile(contentUri)
    const footer = await workspace.fs.readFile(footerUri)

    const td = new TextDecoder()
    webview.html =
      td.decode(header) +
      td.decode(formHeader) +
      td.decode(content) +
      td.decode(footer)
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
