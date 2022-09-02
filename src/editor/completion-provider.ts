import * as monaco from "monaco-editor/esm/vs/editor/editor.api";
import {
  isMap,
  isSeq,
  isPair,
  isScalar,
  YAMLMap,
  Document,
  Node,
  isNode,
  visit,
} from "yaml";
import {
  ConfigVar,
  ConfigVarEnum,
  ConfigVarRegistry,
  ConfigVarTrigger,
  coreSchema,
  Schema,
} from "./core-schema";
import {
  getNodeFromPosition,
  getParent,
  getPath,
  isNumber,
  isString,
  parse,
} from "./parser";

type CompletionItem = monaco.languages.CompletionItem;
const CompletionItemKind = monaco.languages.CompletionItemKind;
const CompletionItemInsertTextRule =
  monaco.languages.CompletionItemInsertTextRule;

monaco.languages.registerCompletionItemProvider("yaml", {
  provideCompletionItems: async function (model, position) {
    return { suggestions: (await getCompletions(model, position)) ?? [] };
  },
});

const getCompletions = async (
  model: monaco.editor.ITextModel,
  position: monaco.Position
): Promise<CompletionItem[] | undefined> => {
  var doc = parse(model.getValue());
  if (!doc) return;

  const offset = model.getOffsetAt(position);
  let originalNode = getNodeFromPosition(doc, offset);

  const lineContent = model.getLineContent(position.lineNumber);
  if (lineContent.trim().length === 0) {
    originalNode = findClosestNode(doc, offset, model)!;
    console.log("closest", originalNode);
  }

  let node = originalNode;

  const word = model.getWordUntilPosition(position);
  const range: monaco.IRange = {
    startLineNumber: position.lineNumber,
    endLineNumber: position.lineNumber,
    startColumn: word.startColumn,
    endColumn: word.endColumn,
  };

  if (node) {
    // Are we in the value side of a map? (this fix for when the cursor is at the right of : and sometimes (depending whitespace after the caret)
    // the returned node is not the value node of the pair but the map itself)
    if (
      isMap(node) &&
      isPair(node.items[0]) &&
      isScalar(node.items[0].key) &&
      isScalar(node.items[0].value) &&
      node.items[0].key.range![2] < offset &&
      node.items[0].value.range![0] > offset
    ) {
      // are we at the right side of :
      console.log("we are in the scalar null? value");
      node = node.items[0].value;
    }
  }
  const p1 = getParent(node, doc);
  const path = getPath(node, doc);

  // At this point node and path should be meaningful and consistent
  // Path is were completions need to be listed, it really doesn't matter where the cursor is, cursor shouldn't be checked
  // to see what completions are need

  // List items under - platform: |
  if (isPair(p1) && isScalar(p1.key)) {
    if (p1.key.value === "platform") {
      const p2 = getParent(p1, doc);
      if (isMap(p2)) {
        const p3 = getParent(p2, doc);
        if (isSeq(p3)) {
          const p4 = getParent(p3, doc);
          if (isPair(p4) && isScalar(p4.key)) {
            const platform_name = p4.key.value as string;
            return await getPlatformNames(platform_name, range);
          }
        }
      }
    }
  }

  const docMap = doc.contents;
  if (!isMap(docMap)) return;

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
          {
            label: "platform",
            kind: monaco.languages.CompletionItemKind.EnumMember,
            insertText: isSeq(getParent(node, doc))
              ? "platform: "
              : "- platform: ",
            command: { title: "chain", id: "editor.action.triggerSuggest" },
            range: range,
          },
        ];
      }
    } else {
      pathElement = docMap.get(path[0]);
      if (isString(path[0])) cv = await coreSchema.getComponentSchema(path[0]);
    }
  }

  console.log("path " + path.join(" - ")); //+ ' found by closest: ' + foundByClosest);
  if (path.length === 0) {
    return getCoreComponents(docMap, range);
  } else {
    return resolveConfigVar(
      path,
      pathIndex,
      cv!,
      pathElement as YAMLMap,
      node,
      doc,
      range
    );
  }

  return undefined;
};

