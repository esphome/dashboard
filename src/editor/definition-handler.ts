import { isScalar } from "yaml";
import { coreSchema, Position } from "./editor-shims";
import { ESPHomeDocuments } from "./esphome-document";

export class DefinitionHandler {
  constructor(private documents: ESPHomeDocuments) {}

  public async getDefinition(uri: string, position: Position) {
    try {
      const document = this.documents.getDocument(uri);
      const lineContent = document.text.getLineContent(position.line);
      if (lineContent.trim().length === 0) {
        return;
      }
      const offset = document.text.offsetAt(position);
      const node = document.getNodeFromOffset(offset);

      if (!node) return;
      var path = document.getPath(node);

      if (path.length === 1) {
        return null;
      }

      const cvAndPath = await document.getConfigVarAndPathNode(path);
      if (cvAndPath === undefined) {
        return;
      }
      const [cv, pathNode] = cvAndPath;
      let fullCv = await coreSchema.getConfigVarComplete2(cv);

      if (fullCv.type === "schema" && fullCv.maybe !== undefined) {
        fullCv = await coreSchema.getConfigVarComplete2(fullCv);
      }
      if (fullCv.type === "use_id" && isScalar(pathNode)) {
        const typeId = fullCv.use_id_type;
        const targetId = pathNode.value as string;
        const range = await coreSchema.findComponentDefinition(
          typeId,
          targetId,
          document.yaml,
        );
        if (!range) {
          return null;
        }
        const definition = {
          uri: uri,
          range: {
            start: document.text.getPosition(range[0]),
            end: document.text.getPosition(range[0] + targetId.length),
          },
        };
        return definition;
      }
    } catch (error) {
      console.log(`Definition: ${error}`);
    }
    return null;
  }
}
