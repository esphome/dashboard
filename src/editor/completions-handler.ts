import {
  isMap,
  isSeq,
  isPair,
  isScalar,
  YAMLMap,
  Node,
  isNode,
  visit,
} from "yaml";
import {
  CompletionItemKind,
  coreSchema,
  Position,
  Range,
  createCompletion,
  CompletionItem,
  createCompletionSnippet,
} from "./editor-shims";
import { ESPHomeDocument, ESPHomeDocuments } from "./esphome-document";
import {
  ConfigVar,
  ConfigVarEnum,
  ConfigVarRegistry,
  ConfigVarTrigger,
  Schema,
} from "./esphome-schema";
import { isNumber, isString } from "./utils/objects";

export class CompletionsHandler {
  constructor(private documents: ESPHomeDocuments) {}
  private document!: ESPHomeDocument;
  private docMap!: YAMLMap;
  private position!: Position;
  private lineContent!: string;

  public async getCompletions(
    uri: string,
    position: Position,
  ): Promise<CompletionItem[]> {
    try {
      this.document = this.documents.getDocument(uri);
      this.position = position;
      this.lineContent = this.document.text.getLineContent(position.line);
      const findByClosest = this.lineContent.trim().length === 0;
      const offset = this.document.text.offsetAt(position);

      // Do not show completions when next to ':'
      if (this.document.text.getText().charAt(offset - 1) === ":") {
        return [];
      }

      const docMap = this.document.yaml.contents;
      if (!isMap(docMap)) {
        this.docMap = undefined!;
        return this.getCoreComponents();
      }
      this.docMap = docMap;

      let node = findByClosest
        ? this.findClosestNode(position, offset)
        : this.document.getNodeFromOffset(offset);

      if (!node) return [];

      const range: Range = {
        start: this.document.text.getPosition(node.range?.[0]!),
        end: this.document.text.getPosition(node.range?.[1]!),
      };
      if (range.start.character === 0) {
        return this.getCoreComponents();
      }

      const p1 = this.document.getParent(node);
      const p2 = p1 !== undefined ? this.document.getParent(p1) : undefined;

      if (!findByClosest && isScalar(node)) {
        if (isPair(p1) && p1.value === null) {
          // seems to be writing on a key still without value
          if (isMap(p2)) {
            node = p2;
          }
        }
      }

      const path = this.document.getPath(node);
      // At this point node and path should be meaningful and consistent
      // Path is were completions need to be listed, it really doesn't matter where the cursor is, cursor shouldn't be checked
      // to see what completions are need

      // List items under - platform: |
      if (isPair(p1) && isScalar(p1.key)) {
        if (p1.key.value === "platform") {
          if (isMap(p2)) {
            const p3 = this.document.getParent(p2);
            if (isSeq(p3)) {
              const p4 = this.document.getParent(p3);
              if (isPair(p4) && isScalar(p4.key)) {
                const platform_name = p4.key.value as string;
                return await this.getPlatformNames(platform_name, range);
              }
            }
          }
        }
      }

      console.log(node, path, path.length, `'${path[0]}'`);

      let pathElement;
      // First get the root component
      let cv: ConfigVar | undefined = undefined;
      let pathIndex = 0;
      if (path.length) {
        pathIndex = 1;
        pathElement = docMap.get(path[0]);
        if (isString(path[0]) && (await coreSchema.isPlatform(path[0]))) {
          if (path.length > 1) {
            // we are in a platform (e.g. sensor) and there are inner stuff
            if (isNumber(path[1])) {
              // the index in the sequence
              const index = path[1];
              if (isSeq(pathElement)) {
                pathElement = pathElement.get(index);
                pathIndex += 1;
              }
            }
          }
          // else branch not needed here as pathElement should be pointing
          // to the object with the platform key
          if (isMap(pathElement)) {
            const domain = pathElement.get("platform");
            if (isString(domain)) {
              cv = await coreSchema.getComponentPlatformSchema(domain, path[0]);
            }
          }
          if (!cv) {
            return [
              createCompletion(
                "platform",
                isSeq(this.document.getParent(node))
                  ? "platform: "
                  : "- platform: ",
                CompletionItemKind.EnumMember,
                undefined,
                true,
              ),
            ];
          }
        } else {
          pathElement = docMap.get(path[0]);
          if (isString(path[0])) {
            cv = await coreSchema.getComponentSchema(path[0]);
          }
        }
      }

      return this.resolveConfigVar(
        path,
        pathIndex,
        cv!,
        pathElement as YAMLMap,
        node,
      );
    } catch (e) {
      console.log(`Error during evaluating completions ${e}`);
      return [];
    }
  }