const getPlatformNames = async (
  platform_name: string,
  range: monaco.IRange
) => {
  const c = await coreSchema.getComponent(platform_name);

  if (c.components === undefined) {
    console.log(`Error: not a platform ${platform_name}`);
    return [];
  }

  const result = [];
  for (var component in c.components) {
    const item: CompletionItem = {
      label: component,
      kind: monaco.languages.CompletionItemKind.EnumMember,
      insertText: component + "\n  ",
      command: { title: "chain", id: "editor.action.triggerSuggest" },
      range: range,
    };
    if (c.components[component].docs !== undefined) {
      item.documentation = {
        value: c.components[component].docs,
      };
    }
    result.push(item);
  }

  return result;
};

const getCoreComponents = async (docMap: YAMLMap, range: monaco.IRange) => {
  const chipset = getChipset(docMap);
  // suggest platforms, e.g. sensor:, binary_sensor:
  const platformList = await coreSchema.getPlatformList();
  const result: CompletionItem[] = [];
  for (var platformName in platformList) {
    // Don't add duplicate keys
    if (mapHasScalarKey(docMap, platformName)) {
      continue;
    }
    result.push({
      label: platformName,
      documentation: {
        value: platformList[platformName].docs ?? "",
      },
      kind: monaco.languages.CompletionItemKind.Class,
      insertText: platformName + ":\n  - platform: ",
      command: { title: "chain", id: "editor.action.triggerSuggest" },
      range: range,
    });
  }
  // suggest component/hub e.g. dallas:, sim800l:
  const components = await coreSchema.getComponentList();
  for (var componentName in components) {
    // skip platforms added in previous loop
    if (componentName in platformList) {
      continue;
    }
    // Don't add duplicate keys
    if (mapHasScalarKey(docMap, componentName)) {
      continue;
    }

    // Filter esp32 or esp8266 components only when the other target is used
    if (components[componentName].dependencies) {
      let missingDep = false;
      for (const dep of components[componentName].dependencies!) {
        if (dep === "esp8266" || dep === "esp32") {
          if (docMap.get(dep) === undefined) {
            missingDep = true;
            break;
          }
        }
      }
      if (missingDep) {
        continue;
      }
    }

    result.push({
      label: componentName,
      documentation: {
        value: components[componentName].docs!,
      },
      kind: monaco.languages.CompletionItemKind.Field,
      insertText: componentName + ":\n  ",
      command: { title: "chain", id: "editor.action.triggerSuggest" },
      range: range,
    });
  }
  return result;
};

const getChipset = (docMap: YAMLMap): "esp8266" | "esp32" | undefined => {
  if (docMap.get("esp8266", true) !== undefined) {
    return "esp8266";
  }
  if (docMap.get("esp32", true) !== undefined) {
    return "esp32";
  }
  const esphome = docMap.get("esphome");
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
};

const mapHasScalarKey = (map: YAMLMap, key: string): boolean => {
  for (var item of map.items) {
    if (isScalar(item.key) && item.key.value === key) {
      return true;
    }
  }
  return false;
};

