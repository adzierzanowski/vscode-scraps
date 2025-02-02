import { ExtensionContext, LogOutputChannel, window, workspace } from 'vscode'
import { ScrapExtension } from './ScrapExtension'


export let Output: LogOutputChannel

export function activate(context: ExtensionContext) {
	Output = window.createOutputChannel('Scraps', { log: true })

	context.subscriptions.push(
		new ScrapExtension(context)
	)

	// workspace.onDidChangeConfiguration(e => {
	// })
}

export function deactivate() {
	Output.dispose()
}
