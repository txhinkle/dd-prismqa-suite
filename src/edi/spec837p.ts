// 837 Professional (005010X222A1) claim + service lines + validation.
import type { Edi837Encounter, ValidationNote } from "./types";
import { ccyymmdd, comp, money, seg, type SegmentEmitter, type VariantSpec } from "./x12";
import { bhtSeg, billing, extrasFor, renderingProvider, subscriberPayer, submitterReceiver, totalCharge, validateCommon } from "./common837";

export const IMPL_REF_837P = "005010X222A1";

const claim: SegmentEmitter = (enc) => {
  const c = enc.claim;
  const out: string[] = [];
  // CLM05 = Place of Service : B : Frequency.
  out.push(seg("CLM", c.patientControlNumber, money(totalCharge(enc)), "", "", comp(c.placeOfService, "B", c.frequencyCode), "N", "A", "Y", "Y"));
  // Diagnoses: principal ABK then additional ABF (one HI, up to 12 pointers' worth).
  const dx: string[] = [];
  if (c.principalDiagnosis) dx.push(comp("ABK", c.principalDiagnosis));
  (c.otherDiagnoses ?? []).filter(Boolean).slice(0, 11).forEach((d) => dx.push(comp("ABF", d)));
  if (dx.length) out.push(seg("HI", ...dx));
  out.push(...renderingProvider(enc));
  out.push(...extrasFor(enc, "2300"));
  return out;
};

const serviceLines: SegmentEmitter = (enc) => {
  const out: string[] = [];
  enc.lines.forEach((line, i) => {
    out.push(seg("LX", String(i + 1)));
    const proc = comp("HC", line.hcpcs, ...(line.modifiers ?? []));
    const pointers = (line.diagnosisPointers && line.diagnosisPointers.length ? line.diagnosisPointers : [1]).map(String);
    out.push(seg("SV1", proc, money(Number(line.charge) || 0), line.unitBasis ?? "UN", String(line.units ?? 1), line.placeOfService ?? "", "", comp(...pointers)));
    if (line.serviceDate) out.push(seg("DTP", "472", "D8", ccyymmdd(line.serviceDate)));
    out.push(...extrasFor(enc, "2400"));
  });
  return out;
};

function validate(enc: Edi837Encounter): ValidationNote[] {
  const n = validateCommon(enc);
  if (!enc.claim.principalDiagnosis?.trim())
    n.push({ severity: "error", field: "claim.principalDiagnosis", message: "At least one diagnosis (2300 HI*ABK) is required.", loop: "2300" });
  if (!enc.claim.placeOfService?.trim())
    n.push({ severity: "error", field: "claim.placeOfService", message: "Place of service (CLM05-1) is required for professional.", loop: "2300" });
  enc.lines.forEach((l, i) => {
    if (!l.hcpcs?.trim()) n.push({ severity: "error", field: `lines.${i}.hcpcs`, message: `Line ${i + 1}: procedure code (SV1-01) is required.`, loop: "2400" });
  });
  return n;
}

export const spec837p: VariantSpec = {
  variant: "837P",
  implementationRef: IMPL_REF_837P,
  body: [bhtSeg, submitterReceiver, billing, subscriberPayer, claim, serviceLines],
  validate
};
