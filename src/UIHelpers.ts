import {
  window,
  ViewColumn,
  Uri,
  workspace,
  ThemeIcon,
  QuickPickItem,
  ThemeColor,
  Color,
  QuickPickItemKind,
} from 'vscode'
import {Output} from './extension'
import {
  Scrap,
  ScrapFactory,
  ScrapKind,
  ScrapKindMeta,
  ScrapSortingMethods,
  ScrapSortingMethod,
  ScrapRepository,
  ScrapQpItem,
} from './scraps'
import {extensionId, extensionPath} from './utils'

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
export const scrapSortingQpItems: {
  [key in ScrapSortingMethod]: QuickPickItem & {method: ScrapSortingMethod}
} = {
  Default: {
    label: 'Default',
    description: 'Scraps order unchanged',
    iconPath: new ThemeIcon('graph-scatter'),
    method: 'Default',
  },
  CreatedAtAsc: {
    label: 'Oldest First',
    description: 'Order scraps by creation date $(arrow-small-down)',
    iconPath: new ThemeIcon('clock'),
    method: 'CreatedAtAsc',
  },
  CreatedAtDesc: {
    label: 'Newest First',
    description: 'Order scraps by creation date $(arrow-small-up)',
    iconPath: new ThemeIcon('clock'),
    method: 'CreatedAtDesc',
  },
  ModifiedAtAsc: {
    label: 'Recently Modified First',
    description: 'Order scraps by modification date $(arrow-small-up)',
    iconPath: new ThemeIcon('pencil'),
    method: 'ModifiedAtAsc',
  },
  ModifiedAtDesc: {
    label: 'Recently Modified Last',
    description: 'Order scraps by modification date $(arrow-small-down)',
    iconPath: new ThemeIcon('pencil'),
    method: 'ModifiedAtDesc',
  },
  NameAsc: {
    label: 'A-Z',
    description: 'Order scraps by name $(arrow-small-down)',
    iconPath: new ThemeIcon('symbol-text'),
    method: 'NameAsc',
  },
  NameDesc: {
    label: 'Z-A',
    description: 'Order scraps by name $(arrow-small-up)',
    iconPath: new ThemeIcon('symbol-text'),
    method: 'NameDesc',
  },
}

export const showSortingQuickPick = async () => {
  return new Promise(resolve => {
    const qp = window.createQuickPick()

    const current = workspace
      .getConfiguration(extensionId())
      .get('sortingMethod')

    // const currentIcon = new ThemeIcon('circle-large-filled')
    //

    qp.items = Object.entries(ScrapSortingMethods).map(([name, method]) => {
      const item = {...scrapSortingQpItems[name as ScrapSortingMethod]}
      if (current === name) {
        item.description = 'current $(dash) ' + item.description
      }
      return item
    })

    qp.show()
    qp.onDidAccept(() => {
      const item = qp.activeItems?.[0] as QuickPickItem & {
        method: ScrapSortingMethod
      }
      resolve(item.method)
      qp.dispose()
    })
    qp.onDidHide(() => {
      resolve(undefined)
      qp.dispose()
    })
    qp.show()
  })
}

export const showSearch = async (
  repo: ScrapRepository,
): Promise<ScrapQpItem | undefined> => {
  return new Promise(resolve => {
    const qp = window.createQuickPick()
    type SearchSection = 'search' | 'filter' | 'sort' | 'tags'
    let section: SearchSection = 'search'

    let sortingMethod: ScrapSortingMethod =
      workspace
        .getConfiguration(extensionId())
        .get<ScrapSortingMethod>('sortingMethod') || 'Default'
    let kindFilters: ScrapKind[] = Object.keys(ScrapKindMeta) as ScrapKind[]

    const searchSection = () => {
      qp.matchOnDetail = true
      qp.title = 'Search'
      qp.buttons = [
        {
          iconPath: new ThemeIcon('search'),
          tooltip: 'search',
        },
        {
          iconPath: new ThemeIcon('filter'),
          tooltip: 'filter',
        },
        ...Object.values(scrapSortingQpItems).map(item => ({
          tooltip: item.label,
          iconPath: item.iconPath!,
        })),
        // {
        //   iconPath: new ThemeIcon('sort-precedence'),
        //   tooltip: 'sort',
        // },
        // {
        //   iconPath: new ThemeIcon('tag'),
        //   tooltip: 'tags',
        // },
      ]
      qp.canSelectMany = false
      const items = repo.search(qp.value, kindFilters, sortingMethod)
      qp.items = items.map(scrap => scrap.qpItem)
      qp.onDidAccept(() => {
        // resolve(qp.activeItems?.[0].label)
        resolve(qp.activeItems?.[0] as ScrapQpItem)
        qp.dispose()
      })
    }

    const filterSection = () => {
      qp.canSelectMany = true
      qp.title = 'Search: Filter by Kind'
      qp.items = Object.entries(ScrapKindMeta).map(([kind, meta]) => ({
        label: kind,
        alwaysShow: true,
        description: meta.description,
        iconPath: meta.icon,
      }))
      qp.selectedItems = qp.items.filter(item =>
        kindFilters.includes(item.label as ScrapKind),
      )
    }

    const sortSection = () => {
      qp.canSelectMany = false
      qp.title = 'Search: Sort'
      qp.items = Object.entries(ScrapSortingMethods).map(
        ([name, method]) => scrapSortingQpItems[name as ScrapSortingMethod],
      )
    }

    const tagSection = () => {}

    qp.onDidTriggerButton(e => {
      section = e.tooltip as SearchSection
      switch (section) {
        case 'search':
          searchSection()
          break
        case 'filter':
          filterSection()
          break
        case 'sort':
          sortSection()
          break
        case scrapSortingQpItems.Default.label:
          sortingMethod = scrapSortingQpItems.Default.method
          searchSection()
          break
        case scrapSortingQpItems.CreatedAtAsc.label:
          sortingMethod = scrapSortingQpItems.CreatedAtAsc.method
          searchSection()
          break
        case scrapSortingQpItems.CreatedAtDesc.label:
          sortingMethod = scrapSortingQpItems.CreatedAtDesc.method
          searchSection()
          break
        case scrapSortingQpItems.ModifiedAtAsc.label:
          sortingMethod = scrapSortingQpItems.ModifiedAtAsc.method
          searchSection()
          break
        case scrapSortingQpItems.ModifiedAtDesc.label:
          sortingMethod = scrapSortingQpItems.ModifiedAtDesc.method
          searchSection()
          break
        case scrapSortingQpItems.NameAsc.label:
          sortingMethod = scrapSortingQpItems.NameAsc.method
          searchSection()
          break
        case scrapSortingQpItems.NameDesc.label:
          sortingMethod = scrapSortingQpItems.NameDesc.method
          searchSection()
          break
        case 'tags':
          tagSection()
          break
      }
    })

    searchSection()
    qp.show()

    qp.onDidAccept(() => {
      switch (section) {
        case 'search':
          // resolve(qp.activeItems?.[0].label)
          resolve(qp.activeItems?.[0] as ScrapQpItem)
          qp.dispose()
          break

        case 'filter':
          kindFilters = qp.selectedItems.map(item => item.label) as ScrapKind[]
          section = 'search'
          searchSection()
          break

        case 'sort':
          sortingMethod = qp.selectedItems[0].label as ScrapSortingMethod
          section = 'search'
          searchSection()
          break
      }
    })

    qp.onDidHide(() => {
      resolve(undefined)
      qp.dispose()
    })

    qp.show()
  })
}
