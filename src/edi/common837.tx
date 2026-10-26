// Shared 837 body emitters + common validation, reused by the I/P/D specs.
// Envelope (ISA/GS/ST/SE/GE/IEA) is handled by the generic engine in x12.ts.
import type { Edi837Encounter, ValidationNote } from "./types";
import { ccyymmdd, money, seg, type SegmentEmitter } from "./x12";

export function totalCharge(enc: Edi837Encounter): number {
  if (typeof enc.claim.totalCharge === "number") return enc.claim.totalCharge;
  return enc.lines.reduce((sum, l) => sum + (Number(l.charge) || 0), 0);
}

// Render any tester-added segments attached to a given loop, ordering elements
// by their numeric position.
export function extrasFor(enc: Edi837Encounter, loop: string): string[] {
  return (enc.extras ?? [])
    .filter((x) => x.loop === loop)
    .map((x) => {
      const positions = Object.keys(x.elements).sort((a, b) => Number(a) - Number(b));
      const max = positions.length ? Number(positions[positions.length - 1]) : 0;
      const elems: string[] = [];
      for (let i = 1; i <= max; i++) {
        elems.push(x.elements[String(i).padStart(2, "0")] ?? x.elements[String(i)] ?? "");
      }
      return seg(x.segment, ...elems);
    });
}

export const bhtSeg: SegmentEmitter = (enc) => [
  seg("BHT", "0019", "00", enc.controlNumbers.isa13, ccyymmdd(new Date().toISOString()), "1022", enc.transactionType)
];

export const submitterReceiver: SegmentEmitter = (enc) => {
  const out = [seg("NM1", "41", "2", enc.submitter.name, "", "", "", "", "46", enc.submitter.id)];
  if (enc.submitter.contactName || enc.submitter.contactPhone) {
    out.push(seg("PER", "IC", enc.submitter.contactName, enc.submitter.contactPhone ? "TE" : undefined, enc.submitter.contactPhone));
  }
  out.push(seg("NM1", "40", "2", enc.receiver.name, "", "", "", "", "46", enc.receiver.id));
  return out;
};

export const billing: SegmentEmitter = (enc) => {
  const b = enc.billingProvider;
  const out = [seg("HL", "1", "", "20", "1")];
  if (b.taxonomy) out.push(seg("PRV", "BI", "PXC", b.taxonomy));
  out.push(seg("NM1", "85", "2", b.orgName, "", "", "", "", "XX", b.npi));
  out.push(seg("N3", b.address1));
  out.push(seg("N4", b.city, b.state, b.zip));
  out.push(seg("REF", "EI", b.taxId));
  out.push(...extrasFor(enc, "2010AA"));
  return out;
};

export const subscriberPayer: SegmentEmitter = (enc) => {
  const s = enc.subscriber;
  const out = [
    seg("HL", "2", "1", "22", "0"),
    seg("SBR", s.payerResponsibility, "18", s.groupNumber, "", "", "", "", "", s.claimFilingCode),
    seg("NM1", "IL", "1", s.lastName, s.firstName ?? "NoFirst", "", "", "", "MI", s.memberId)
  ];
  if (s.dob || s.gender) out.push(seg("DMG", "D8", ccyymmdd(s.dob), s.gender));
  out.push(seg("NM1", "PR", "2", enc.payer.name, "", "", "", "", "PI", enc.payer.id));
  return out;
};

// 2310B rendering provider (used by P and D when present).
export const renderingProvider: SegmentEmitter = (enc) => {
  const r = enc.claim.renderingProvider;
  if (!r || !r.npi) return [];
  return [seg("NM1", "82", "1", r.lastName, r.firstName ?? "", "", "", "", "XX", r.npi)];
};

// Checks shared by all variants. Variant specs add their own (dx, DRG, tooth, etc.).
export function validateCommon(enc: Edi837Encounter): ValidationNote[] {
  const n: ValidationNote[] = [];
  const err = (field: string, message: string, loop?: string) => n.push({ severity: "error", field, message, loop });
  const warn = (field: string, message: string, loop?: string) => n.push({ severity: "warning", field, message, loop });

  if (!enc.submitter.id.trim()) err("submitter.id", "Submitter / trading partner ID (ISA06, 1000A NM109) is required.", "1000A");
  if (!enc.receiver.id.trim()) err("receiver.id", "Receiver ID (1000B NM109) is required.", "1000B");
  if (!enc.billingProvider.npi.trim()) err("billingProvider.npi", "Billing provider NPI (2010AA NM109) is required.", "2010AA");
  if (!enc.billingProvider.taxId.trim()) err("billingProvider.taxId", "Billing provider tax ID (2010AA REF*EI) is required.", "2010AA");
  if (!enc.subscriber.lastName.trim()) err("subscriber.lastName", "Subscriber last name (2010BA NM103) is required.", "2010BA");
  if (!enc.subscriber.memberId.trim()) err("subscriber.memberId", "Subscriber member ID (2010BA NM109) is required.", "2010BA");
  if (!enc.payer.id.trim()) err("payer.id", "Payer ID (2010BB NM109) is required.", "2010BB");
  if (!enc.claim.patientControlNumber.trim()) err("claim.patientControlNumber", "Patient control number (CLM01) is required.", "2300");
  if (!enc.lines.length) err("lines", "At least one service line (2400) is required.", "2400");

  if (enc.transactionType !== "RP") warn("transactionType", 'For an encounter, BHT06 should be "RP" (Reporting); "CH" is fee-for-service.');
  if (!["1", "2", "7", "8"].includes(enc.claim.frequencyCode)) warn("claim.frequencyCode", "Claim frequency (CLM05-3) is normally 1/2/7/8.", "2300");
  const lineSum = enc.lines.reduce((s, l) => s + (Number(l.charge) || 0), 0);
  if (typeof enc.claim.totalCharge === "number" && Math.abs(enc.claim.totalCharge - lineSum) > 0.005)
    warn("claim.totalCharge", `CLM02 total (${money(enc.claim.totalCharge)}) does not equal the sum of line charges (${money(lineSum)}).`, "2300");
  return n;
}
