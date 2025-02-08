import {Disposable, Uri} from 'vscode'
import {extensionUri} from './extension'

export type Constructor = new (...args: unknown[]) => unknown

export const extensionId = (...parts: string[]) => {
  return ['doublefloat', 'scraps', ...parts].join('.')
}

export const extensionPath = (...parts: string[]) => {
  return Uri.joinPath(extensionUri, ...parts)
}
