import {
  Document,
  isMap,
  isPair,
  isScalar,
  isSeq,
  Node,
  Range,
  YAMLMap,
} from "yaml";

export interface SchemaSet {
  [name: string]: Component;
  core: CoreComponent;
}

interface ConfigVarBase {
  key: string;
  is_list?: boolean;
  docs?: string;
  maybe?: string;
  templatable?: boolean;
}

export interface ConfigVarRegistry extends ConfigVarBase {
  type: "registry";
  registry: ComponentRegistry;
  filter?: string[];
}

export interface ConfigVarTrigger extends ConfigVarBase {
  type: "trigger";
  schema: Schema | undefined;
  has_required_var: Boolean;
}

export interface ConfigVarEnum extends ConfigVarBase {
  type: "enum";
  values: { [key: string]: { docs: string } | null };
  default?: string;
}

export interface ConfigVarSchema extends ConfigVarBase {
  type: "schema";
  schema: Schema;
  maybe?: string;
}

export interface ConfigVarTyped extends ConfigVarBase {
  type: "typed";
  typed_key: string;
  types: {
    [name: string]: Schema;
  };
}
export interface ConfigVarPin extends ConfigVarBase {
  type: "pin";
  schema: Boolean;
  internal: Boolean;
  modes: ("output" | "input" | "pullup")[];
}
interface ConfigVarBoolean extends ConfigVarBase {
  type: "boolean";
  default: string;
}
interface ConfigVarString extends ConfigVarBase {
  type: "string" | "integer";
  default?: string;
}
export interface ConfigVarUseId extends ConfigVarBase {
  type: "use_id";
  use_id_type: string;
}

export interface ConfigVarId {
  id_type: {
    class: string;
    parents: string[];
  };
}

export type ConfigVar =
  | ConfigVarSchema
  | ConfigVarRegistry
  | ConfigVarEnum
  | ConfigVarTrigger
  | ConfigVarTyped
  | ConfigVarPin
  | ConfigVarBoolean
  | ConfigVarString
  | ConfigVarUseId;

interface ConfigVars {
  [name: string]: ConfigVar | undefined;
  id?: ConfigVar & ConfigVarId;
}

export interface Schema {
  config_vars: ConfigVars;
  extends: string[];
}

interface Registry {
  [name: string]: ConfigVar;
}

type ComponentRegistry = "action" | "condition" | "filter" | "effects";

interface Component {
  schemas: {
    [name: string]: ConfigVar;
    CONFIG_SCHEMA: ConfigVarSchema;
  };
  // These are the components e.g. of sensor, binary_sensor
  components: { [name: string]: { docs?: string } };

  action: Registry;
  condition: Registry;
  filter: Registry;
  effects: Registry;
  pin?: ConfigVar;
}
interface CoreComponent extends Component {
  platforms: { [name: string]: { docs?: string } };
  components: { [name: string]: { docs?: string; dependencies?: string[] } };
  pins: string[];
}

export class ESPHomeSchema {
  schema: SchemaSet | undefined;
  loaded_schemas: string[] = ["core", "esphome"];

  constructor(private schemaLoader: (schemaName: string) => Promise<any>) {}

  async getSchema(): Promise<SchemaSet> {
    if (this.schema) {
      return this.schema;
    }
    this.schema = await this.schemaLoader("esphome");
    return this.schema!;
  }

  async getPlatformList() {
    return (await this.getSchema()).core.platforms;
  }
  async getComponentList() {
    return (await this.getSchema()).core.components;
  }

  async getComponent(
    domain: string,
    platform: string | null = null,
  ): Promise<Component> {
    if (!this.loaded_schemas.includes(domain)) {
      this.schema = {
        ...this.schema,
        ...(await this.schemaLoader(domain)),
      };
      this.loaded_schemas.push(domain);
    }
    if (platform !== null) {
      return (await this.getSchema())[`${domain}.${platform}`];
    }
    return (await this.getSchema())[domain];
  }

  async getComponentSchema(domain: string): Promise<ConfigVar> {
    const component = await this.getComponent(domain);
    return component.schemas.CONFIG_SCHEMA;
  }
  async getComponentPlatformSchema(
    domain: string,
    platform: string,
  ): Promise<ConfigVar> {
    const component = await this.getComponent(domain, platform);
    return component.schemas.CONFIG_SCHEMA;
  }

