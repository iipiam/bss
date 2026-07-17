import ts from "typescript";
import fs from "fs";

const FILE = "client/src/i18n/translations.ts";
const missingKeys = fs.readFileSync("/tmp/missing_keys.txt", "utf8").split("\n").map(s => s.trim()).filter(Boolean);
const objOnlyKeys = fs.readFileSync("/tmp/obj_only_keys.txt", "utf8").split("\n").map(s => s.trim()).filter(Boolean);

const src = fs.readFileSync(FILE, "utf8");
const sf = ts.createSourceFile(FILE, src, ts.ScriptTarget.Latest, true);

function humanize(key: string): string {
  let k = key.replace(/Desc$/, " description").replace(/Title$/, "");
  const words = k.replace(/([a-z0-9])([A-Z])/g, "$1 $2").replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2").toLowerCase().split(/[\s_]+/).filter(Boolean);
  const s = words.join(" ").trim();
  return s.charAt(0).toUpperCase() + s.slice(1);
}

interface Removal { start: number; end: number; }
const removals: Removal[] = [];
interface Insertion { pos: number; text: string; }
const insertions: Insertion[] = [];

let iface: ts.InterfaceDeclaration | undefined;
let transObj: ts.ObjectLiteralExpression | undefined;

sf.forEachChild(node => {
  if (ts.isInterfaceDeclaration(node) && node.name.text === "Translations") iface = node;
  if (ts.isVariableStatement(node)) {
    for (const d of node.declarationList.declarations) {
      if (ts.isIdentifier(d.name) && d.name.text === "translations" && d.initializer && ts.isObjectLiteralExpression(d.initializer)) {
        transObj = d.initializer;
      }
    }
  }
});

if (!iface || !transObj) throw new Error("Could not find interface or translations object");

// ---- Interface: dedupe (keep last) + collect existing keys ----
const ifaceSeen = new Map<string, ts.TypeElement[]>();
for (const m of iface.members) {
  if (m.name && (ts.isIdentifier(m.name) || ts.isStringLiteral(m.name))) {
    const name = m.name.text;
    if (!ifaceSeen.has(name)) ifaceSeen.set(name, []);
    ifaceSeen.get(name)!.push(m);
  }
}
let dupIfaceCount = 0;
for (const [, members] of ifaceSeen) {
  if (members.length > 1) {
    for (const m of members.slice(0, -1)) {
      removals.push({ start: m.getFullStart(), end: m.getEnd() });
      dupIfaceCount++;
    }
  }
}
const ifaceKeys = new Set(ifaceSeen.keys());
const keysToAddIface = Array.from(new Set([...missingKeys, ...objOnlyKeys])).filter(k => !ifaceKeys.has(k));
{
  const closeBrace = iface.getEnd() - 1;
  const text = "\n  // --- Added by full-app error inspection (previously missing keys) ---\n" +
    keysToAddIface.map(k => `  ${k}: string;`).join("\n") + "\n";
  insertions.push({ pos: closeBrace, text });
}

// ---- Language objects: dedupe (keep last) + add missing keys ----
const langReport: string[] = [];
for (const prop of transObj.properties) {
  if (!ts.isPropertyAssignment(prop) || !ts.isObjectLiteralExpression(prop.initializer)) continue;
  const langName = prop.name.getText();
  const obj = prop.initializer;
  const seen = new Map<string, ts.ObjectLiteralElementLike[]>();
  for (const p of obj.properties) {
    if (p.name && (ts.isIdentifier(p.name) || ts.isStringLiteral(p.name))) {
      const name = p.name.text;
      if (!seen.has(name)) seen.set(name, []);
      seen.get(name)!.push(p);
    }
  }
  let dupCount = 0;
  for (const [, props] of seen) {
    if (props.length > 1) {
      for (const p of props.slice(0, -1)) {
        let end = p.getEnd();
        if (src[end] === ",") end++;
        removals.push({ start: p.getFullStart(), end });
        dupCount++;
      }
    }
  }
  const existing = new Set(seen.keys());
  const toAdd = missingKeys.filter(k => !existing.has(k));
  if (toAdd.length) {
    const closeBrace = obj.getEnd() - 1;
    const lastProp = obj.properties[obj.properties.length - 1];
    const needComma = lastProp ? src.slice(lastProp.getEnd(), closeBrace).indexOf(",") === -1 : false;
    const text = (needComma ? "," : "") + "\n    // --- Added by full-app error inspection (English fallback) ---\n" +
      toAdd.map(k => `    ${k}: ${JSON.stringify(humanize(k))},`).join("\n") + "\n  ";
    insertions.push({ pos: closeBrace, text });
  }
  langReport.push(`${langName}: removed ${dupCount} dups, added ${toAdd.length} keys`);
}

// ---- Apply edits (sort descending by position) ----
type Edit = { pos: number; end: number; text: string };
const edits: Edit[] = [
  ...removals.map(r => ({ pos: r.start, end: r.end, text: "" })),
  ...insertions.map(i => ({ pos: i.pos, end: i.pos, text: i.text })),
].sort((a, b) => b.pos - a.pos || b.end - a.end);

let out = src;
for (const e of edits) {
  out = out.slice(0, e.pos) + e.text + out.slice(e.end);
}
fs.writeFileSync(FILE, out);
console.log(`Interface: removed ${dupIfaceCount} duplicate members, added ${keysToAddIface.length} keys`);
console.log(langReport.join("\n"));
