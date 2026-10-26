// Generic X12 5010 assembly: delimiters, ISA/GS envelope, control counting,
// and SE/GE/IEA trailers. Variant bodies (e.g. spec837i) supply the ST..2400
// segments via SegmentEmitters so the per-transaction structure stays the
// single source of truth.
import type { Edi837Encounter, GenerateResult, ValidationNote } from "./types";

export const ELEMENT = "*";
export const SUBELEMENT = ":";
export const SEGTERM = "";

// Build a segment from an id + elements, trimming trailing empty elements.
export function seg(id: string, ...elements: (string | number | undefined)[]): string {
  const parts = elements.map((e) => (e === undefined || e === null ? "" : String(e)));
  while (parts.length && parts[parts.length - 1] === "") parts.pop();
  return [id, ...parts].join(ELEMENT);
}

// Composite element from sub-elements (trims trailing empties).
export function comp(...subs: (string | number | undefined)[]): string {
  const parts = subs.map((s) => (s === undefined || s === null ? "" : String(s)));
  while (parts.length && parts[parts.length - 1] === "") parts.pop();
  return parts.join(SUBELEMENT);
}

export function ccyymmdd(value?: string): string {
  if (!value) return "";
  const digits = value.replace(/[^0-9]/g, "");
  return digits.slice(0, 8);
}

export function hhmm(date = new Date()): string {
  return `${String(date.getHours()).padStart(2, "0")}${String(date.getMinutes()).padStart(2, "0")}`;
}

export function money(value: number): string {
  return (Math.round(value * 100) / 100).toFixed(2);
}

function pad(value: string, len: number): string {
  return value.length >= len ? value.slice(0, len) : value + " ".repeat(len - value.length);
}

export type SegmentEmitter = (enc: Edi837Encounter) => string[];

export interface VariantSpec {
  variant: string;
  implementationRef: string; // GS08 / ST03 (e.g. 005010X223A2)
  body: SegmentEmitter[];
  validate: (enc: Edi837Encounter) => ValidationNote[];
}

function buildIsa(enc: Edi837Encounter, now: Date): string {
  const date = `${String(now.getFullYear()).slice(2)}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
  return [
    "ISA", "00", pad("", 10), "00", pad("", 10),
    "ZZ", pad(enc.submitter.id, 15), "ZZ", pad(enc.receiver.id, 15),
    date, hhmm(now), "^", "00501",
    enc.controlNumbers.isa13.padStart(9, "1"), "1", enc.usageIndicator, SUBELEMENT
  ].join(ELEMENT);
}

function buildGs(enc: Edi837Encounter, spec: VariantSpec, now: Date): string {
  const date = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
  return seg("GS", "HC", enc.submitter.id, enc.receiver.id, date, hhmm(now), enc.controlNumbers.isa13.padStart(9, "1"), "X", spec.implementationRef);
}

export function generate(enc: Edi837Encounter, spec: VariantSpec, now = new Date()): GenerateResult {
  const notes = spec.validate(enc);
  const body = spec.body.flatMap((emit) => emit(enc));
  const st = seg("ST", "837", enc.controlNumbers.isa13.padStart(9, "1"), spec.implementationRef);
  // SE counts ST..SE inclusive = body + ST + SE.
  const segmentCount = body.length + 2;
  const se = seg("SE", String(segmentCount), enc.controlNumbers.isa13.padStart(9, "1"));

  const isa = buildIsa(enc, now);
  const gs = buildGs(enc, spec, now);
  const ge = seg("GE", "1", enc.controlNumbers.isa13.padStart(9, "1"));
  const iea = seg("IEA", "1", enc.controlNumbers.isa13.padStart(9, "1"));

  const segments = [isa, gs, st, ...body, se, ge, iea];
  const x12 = segments.map((s) => s + SEGTERM).join("\n") + "\n";

  return { segments, x12, segmentCount, notes };
}

// Parse a generated file back into {loop-agnostic} segment objects - used by the
// preview/round-trip check so the tester can confirm structure before export.
export function parseSegments(x12: string): { id: string | undefined; elements: string[] }[] {
  return x12
    .split(SEGTERM)
    .map((s) => s.replace(/[\r\n]+/g, "").trim())
    .filter(Boolean)
    .map((s) => {
      const [id, ...elements] = s.split(ELEMENT);
      return { id, elements };
    });
}
