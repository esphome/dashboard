import * as monaco from "monaco-editor/esm/vs/editor/editor.api";

import { parse } from "./parser";
import {
  isDocument,
  isMap,
  visit,
  Node,
  isNode,
  Document,
  isScalar,
  isPair,
  isSeq,
} from "yaml";
import { ConfigVar, coreSchema } from "./core-schema";

function isNumber(val: unknown): val is number {
  return typeof val === "number";
}
function isString(val: unknown): val is string {
  return typeof val === "string";
}

monaco.languages.registerHoverProvider("yaml", {
  provideHover: function (
    model,
    position //: monaco.languages.ProviderResult<monaco.languages.Hover>
  ) {
    var doc = parse(model.getValue());
    if (!doc) return;

    // Get offset from beginning of file of this line / column
    let offset = position.column - 1;
    for (var line = 1; line < position.lineNumber; line++)
      offset += model.getLineLength(line) + 1;

    // Get node in this offset
    const node = getNodeFromPosition(doc, offset);

    console.log(
      position.lineNumber,
      position.column,
      model.getOffsetAt(position),
      offset,
      node.toString()
    );

    // Get monaco range of this node
    let startLine = 1;
    let startColumn = 1;
    let endLine = 1;
    let endColumn = 1;
    if (node.range?.length) {
      offset = node.range?.[0] + 1;
      while (offset > model.getLineLength(startLine)) {
        offset -= model.getLineLength(startLine) + 1;
        startLine++;
      }
      startColumn = offset;
      offset += node.range?.[1] - node.range?.[0];
      endLine = startLine;
      while (offset > model.getLineLength(endLine)) {
        offset -= model.getLineLength(endLine);
        endLine++;
      }
      endColumn = offset;
    }

    return getHover(node, doc).then((docs) => {
      if (!docs) return undefined;
      return {
        range: new monaco.Range(startLine, startColumn, endLine, endColumn),
        contents: [{ value: docs }],
      };
    });
  },
});

const getParent = (nodeToFind: Node, doc: Document): Node | undefined => {
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

const getPath = (pathNode: Node, doc: Document): (string | number)[] => {
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

const getHover = async (
  node: Node,
  doc: Document
): Promise<string | undefined> => {
  try {
    var path = getPath(node, doc);

    if (path.length === 1) {
      const rootComponents = await coreSchema.getComponentList();
      if (path[0] in rootComponents) {
        return rootComponents[path[0]].docs;
      }
      const platformComponents = await coreSchema.getPlatformList();
      if (path[0] in platformComponents) {
        return platformComponents[path[0]].docs;
      }

      return undefined;
    }

    const cvAndPath = await getConfigVarAndPathNode(path, doc);
    if (cvAndPath === undefined) return undefined;
    const [cv, pathNode] = cvAndPath;

    let content: string | undefined = undefined;
    if (cv !== undefined) {
      content = cv.docs;
      if (
        content === undefined &&
        path.length === 3 &&
        path[2] === "platform" &&
        isScalar(pathNode)
      ) {
        content = (await coreSchema.getComponent(path[0] as string)).components[
          pathNode.value as string
        ].docs;
      }
    }
    return content;
  } catch (error) {
    console.log("Hover:" + error);
  }
};

const getNodeFromPosition = (doc: Document, positionOffset: number) => {
  let closestNode: Node = doc.contents!;
  visit(doc, (key, node) => {
    console.log(key, node);
    if (!node) return;
    if (!isNode(node)) {
      return;
    }

    const range = node?.range;
    if (!range) {
      return;
    }
    if (range[0] <= positionOffset && range[1] >= positionOffset) {
      console.log("**", range[0], range[1], positionOffset, node.toString());
      closestNode = node;
    } else {
      console.log("--", range[0], range[1], positionOffset, node.toString());
      if (range[0] > positionOffset) return visit.BREAK;
      return visit.SKIP;
    }
    return;
  });

  return closestNode;
};

const getConfigVarAndPathNode = async (
  path: (string | number)[],
  doc: Document
): Promise<[ConfigVar, Node] | undefined> => {
  let pathNode = doc.contents;
  let cv: ConfigVar | undefined = undefined;
  for (let index = 0; index < path.length; index++) {
    if (isString(path[index]) && isMap(pathNode)) {
      if (cv === undefined && index <= 2 && pathNode.get("platform")) {
        const componentName = pathNode.get("platform");
        if (isString(componentName)) {
          const platformComponents = await coreSchema.getPlatformList();
          if (isString(path[0]) && path[0] in platformComponents) {
            const c = await coreSchema.getComponent(path[0]);
            if (c.components !== undefined && componentName in c.components) {
              cv = await coreSchema.getComponentPlatformSchema(
                componentName,
                path[0]
              );
            }
          }
        }
      }

      pathNode = pathNode.get(path[index], true) as Node;
      if (cv === undefined) {
        const rootComponents = await coreSchema.getComponentList();
        if (isString(path[0]) && path[0] in rootComponents) {
          cv = (await coreSchema.getComponent(path[0])).schemas.CONFIG_SCHEMA;
        }
      } else {
        const pathIndex = path[index];
        if (isString(pathIndex)) {
          if (cv.type === "schema" || cv.type === "trigger") {
            if (cv.schema !== undefined) {
              const schema_cv: ConfigVar | undefined =
                await coreSchema.findConfigVar(cv.schema, pathIndex, doc);
              if (schema_cv !== undefined) {
                cv = schema_cv;
                continue;
              }
            }

            if (cv.type === "trigger") {
              if (pathIndex === "then") {
                continue;
              }
              const action = await coreSchema.getActionConfigVar(pathIndex);
              if (action !== undefined) {
                cv = action;
                continue;
              }
            }
          }
          if (cv.type === "registry") {
            cv = await coreSchema.getRegistryConfigVar(cv.registry, pathIndex);
          }
        }
      }
    } else if (isNumber(path[index]) && isSeq(pathNode)) {
      pathNode = pathNode.get(path[index], true) as Node;
    }
  }
  if (!cv || !pathNode) return undefined;
  return [cv, pathNode];
};
