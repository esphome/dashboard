import * as monaco from "monaco-editor/esm/vs/editor/editor.api";
import { CompletionsHandler } from "./completions-handler";
import { DefinitionHandler } from "./definition-handler";
import { fromMonacoPosition } from "./editor-shims";
import { ESPHomeDocuments } from "./esphome-document";
import { HoverHandler } from "./hover-handler";
import { TextBuffer } from "./utils/text-buffer";

const documents = new ESPHomeDocuments();

const hoverHandler = new HoverHandler(documents);
monaco.languages.registerHoverProvider("yaml", {
  provideHover: async function (model, position) {
    documents.update(model.uri.toString(), new TextBuffer(model));
    const hover = await hoverHandler.getHover(
      model.uri.toString(),
      fromMonacoPosition(position)
    );
    return hover;
  },
});

const completionsHandler = new CompletionsHandler(documents);
monaco.languages.registerCompletionItemProvider("yaml", {
  provideCompletionItems: async function (model, position) {
    documents.update(model.uri.toString(), new TextBuffer(model));
    const completions = await completionsHandler.getCompletions(
      model.uri.toString(),
      fromMonacoPosition(position)
    );
    return { suggestions: completions };
  },
});

const definitionHandler = new DefinitionHandler(documents);
monaco.languages.registerDefinitionProvider("yaml", {
  provideDefinition: async function (model, position) {
    documents.update(model.uri.toString(), new TextBuffer(model));
    const ret = await definitionHandler.getDefinition(
      model.uri.toString(),
      fromMonacoPosition(position)
    );
    if (!ret) return;

    return {
      uri: model.uri,
      range: {
        startLineNumber: ret.range.start.line + 1,
        startColumn: ret.range.start.character + 1,
        endLineNumber: ret.range.end.line + 1,
        endColumn: ret.range.end.character + 1,
      },
    };
  },
});

monaco.editor.defineTheme("esphome", {
  base: "vs", // can also be vs-dark or hc-black
  inherit: true, // can also be false to completely replace the builtin rules
  rules: [{ token: "type", foreground: "000099", fontStyle: "" }],

  colors: {
    "editor.foreground": "#000000",
  },
});

monaco.editor.defineTheme("esphome-dark", {
  base: "vs-dark",
  inherit: true,
  rules: [{ token: "type", foreground: "E8E8E9", fontStyle: "" }],

  colors: {
    "editor.foreground": "#E8E8E9",
  },
});
