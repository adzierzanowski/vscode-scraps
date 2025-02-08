import {
  ExtensionContext,
  LogOutputChannel,
  Uri,
  window,
  workspace,
} from 'vscode'
import {ScrapExtension} from './ScrapExtension'

export let Output: LogOutputChannel
export let extensionUri: Uri

export function activate(context: ExtensionContext) {
  Output = window.createOutputChannel('Scraps', {log: true})
  extensionUri = context.extensionUri

  context.subscriptions.push(new ScrapExtension(context))
}

export function deactivate() {
  Output.dispose()
}
