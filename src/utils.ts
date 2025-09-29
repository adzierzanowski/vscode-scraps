import {Disposable, Uri} from 'vscode'
import {extensionUri} from './extension'

export type Constructor = new (...args: unknown[]) => unknown

export const extensionId = (...parts: string[]) => {
  return ['doublefloat', 'scraps', ...parts].join('.')
}

export const extensionPath = (...parts: string[]) => {
  return Uri.joinPath(extensionUri, ...parts)
}

export const dateFmt = (d: Date) => {
  const now = new Date()
  const intl = new Intl.RelativeTimeFormat()

  const diff = new Date(now.getTime() - d.getTime())

  const years = diff.getFullYear() - 1970
  if (years > 0) {
    return intl.format(-years, 'years')
  }

  const months = diff.getMonth()
  if (months > 0) {
    return intl.format(-months, 'months')
  }

  const days = diff.getDate() - 1
  if (days > 0) {
    return intl.format(-days, 'days')
  }

  const hours = diff.getHours() - 1
  if (hours > 0) {
    return intl.format(-hours, 'hours')
  }

  const minutes = diff.getMinutes()
  if (minutes > 0) {
    return intl.format(-minutes, 'minutes')
  }
  const seconds = diff.getSeconds()
  return intl.format(-seconds, 'seconds')
}
