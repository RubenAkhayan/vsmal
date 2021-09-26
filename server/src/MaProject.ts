import {MaDocument, DocumentCallbacks, TextDocumentItem} from './document';
import {Settings, DocumentSelector} from './protocol';
import * as vscode from 'vscode-languageserver';
import {PrettifySymbolsMode} from './util/PrettifySymbols';
import {TextDocumentPositionParams /*, CompletionItemKind*/} from 'vscode-languageserver';
import * as vscodeLangServer from 'vscode-languageserver';

export class MaProject {
  private maInstances = new Map<string,MaDocument>();
  private currentSettings : Settings;
  private maProjectRoot: string;

  private ready = {event: Promise.resolve<{}>({}), signal: ()=>{} };
  private psm = new PrettifySymbolsMode([]);

  constructor(workspaceRoot: string, private readonly connection: vscode.IConnection) {
    if(workspaceRoot) {
      connection.console.log('Loaded project at ' + workspaceRoot);
    } else {
      connection.console.log('Loading project with no root directory');
    }
    this.maProjectRoot = workspaceRoot; // default is the workspace root
  }

  public get console() : vscode.RemoteConsole {
    return this.connection.console;
  }

  public getMaProjectRoot() : string {
    return this.maProjectRoot;
  }

  public lookup(uri: string) : MaDocument {
    let doc = this.maInstances.get(uri);
    // this.console.log(JSON.stringify(doc));
    if(!doc) {
      throw 'unknown document: ' + uri;
    }
    return doc;
  }

  /* reset the ready promise */
  private notReady() {
     this.ready.event = new Promise<{}>((resolve) => {
       this.ready.signal = () => {
         this.ready = {event: Promise.resolve<{}>({}), signal: ()=>{} };
         resolve() // resolve([]);
        };
     });
  }

  public getPrettifySymbols() : PrettifySymbolsMode {
    return this.psm;
  }

  private matchesMa(selector: DocumentSelector) {
    if(typeof selector === 'string') {
      return selector === 'ma';
    }
    else if(selector instanceof Array) {
      return selector.some((s) => this.matchesMa(s));
    } else {
      return selector.language === 'ma';
    }
  }

  public async updateSettings(newSettings: Settings) {

    this.notReady();
    // this.setMaTop();
    // this.settingsMaTopArgs = newSettings.matop.args;
    this.currentSettings = newSettings;


    if(newSettings.ma.maProjectRoot ){
      this.maProjectRoot = newSettings.ma.maProjectRoot;
      this.console.log('Updated project root to ' + this.getMaProjectRoot());
    }

    if(newSettings.prettifySymbolsMode && newSettings.prettifySymbolsMode.substitutions) {
      for(let entry of newSettings.prettifySymbolsMode.substitutions) {
        if(entry.language && entry.substitutions && this.matchesMa(entry.language)) {
          this.psm = new PrettifySymbolsMode(entry.substitutions);
          break;
        }
      }
    } else {
      this.psm = new PrettifySymbolsMode([]);
    }
    this.ready.signal();
  }

  public async open(textDocument: TextDocumentItem, callbacks: DocumentCallbacks): Promise<MaDocument> {
    await this.ready.event;
    const doc = new MaDocument(this, textDocument, this.console, callbacks);
    // this.console.log('open in the Project');
    // console.log('OPEN in the Project');
    this.maInstances.set(doc.uri, doc);
    return doc;
  }

  public close(uri: string) {
    let doc = this.maInstances.get(uri);
    this.maInstances.delete(uri);
    if(doc) {
      doc.dispose();
    }
  }

  public shutdown() {
    this.maInstances.forEach((x) => x.dispose());
    this.maInstances.clear();
  }

  public get settings() {
    return this.currentSettings;
  }

  public getIntelliSense (textDocumentPositionParams:TextDocumentPositionParams, projectParams: vscodeLangServer.DidChangeTextDocumentParams) : any[]{
    // console.log('getIntelliSense');

    /*
    const uri = projectParams.textDocument.uri;
    const document:any = this.lookup(uri).getText();
    console.log(document);
    console.log(text);
    */
    const text = projectParams.contentChanges[0].text;
    let result: any[] = [];
    if (text !== '.' && text.indexOf('(') < 0) { // In server.ts we also check for .
      result = this.currentSettings.ma.intelliSense;
    }
    result = result;

    /*
    // Test
    result = [];
    result.push(
      {
        label: 'Test1',
        // kind: CompletionItemKind.Field,
        kind: 1,
        data: 'Data1'
      }
    );
    */

    return result;
  }

}
