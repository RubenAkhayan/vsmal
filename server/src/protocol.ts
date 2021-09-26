'use strict';
import { RequestType, NotificationType } from 'vscode-jsonrpc';
import * as vscode from 'vscode-languageserver-types';

export interface DocumentFilter {
  language?: string,
  pattern?: string,
  scheme?: string,
}
export type DocumentSelector = string | DocumentFilter | (string | DocumentFilter)[];

/** The substitution settings for a language (or group of languages) */
export interface LanguageEntry {
  /** language(s) to apply these substitutions on */
  language:  DocumentSelector;
  /** substitution rules */
  substitutions: Substitution[];
}

export interface PrettifySymbolsModeSettings {
  substitutions: LanguageEntry[],
}

// The settings interface describe the server relevant settings part
export interface Settings {
  matop: MaTopSettings,
  ma: MaSettings,
  prettifySymbolsMode?: PrettifySymbolsModeSettings,
}

export interface MaTopSettings {
  binPath: string;
  /** A list of arguments to send to matop. @default `[]` */
  args: string[];
}

export interface AutoFormattingSettings {
  enable: boolean, // mast switch
  // indentAfterBullet: 'none' | 'indent' | 'align',
}

export interface MaSettings {
  format: any,
  intelliSense:string[],
  loadMaProject: boolean,
  maProjectRoot: string,
}

export interface FailValue {
  message: AnnotatedText;
  range?: vscode.Range;
  sentence: vscode.Range;
}

export enum SetDisplayOption {
  On, Off, Toggle
}
export enum DisplayOption {
  ImplicitArguments,
  Coercions,
  RawMatchingExpressions,
  Notations,
  AllBasicLowLevelContents,
  ExistentialVariableInstances,
  UniverseLevels,
  AllLowLevelContents,
}

export interface MaTopParams {
  uri: string;
}

export interface Substitution {
  ugly: string;        // regular expression describing the text to replace
  pretty: string;      // plain-text symbol to show instead
  pre?: string;        // regular expression guard on text before "ugly"
  post?: string;       // regular expression guard on text after "ugly"
  style?: any;         // stylings to apply to the "pretty" text, if specified, or else the ugly text
}

export type TextDifference = 'added'|'removed';

export interface TextAnnotation {
  /** the relationship this text has to the text of another state */
  diff?: TextDifference,
  /** what to display instead of this text */
  substitution?: string,
  /** the underlying text, possibly with more annotations */
  text: string
}

export interface ScopedText {
  /** A scope identifier */
  scope: string,
  /** Extra stuff */
  attributes?: any,
  /** the underlying text, possibly with more annotations */
  text: AnnotatedText,
}

export type AnnotatedText = string | TextAnnotation | ScopedText | (string | TextAnnotation | ScopedText)[];

export enum HypothesisDifference { None, Changed, New, MovedUp, MovedDown }
export interface Hypothesis {
  identifier: string;
  relation: string;
  expression: AnnotatedText;
  diff: HypothesisDifference;
}
export interface Goal {
  id: string;
  hypotheses: Hypothesis[];
  goal: AnnotatedText;
}
export interface UnfocusedGoalStack {
  // subgoals that appear before the focus
  before: Goal[];
  // reference to the more-focused background goals
  next?: UnfocusedGoalStack;
  // subgoals that appear after the focus
  after: Goal[];
}
export interface ProofView {
  goals: Goal[];
  backgroundGoals?: UnfocusedGoalStack,
  shelvedGoals: Goal[],
  abandonedGoals: Goal[],
  focus: vscode.Position,
}

export interface CommandInterrupted {
  range: vscode.Range;
}

export type FocusPosition = {focus: vscode.Position};
export type NotRunningTag = {type: 'not-running'};
export type NoProofTag = {type: 'no-proof'};
export type FailureTag = {type: 'failure'};
export type ProofViewTag = {type: 'proof-view'};
export type InterruptedTag = {type: 'interrupted'};
export type BusyTag = {type: 'busy'};
export type NotRunningResult = NotRunningTag & {reason: 'not-started'|'spawn-failed', matop?: string};
export type BusyResult = BusyTag;
export type NoProofResult = NoProofTag;
export type FailureResult = FailValue & FailureTag;
export type ProofViewResult = ProofView & ProofViewTag;
export type InterruptedResult = CommandInterrupted & InterruptedTag;
export type CommandResult =
  NotRunningResult |
  (BusyResult & FocusPosition) |
  (FailureResult & FocusPosition) |
  (ProofViewResult & FocusPosition) |
  (InterruptedResult & FocusPosition) |
  (NoProofResult & FocusPosition);

export namespace QuitMaRequest {
  export const type = new RequestType<MaTopParams, void, void, void>('matop/quitMa');
}

// testRequest
export namespace testRequest {
  export const type = new RequestType<MaTopParams, CommandResult, void, void>('matop/test');
}
export namespace openDotParserRequest {
  export const type = new RequestType<MaTopParams, CommandResult, void, void>('matop/openDotParser');
}

export interface MaTopResizeWindowParams extends MaTopParams {
  columns: number;
}
export namespace ResizeWindowRequest {
  export const type = new RequestType<MaTopResizeWindowParams, void, void, void>('matop/resizeWindow');
}

export interface MaTopSetDisplayOptionsParams extends MaTopParams {
  options: {item: DisplayOption, value: SetDisplayOption}[];
}
export namespace SetDisplayOptionsRequest {
  export const type = new RequestType<MaTopSetDisplayOptionsParams, void, void, void>('matop/setDisplayOptions');
}

export interface NotificationParams {
  uri: string;
}

export interface Highlights {
  ranges: [vscode.Range[],vscode.Range[],vscode.Range[],vscode.Range[],vscode.Range[],vscode.Range[]];
}

export type NotifyHighlightParams = NotificationParams & Highlights;

export interface NotifyMessageParams extends NotificationParams {
  level: string;
  message: AnnotatedText;
}


export namespace MaMessageNotification {
  export const type = new NotificationType<NotifyMessageParams,void>('matop/message');
}

export enum MatopStopReason { UserRequest, Anomaly, InternalError }
export interface NotifyMatopStopParams extends NotificationParams {
  reason: MatopStopReason;
  message?: string;
}

export interface DocumentPositionParams extends NotificationParams {
  position: vscode.Position;
}

export enum ComputingStatus {Finished, Computing, Interrupted}
