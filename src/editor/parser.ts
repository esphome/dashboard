import {
  Parser,
  Composer,
  LineCounter,
  ParseOptions,
  Document,
  DocumentOptions,
  SchemaOptions,
  Node,
  visit,
  isNode,
  isDocument,
  isPair,
  isSeq,
  isScalar,
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

export const getNodeFromPosition = (
  doc: Document,
  positionOffset: number
): Node => {
  let closestNode: Node = doc.contents!;
  visit(doc, (key, node) => {
    //console.log(key, node);
    if (!node) return;
    if (!isNode(node)) {
      return;
    }

    const range = node?.range;
    if (!range) {
      return;
    }
    if (range[0] <= positionOffset && range[1] >= positionOffset) {
      //console.log("**", range[0], range[1], positionOffset, node.toString());
      closestNode = node;
    } else {
      //console.log("--", range[0], range[1], positionOffset, node.toString());
      if (range[0] > positionOffset) return visit.BREAK;
      return visit.SKIP;
    }
    return;
  });

  return closestNode;
};

export const getParent = (
  nodeToFind: Node,
  doc: Document
): Node | undefined => {
  let parentNode: Node | undefined;
  visit(doc, (_, node, path) => {
    if (node === nodeToFind) {
      parentNode = path[path.length - 1] as Node;
      return visit.BREAK;
    }
    return undefined;
  });

  if (isDocument(parentNode)) {
    return undefined;
  }

  return parentNode;
};

export const getPath = (pathNode: Node, doc: Document): (string | number)[] => {
  const path: (string | number)[] = [];
  let child: Node | undefined = undefined;
  let node: Node | undefined = pathNode;
  while (node) {
    if (isPair(node)) {
      if (isScalar(node.key)) {
        // @ts-ignore
        path.push(node.key.value);
      }
    }
    if (isSeq(node) && child !== undefined) {
      path.push(node.items.indexOf(child));
    }
    child = node;
    node = getParent(node, doc);
  }
  return path.reverse();
};

export function isNumber(val: unknown): val is number {
  return typeof val === "number";
}
export function isString(val: unknown): val is string {
  return typeof val === "string";
}