  private async getPlatformNames(platform_name: string, range: Range) {
    const c = await coreSchema.getComponent(platform_name);

    if (c.components === undefined) {
      console.log(`Error: not a platform ${platform_name}`);
      return [];
    }

    const result = [];
    for (var component in c.components) {
      result.push(
        createCompletion(
          component,
          `${component}\n  `,
          CompletionItemKind.EnumMember,
          c.components[component].docs,
          true,
        ),
      );
    }

    return result;
  }

  private async getCoreComponents() {
    // suggest platforms, e.g. sensor:, binary_sensor:
    const platformList = await coreSchema.getPlatformList();
    const result: CompletionItem[] = [];

    for (var platformName in platformList) {
      // Don't add duplicate keys
      if (this.docMap && this.mapHasScalarKey(this.docMap, platformName)) {
        continue;
      }

      result.push(
        createCompletion(
          platformName,
          `${platformName}:\n  - platform: `,
          CompletionItemKind.Class,
          platformList[platformName].docs,
          true,
        ),
      );
    }
    // suggest component/hub e.g. dallas:, sim800l:
    const components = await coreSchema.getComponentList();
    for (var componentName in components) {
      // skip platforms added in previous loop
      if (componentName in platformList) {
        continue;
      }
      // Don't add duplicate keys
      if (this.docMap && this.mapHasScalarKey(this.docMap, componentName)) {
        continue;
      }

      // Filter esp32 or esp8266 components only when the other target is used
      if (this.docMap && components[componentName].dependencies) {
        let missingDep = false;
        for (const dep of components[componentName].dependencies!) {
          if (dep === "esp8266" || dep === "esp32") {
            if (this.docMap.get(dep) === undefined) {
              missingDep = true;
              break;
            }
          }
        }
        if (missingDep) {
          continue;
        }
      }
      result.push(
        createCompletion(
          componentName,
          `${componentName}:\n  `,
          CompletionItemKind.Field,
          components[componentName].docs,
          true,
        ),
      );
    }
    return result;
  }

  private getChipset(): "esp8266" | "esp32" | undefined {
    if (this.docMap.get("esp8266", true) !== undefined) {
      return "esp8266";
    }
    if (this.docMap.get("esp32", true) !== undefined) {
      return "esp32";
    }
    const esphome = this.docMap.get("esphome");
    if (isMap(esphome)) {
      const chipset = esphome.get("platform");
      if (isString(chipset)) {
        if (chipset.toLowerCase() === "esp32") {
          return "esp32";
        }
        if (chipset.toLowerCase() === "esp8266") {
          return "esp8266";
        }
      }
    }
    return undefined;
  }

  private mapHasScalarKey(map: YAMLMap, key: string): boolean {
    for (var item of map.items) {
      if (isScalar(item.key) && item.key.value === key) {
        return true;
      }
    }
    return false;
  }

