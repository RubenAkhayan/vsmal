import * as vscode from 'vscode';
import {MaSettings} from './protocol';

let subscriptions : vscode.Disposable[] = [];

export function unload() {
  subscriptions.forEach((x) => x.dispose());
  subscriptions = [];
}

export const regExpQualifiedMaIdent = /((\p{L}|[_\u00A0])(\p{L}|[0-9_\u00A0'])*)(\.((\p{L}|[_\u00A0])(\p{L}|[0-9_\u00A0'])*))*/u;

export function reload() : vscode.Disposable {
  unload();
  const matchNothing = /a^/;

  // tslint:disable-next-line:no-any
  const settings = vscode.workspace.getConfiguration('ma') as any as MaSettings;

  const increaseIndentPatternParts : string[] = [];
  const increaseIndentRE = settings.format.enable && increaseIndentPatternParts.length > 0
    ? new RegExp(String.raw `^\s*${increaseIndentPatternParts.join('|')}`)
    : matchNothing;

  subscriptions.push(vscode.languages.setLanguageConfiguration('ma', {
    indentationRules: { increaseIndentPattern: increaseIndentRE, decreaseIndentPattern: matchNothing },
    wordPattern: regExpQualifiedMaIdent,
  }));

  if(settings.format.enable) {
    const editProviders: { fun: (doc: vscode.TextDocument, pos: vscode.Position, ch: string, options: vscode.FormattingOptions, token: vscode.CancellationToken) => vscode.TextEdit[] | undefined, trigger: string}[] = [];

    if (editProviders.length > 0) {
      subscriptions.push(vscode.languages.registerOnTypeFormattingEditProvider('ma', {
        provideOnTypeFormattingEdits: (document,position,ch,options,token) : vscode.TextEdit[] | Thenable<vscode.TextEdit[]> => {
          for(let ep of editProviders) {
            const editors = ep.fun(document,position,ch,options,token);
            if(editors) {
              return editors;
            }
          }
          return [];
      }}, editProviders[0].trigger, ...editProviders.map((x) => x.trigger)));
    }

  }

  return { dispose: () => unload() };
}
