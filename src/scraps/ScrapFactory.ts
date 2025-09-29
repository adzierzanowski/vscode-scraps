import {Uri} from 'vscode'
import {
  FileScrap,
  FileScrapState,
  GroupScrap,
  GroupScrapState,
  LinkScrap,
  LinkScrapState,
  NoteScrap,
  NoteScrapState,
  ShellScrap,
  ShellScrapState,
  TodoScrap,
  TodoScrapState,
  VSCommandScrap,
  VSCommandScrapState,
} from './concrete'
import {UUID} from 'crypto'
import {Output} from '../extension'
import {ScrapDTO, ScrapKind} from './types'

export class ScrapFactory {
  static createDefault(kind: ScrapKind) {
    switch (kind) {
      case 'File':
        return new FileScrap({uri: Uri.file('')})
      case 'Group':
        return new GroupScrap({collapsed: true})
      case 'Link':
        return new LinkScrap({uri: Uri.parse('about:blank')})
      case 'Note':
        return new NoteScrap({collapsed: true, content: ''})
      case 'Shell':
        return new ShellScrap({command: 'false'})
      case 'Todo':
        return new TodoScrap({checked: false, collapsed: true})
      case 'VSCommand':
        return new VSCommandScrap({commandId: 'noop', args: ''})
    }
  }

  static fromDTO<T extends {}>(dto_: ScrapDTO<T>) {
    console.log('from DTO', dto_.kind)
    switch (dto_.kind as ScrapKind) {
      case 'File': {
        const dto = dto_ as ScrapDTO<FileScrapState>
        return new FileScrap(
          {
            uri: Uri.parse(dto?.uri ?? 'file://'),
            description: dto.description,
            name: dto.name,
            createdAt: dto.createdAt ? parseInt(dto.createdAt) : undefined,
            modifiedAt: dto.modifiedAt ? parseInt(dto.modifiedAt) : undefined,
          },
          dto.id as UUID | undefined,
        )
      }

      case 'Group': {
        const dto = dto_ as ScrapDTO<GroupScrapState>
        return new GroupScrap(
          {
            collapsed: dto.collapsed === 'true',
            description: dto.description,
            name: dto.name,
            color: dto.color,
            createdAt: dto.createdAt ? parseInt(dto.createdAt) : undefined,
            modifiedAt: dto.modifiedAt ? parseInt(dto.modifiedAt) : undefined,
          },
          dto.id as UUID | undefined,
        )
      }

      case 'Link': {
        const dto = dto_ as ScrapDTO<LinkScrapState>
        return new LinkScrap(
          {
            uri: Uri.parse(dto?.uri ?? 'about:blank', false),
            description: dto.description,
            name: dto.name,
            createdAt: dto.createdAt ? parseInt(dto.createdAt) : undefined,
            modifiedAt: dto.modifiedAt ? parseInt(dto.modifiedAt) : undefined,
          },
          dto.id as UUID | undefined,
        )
      }

      case 'Note': {
        const dto = dto_ as ScrapDTO<NoteScrapState>
        return new NoteScrap(
          {
            collapsed: true,
            content: dto?.content ?? '',
            description: dto.description,
            name: dto.name,
            createdAt: dto.createdAt ? parseInt(dto.createdAt) : undefined,
            modifiedAt: dto.modifiedAt ? parseInt(dto.modifiedAt) : undefined,
          },
          dto.id as UUID | undefined,
        )
      }

      case 'Shell': {
        const dto = dto_ as ScrapDTO<ShellScrapState>
        return new ShellScrap(
          {
            command: dto?.command ?? 'false',
            description: dto.description,
            name: dto.name,
            createdAt: dto.createdAt ? parseInt(dto.createdAt) : undefined,
            modifiedAt: dto.modifiedAt ? parseInt(dto.modifiedAt) : undefined,
          },
          dto.id as UUID | undefined,
        )
      }

      case 'Todo': {
        const dto = dto_ as ScrapDTO<TodoScrapState>
        return new TodoScrap(
          {
            checked: dto.checked === 'true',
            collapsed: dto.collapsed === 'true',
            description: dto.description,
            name: dto.name,
            createdAt: dto.createdAt ? parseInt(dto.createdAt) : undefined,
            modifiedAt: dto.modifiedAt ? parseInt(dto.modifiedAt) : undefined,
          },
          dto.id as UUID | undefined,
        )
      }

      case 'VSCommand': {
        const dto = dto_ as ScrapDTO<VSCommandScrapState>
        let args: any = dto.args

        if (args !== undefined) {
          try {
            args = JSON.parse(args)
          } catch {
            args = args.split(',')
          }
        }

        return new VSCommandScrap(
          {
            commandId: dto.commandId ?? 'noop',
            description: dto.description,
            name: dto.name,
            args,
            createdAt: dto.createdAt ? parseInt(dto.createdAt) : undefined,
            modifiedAt: dto.modifiedAt ? parseInt(dto.modifiedAt) : undefined,
          },
          dto.id as UUID | undefined,
        )
      }
    }
  }

  static fromUri(uri: Uri) {
    switch (uri.scheme) {
      case 'file':
        return new FileScrap({
          uri,
          description: uri.toString(),
          name: uri.path.split('/').at(-1),
        })
      default:
        return new LinkScrap({
          uri,
        })
    }
  }

  static fromString(s: string) {
    if (/^\w+:/g.test(s)) {
      return ScrapFactory.fromUri(Uri.parse(s))
    }

    try {
      const dto = JSON.parse(s)
      console.log({dto})
      if (dto instanceof Array) {
        return dto.map(d => {
          ;(d as ScrapDTO<any>).id = undefined
          return ScrapFactory.fromDTO(d)
        })
      }
    } catch (err) {
      Output.error(`${err}`)
    }

    return new NoteScrap({collapsed: false, content: s})
  }
}