  private async resolveConfigVar(
    path: any[],
    pathIndex: number,
    cv: ConfigVar,
    pathNode: YAMLMap | null,
    cursorNode: Node,
  ): Promise<CompletionItem[]> {
    if (cv.is_list && isNumber(path[pathIndex])) {
      if (isSeq(pathNode)) {
        pathNode = pathNode.get(path[pathIndex]) as any as YAMLMap;
      }
      pathIndex++;
    }
    if (cv.type === "schema") {
      if (isMap(pathNode)) {
        if (pathIndex === path.length) {
          return this.getConfigVars(cv.schema, pathNode);
        }
        return this.resolveSchema(
          path,
          pathIndex,
          cv.schema,
          pathNode,
          cursorNode,
        );
      } else {
        if (pathIndex === path.length) {
          if (isScalar(cursorNode)) {
            const complete = await coreSchema.getConfigVarComplete2(cv);
            if (complete["maybe"] !== undefined) {
              const maybe_cv = await coreSchema.findConfigVar(
                cv.schema,
                complete["maybe"],
                this.document.yaml,
              );
              return this.resolveConfigVar(
                path,
                pathIndex,
                maybe_cv!,
                null,
                cursorNode,
              );
            }
          }

          return this.getConfigVars(cv.schema, null, cv.is_list);
        }
        throw new Error(`Expected map not found in ${pathIndex}`);
      }
    } else if (cv.type === "enum") {
      return this.addEnums(cv);
    } else if (cv.type === "trigger") {
      return this.resolveTrigger(path, pathIndex, pathNode, cv, cursorNode);
    } else if (cv.type === "registry") {
      let elem: any = pathNode;
      if (isSeq(elem) && elem.items.length) {
        elem = elem.items[path[pathIndex]];
        if (isNode(elem)) {
          return this.resolveRegistryInner(
            path,
            pathIndex + 1,
            isMap(elem) ? elem : null,
            cv,
            cursorNode,
          );
        }
      }
      if (isMap(elem)) {
        return this.resolveRegistryInner(path, pathIndex, elem, cv, cursorNode);
      }
      return this.resolveRegistryInner(
        path,
        pathIndex,
        isMap(elem) ? elem : null,
        cv,
        cursorNode,
      );
    } else if (cv.type === "typed") {
      if (!pathNode) {
        return [
          createCompletion(
            cv.typed_key,
            `${cv.typed_key}: `,
            CompletionItemKind.Enum,
            undefined,
            true,
          ),
        ];
      } else if (
        pathIndex + 1 >= path.length &&
        path[pathIndex] === cv.typed_key
      ) {
        let result = [];
        for (const schema_type in cv.types) {
          result.push(
            createCompletion(
              schema_type,
              `${schema_type}\n`,
              CompletionItemKind.EnumMember,
              undefined,
              true,
            ),
          );
        }
        return result;
      } else {
        if (pathNode !== null && isMap(pathNode)) {
          const type = pathNode.get(cv.typed_key);
          if (type !== null && isString(type)) {
            if (pathIndex === path.length) {
              return this.getConfigVars(cv.types[type], pathNode);
            }
            return this.resolveSchema(
              path,
              pathIndex,
              cv.types[type],
              pathNode,
              cursorNode,
            );
          }
          let result: CompletionItem[] = [];
          // there are other options but still not `type`
          result.push(
            createCompletion(
              cv.typed_key,
              `${cv.typed_key}: `,
              CompletionItemKind.EnumMember,
              undefined,
              true,
            ),
          );
          return result;
        }
      }
    } else if (cv.type === "string") {
      if (cv.templatable) {
        return [
          createCompletionSnippet(
            "!lambda",
            '!lambda return "${0:<string expression>}";',
            CompletionItemKind.Function,
          ),
        ];
      }
      return [];
    } else if (cv.type === "pin") {
      //if (parentElement.items.length > 0 && isScalar(node) && node === parentElement.items[0].value) {
      // cursor is in the value of the pair
      //    return this.resolvePinNumbers(result, cv);
      //}
      if (!cv.schema) {
        // This pin does not accept schema, e.g. i2c
        return [];
      }

      let pinCv: ConfigVar | undefined = undefined;

      if (isMap(pathNode)) {
        // Check if it is using a port expander
        for (const expander of await coreSchema.getPins()) {
          if (
            expander !== "esp32" &&
            expander !== "esp8266" &&
            (this.document.yaml.contents as YAMLMap).get(expander)
          ) {
            if (pathNode.get(expander)) {
              pinCv = await coreSchema.getPinConfigVar(expander);
              break;
            }
          }
        }
      }

      if (pinCv === undefined) {
        const chipset = this.getChipset();
        if (chipset === "esp32") {
          pinCv = await coreSchema.getPinConfigVar("esp32");
        } else if (chipset === "esp8266") {
          pinCv = await coreSchema.getPinConfigVar("esp8266");
        }
      }

      if (
        pinCv !== undefined &&
        pinCv.type === "schema" &&
        pathNode === null &&
        !cv.internal
      ) {
        // suggest all expanders
        for (const expander of await coreSchema.getPins()) {
          if (
            expander !== "esp32" &&
            expander !== "esp8266" &&
            this.docMap.get(expander)
          ) {
            pinCv.schema.config_vars[expander] = {
              key: "Optional",
              type: "string",
            };
          }
        }
      }
      if (!pinCv) {
        return [];
      }
      return this.resolveConfigVar(
        path,
        pathIndex,
        pinCv,
        pathNode,
        cursorNode,
      );
    } else if (cv.type === "boolean") {
      let result: CompletionItem[] = [];
      if (cv.templatable) {
        result.push(
          createCompletionSnippet(
            "!lambda ",
            '!lambda return "${0:<boolean expression>}";',
            CompletionItemKind.Function,
          ),
        );
      }
      for (var value of ["True", "False"]) {
        result.push(
          createCompletion(
            value,
            value,
            CompletionItemKind.Constant,
            undefined,
            false,
            cv.default === value,
          ),
        );
      }
      return result;
    } else if (cv.type === "use_id") {
      let result: CompletionItem[] = [];
      const usableIds = await coreSchema.getUsableIds(
        cv.use_id_type,
        this.document.yaml,
      );
      for (var usableId of usableIds) {
        result.push(
          createCompletion(usableId, usableId, CompletionItemKind.Variable),
        );
      }
      return result;
    } else if (cv["templatable"]) {
      let insertText = "!lambda return ${0:<expression>};";
      if (cv.docs && cv.docs.startsWith("**")) {
        const endStrType = cv.docs.indexOf("**", 2);
        if (endStrType !== -1) {
          const strType = cv.docs.substring(2, cv.docs.indexOf("**", 2));
          if (strType === "string") {
            insertText = '!lambda return "${0:<string expression>}";';
          } else {
            insertText = `!lambda return \${0:<${strType} expression>};`;
          }
        }
      }
      return [
        createCompletionSnippet(
          "!lambda",
          insertText,
          CompletionItemKind.Function,
          cv.docs,
        ),
      ];
    }
    throw new Error("Unexpected path traverse.");
  }

