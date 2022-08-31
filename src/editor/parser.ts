import {
  Parser,
  Composer,
  LineCounter,
  ParseOptions,
  DocumentOptions,
  SchemaOptions,
} from "yaml";

export function parse(text: string) {
  const options: ParseOptions & DocumentOptions & SchemaOptions = {
    strict: false,
    version: "1.2",
  };
  const composer = new Composer(options);
  const lineCounter = new LineCounter();
  let isLastLineEmpty = false;

  const parser = isLastLineEmpty
    ? new Parser()
    : new Parser(lineCounter.addNewLine);
  const tokens = parser.parse(text);
  const tokensArr = Array.from(tokens);
  const docs = composer.compose(tokensArr, true, text.length);
  const docsArray = Array.from(docs);
  if (docsArray.length > 0) return docsArray[0];
  return undefined;
}
