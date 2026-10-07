import { createRequire } from "node:module";
import { expect, it } from "vitest";
import { extractRawText } from "mammoth";

it("retains DOCX text extraction after removing the vulnerable CLI dependency", async () => {
  const require = createRequire(import.meta.url);
  const mammothRequire = createRequire(require.resolve("mammoth"));
  const Zip = mammothRequire("jszip");
  const zip = new Zip();
  zip.file("[Content_Types].xml", '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>');
  zip.file("_rels/.rels", '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>');
  zip.file("word/document.xml", '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>Example Candidate. Office administration. Graduation 2025.</w:t></w:r></w:p></w:body></w:document>');
  const buffer = await zip.generateAsync({ type: "nodebuffer" });
  expect((await extractRawText({ buffer })).value).toContain("Office administration");
});
