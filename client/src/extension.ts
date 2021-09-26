'use strict';
import * as vscode from 'vscode';
import { /*TextEditor, TextEditorEdit,*/ ExtensionContext } from 'vscode';
import * as proto from './protocol';
import { MaProject/*, MaDocument*/ } from './MaProject';
import * as intelliSense from './IntelliSense';

import * as editorAssist from './EditorAssist';
import * as psm from './prettify-symbols-mode';

vscode.Range.prototype.toString = function rangeToString(this: vscode.Range) { return `[${this.start.toString()},${this.end.toString()})`; };
vscode.Position.prototype.toString = function positionToString(this: vscode.Position) { return `{${this.line}@${this.character}}`; };

console.log(`MA Extension: process.version: ${process.version}, process.arch: ${process.arch}}`);

let project: MaProject;

export let extensionContext: ExtensionContext;

export function activate(context: ExtensionContext) {
  // console.log(`execArgv: ${process.execArgv.join(' ')}`);
  // console.log(`argv: ${process.argv.join(' ')}`);
  extensionContext = context;

  // Indentation rules
  vscode.languages.setLanguageConfiguration('ma', {
    onEnterRules: [
      {
        beforeText: new RegExp(
          String.raw`
          ^\s*
          (
            (\|) .+
          )
          \s*$
          `.replace(/\s+?/g, '')
        ),
        action: {
          indentAction: vscode.IndentAction.None
        }
      }
    ]
  });

  project = MaProject.create(context);
  context.subscriptions.push(project);

  /*
  function regTCmd(command: string, callback: (textEditor: vscode.TextEditor, edit: vscode.TextEditorEdit, ...args: any[]) => void) {
    context.subscriptions.push(vscode.commands.registerTextEditorCommand('extension.ma.' + command, callback));
  }
  */
  function regCmd(command: string, callback: (...args: any[]) => any, thisArg?: any) {
    context.subscriptions.push(vscode.commands.registerCommand('extension.ma.' + command, callback, thisArg));
  }
  function regProjectCmd(command: string, callback: (...args: any[]) => any, thisArg?: any) {
    context.subscriptions.push(vscode.commands.registerCommand('extension.ma.' + command, callback, project));
  }

  // initializeDecorations(context);

  regProjectCmd('quit', project.quitMa);
  regProjectCmd('test', project.test);
  regProjectCmd('reset', project.resetMa);
  // regTCmd('query.check', check);
  regCmd('display.toggle.implicitArguments', () => project.setDisplayOption(proto.DisplayOption.ImplicitArguments, proto.SetDisplayOption.Toggle));

  context.subscriptions.push(editorAssist.reload());
  intelliSense.setupIntelliSense(context.subscriptions, project.currentSettings.intelliSense);
  context.subscriptions.push(psm.load());
}