const resolveConfigVar = async (
  path: any[],
  pathIndex: number,
  cv: ConfigVar,
  pathNode: YAMLMap | null,
  cursorNode: Node,
  doc: Document,
  range: monaco.IRange
): Promise<CompletionItem[]> => {
  if (cv.is_list && isNumber(path[pathIndex])) {
    if (isSeq(pathNode)) {
      pathNode = pathNode.get(path[pathIndex]) as any as YAMLMap;
    }
    pathIndex++;
  }
  if (cv.type === "schema") {
    if (isMap(pathNode)) {
      if (pathIndex === path.length) {
        return getConfigVars(cv.schema, pathNode, doc, range);
      }
      return resolveSchema(
        path,
        pathIndex,
        cv.schema,
        pathNode,
        cursorNode,
        doc,
        range
      );
    } else {
      if (pathIndex === path.length) {
        if (isScalar(cursorNode)) {
          const complete = await coreSchema.getConfigVarComplete2(cv);
          if (complete["maybe"] !== undefined) {
            const mayb_cv = await coreSchema.findConfigVar(
              cv.schema,
              complete["maybe"],
              doc
            );
            return resolveConfigVar(
              path,
              pathIndex,
              mayb_cv!,
              null,
              cursorNode,
              doc,
              range
            );
          }
        }

        return getConfigVars(cv.schema, null, doc, range, cv.is_list);
      }
      throw new Error("Expected map not found in " + pathIndex);
    }
  } else if (cv.type === "enum") {
    return addEnums(cv, range);
  } else if (cv.type === "trigger") {
    return resolveTrigger(
      path,
      pathIndex,
      pathNode,
      cv,
      cursorNode,
      doc,
      range
    );
  } else if (cv.type === "registry") {
    let elem: any = pathNode;
    if (isSeq(elem) && elem.items.length) {
      elem = elem.items[path[pathIndex]];
      if (isNode(elem)) {
        return resolveRegistryInner(
          path,
          pathIndex + 1,
          isMap(elem) ? elem : null,
          cv,
          cursorNode,
          doc,
          range
        );
      }
    }
    if (isMap(elem)) {
      return resolveRegistryInner(
        path,
        pathIndex,
        elem,
        cv,
        cursorNode,
        doc,
        range
      );
    }
    return resolveRegistryInner(
      path,
      pathIndex,
      isMap(elem) ? elem : null,
      cv,
      cursorNode,
      doc,
      range
    );
  } else if (cv.type === "typed") {
    if (pathNode === null) {
      return [
        {
          label: cv.typed_key,
          kind: monaco.languages.CompletionItemKind.Enum,
          insertText: cv.typed_key + ": ",
          command: { title: "chain", id: "editor.action.triggerSuggest" },
          range,
        },
      ];
    } else if (
      pathIndex + 1 >= path.length &&
      path[pathIndex] === cv.typed_key
    ) {
      let result = [];
      for (const schema_type in cv.types) {
        result.push({
          label: schema_type,
          kind: monaco.languages.CompletionItemKind.Enum,
          insertText: schema_type + "\n",
          command: { title: "chain", id: "editor.action.triggerSuggest" },
          range,
        });
      }
      return result;
    } else {
      if (pathNode !== null && isMap(pathNode)) {
        const type = pathNode.get(cv.typed_key);
        if (type !== null && isString(type)) {
          if (pathIndex === path.length) {
            return getConfigVars(cv.types[type], pathNode, doc, range);
          }
          return resolveSchema(
            path,
            pathIndex,
            cv.types[type],
            pathNode,
            cursorNode,
            doc,
            range
          );
        }
        let result: CompletionItem[] = [];
        // there are other options but still not `type`
        result.push({
          label: cv.typed_key,
          kind: monaco.languages.CompletionItemKind.Enum,
          insertText: cv.typed_key + ": ",
          command: { title: "chain", id: "editor.action.triggerSuggest" },
          range,
        });
        return result;
      }
    }
  } else if (cv.type === "string") {
    if (cv["templatable"]) {
      return [
        {
          label: "!lambda ",

          insertTextRules:
            monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          insertText: '!lambda return "${0:<string expression>}";',
          kind: monaco.languages.CompletionItemKind.Function,
          range,
        },
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
          (doc.contents as YAMLMap).get(expander)
        ) {
          if (pathNode.get(expander)) {
            pinCv = await coreSchema.getPinConfigVar(expander);
            break;
          }
        }
      }
    }

    if (pinCv === undefined) {
      const chipset = getChipset(doc.contents as YAMLMap);
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
          (doc.contents as YAMLMap).get(expander)
        ) {
          pinCv.schema.config_vars[expander] = {
            key: "Optional",
            type: "string",
          };
        }
      }
    }
    if (!pinCv) return [];
    return resolveConfigVar(
      path,
      pathIndex,
      pinCv,
      pathNode,
      cursorNode,
      doc,
      range
    );
  } else if (cv.type === "boolean") {
    let result: CompletionItem[] = [];
    if (cv["templatable"]) {
      const item: CompletionItem = {
        label: "!lambda ",

        insertTextRules:
          monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        insertText: '!lambda return "${0:<boolean expression>}";',
        kind: monaco.languages.CompletionItemKind.Function,
        range,
      };
      result.push(item);
    }
    for (var value of ["True", "False"]) {
      const item: CompletionItem = {
        label: value,
        kind: monaco.languages.CompletionItemKind.Constant,
        insertText: value,
        range,
      };
      item.preselect = cv.default === value;
      result.push(item);
    }
    return result;
  } else if (cv.type === "use_id") {
    let result: CompletionItem[] = [];
    const usableIds = await coreSchema.getUsableIds(cv.use_id_type, doc);
    for (var usableId of usableIds) {
      const item: CompletionItem = {
        label: usableId,
        kind: monaco.languages.CompletionItemKind.Variable,
        insertText: usableId,
        range,
      };
      result.push(item);
    }
    return result;
  } else if (cv["templatable"]) {
    let result: CompletionItem[] = [];
    const item: CompletionItem = {
      label: "!lambda",

      insertTextRules:
        monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      insertText: "!lambda return ${0:<expression>};",
      kind: monaco.languages.CompletionItemKind.Function,
      range,
    };
    if (cv.docs && cv.docs.startsWith("**")) {
      const endStrType = cv.docs.indexOf("**", 2);
      if (endStrType !== -1) {
        const strType = cv.docs.substring(2, cv.docs.indexOf("**", 2));
        if (strType === "string") {
          item.insertText = '!lambda return "${0:<string expression>}";';
        } else {
          item.insertText = "!lambda return ${0:<" + strType + " expression>};";
        }
      }
    }
    result.push(item);
    return result;
  }
  throw new Error("Unexpected path traverse.");
};

