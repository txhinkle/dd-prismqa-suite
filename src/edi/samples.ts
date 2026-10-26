// Preloaded minimal-valid encounters per variant. Each carries just enough to
// produce a processable transaction; the tester edits/extends from here.
import type { Edi837Encounter, Edi837Variant } from "./types";

const commonParties = {
  usageIndicator: "T" as const,
  transactionType: "RP" as const,
  submitter: { name: "TEST MCO SUBMITTER", id: "HT000015-300", contactName: "EDI SUPPORT", contactPhone: "8015551234" },
  receiver: { name: "Utah Medicaid MCO", id: "HT000004-003" },
  billingProvider: {
    orgName: "TEST CLINIC", npi: "1234567893", taxId: "870000000", taxonomy: "282N00000X",
    address1: "123 MAIN ST", city: "SALT LAKE CITY", state: "UT", zip: "841011111"
  },
  subscriber: {
    lastName: "DOE", firstName: "JANE", memberId: "1234567890", dob: "1990-01-15",
    gender: "F" as const, payerResponsibility: "P" as const, groupNumber: "123456789", claimFilingCode: "MC"
  },
  payer: { name: "UTAH MEDICAID MCO", id: "HT000004" }
};

export const sample837i: Edi837Encounter = {
  variant: "837I",
  ...commonParties,
  // controlNumbers: { isa13: "000000001", gs06: "1", st02: "0001" },
  controlNumbers: { isa13: '' + Math.floor(Date.now() / 10000) + '' },
  billingProvider: { ...commonParties.billingProvider, orgName: "TEST HOSPITAL" },
  claim: {
    patientControlNumber: "ENC2026I0001", typeOfBill: "13", frequencyCode: "1",
    statementFrom: "2026-04-21", statementThrough: "2026-04-21", drgCode: "470",
    serviceDateH: "2026-04-21",
    principalDiagnosis: "R079", otherDiagnoses: ["I2510"]
  },
  lines: [
    { revenueCode: "0450", hcpcs: "99284", charge: 987.5, units: 1, unitBasis: "UN", serviceDate: "2026-04-21" },
    { revenueCode: "0636", hcpcs: "J1885", charge: 54, units: 2, unitBasis: "UN", serviceDate: "2026-04-21" }
  ],
  extras: []
};

export const sample837p: Edi837Encounter = {
  variant: "837P",
  ...commonParties,
  // controlNumbers: { isa13: "100000002", gs06: "2", st02: "0001" },
  controlNumbers: { isa13: Math.floor(Date.now() / 10000) + '' },
  claim: {
    patientControlNumber: "ENC2026P0001", placeOfService: "11", frequencyCode: "1",
    principalDiagnosis: "J029", otherDiagnoses: [],
    renderingProvider: { lastName: "SMITH", firstName: "PAT", npi: "1235567896" }
  },
  lines: [
    { hcpcs: "99213", modifiers: [], charge: 125, units: 1, unitBasis: "UN", placeOfService: "11", diagnosisPointers: [1], serviceDate: "2026-04-21" },
    { hcpcs: "87880", modifiers: [], charge: 35, units: 1, unitBasis: "UN", placeOfService: "11", diagnosisPointers: [1], serviceDate: "2026-04-21" }
  ],
  extras: []
};

export const sample837d: Edi837Encounter = {
  variant: "837D",
  ...commonParties,
  // controlNumbers: { isa13: "000000003", gs06: "3", st02: "0001" },
  controlNumbers: { isa13: Math.floor(Date.now() / 10000) + '' },
  billingProvider: { ...commonParties.billingProvider, orgName: "TEST DENTAL", taxonomy: "1223G0001X" },
  claim: {
    patientControlNumber: "ENC2026D0001", placeOfService: "11", frequencyCode: "1",
    renderingProvider: { lastName: "MOLAR", firstName: "DEE", npi: "1235567896" }
  },
  lines: [
    { hcpcs: "D0120", charge: 55, units: 1, serviceDate: "2026-04-21" },
    { hcpcs: "D2391", charge: 180, units: 1, toothNumber: "3", toothSurfaces: ["O"], serviceDate: "2026-04-21" }
  ],
  extras: []
};

export function sampleFor(variant: Edi837Variant): Edi837Encounter {
  if (variant === "837P") return sample837p;
  if (variant === "837D") return sample837d;
  return sample837i;
}
