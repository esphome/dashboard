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
  YAMLMap,
  YAMLSeq,
} from "yaml";
import { coreSchema } from "./editor-shims";
import { ConfigVar } from "./esphome-schema";
import { isNumber, isString } from "./utils/objects";
import { TextBuffer } from "./utils/text-buffer";

class CommonTagImpl {
  tag: string;
  readonly type: string;
  default: boolean = false;
  constructor(tag: string, type: string) {
    this.tag = tag;
    this.type = type;
  }
  get collection() {
    return undefined;
  }

  identify(value: unknown) {
    return true;
  }
  resolve(value: string | YAMLMap | YAMLSeq): string | YAMLMap | YAMLSeq {
    return value;
  }
}

export class ESPHomeDocument {
  public yaml: Document;
  public bufferText?: string;

  constructor(public text: TextBuffer) {
    this.bufferText = text.getText();
    this.yaml = this.parse(this.bufferText);
  }

  public update(buffer: TextBuffer) {
    this.text = buffer;
    const text = this.text.getText();
    if (this.bufferText === text) {
      return;
    }
    this.bufferText = text;
    this.yaml = this.parse(this.bufferText);
  }

  private parse(text: string) {
    const options: ParseOptions & DocumentOptions & SchemaOptions = {
      strict: false,
      version: "1.2",
      customTags: [new CommonTagImpl("!secret", "scalar")],
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

  public getNodeFromOffset(offset: number): Node | undefined {
    let closestNode: Node | undefined = undefined;
    let scalarAfterOffset = false;
    visit(this.yaml, (key, node) => {
      if (!node || !isNode(node)) {
        return;
      }
      const range = node.range;
      if (!range) {
        return;
      }

      // tagged node e.g. !secret at the beginning have tag property
      // but the range does not include this tag space
      const startPos = node.tag ? range[0] - node.tag.length - 1 : range[0];
      if (
        (startPos <= offset && range[2] >= offset) ||
        // handle edge case of null node values
        (isScalar(node) &&
          node.value === null &&
          startPos > offset &&
          range[1] > offset &&
          !isScalar(closestNode) &&
          !scalarAfterOffset)
      ) {
        closestNode = node;
      } else {
        if (isScalar(node) && startPos > offset && range[1] > offset) {
          scalarAfterOffset = true;
        }
        return visit.SKIP;
      }
      return;
    });

    return closestNode!;
  }

  public async getConfigVarAndPathNode(
    path: (string | number)[],
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
                  path[0],
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
                    this.yaml,
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
                pathIndex,
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
