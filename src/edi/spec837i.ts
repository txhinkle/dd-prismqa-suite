// 837 Institutional (005010X223A2) claim + service lines + validation.
import type { Edi837Encounter, ValidationNote } from "./types";
import { ccyymmdd, comp, money, seg, type SegmentEmitter, type VariantSpec } from "./x12";
import { bhtSeg, billing, extrasFor, renderingProvider, subscriberPayer, submitterReceiver, totalCharge, validateCommon } from "./common837";

export const IMPL_REF_837I = "005010X223A2";

const claim: SegmentEmitter = (enc) => {
  const c = enc.claim;
  const out: string[] = [];
  out.push(seg("CLM", c.patientControlNumber, money(totalCharge(enc)), "", "", comp(c.typeOfBill, "A", c.frequencyCode), "", "A", "Y", "Y"));
  out.push(seg("DTP", "434", "RD8", `${ccyymmdd(c.statementFrom)}-${ccyymmdd(c.statementThrough)}`));
  if (c.admissionType || c.patientStatus) out.push(seg("CL1", c.admissionType, c.admissionSource, c.patientStatus));
  if (c.principalDiagnosis) out.push(seg("HI", comp("ABK", c.principalDiagnosis)));
  const others = (c.otherDiagnoses ?? []).filter(Boolean).slice(0, 11);
  if (others.length) out.push(seg("HI", ...others.map((d) => comp("ABF", d))));
  if (c.drgCode) out.push(seg("HI", comp("DR", c.drgCode)));
  out.push(...renderingProvider(enc));
  out.push(...extrasFor(enc, "2300"));
  return out;
};

const serviceLines: SegmentEmitter = (enc) => {
  const out: string[] = [];
  enc.lines.forEach((line, i) => {
    out.push(seg("LX", String(i + 1)));
    const proc = line.hcpcs ? comp("HC", line.hcpcs, ...(line.modifiers ?? [])) : "";
    out.push(seg("SV2", line.revenueCode, proc, money(Number(line.charge) || 0), line.unitBasis ?? "UN", String(line.units ?? 1)));
    if (line.serviceDate) out.push(seg("DTP", "472", "D8", ccyymmdd(line.serviceDate)));
    out.push(...extrasFor(enc, "2400"));
  });
  return out;
};

function validate(enc: Edi837Encounter): ValidationNote[] {
  const n = validateCommon(enc);
  if (!enc.claim.principalDiagnosis?.trim())
    n.push({ severity: "error", field: "claim.principalDiagnosis", message: "Principal diagnosis (2300 HI*ABK) is required.", loop: "2300" });
  if (!enc.claim.drgCode)
    n.push({ severity: "warning", field: "claim.drgCode", message: "Utah requires a valid DRG (2300 HI*DR) on all institutional claims regardless of payment.", loop: "2300" });
  if (!enc.claim.admissionType)
    n.push({ severity: "warning", field: "enc.claim.admissionType", message: "Admission Type, Source Code, and Patient Status required for Institutional claim", loop: "2300" });
  if (!enc.billingProvider.taxonomy)
    n.push({ severity: "warning", field: "billingProvider.taxonomy", message: "Billing provider taxonomy (2000A PRV03) omitted; required for some provider types (e.g. RHC 261QR1300X).", loop: "2000A" });
  enc.lines.forEach((l, i) => {
    if (!l.revenueCode?.trim()) n.push({ severity: "error", field: `lines.${i}.revenueCode`, message: `Line ${i + 1}: revenue code (SV2-01) is required for institutional.`, loop: "2400" });
  });
  return n;
}

export const spec837i: VariantSpec = {
  variant: "837I",
  implementationRef: IMPL_REF_837I,
  body: [bhtSeg, submitterReceiver, billing, subscriberPayer, claim, serviceLines],
  validate
};
