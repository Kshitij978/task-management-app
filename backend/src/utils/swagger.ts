import fs from "fs";
import path from "path";
import yaml from "js-yaml";
import type { OpenAPIV3 } from "openapi-types";

export function loadOpenApiSpec(): OpenAPIV3.Document {
  const p = path.resolve(__dirname, "../../docs/openapi.yaml"); // adjust if different
  const content = fs.readFileSync(p, "utf8");
  const doc = yaml.load(content) as OpenAPIV3.Document;
  return doc;
}
