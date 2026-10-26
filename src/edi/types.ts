// 837 encounter data model. The 837 transaction is the container; OPPS and other
// claim types are *content* that ride inside it. One model serves all three
// variants (I/P/D); variant-specific fields are optional and read by each spec.

export type Edi837Variant = "837I" | "837P" | "837D";

export type PayerResponsibility = "P" | "S" | "T";

export interface SubmitterInfo {
  name: string;
  id: string; // ISA06 / 1000A NM109 trading partner number
  contactName?: string;
  contactPhone?: string;
}

export interface ReceiverInfo {
  name: string; // 1000B NM103
  id: string; // 1000B NM109
}

export interface BillingProvider {
  orgName: string;
  npi: string;
  taxId: string;
  taxonomy?: string;
  address1: string;
  city: string;
  state: string;
  zip: string;
}

export interface SubscriberInfo {
  lastName: string;
  firstName?: string;
  memberId: string; // 2010BA NM109 (PRISM beneficiary id)
  dob?: string;
  gender?: "M" | "F" | "U";
  payerResponsibility: PayerResponsibility;
  groupNumber?: string; // SBR03 (PRISM location id)
  claimFilingCode: string; // SBR09 (MC)
}

export interface PayerInfo {
  name: string;
  id: string;
}

// Optional rendering / referring provider (2310 loops; used by P and D).
export interface RenderingProvider {
  lastName: string;
  firstName?: string;
  npi: string;
}

// Common claim shape. Institutional uses typeOfBill/DRG/statement dates;
// professional & dental use placeOfService and line-level dates.
export interface EncounterClaim {
  patientControlNumber: string;
  frequencyCode: string; // CLM05-3
  principalDiagnosis?: string;
  otherDiagnoses?: string[];
  totalCharge?: number; // derived from lines when omitted
  // Institutional
  typeOfBill?: string; // CLM05-1
  statementFrom?: string;
  statementThrough?: string;
  drgCode?: string;
  admissionType?: string;
  admissionSource?: string;
  patientStatus?: string;
  // Professional / Dental
  placeOfService?: string; // CLM05-1
  renderingProvider?: RenderingProvider;
  serviceDateH?: string;
}

export interface ServiceLine {
  charge: number;
  units: number;
  serviceDate?: string;
  hcpcs?: string; // CPT/HCPCS (P) or CDT procedure (D)
  modifiers?: string[];
  unitBasis?: "UN" | "DA" | "MJ";
  // Institutional
  revenueCode?: string;
  // Professional
  placeOfService?: string;
  diagnosisPointers?: number[];
  // Dental
  toothNumber?: string;
  toothSurfaces?: string[];
  oralCavity?: string;
}

// Free-form additional segments the tester can attach; the generator slots them
// into the named loop in document order.
export interface ExtraSegment {
  loop: string;
  segment: string;
  elements: Record<string, string>;
  note?: string;
}

export interface Edi837Encounter {
  variant: Edi837Variant;
  usageIndicator: "P" | "T"; // ISA15
  transactionType: "RP" | "CH"; // BHT06 - RP = encounter (reporting)
  // controlNumbers: { isa13: string; gs06: string; st02: string };
  controlNumbers: { isa13: string }
  submitter: SubmitterInfo;
  receiver: ReceiverInfo;
  billingProvider: BillingProvider;
  subscriber: SubscriberInfo;
  payer: PayerInfo;
  claim: EncounterClaim;
  lines: ServiceLine[];
  extras?: ExtraSegment[];
}

export interface ValidationNote {
  severity: "error" | "warning";
  loop?: string;
  field: string;
  message: string;
}

export interface GenerateResult {
  segments: string[];
  x12: string;
  segmentCount: number;
  notes: ValidationNote[];
}
