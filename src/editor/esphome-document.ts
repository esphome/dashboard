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
  isMap,
} from "yaml";
import { coreSchema } from "./editor-shims";
import { ConfigVar } from "./esphome-schema";
import { isNumber, isString } from "./utils/objects";
import { TextBuffer } from "./utils/text-buffer";

export class ESPHomeDocument {
  public yaml: Document;

  constructor(public text: TextBuffer) {
    this.yaml = this.parse();
  }

  public update(buffer: TextBuffer) {
    if (this.text === buffer) {
      console.log("text buffer cache hit");
      return;
    }
    console.log("text buffer changed, parsing yaml");
    this.text = buffer;
    this.yaml = this.parse();
  }

  private parse() {
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

    const text = this.text.getText();
    const tokens = parser.parse(text);
    const tokensArr = Array.from(tokens);
    const docs = composer.compose(tokensArr, true, text.length);
    return Array.from(docs)[0];
  }

  public getParent(nodeToFind: Node): Node | undefined {
    let parentNode: Node | undefined = undefined;
    visit(this.yaml, (_, node, path) => {
      if (node === nodeToFind) {
        parentNode = path[path.length - 1] as Node;
        return visit.BREAK;
      }
      return;
    });

    if (isDocument(parentNode)) {
      return;
    }

    return parentNode;
  }

  public getPath(node: Node): (number | string)[] {
    const path: (number | string)[] = [];
    let child: Node | undefined = undefined;
    let findingNode: Node | undefined = node;
    while (findingNode) {
      if (isPair(findingNode)) {
        if (isScalar(findingNode.key)) {
          path.push(findingNode.key.value as string);
        }
      }
      if (isSeq(findingNode) && child !== undefined) {
        path.push(findingNode.items.indexOf(child));
      }
      child = findingNode;
      findingNode = this.getParent(findingNode);
    }
    return path.reverse();
  }

  public getNodeFromOffset(offset: number): Node {
    let closestNode: Node;
    visit(this.yaml, (key, node) => {
      if (!node || !isNode(node)) {
        return;
      }
      const range = node.range;
      if (!range) {
        return;
      }

      if (
        (range[0] <= offset && range[2] >= offset) ||
        // handle edge case of null node values
        (isScalar(node) &&
          node.value === null &&
          range[0] > offset &&
          range[1] > offset &&
          !isScalar(closestNode))
      ) {
        closestNode = node;
      } else {
        return visit.SKIP;
      }
      return;
    });

    return closestNode!;
  }

  public async getConfigVarAndPathNode(
    path: (string | number)[]
  ): Promise<[ConfigVar, Node] | undefined> {
    let pathNode = this.yaml.contents;
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
                  await coreSchema.findConfigVar(
                    cv.schema,
                    pathIndex,
                    this.yaml
                  );
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
              cv = await coreSchema.getRegistryConfigVar(
                cv.registry,
                pathIndex
              );
            }
          }
        }
      } else if (isNumber(path[index]) && isSeq(pathNode)) {
        pathNode = pathNode.get(path[index], true) as Node;
      }
    }
    if (!cv || !pathNode) {
      return undefined;
    }
    return [cv, pathNode];
  }
}

export class ESPHomeDocuments {
  private documents: { [uri: string]: ESPHomeDocument } = {};

  update(uri: string, buffer: TextBuffer) {
    const doc = this.documents[uri];
    if (doc === undefined) {
      this.documents[uri] = new ESPHomeDocument(buffer);
    } else {
      doc.update(buffer);
    }
  }

  public getDocument(uri: string): ESPHomeDocument {
    return this.documents[uri];
  }
}
