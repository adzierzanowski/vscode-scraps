import {Uri, workspace} from 'vscode'
import {Scrap, ScrapDTO, ScrapKind, ScrapState} from './Scrap'
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
        return new VSCommandScrap({commandId: 'noop'})
    }
  }

  static fromDTO<T extends ScrapState>(dto_: ScrapDTO<T>) {
    switch (dto_.kind as ScrapKind) {
      case 'File': {
        const dto = dto_ as ScrapDTO<FileScrapState>
        return new FileScrap(
          {
            uri: Uri.parse(dto?.uri ?? 'file://'),
            description: dto.description,
            name: dto.name,
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
          },
          dto.id as UUID | undefined,
        )
      }

      case 'Link': {
        const dto = dto_ as ScrapDTO<LinkScrapState>
        return new LinkScrap(
          {
            uri: Uri.parse(dto?.uri ?? 'about:blank'),
            description: dto.description,
            name: dto.name,
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
          },
          dto.id as UUID | undefined,
        )
      }

      case 'VSCommand': {
        const dto = dto_ as ScrapDTO<VSCommandScrapState>
        return new VSCommandScrap(
          {
            commandId: dto.commandId ?? 'noop',
            description: dto.description,
            name: dto.name,
            args: dto.args?.split(','),
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
}