const getConfigVars = async (
  schema: Schema,
  node: YAMLMap | null,
  doc: Document,
  range: monaco.IRange,
  isList = false
): Promise<CompletionItem[]> => {
  const ret: CompletionItem[] = [];

  for await (const [prop, config] of coreSchema.iterConfigVars(schema, doc)) {
    // Skip existent properties
    if (node !== null && mapHasScalarKey(node, prop)) {
      continue;
    }
    const item: Partial<CompletionItem> = {
      label: prop,
      insertText: prop + ": ",
      range,
    };

    if (isList) {
      item.insertText = "- " + item.insertText;
    }

    let triggerSuggest = false;
    if (config.docs) {
      item.documentation = {
        value: config.docs,
      };
    }
    if (config["templatable"] !== undefined) {
      item.detail = "lambda";
      triggerSuggest = true;
    } else {
      if (config.key === "Required") {
        item.sortText = "00" + prop;
        item.detail = "Required";
      } else {
        if (
          config.type === "integer" ||
          config.type === "string" ||
          config.type === undefined
        ) {
          if (config["default"] !== undefined) {
            insertTextRules: monaco.languages.CompletionItemInsertTextRule
              .InsertAsSnippet,
              (item.insertText = prop + ": ${0:" + config["default"] + "}");
          }
        }
      }
    }

    switch (config.type) {
      case "schema":
        item.kind = CompletionItemKind.Struct;
        item.insertText += "\n  ";
        triggerSuggest = true;
        break;
      case "typed":
        item.kind = CompletionItemKind.Struct;
        item.insertText += "\n  " + config.typed_key + ": ";
        triggerSuggest = true;
        break;
      case "enum":
        item.kind = CompletionItemKind.Enum;
        triggerSuggest = true;
        break;
      case "trigger":
        item.kind = CompletionItemKind.Event;
        if (prop !== "then" && !config.has_required_var) {
          item.insertText += "\n  then:\n    ";
        } else {
          item.insertText += "\n  ";
        }
        triggerSuggest = true;
        break;
      case "registry":
        item.kind = CompletionItemKind.Field;
        break;
      case "pin":
        item.kind = CompletionItemKind.Interface;
        break;
      case "boolean":
        triggerSuggest = true;
        item.kind = CompletionItemKind.Variable;
        break;
      default:
        item.kind = CompletionItemKind.Property;
        break;
    }

    if (config["use_id_type"] || config["maybe"]) {
      triggerSuggest = true;
    }

    if (triggerSuggest) {
      item.command = { title: "chain", id: "editor.action.triggerSuggest" };
    }
    ret.push(item as CompletionItem);
  }
  return ret;
};