  private arrayItemPrefixed(key: string): string {
    // prefix only if not prefixed already
    if (
      this.position.character > 1 &&
      this.lineContent.substring(
        this.position.character - 2,
        this.position.character,
      ) === "- "
    ) {
      return `${key}: `;
    }
    return `- ${key}: `;
  }

  private async getConfigVars(
    schema: Schema,
    node: YAMLMap | null,
    isList = false,
  ): Promise<CompletionItem[]> {
    const ret: CompletionItem[] = [];

    for await (const [prop, config] of coreSchema.iterConfigVars(
      schema,
      this.document.yaml,
    )) {
      // Skip existent properties
      if (node !== null && this.mapHasScalarKey(node, prop)) {
        continue;
      }

      let insertText = isList ? this.arrayItemPrefixed(prop) : `${prop}: `;
      let triggerSuggest = false;
      let snippet = false;

      let sortText: string | undefined = undefined;
      let detail: string | undefined = undefined;

      if (config.templatable) {
        detail = "lambda";
        triggerSuggest = true;
      } else {
        if (config.key === "Required") {
          sortText = `00${prop}`;
          detail = "Required";
        } else {
          if (config.type === "integer" || config.type === "string") {
            if (config.default) {
              snippet = true;
              insertText += `\${0:${config.default}}`;
            }
          }
        }
      }

      let kind: any = CompletionItemKind.Struct;
      switch (config.type) {
        case "schema":
          kind = CompletionItemKind.Struct;
          insertText += "\n  ";
          triggerSuggest = true;
          break;
        case "typed":
          kind = CompletionItemKind.Struct;
          insertText += `\n  ${config.typed_key}: `;
          triggerSuggest = true;
          break;
        case "enum":
          kind = CompletionItemKind.Enum;
          triggerSuggest = true;
          break;
        case "trigger":
          kind = CompletionItemKind.Event;
          if (prop !== "then" && !config.has_required_var) {
            insertText += "\n  then:\n    ";
          } else {
            insertText += "\n  ";
          }
          triggerSuggest = true;
          break;
        case "registry":
          kind = CompletionItemKind.Field;
          break;
        case "pin":
          kind = CompletionItemKind.Interface;
          break;
        case "boolean":
          triggerSuggest = true;
          kind = CompletionItemKind.Variable;
          break;
        default:
          kind = CompletionItemKind.Property;
          break;
      }

      if (config.type === "use_id" || config.maybe) {
        triggerSuggest = true;
      }

      ret.push(
        createCompletion(
          prop,
          insertText,
          kind,
          config.docs,
          triggerSuggest,
          undefined,
          snippet,
          sortText,
          detail,
        ),
      );
    }
    return ret;
  }

  private async resolveSchema(
    path: any[],
    pathIndex: number,
    schema: Schema,
    pathElement: YAMLMap | null,
    node: Node,
  ): Promise<CompletionItem[]> {
    console.log(`component: ${path[pathIndex]}`);
    const cv = await coreSchema.findConfigVar(
      schema,
      path[pathIndex],
      this.document.yaml,
    );
    if (cv === undefined) return [];
    let innerNode =
      pathElement !== null
        ? (pathElement.get(path[pathIndex]) as YAMLMap)
        : null;

    return await this.resolveConfigVar(
      path,
      pathIndex + 1,
      cv,
      innerNode,
      node,
    );
  }

