// 837 Dental (005010X224A2) claim + service lines (SV3 + TOO) + validation.
import type { Edi837Encounter, ValidationNote } from "./types";
import { ccyymmdd, comp, money, seg, type SegmentEmitter, type VariantSpec } from "./x12";
import { bhtSeg, billing, extrasFor, renderingProvider, subscriberPayer, submitterReceiver, totalCharge, validateCommon } from "./common837";

export const IMPL_REF_837D = "005010X224A2";

const claim: SegmentEmitter = (enc) => {
  const c = enc.claim;
  const out: string[] = [];
  out.push(seg("CLM", c.patientControlNumber, money(totalCharge(enc)), "", "", comp(c.placeOfService, "B", c.frequencyCode), "N", "A", "Y", "Y"));
  // Dental diagnoses are situational.
  // DTP date of service is expected at the head level for dental claims if there is diagnosis
  if (c.serviceDateH) out.push(seg("DTP", "472", "D8", ccyymmdd(c.serviceDateH)));
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
    const proc = comp("AD", line.hcpcs, ...(line.modifiers ?? []));
    out.push(seg("SV3", proc, money(Number(line.charge) || 0), line.placeOfService ?? "", line.oralCavity ?? "", "", "", "", "", "", String(line.units ?? 1)));
    if (line.toothNumber) out.push(seg("TOO", "JP", line.toothNumber, comp(...(line.toothSurfaces ?? []))));
    if (line.serviceDate) out.push(seg("DTP", "472", "D8", ccyymmdd(line.serviceDate)));
    out.push(...extrasFor(enc, "2400"));
  });
  return out;
};

function validate(enc: Edi837Encounter): ValidationNote[] {
  const n = validateCommon(enc);
  if (!enc.claim.placeOfService?.trim())
    n.push({ severity: "error", field: "claim.placeOfService", message: "Place of service (CLM05-1) is required for dental.", loop: "2300" });
  enc.lines.forEach((l, i) => {
    if (!l.hcpcs?.trim()) n.push({ severity: "error", field: `lines.${i}.hcpcs`, message: `Line ${i + 1}: CDT procedure code (SV3-01) is required.`, loop: "2400" });
  });
  return n;
}

export const spec837d: VariantSpec = {
  variant: "837D",
  implementationRef: IMPL_REF_837D,
  body: [bhtSeg, submitterReceiver, billing, subscriberPayer, claim, serviceLines],
  validate
};