  async getExtendedConfigVar(name: string): Promise<ConfigVar> {
    const parts = name.split(".");
    if (parts.length === 3) {
      const c = await this.getComponent(parts[0], parts[1]);
      return c.schemas[parts[2]];
    }
    const c = await this.getComponent(parts[0]);
    return c.schemas[parts[1]];
  }

  async isPlatform(name: string): Promise<boolean> {
    return name in (await this.getSchema()).core.platforms;
  }

  async *getDocComponents(
    doc: Document,
  ): AsyncGenerator<[string, Component, Node?]> {
    const docMap = doc.contents as YAMLMap;
    let addPollingComponent = false;
    const yieldedComponents: string[] = [];
    for (const k of docMap.items) {
      if (isPair(k) && isScalar(k.key)) {
        const componentName = k.key.value as string;
        const isPlatformComponent = await this.isPlatform(componentName);
        if (
          !isPlatformComponent &&
          !(componentName in (await this.getSchema()).core.components)
        ) {
          // invalid or unknown name
          continue;
        }
        const component = await this.getComponent(componentName);
        if (!yieldedComponents.includes(componentName)) {
          yield [componentName, component, k.value as Node];
          yieldedComponents.push(componentName);
        }

        if (isPlatformComponent) {
          // iterate elements and lookup platform to load components
          const platList = docMap.get(componentName);
          if (isSeq(platList)) {
            for (const plat of platList.items) {
              if (isMap(plat)) {
                const platCompName = plat.get("platform") as string;
                if (platCompName in component.components) {
                  if (!addPollingComponent) {
                    const platComponent = await this.getComponent(
                      platCompName,
                      componentName,
                    );
                    if (
                      platComponent.schemas.CONFIG_SCHEMA?.schema?.config_vars.id?.id_type?.parents?.includes(
                        "PollingComponent",
                      )
                    ) {
                      addPollingComponent = true;
                    }
                  }
                  if (!yieldedComponents.includes(platCompName)) {
                    yield [
                      platCompName,
                      await this.getComponent(platCompName),
                      plat,
                    ];
                    yieldedComponents.push(platCompName);
                  }
                }
              }
            }
          }
        } else {
          if (
            !addPollingComponent &&
            component.schemas.CONFIG_SCHEMA?.schema?.config_vars.id?.id_type?.parents?.includes(
              "PollingComponent",
            )
          ) {
            addPollingComponent = true;
          }
          if (
            componentName === "api" &&
            !yieldedComponents.includes("homeassistant")
          ) {
            yield [
              "homeassistant",
              await this.getComponent("homeassistant"),
              k.value as Node,
            ];
          }
        }
      }
    }
    if (addPollingComponent) {
      yield ["component", await this.getComponent("component"), undefined];
    }
    yield ["core", (await this.getSchema()).core, undefined];
  }

  async *getRegistry(
    registry: ComponentRegistry,
    doc: Document,
  ): AsyncGenerator<[string, ConfigVar]> {
    if (registry.includes(".")) {
      // e.g. sensor.filter only items from one component
      const [domain, registryName] = registry.split(".");
      if (this.isRegistry(registryName)) {
        for (const name in (await this.getSchema())[domain][registryName]) {
          yield [name, (await this.getSchema())[domain][registryName][name]];
        }
      }
    } else {
      // e.g. action, condition: search in all domains
      if (this.isRegistry(registry))
        for await (const [componentName, component] of this.getDocComponents(
          doc,
        )) {
          // component might be undefined if this component has no registries
          const componentRegistry = component ? component[registry] : undefined;
          if (componentRegistry !== undefined) {
            for (const name in componentRegistry) {
              if (componentName === "core") {
                yield [name, componentRegistry[name]];
              } else {
                yield [
                  `${componentName.split(".").reverse().join(".")}.${name}`,
                  componentRegistry[name],
                ];
              }
            }
          }
        }
    }
  }

