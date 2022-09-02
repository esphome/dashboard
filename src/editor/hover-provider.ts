import * as monaco from "monaco-editor/esm/vs/editor/editor.api";
import {
  getNodeFromPosition,
  getPath,
  isNumber,
  isString,
  parse,
} from "./parser";
import { isMap, Node, Document, isScalar, isSeq } from "yaml";
import { ConfigVar, coreSchema } from "./core-schema";

monaco.languages.registerHoverProvider("yaml", {
  provideHover: async function (
    model,
    position //: monaco.languages.ProviderResult<monaco.languages.Hover>
  ) {
    var doc = parse(model.getValue());
    if (!doc) return;

    const offset = model.getOffsetAt(position);
    const node = getNodeFromPosition(doc, offset);
    const startPos = model.getPositionAt(node.range?.[0]!);
    const endPos = model.getPositionAt(node.range?.[1]!);

    const docs = await getHover(node, doc);

    if (!docs) return undefined;
    return {
      range: new monaco.Range(
        startPos.lineNumber,
        startPos.column,
        endPos.lineNumber,
        endPos.column
      ),
      contents: [{ value: docs }],
    };
  },
});

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