const resolveSchema = async (
  path: any[],
  pathIndex: number,
  schema: Schema,
  pathElement: YAMLMap | null,
  node: Node,
  currentDoc: Document,
  range: monaco.IRange
): Promise<CompletionItem[]> => {
  console.log("component: " + path[pathIndex]);
  const cv = await coreSchema.findConfigVar(
    schema,
    path[pathIndex],
    currentDoc
  );
  const innerNode =
    pathElement !== null ? (pathElement.get(path[pathIndex]) as YAMLMap) : null;
  pathIndex++;
  return await resolveConfigVar(
    path,
    pathIndex,
    cv!,
    innerNode,
    node,
    currentDoc,
    range
  );
};

const addEnums = async (
  cv: ConfigVarEnum,
  range: monaco.IRange
): Promise<CompletionItem[]> => {
  const result: CompletionItem[] = [];

  if (cv["templatable"]) {
    const item: CompletionItem = {
      label: "!lambda ",
      insertTextRules: CompletionItemInsertTextRule.InsertAsSnippet,
      insertText: '!lambda return "${0:<enum expression>}";',
      kind: CompletionItemKind.Function,
      range: range,
    };
    result.push(item);
  }
  for (var value of cv.values) {
    if (isNumber(value as any)) {
      value = value.toString();
    }
    let c: CompletionItem = {
      label: value,
      kind: CompletionItemKind.EnumMember,
      insertText: value,
      range: range,
      // command: { title: 'chain', command: "editor.action.triggerSuggest" }
    };
    if (cv["default"] === value) {
      c.preselect = true;
    }
    if (
      cv["values_docs"] !== undefined &&
      cv["values_docs"][value] !== undefined
    ) {
      c.documentation = { value: cv["values_docs"][value] };
    }

    result.push(c);
  }
  return result;
};

const resolveTrigger = async (
  path: any[],
  pathIndex: number,
  pathNode: Node | null,
  cv: ConfigVarTrigger,
  node: Node,
  doc: Document,
  range: monaco.IRange
): Promise<CompletionItem[]> => {
  console.log("trigger: " + path[pathIndex]);
  // trigger can be a single item on a map or otherwise a seq.
  if (isSeq(pathNode)) {
    let innerNode: Node | null = null;
    if (pathIndex < path.length) {
      if (pathNode.items.length) {
        innerNode = pathNode.items[path[pathIndex]] as Node;
      }
      return resolveTriggerInner(
        path,
        pathIndex + 1,
        innerNode,
        cv,
        node,
        doc,
        range
      );
    }
    if (cv.schema && !cv.has_required_var) {
      // if this has a schema, when inside the list we no longer can setup automation props
      cv = cv.schema.config_vars.then as ConfigVarTrigger;
    }
    return resolveTriggerInner(
      path,
      pathIndex,
      innerNode,
      cv,
      node,
      doc,
      range
    );
  }
  return resolveTriggerInner(
    path,
    pathIndex,
    isMap(pathNode) ? pathNode : null,
    cv,
    node,
    doc,
    range
  );
};

const resolveTriggerInner = async (
  path: any[],
  pathIndex: number,
  pathNode: Node | null,
  cv: ConfigVarTrigger,
  node: Node,
  doc: Document,
  range: monaco.IRange
): Promise<CompletionItem[]> => {
  console.log("resolve inner: " + pathNode?.toString() + " - cv: " + cv.type);
  const final = pathIndex === path.length;
  if (final) {
    // If this has a schema, use it, these are suggestions so user will see the trigger parameters even when they are optional
    // However if the only option is 'then:' we should avoid it for readability
    if (cv.schema !== undefined) {
      return getConfigVars(
        cv.schema,
        isMap(pathNode) ? pathNode : null,
        doc,
        range
      );
    }
    return addRegistry(
      { type: "registry", registry: "action", key: "" },
      doc,
      range
    );
  }

  if (path[pathIndex] === "then") {
    // all triggers support then, even when they do not have a schema
    // then is a trigger without schema so...
    let thenNode = pathNode;
    if (isMap(pathNode)) {
      thenNode = pathNode.get("then", true) as Node;
    }
    return resolveTrigger(
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
      doc,
      range
    );
  }

  // navigate into the prop
  // this can be an action or a prop of this trigger
  if (cv.schema !== undefined) {
    const innerProp = await coreSchema.findConfigVar(
      cv.schema,
      path[pathIndex],
      doc
    );
    if (innerProp !== undefined) {
      return resolveSchema(
        path,
        pathIndex,
        cv.schema,
        isMap(pathNode) ? pathNode : null,
        node,
        doc,
        range
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
            doc
          );
          if (!maybe_cv) return [];
          return resolveConfigVar(
            path,
            pathIndex,
            maybe_cv,
            null,
            node,
            doc,
            range
          );
        }
        return [];
      }

      return getConfigVars(action.schema, innerNode as YAMLMap, doc, range);
    }

    return resolveSchema(
      path,
      pathIndex + 1,
      action.schema,
      innerNode as YAMLMap,
      node,
      doc,
      range
    );
  }
  return [];
};