  async getRegistryConfigVar(
    registry: string,
    entry: string,
  ): Promise<ConfigVar | undefined> {
    if (registry.includes(".")) {
      const [domain, registryName] = registry.split(".");
      if (this.isRegistry(registryName))
        return (await this.getComponent(domain))[registryName][entry];
    } else {
      if (this.isRegistry(registry)) {
        if (entry.includes(".")) {
          const parts = entry.split(".");
          if (parts.length === 3) {
            const [domain, platform, actionName] = parts;
            return (await this.getComponent(platform, domain))[registry][
              actionName
            ];
          } else {
            const [domain, actionName] = parts;
            return (await this.getComponent(domain))[registry][actionName];
          }
        }
        for (const c in this.schema) {
          const schema = await this.getComponent(c);
          if (
            schema[registry] !== undefined &&
            schema[registry][entry] !== undefined
          ) {
            return schema[registry][entry];
          }
        }
      }
    }
    return undefined;
  }
  isRegistry(name: string): name is ComponentRegistry {
    return (
      name === "filter" ||
      name === "effects" ||
      name === "condition" ||
      name === "action"
    );
  }
  async getActionConfigVar(entry: string): Promise<ConfigVarTrigger> {
    return (await this.getRegistryConfigVar(
      "action",
      entry,
    )) as ConfigVarTrigger;
  }
  async getPinConfigVar(component: string): Promise<ConfigVar> {
    var c = await this.getComponent(component);
    if (!c.pin) throw new Error("Attempt to get pin from not pin component.");
    return c.pin;
  }
  async getPins(): Promise<string[]> {
    return (await this.getSchema()).core.pins;
  }

  async getConfigVarComplete(schema: Schema, key: string): Promise<ConfigVar> {
    var cv = { ...schema.config_vars[key] } as ConfigVar;

    const appendCvs = async (s: Schema, c: ConfigVar) => {
      if (s.extends !== undefined) {
        for (const extended of s.extends) {
          const s_cv = await this.getExtendedConfigVar(extended);
          if (s_cv.type === "schema") {
            if (
              s_cv.schema.config_vars !== undefined &&
              key in s_cv.schema.config_vars
            ) {
              c = {
                ...s_cv.schema.config_vars[key],
                ...c,
              };
            }
            c = await appendCvs(s_cv.schema, c);
          }
        }
      }
      return c;
    };
    cv = await appendCvs(schema, cv);
    return await this.getConfigVarComplete2(cv);
  }

  async getConfigVarComplete2(cv: ConfigVar): Promise<ConfigVar> {
    var ret = { ...cv };

    if (cv.type === "schema" && cv.schema.extends !== undefined) {
      for (const extended of cv.schema.extends) {
        const s_cv = await this.getExtendedConfigVar(extended);
        ret = {
          ...s_cv,
          ...ret,
        };
        ret.type = s_cv.type;
      }
    }

    return ret;
  }

  async *iterConfigVars(
    schema: Schema,
    doc: Document,
    yielded: string[] = [],
  ): AsyncGenerator<[string, ConfigVar]> {
    const docMap = doc.contents as YAMLMap;
    for (var prop in schema.config_vars) {
      if (
        schema.extends?.includes("core.MQTT_COMPONENT_SCHEMA") &&
        (prop === "mqtt_id" || prop === "expire_after") &&
        docMap.get("mqtt") === undefined
      ) {
        // filter mqtt props if mqtt is not used
        continue;
      }
      if (yielded.includes(prop)) {
        continue;
      }
      yielded.push(prop);
      yield [prop, await this.getConfigVarComplete(schema, prop)];
    }
    if (schema.extends !== undefined) {
      for (var extended of schema.extends) {
        if (
          extended.startsWith("core.MQTT") &&
          docMap.get("mqtt") === undefined
        ) {
          continue;
        }
        const s = await this.getExtendedConfigVar(extended);
        if (s.type === "schema") {
          for await (const pair of this.iterConfigVars(
            s.schema,
            doc,
            yielded,
          )) {
            yield pair;
          }
        } else if (s.type === "typed") {
          yield [s.typed_key, s];
        }
      }
    }
  }

  async findConfigVar(
    schema: Schema,
    prop: string,
    doc: Document,
  ): Promise<ConfigVar | undefined> {
    for await (const [p, config] of this.iterConfigVars(schema, doc)) {
      if (p === prop) {
        return config;
      }
    }
    return undefined;
  }

