import * as monaco from "monaco-editor/esm/vs/editor/editor.api";
import {
  fromMonacoPosition,
  Position,
  toMonacoPosition,
} from "../editor-shims";

export class TextBuffer {
  constructor(private doc: monaco.editor.ITextModel) {}

  getLineCount(): number {
    return this.doc.getLineCount();
  }

  getLineLength(lineNumber: number): number {
    return this.doc.getLineLength(lineNumber + 1);
  }

  getLineContent(lineNumber: number): string {
    return this.doc.getLineContent(lineNumber + 1);
  }

  getLineCharCode(lineNumber: number, index: number): number {
    return this.doc.getLineContent(lineNumber + 1).charCodeAt(index);
  }

  getText(): string {
    return this.doc.getValue();
  }

  getPosition(offset: number): Position {
    return fromMonacoPosition(this.doc.getPositionAt(offset));
  }

  offsetAt(position: Position) {
    return this.doc.getOffsetAt({
      lineNumber: position.line + 1,
      column: position.character + 1,
    });
  }

  getWordUntilPosition(position: Position) {
    return this.doc.getWordUntilPosition(toMonacoPosition(position));
  }
}
