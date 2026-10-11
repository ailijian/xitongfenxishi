import { readFile } from "node:fs/promises";
import { unzipSync, strFromU8 } from "fflate";
import { XMLParser } from "fast-xml-parser";

// The source uses x:/w: namespace prefixes. Parse qualified XML rather than
// relying on libraries that assume unprefixed SpreadsheetML tag names.
const xml = new XMLParser({
  ignoreAttributes: false,
  removeNSPrefix: true,
  parseTagValue: false,
  trimValues: false,
});
const list = <T>(value: T | T[] | undefined): T[] =>
  value === undefined ? [] : Array.isArray(value) ? value : [value];
type XmlNode = Record<string, unknown>;
function text(node: unknown): string {
  if (node === undefined || node === null) return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(text).join("");
  const obj = node as XmlNode;
  if ("#text" in obj) return text(obj["#text"]);
  if ("t" in obj) return text(obj.t);
  if ("r" in obj) return text(obj.r);
  return "";
}
export type SourceRow = {
  number: number;
  cells: Map<number, unknown>;
  getCell: (col: number) => { value: unknown };
  hasValues: boolean;
};
export type SourceSheet = {
  name: string;
  rowCount: number;
  columnCount: number;
  getRow: (row: number) => SourceRow;
};
export type SourceWorkbook = {
  worksheets: SourceSheet[];
  getWorksheet: (name: string) => SourceSheet | undefined;
};
function columnNumber(address: string) {
  const letters = address.match(/^[A-Z]+/)?.[0];
  if (!letters) throw new Error(`不合法单元格地址：${address}`);
  return [...letters].reduce((n, c) => n * 26 + c.charCodeAt(0) - 64, 0);
}
export async function readWorkbook(filename: string): Promise<SourceWorkbook> {
  const zip = unzipSync(await readFile(filename));
  const parse = (file: string) => {
    if (!zip[file]) throw new Error(`XLSX缺少部件：${file}`);
    return xml.parse(strFromU8(zip[file]));
  };
  const strings = zip["xl/sharedStrings.xml"]
    ? list(parse("xl/sharedStrings.xml").sst.si).map(text)
    : [];
  const relations = new Map<string, string>(
    list<XmlNode>(
      parse("xl/_rels/workbook.xml.rels").Relationships.Relationship,
    ).map((r) => [String(r["@_Id"]), String(r["@_Target"])]),
  );
  const worksheets = list<XmlNode>(
    parse("xl/workbook.xml").workbook.sheets.sheet,
  ).map((s) => {
    const target = relations.get(String(s["@_id"]));
    if (!target) throw new Error(`工作表关系缺失：${s["@_name"]}`);
    const file = target.startsWith("/") ? target.slice(1) : `xl/${target}`;
    const sheet = parse(file).worksheet;
    const rowMap = new Map<number, SourceRow>();
    let maxColumn = 0;
    for (const row of list<XmlNode>(sheet.sheetData.row)) {
      const cells = new Map<number, unknown>();
      for (const c of list<XmlNode>(row.c as XmlNode | XmlNode[] | undefined)) {
        const col = columnNumber(String(c["@_r"]));
        maxColumn = Math.max(maxColumn, col);
        let value: unknown;
        if ("f" in c) value = { formula: text(c.f) };
        else if (c["@_t"] === "s") {
          const index = Number(c.v);
          if (!Number.isInteger(index) || strings[index] === undefined)
            throw new Error(`共享字符串索引失效：${s["@_name"]}!${c["@_r"]}`);
          value = strings[index];
        } else if (c["@_t"] === "inlineStr") value = text(c.is);
        else value = text(c.v);
        cells.set(col, value);
      }
      const number = Number(row["@_r"]);
      if (rowMap.has(number))
        throw new Error(`重复来源行：${s["@_name"]}!${number}`);
      rowMap.set(number, {
        number,
        cells,
        getCell: (col) => ({ value: cells.get(col) }),
        hasValues: cells.size > 0,
      });
    }
    return {
      name: String(s["@_name"]),
      rowCount: Math.max(...rowMap.keys()),
      columnCount: maxColumn,
      getRow: (number: number) =>
        rowMap.get(number) ?? {
          number,
          cells: new Map(),
          getCell: () => ({ value: undefined }),
          hasValues: false,
        },
    };
  });
  return {
    worksheets,
    getWorksheet: (name) => worksheets.find((s) => s.name === name),
  };
}

export async function readWord(filename: string) {
  const zip = unzipSync(await readFile(filename));
  if (!zip["word/document.xml"]) throw new Error("DOCX缺少word/document.xml");
  const ordered = new XMLParser({
    ignoreAttributes: false,
    removeNSPrefix: true,
    preserveOrder: true,
    parseTagValue: false,
    trimValues: false,
  });
  const doc = ordered.parse(strFromU8(zip["word/document.xml"])) as XmlNode[];
  const paragraphs: string[] = [];
  const paragraphText = (nodes: XmlNode[]): string =>
    nodes
      .map((node) =>
        Object.entries(node)
          .map(([key, value]) => {
            if (key === "t")
              return (value as XmlNode[]).map((n) => text(n["#text"])).join("");
            if (key === "tab") return "\t";
            if (key === "br") return "\n";
            return Array.isArray(value)
              ? paragraphText(value as XmlNode[])
              : "";
          })
          .join(""),
      )
      .join("");
  const visit = (nodes: XmlNode[]) => {
    for (const node of nodes)
      for (const [key, value] of Object.entries(node)) {
        if (key === "p") paragraphs.push(paragraphText(value as XmlNode[]));
        else if (Array.isArray(value)) visit(value as XmlNode[]);
      }
  };
  visit(doc);
  return paragraphs
    .map((text, i) => ({ text: text.trim(), textBlock: i + 1 }))
    .filter((p) => p.text);
}