  async *iterDeclaringIdsInner(
    idType: string,
    map: YAMLMap,
    declaringCv: ConfigVar,
    doc: Document,
  ): AsyncGenerator<Node> {
    let schema: Schema;
    if (declaringCv.type === "schema") {
      schema = declaringCv.schema;
    } else if (declaringCv.type === "typed") {
      const schemaType = map.get(declaringCv.typed_key) as string;
      schema = declaringCv.types[schemaType];
    } else {
      return;
    }
    for (const k of map.items) {
      if (isPair(k) && isScalar(k.key)) {
        const propName = k.key.value as string;
        const cv = await this.findConfigVar(schema, propName, doc);
        if (cv) {
          const idCv = cv as any as ConfigVarId;
          if (
            idCv.id_type &&
            (idCv.id_type.class === idType ||
              idCv.id_type.parents?.includes(idType))
          ) {
            yield k.value as Node;
          }
          if (isMap(k.value)) {
            for await (const yieldNode of this.iterDeclaringIdsInner(
              idType,
              k.value,
              cv,
              doc,
            )) {
              yield yieldNode;
            }
          } else if (cv.is_list && isSeq(k.value)) {
            for (const seqItem of k.value.items) {
              if (isMap(seqItem)) {
                for await (const yieldNode of this.iterDeclaringIdsInner(
                  idType,
                  seqItem,
                  cv,
                  doc,
                )) {
                  yield yieldNode;
                }
              }
            }
          }
        }
      }
    }
  }

  async *iterDeclaringIds(idType: string, doc: Document): AsyncGenerator<Node> {
    const docMap = doc.contents as YAMLMap;
    for (const k of docMap.items) {
      if (isPair(k) && isScalar(k.key)) {
        const componentName = k.key.value as string;
        if (
          componentName in (await this.getSchema()).core.components ||
          (await this.isPlatform(componentName))
        ) {
          const component = await this.getComponent(componentName);
          const cv = component.schemas.CONFIG_SCHEMA;
          if (isMap(k.value) && isScalar(k.value.get("id", true)) && cv) {
            for await (const yieldNode of this.iterDeclaringIdsInner(
              idType,
              k.value,
              cv,
              doc,
            )) {
              yield yieldNode;
            }
          } else if (isSeq(k.value) && cv && cv.is_list) {
            const nodeList = k.value;
            for (const item of nodeList.items) {
              if (isMap(item) && isScalar(item.get("id", true)) && cv) {
                for await (const yieldNode of this.iterDeclaringIdsInner(
                  idType,
                  item,
                  cv,
                  doc,
                )) {
                  yield yieldNode;
                }
              }
            }
          }
          if (await this.isPlatform(componentName)) {
            // iterate elements and lookup platform to load components
            const platNode = k.value;
            if (isSeq(platNode)) {
              for (const seqItemNode of platNode.items) {
                if (isMap(seqItemNode)) {
                  const platCompName = seqItemNode.get("platform") as string;
                  if (platCompName in component.components) {
                    const component = await this.getComponent(
                      platCompName,
                      componentName,
                    );
                    const platCv = component.schemas.CONFIG_SCHEMA;
                    for await (const yieldNode of this.iterDeclaringIdsInner(
                      idType,
                      seqItemNode,
                      platCv,
                      doc,
                    )) {
                      yield yieldNode;
                    }
                  }
                }
              }
            } else if (isMap(platNode)) {
              const platCompName = platNode.get("platform") as string;
              if (platCompName in component.components) {
                const component = await this.getComponent(
                  platCompName,
                  componentName,
                );
                const platCv = component.schemas.CONFIG_SCHEMA;
                for await (const yieldNode of this.iterDeclaringIdsInner(
                  idType,
                  platNode,
                  platCv,
                  doc,
                )) {
                  yield yieldNode;
                }
              }
            }
          }
        }
      }
    }
  }

  async findComponentDefinition(
    id_type: string,
    id: string,
    doc: Document,
  ): Promise<Range | null | undefined> {
    for await (const item of this.iterDeclaringIds(id_type, doc)) {
      if (isScalar(item) && item.value === id) {
        return item.range;
      }
    }
    return null;
  }

  async getUsableIds(use_id_type: string, doc: Document): Promise<string[]> {
    const ret: string[] = [];
    for await (const item of this.iterDeclaringIds(use_id_type, doc)) {
      ret.push(item.toString());
    }
    return ret;
  }
}