const addRegistry = async (
  configVar: ConfigVarRegistry,
  doc: Document,
  range: monaco.IRange
): Promise<CompletionItem[]> => {
  const result: CompletionItem[] = [];
  for await (const [value, props] of await coreSchema.getRegistry(
    configVar.registry,
    doc
  )) {
    if (configVar.filter && !configVar.filter.includes(value)) {
      continue;
    }
    const item: CompletionItem = {
      label: value,
      kind: monaco.languages.CompletionItemKind.Keyword,
      insertText: "- " + value + ": ",
      sortText: value.includes(".") ? "z" + value : value,
      command: { title: "chain", id: "editor.action.triggerSuggest" },
      range,
    };
    if (props.docs) {
      item.documentation = { value: props.docs };
    }
    const completeCv = await coreSchema.getConfigVarComplete2(props);
    if (!completeCv["maybe"]) {
      item.insertText += "\n    ";
    }

    result.push(item);
  }
  return result;
};

const resolveRegistryInner = async (
  path: any[],
  pathIndex: number,
  pathNode: YAMLMap | null,
  cv: ConfigVarRegistry,
  node: Node,
  doc: Document,
  range: monaco.IRange
): Promise<CompletionItem[]> => {
  const final = pathIndex === path.length;
  if (final && pathNode === null) {
    return addRegistry(cv, doc, range);
  }
  const registryCv = await coreSchema.getRegistryConfigVar(
    cv.registry,
    path[pathIndex]
  );
  if (!registryCv) return [];
  const inner = pathNode !== null ? pathNode.get(path[pathIndex]) : null;
  return resolveConfigVar(
    path,
    pathIndex + 1,
    registryCv,
    isMap(inner) ? inner : null,
    node,
    doc,
    range
  );
};

const findClosestNode = (
  doc: Document,
  offset: number,
  model: monaco.editor.ITextModel
): Node | undefined => {
  let offsetDiff = doc.contents!.range![2];
  let maxOffset = doc.contents!.range![0];

  let closestNode: Node | undefined = undefined;
  visit(doc, (key, node) => {
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

  console.log("closest node 1", closestNode);

  const position = model.getPositionAt(offset);
  console.log(position, offset);
  const lineContent = model.getLineContent(position.lineNumber);

  // note that in monaco, position column is 1 based, so indentation 2 spaces will be value 3
  const indentation = getIndentation(lineContent, position.column) + 1;

  if (closestNode !== undefined && indentation === position.column) {
    closestNode = getProperParentByIndentation(
      doc,
      indentation,
      closestNode,
      model
    );
  }

  return closestNode;
};

const getIndentation = (lineContent: string, position: number): number => {
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
};

const getProperParentByIndentation = (
  doc: Document,
  indentation: number,
  node: Node,
  model: monaco.editor.ITextModel
): Node | undefined => {
  if (!node) {
    return doc.contents as Node;
  }
  if (isNode(node) && node.range) {
    const position = model.getPositionAt(node.range[0]);
    if (position.column > indentation && position.column > 1) {
      const parent = getParent(node, doc);
      if (parent) {
        return getProperParentByIndentation(doc, indentation, parent, model);
      }
    } else if (position.column < indentation) {
      const parent = getParent(node, doc);
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
      model.getPositionAt(node.key.range![0]).column < indentation
    ) {
      return node;
    }
    const parent = getParent(node, doc);
    if (isNode(parent))
      return getProperParentByIndentation(doc, indentation, parent, model);
  }
  return node;
};
