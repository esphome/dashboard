import { isScalar } from "yaml";
import { ESPHomeDocuments } from "./esphome-document";
import { coreSchema, createHover, Position, Range } from "./editor-shims";
import { isString } from "./utils/objects";

export class HoverHandler {
  constructor(private documents: ESPHomeDocuments) {}

  public async getHover(uri: string, position: Position) {
    try {
      const document = this.documents.getDocument(uri);
      const lineContent = document.text.getLineContent(position.line);
      if (lineContent.trim().length === 0) {
        return;
      }
      const offset = document.text.offsetAt(position);
      const node = document.getNodeFromOffset(offset);
      if (!node) return;

      let startPos = node.range?.[0]!;
      if (node.tag) {
        startPos -= node.tag.length + 1;
      }
      const range: Range = {
        start: document.text.getPosition(startPos),
        end: document.text.getPosition(node.range?.[1]!),
      };

      var path = document.getPath(node);

      if (path.length === 1) {
        const rootComponents = await coreSchema.getComponentList();
        if (path[0] in rootComponents) {
          const docs = rootComponents[path[0]].docs;
          if (docs) {
            return createHover(docs, range);
          }
        }
        const platformComponents = await coreSchema.getPlatformList();
        if (path[0] in platformComponents) {
          const docs = platformComponents[path[0]].docs;
          if (docs) {
            return createHover(docs, range);
          }
        }
        return;
      }

      const cvAndPath = await document.getConfigVarAndPathNode(path);
      if (cvAndPath === undefined) {
        return;
      }
      const [cv, pathNode] = cvAndPath;

      let content: string | undefined = undefined;
      if (cv !== undefined) {
        content = cv.docs;
        if (
          content === undefined &&
          path.length === 3 &&
          path[2] === "platform" &&
          isScalar(pathNode) &&
          isString(path[0])
        ) {
          content = (await coreSchema.getComponent(path[0])).components[
            pathNode.value as string
          ].docs;
        }
        if (content) {
          return createHover(content, range);
        }
      }
      return;
    } catch (error) {
      console.log(`Hover: ${error}`);
    }
    return;
  }
}