  private async addEnums(cv: ConfigVarEnum): Promise<CompletionItem[]> {
    const result: CompletionItem[] = [];

    if (cv.templatable) {
      result.push(
        createCompletionSnippet(
          "!lambda",
          '!lambda return "${0:<enum expression>}";',
          CompletionItemKind.Function,
        ),
      );
    }
    for (var value in cv.values) {
      if (isNumber(value as any)) {
        value = value.toString();
      }
      result.push(
        createCompletion(
          value,
          value,
          CompletionItemKind.EnumMember,
          cv.values[value]?.docs,
          false,
          cv.default === value,
        ),
      );
    }
    return result;
  }

  private async resolveTrigger(
    path: any[],
    pathIndex: number,
    pathNode: Node | null,
    cv: ConfigVarTrigger,
    node: Node,
  ): Promise<CompletionItem[]> {
    console.log(`trigger: ${path[pathIndex]}`);
    // trigger can be a single item on a map or otherwise a seq.
    if (isSeq(pathNode)) {
      let innerNode: Node | null = null;
      if (pathIndex < path.length) {
        if (pathNode.items.length) {
          innerNode = pathNode.items[path[pathIndex]] as Node;
        }
        return this.resolveTriggerInner(
          path,
          pathIndex + 1,
          innerNode,
          cv,
          node,
        );
      }
      if (cv.schema && !cv.has_required_var) {
        // if this has a schema, when inside the list we no longer can setup automation props
        cv = cv.schema.config_vars.then as ConfigVarTrigger;
      }
      return this.resolveTriggerInner(path, pathIndex, innerNode, cv, node);
    }

    return this.resolveTriggerInner(
      path,
      pathIndex,
      isMap(pathNode) ? pathNode : null,
      cv,
      node,
    );
  }

  private async resolveTriggerInner(
    path: any[],
    pathIndex: number,
    pathNode: Node | null,
    cv: ConfigVarTrigger,
    node: Node,
  ): Promise<CompletionItem[]> {
    const final = pathIndex === path.length;
    if (final) {
      // If this has a schema, use it, these are suggestions so user will see the trigger parameters even when they are optional
      // However if the only option is 'then:' we should avoid it for readability
      if (cv.schema !== undefined) {
        return this.getConfigVars(cv.schema, isMap(pathNode) ? pathNode : null);
      }
      if (pathNode && !isScalar(pathNode)) {
        // here in this trigger there is already an action,
        // we could suggest another actions but in that case we should convert
        // this action to a list, so just don't suggest anything
        return [];
      }
      return this.addRegistry({
        type: "registry",
        registry: "action",
        key: "",
      });
    }

    if (path[pathIndex] === "then") {
      // all triggers support then, even when they do not have a schema
      // then is a trigger without schema so...
      let thenNode = pathNode;
      if (isMap(pathNode)) {
        thenNode = pathNode.get("then", true) as Node;
      }
      return this.resolveTrigger(
        path,
        pathIndex + 1,
        thenNode,
        {
          type: "trigger",
          key: "Optional",
          schema: undefined,
          has_required_var: false,
        },
        node,
      );
    }

    // navigate into the prop
    // this can be an action or a prop of this trigger
    if (cv.schema !== undefined) {
      const innerProp = await coreSchema.findConfigVar(
        cv.schema,
        path[pathIndex],
        this.document.yaml,
      );
      if (innerProp !== undefined) {
        return this.resolveSchema(
          path,
          pathIndex,
          cv.schema,
          isMap(pathNode) ? pathNode : null,
          node,
        );
      }
    }
    // is this an action?
    const action = await coreSchema.getActionConfigVar(path[pathIndex]);
    if (action !== undefined && action.schema) {
      var innerNode: Node | null = null;
      if (isMap(pathNode)) {
        const innerPathNode = pathNode.get(path[pathIndex]);
        if (isNode(innerPathNode)) {
          innerNode = innerPathNode;
        }
      }
      if (pathIndex + 1 === path.length && isMap(pathNode)) {
        if (isScalar(node)) {
          const complete = await coreSchema.getConfigVarComplete2(action);
          if (complete.type === "schema" && complete["maybe"] !== undefined) {
            const maybe_cv = await coreSchema.findConfigVar(
              action.schema,
              complete["maybe"],
              this.document.yaml,
            );
            if (!maybe_cv) {
              return [];
            }
            return this.resolveConfigVar(path, pathIndex, maybe_cv, null, node);
          }
          return [];
        }

        return this.getConfigVars(action.schema, innerNode as YAMLMap);
      }

      return this.resolveSchema(
        path,
        pathIndex + 1,
        action.schema,
        innerNode as YAMLMap,
        node,
      );
    }
    return [];
  }
  private async addRegistry(
    configVar: ConfigVarRegistry,
  ): Promise<CompletionItem[]> {
    const result: CompletionItem[] = [];
    for await (const [value, props] of await coreSchema.getRegistry(
      configVar.registry,
      this.document.yaml,
    )) {
      if (configVar.filter && !configVar.filter.includes(value)) {
        continue;
      }
      let insertText = this.arrayItemPrefixed(value);
      const completeCv = await coreSchema.getConfigVarComplete2(props);
      if (!completeCv.maybe) {
        insertText += "\n    ";
      }

      result.push(
        createCompletion(
          value,
          insertText,
          CompletionItemKind.Keyword,
          props.docs,
          true,
        ),
      );
    }
    return result;
  }

