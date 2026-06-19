import * as monaco from "monaco-editor/esm/vs/editor/editor.api";
import { ESPHomeSchema } from "./esphome-schema";

let schema_version = "dev";
const schema_uri = (name: string, version?: string) =>
  `https://schema.esphome.io/${version ?? schema_version}/${name}.json`;

export async function setSchemaVersion(version: string) {
  if (version.endsWith("dev")) schema_version = "dev";
  else {
    // check esphome schema exists for given schema
    const response = await fetch(schema_uri("esphome", version));
    if (response.ok) schema_version = version;
    else
      console.warn(
        `Schema version ${version} not available in schema.esphome.io. Using latest dev schemas instead.`,
      );
  }
}

export const coreSchema = new ESPHomeSchema(async (name: string) => {
  const response = await fetch(schema_uri(name));
  const fileContents = await response.text();
  return JSON.parse(fileContents);
});

export const createHover = (contents: string, range: Range) => {
  return {
    range: new monaco.Range(
      range.start.line + 1,
      range.start.character + 1,
      range.end.line + 1,
      range.end.character + 1,
    ),
    contents: [{ value: contents }],
  };
};

/**
 * Position in a text document expressed as zero-based line and character offset.
 * The offsets are based on a UTF-16 string representation. So a string of the form
 * `a𐐀b` the character offset of the character `a` is 0, the character offset of `𐐀`
 * is 1 and the character offset of b is 3 since `𐐀` is represented using two code
 * units in UTF-16.
 *
 * Positions are line end character agnostic. So you can not specify a position that
 * denotes `\r|\n` or `\n|` where `|` represents the character offset.
 */
export interface Position {
  /**
   * Line position in a document (zero-based).
   */
  line: number;
  /**
   * Character offset on a line in a document (zero-based). Assuming that the line is
   * represented as a string, the `character` value represents the gap between the
   * `character` and `character + 1`.
   *
   * If the character value is greater than the line length it defaults back to the
   * line length.
   */
  character: number;
}

/**
 * A range in a text document expressed as (zero-based) start and end positions.
 *
 * If you want to specify a range that contains a line including the line ending
 * character(s) then use an end position denoting the start of the next line.
 * For example:
 * ```ts
 * {
 *     start: { line: 5, character: 23 }
 *     end : { line 6, character : 0 }
 * }
 * ```
 */
export interface Range {
  /**
   * The range's start position
   */
  start: Position;
  /**
   * The range's end position.
   */
  end: Position;
}

export const fromMonacoPosition = (position: monaco.Position): Position => ({
  line: position.lineNumber - 1,
  character: position.column - 1,
});

export const toMonacoPosition = (position: Position): monaco.IPosition => ({
  lineNumber: position.line + 1,
  column: position.character + 1,
});

export type CompletionItem = monaco.languages.CompletionItem;
export const CompletionItemKind = monaco.languages.CompletionItemKind;
export const CompletionItemInsertTextRule =
  monaco.languages.CompletionItemInsertTextRule;

export const createCompletion = (
  label: string,
  insertText: string,
  kind: monaco.languages.CompletionItemKind,
  documentation: string | undefined = undefined,
  triggerSuggest: boolean = false,
  preselect?: boolean,
  snippet?: boolean,
  sortText?: string,
  detail?: string,
) => {
  const completion: monaco.languages.CompletionItem = {
    label: label,
    insertText: insertText,
    kind,
    range: null!,
    preselect,
    sortText,
    detail,
  };
  if (triggerSuggest) {
    completion.command = {
      title: "chain",
      id: "editor.action.triggerSuggest",
    };
  }
  // use IMarkdownString
  if (documentation) completion.documentation = { value: documentation };
  if (snippet) {
    completion.insertTextRules = CompletionItemInsertTextRule.InsertAsSnippet;
  }
  return completion;
};

export const createCompletionSnippet = (
  label: string,
  insertText: string,
  kind: monaco.languages.CompletionItemKind,
  documentation: string | undefined = undefined,
) => {
  const completion: CompletionItem = {
    label: label,
    insertText: insertText,
    kind,
    insertTextRules: CompletionItemInsertTextRule.InsertAsSnippet,
    documentation,
    range: null!,
  };
  return completion;
};
