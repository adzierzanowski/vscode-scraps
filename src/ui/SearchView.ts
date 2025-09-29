import {
  ViewColumn,
  window,
  WebviewPanel,
  Uri,
  workspace,
  EventEmitter,
} from 'vscode'
import {
  Scrap,
  ScrapEventArg,
  ScrapKind,
  ScrapKindMeta,
  ScrapRepository,
  ScrapSortingMethod,
} from '../scraps'
import {extensionId, extensionPath} from '../utils'

export class SearchView {
  repo: ScrapRepository
  view?: WebviewPanel
  query: string = ''
  sortingMethod: ScrapSortingMethod
  kindFilter: ScrapKind[] = Object.keys(ScrapKindMeta) as ScrapKind[]
  private _onDidClickScrap: EventEmitter<Scrap<any>> = new EventEmitter()
  onDidClickScrap = this._onDidClickScrap.event

  constructor(repo: ScrapRepository) {
    this.repo = repo
    this.sortingMethod =
      workspace.getConfiguration(extensionId()).get('sortingMethod') ??
      'Default'
  }

  async show() {
    if (this.view) {
      this.view.dispose()
    }
    this.view = window.createWebviewPanel(
      extensionId('searchView'),
      'Scrap Search',
      {
        viewColumn: ViewColumn.Active,
      },
      {
        enableScripts: true,
        enableCommandUris: true,
        retainContextWhenHidden: true,
      },
    )

    this.view.webview.html = (await this.getHTML()).replace(
      '%codiconsCss%',
      `${this.view.webview.asWebviewUri(
        extensionPath('assets', 'codicons', 'codicon.css'),
      )}`,
    )

    this.view.webview.onDidReceiveMessage(this.onMessage, this)
    await this.updateView()
  }

  async onMessage(msg: any) {
    switch (msg.kind) {
      case 'state':
        console.log('state msg', msg)
        this.query = msg.state.query
        this.kindFilter = msg.state.kindFilter
        this.sortingMethod = msg.state.sortingMethod
        await this.updateView()
        break

      case 'click':
        console.log('click msg', msg)
        const scrap = this.repo.getScrapById(msg.id)
        if (scrap) {
          this._onDidClickScrap.fire(scrap)
        }
        break
    }
  }

  async updateView() {
    const scraps = this.repo.search(
      this.query,
      this.kindFilter,
      this.sortingMethod,
    )

    this.view?.webview.postMessage(scraps.map(s => this.scrapHTMLElement(s)))
  }

  scrapHTMLElement(scrap: Scrap<any>) {
    let color = ''
    if (scrap.kind === 'Group') {
      color = ` style="color: var(--vscode-doublefloat-scraps\\.color\\.${scrap.state.color});"`
    }

    return `
    <div class="scrap" id="${scrap.id}">
      <div class="scrap__header">
        <div class="scrap__title">
          <i class="codicon codicon-${
            ScrapKindMeta[scrap.kind].icon.id
          }" ${color}></i>
          ${scrap.state.name}
        </div>
        <div class="scrap__date">
          <div>
            <i class="codicon codicon-clock"></i> ${scrap.createdAtString}
          </div>
          <div>
            <i class="codicon codicon-pencil"></i> ${scrap.modifiedAtString}
          </div>
        </div>
      </div>
    </div>`
  }

  async getHTML() {
    const htmlPath = Uri.joinPath(
      extensionPath('assets', 'search', 'search.html'),
    )
    const htmlData = await workspace.fs.readFile(htmlPath)
    const td = new TextDecoder()
    return td.decode(htmlData)
  }
}