  private async resolveRegistryInner(
    path: any[],
    pathIndex: number,
    pathNode: YAMLMap | null,
    cv: ConfigVarRegistry,
    node: Node,
  ): Promise<CompletionItem[]> {
    const final = pathIndex === path.length;
    if (final && pathNode === null) {
      return this.addRegistry(cv);
    }
    const registryCv = await coreSchema.getRegistryConfigVar(
      cv.registry,
      path[pathIndex],
    );
    if (!registryCv) {
      return [];
    }
    const inner = pathNode !== null ? pathNode.get(path[pathIndex]) : null;
    return this.resolveConfigVar(
      path,
      pathIndex + 1,
      registryCv,
      isMap(inner) ? inner : null,
      node,
    );
  }

  private findClosestNode(position: Position, offset: number): Node {
    const { yaml, text } = this.document;

    let offsetDiff = yaml.contents!.range![2];
    let maxOffset = yaml.contents!.range![0];

    let closestNode: Node = this.document.yaml.contents!;
    visit(yaml, (key, node) => {
      if (!node || !isNode(node)) {
        return;
      }
      const range = node.range;
      if (!range) {
        return;
      }
      const diff = range[2] - offset;
      if (maxOffset <= range[0] && diff <= 0 && Math.abs(diff) <= offsetDiff) {
        offsetDiff = Math.abs(diff);
        maxOffset = range[0];
        closestNode = node;
      }
    });

    const lineContent = text.getLineContent(position.line);
    const indentation = this.getIndentation(lineContent, position.character);

    if (closestNode !== undefined && indentation === position.character) {
      closestNode = this.getProperParentByIndentation(
        indentation,
        closestNode,
      )!;
    }

    return closestNode!;
  }

  private getIndentation(lineContent: string, position: number): number {
    if (lineContent.length < position - 1) {
      return 0;
    }

    for (let i = 0; i < position; i++) {
      const char = lineContent.charCodeAt(i);
      if (char !== 32 && char !== 9) {
        return i;
      }
    }

    // assuming that current position is indentation
    return position;
  }

  private getProperParentByIndentation(
    indentation: number,
    node: Node,
  ): Node | undefined {
    if (!node) {
      return this.document.yaml.contents as Node;
    }
    const { text } = this.document;
    if (isNode(node) && node.range) {
      const position = text.getPosition(node.range[0]);
      if (position.character > indentation && position.character > 1) {
        const parent = this.document.getParent(node);
        if (parent) {
          return this.getProperParentByIndentation(indentation, parent);
        }
      } else if (position.character < indentation) {
        const parent = this.document.getParent(node);
        if (isPair(parent) && isNode(parent.value)) {
          return parent.value;
        }
      } else {
        return node;
      }
    } else if (isPair(node)) {
      if (
        isScalar(node.value) &&
        node.value.value === null &&
        isScalar(node.key) &&
        text.getPosition(node.key.range![0]).character < indentation
      ) {
        return node;
      }
      const parent = this.document.getParent(node);
      if (isNode(parent)) {
        return this.getProperParentByIndentation(indentation, parent);
      }
    }
    return node;
  }
}
