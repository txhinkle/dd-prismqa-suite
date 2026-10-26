<script setup lang="ts">
    import { computed, ref } from 'vue';
    import useShared from '@/composables/useShared';
    import CollapsiblePanel from './CollapsiblePanel.vue';
    import AlertTriangle from './icons/AlertTriangle.vue';
    import Download from './icons/Download.vue';
    import Plus from './icons/Plus.vue';
    import RotateCcw from './icons/RotateCcw.vue';
    import Trash2 from './icons/Trash2.vue';
    import Building2 from './icons/Building2.vue';
    import FileCode2 from './icons/FileCode2.vue';
    import FileText from './icons/FileText.vue';
    import Stethoscope from './icons/Stethoscope.vue';
    import UserRound from './icons/UserRound.vue';
    import { getSpec } from '@/edi/registry';
    import { generate, parseSegments } from '@/edi/x12';
    import type { Edi837Variant, RenderingProvider, ServiceLine } from '../edi/types.ts';

    const {
        activeComponent,
        enc,
        toggleVariant,
    } = useShared();

    const variants: { value: Edi837Variant; label: string }[] = [
        { value: "837I", label: "837I Institutional" },
        { value: "837P", label: "837P Professional" },
        { value: "837D", label: "837D Dental" }
    ];

    const mcos: { name: string, tpn: string, id: string}[] = [
      {name: "Molina - MMed", tpn: 'Fill in TPN', id: "200000101"}
    ]

    // Export filename pieces
    const initials = ref('');
    const batchSeq = ref('001');

    const isI = computed(() => enc.value.variant === '837I');
    const isP = computed(() => enc.value.variant === '837P');
    const isD = computed(() => enc.value.variant === '837D');

    // Regenerates automatically whenever anything in enc changes (deep reactivity).
    const spec = computed(() => getSpec(enc.value.variant));
    const result = computed(() => (spec.value ? generate(enc.value, spec.value) : null));
    const loops = computed(() => (result.value ? parseSegments(result.value.x12).length : 0));
    const errorCount = computed(() => result.value?.notes.filter((n) => n.severity === 'error').length ?? 0);
    const warnCount = computed(() => result.value?.notes.filter((n) => n.severity === 'warning').length ?? 0);

    const exportName = computed(() =>
        `${enc.value.receiver.id}_<CCYYMMDDHHMMSS>_${enc.value.submitter.id}_${(initials.value || 'DD').toUpperCase()}${batchSeq.value}.${enc.value.variant}`
    );

    const valueOf = (e: Event) => (e.target as HTMLInputElement).value;
    const splitList = (value: string) => value.split(',').map((x) => x.trim()).filter(Boolean);

    const setOtherDiagnoses = function (e: Event) {
        enc.value.claim.otherDiagnoses = splitList(valueOf(e));
    };

    const setRendering = function (field: keyof RenderingProvider, value: string) {
        const claim = enc.value.claim;
        claim.renderingProvider = claim.renderingProvider ?? { lastName: '', npi: '' };
        claim.renderingProvider[field] = value;
    };

    const addLine = function () {
        const d = enc.value;
        if (d.variant === '837I') d.lines.push({ revenueCode: '', charge: 0, units: 1, unitBasis: 'UN' });
        else if (d.variant === '837P') d.lines.push({ hcpcs: '', charge: 0, units: 1, unitBasis: 'UN', placeOfService: d.claim.placeOfService ?? '11', diagnosisPointers: [1] });
        else d.lines.push({ hcpcs: '', charge: 0, units: 1, toothNumber: '' });
    };

    const removeLine = function (i: number) {
        enc.value.lines.splice(i, 1);
    };

    // Comma-separated list fields on a service line (applied on change/blur so
    // typing a trailing comma isn't swallowed).
    const setLineList = function (i: number, field: keyof ServiceLine, value: string) {
        const line = enc.value.lines[i] as any;
        if (!line) return;
        if (field === 'diagnosisPointers') line[field] = splitList(value).map(Number).filter((x) => !Number.isNaN(x));
        else line[field] = splitList(value);
    };

    const exportFile = function () {
        if (!result.value) return;
        const p = (n: number, l = 2) => String(n).padStart(l, '0');
        const d = new Date();
        const ts = `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
        const filename = `${enc.value.receiver.id}_${ts}_${enc.value.submitter.id}_${(initials.value || 'DD').toUpperCase()}${batchSeq.value}.${enc.value.variant}`;
        const blob = new Blob([result.value.x12], { type: 'application/edi-x12;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
    };
</script>
<template>
  <div>
    <section class="page-heading">
      <div>
        <p class="eyebrow">Encounters</p>
        <h1>837 Encounter Generator</h1>
      </div>
      <button class="primary-action" :disabled="!result || errorCount > 0" @click="exportFile" type="button">
        <Download :size="16" />
        Export {{ enc.variant }}
      </button>
    </section>

    <section class="two-column-workspace">
      <div class="workspace-stack">
        <CollapsiblePanel eyebrow="Encounter" :icon="FileText" title="Transaction" :summary="`${enc.variant} / ${enc.transactionType}`">
          <div class="form-grid">
            <label class="field">
              <span>Transaction type</span>
              <!-- Switching type keeps the entered data; use "Reload preloaded" to reset. -->
              <select v-model="enc.variant">
                <option v-for="variant in variants" :value="variant.value" :key="variant.value">{{ variant.label }}</option>
              </select>
            </label>
            <label class="field">
              <span>BHT06 (encounter vs FFS)</span>
              <select v-model="enc.transactionType" disabled="true">
                <option value="RP">RP - Reporting (encounter)</option>
                <option value="CH">CH - Chargeable (FFS)</option>
              </select>
            </label>
            <label class="field">
              <span>Usage (ISA15)</span>
              <span>{{ enc.usageIndicator }} - Test</span>
            </label>
            <label class="field"><span>ISA13 control #</span>
              <input v-model="enc.controlNumbers.isa13" /></label>
            <label class="field"><span>GS06 group #</span>
              <span>{{ enc.controlNumbers.isa13 }}</span></label>
            <label class="field"><span>ST02 set #</span>
              <span>{{ enc.controlNumbers.isa13 }}</span> </label>
            <label class="field"><span>Preparer initials (filename)</span>
              <input v-model="initials" maxlength="5" placeholder="DD" /></label>
            <label class="field"><span>Batch sequence (filename)</span>
              <input v-model="batchSeq" placeholder="001" /></label>
          </div>
          <div class="action-row">
            <button class="icon-button labeled" type="button" @click="toggleVariant">
              <RotateCcw :size="16" /> Reload preloaded {{ enc.variant }}
            </button>
          </div>
        </CollapsiblePanel>

        <CollapsiblePanel eyebrow="Trading partners" :icon="FileCode2" title="Submitter & Receiver">
          <div class="form-grid">
            <label class="field"><span>Submitter name (1000A)</span>
              <input v-model="enc.submitter.name" /></label>
            <label class="field"><span>Submitter ID / TPN</span>
              <input v-model="enc.submitter.id" /></label>
            <label class="field"><span>Submitter contact</span>
              <input v-model="enc.submitter.contactName" /></label>
            <label class="field"><span>Contact phone</span>
              <input v-model="enc.submitter.contactPhone" /></label>
            <label class="field"><span>Receiver name (1000B)</span>
              <input v-model="enc.receiver.name" /></label>
            <label class="field"><span>Receiver ID</span>
              <input v-model="enc.receiver.id" /></label>
          </div>
        </CollapsiblePanel>

        <CollapsiblePanel eyebrow="2010AA" :icon="Building2" title="Billing Provider">
          <div class="form-grid">
            <label class="field"><span>Organization name</span>
              <input v-model="enc.billingProvider.orgName" /></label>
            <label class="field"><span>NPI</span>
              <input v-model="enc.billingProvider.npi" /></label>
            <label class="field"><span>Tax ID (REF*EI)</span>
              <input v-model="enc.billingProvider.taxId" /></label>
            <label class="field"><span>Taxonomy (PRV03)</span>
              <input v-model="enc.billingProvider.taxonomy" /></label>
            <label class="field"><span>Address</span>
              <input v-model="enc.billingProvider.address1" /></label>
            <label class="field"><span>City</span>
              <input v-model="enc.billingProvider.city" /></label>
            <label class="field"><span>State</span>
              <input v-model="enc.billingProvider.state" /></label>
            <label class="field"><span>ZIP</span>
              <input v-model="enc.billingProvider.zip" /></label>
          </div>
        </CollapsiblePanel>

        <CollapsiblePanel eyebrow="2000B / 2010BA / 2010BB" :icon="UserRound" title="Subscriber & Payer">
          <div class="form-grid">
            <label class="field"><span>Last name</span>
              <input v-model="enc.subscriber.lastName" /></label>
            <label class="field"><span>First name</span>
              <input v-model="enc.subscriber.firstName" /></label>
            <label class="field"><span>Member ID (NM109)</span>
              <input v-model="enc.subscriber.memberId" /></label>
            <label class="field"><span>DOB</span>
              <input type="date" v-model="enc.subscriber.dob" /></label>
            <label class="field"><span>Gender</span>
              <select v-model="enc.subscriber.gender">
                <option value="F">F</option><option value="M">M</option><option value="U">U</option>
              </select></label>
            <label class="field"><span>Payer responsibility (SBR01)</span>
              <select v-model="enc.subscriber.payerResponsibility">
                <option value="P">P</option><option value="S">S</option><option value="T">T</option>
              </select></label>
            <label class="field"><span>Group / PRISM location (SBR03)</span>
              <input v-model="enc.subscriber.groupNumber" /></label>
            <label class="field"><span>Claim filing (SBR09)</span>
              <input v-model="enc.subscriber.claimFilingCode" /></label>
            <label class="field"><span>Payer name (2010BB)</span>
              <input v-model="enc.payer.name" /></label>
            <label class="field"><span>Payer ID</span>
              <input v-model="enc.payer.id" /></label>
          </div>
        </CollapsiblePanel>

        <CollapsiblePanel eyebrow="2300" :icon="Stethoscope" title="Claim">
          <div class="form-grid">
            <label class="field"><span>Patient control # (CLM01)</span>
              <input v-model="enc.claim.patientControlNumber" /></label>
            <label v-if="isI" class="field"><span>Type of bill (CLM05-1)</span>
              <input v-model="enc.claim.typeOfBill" /></label>
            <label v-else class="field"><span>Place of service (CLM05-1)</span>
              <input v-model="enc.claim.placeOfService" /></label>
            <label class="field"><span>Frequency (CLM05-3)</span>
              <input v-model="enc.claim.frequencyCode" /></label>
            <template v-if="isI">
              <label class="field"><span>Statement from</span>
                <input type="date" v-model="enc.claim.statementFrom" /></label>
              <label class="field"><span>Statement through</span>
                <input type="date" v-model="enc.claim.statementThrough" /></label>
              <label class="field"><span>DRG (HI*DR)</span>
                <input v-model="enc.claim.drgCode" /></label>
              <label class="field"><span>Admission Type</span>
                <input v-model="enc.claim.admissionType" /></label>
              <label class="field"><span>Admission Source</span>
                <input v-model="enc.claim.admissionSource" /></label>
              <label class="field"><span>Patient Status</span>
                <input v-model="enc.claim.patientStatus" /></label>  
            </template>
            <label v-if="enc.claim.serviceDateH" class="field"><span>Date of Service</span>
                <input v-model="enc.claim.serviceDateH" /></label>
            <label class="field"><span>Principal diagnosis (HI*ABK){{ isD ? " (optional)" : "" }}</span>
              <input v-model="enc.claim.principalDiagnosis" /></label>
            <label class="field"><span>Other diagnoses (comma)</span>
              <input :value="(enc.claim.otherDiagnoses ?? []).join(', ')" @change="setOtherDiagnoses" /></label>
          </div>
          <div v-if="isP || isD" class="form-grid">
            <label class="field"><span>Rendering provider last (2310B)</span>
              <input :value="enc.claim.renderingProvider?.lastName ?? ''" @input="setRendering('lastName', valueOf($event))" /></label>
            <label class="field"><span>Rendering provider first</span>
              <input :value="enc.claim.renderingProvider?.firstName ?? ''" @input="setRendering('firstName', valueOf($event))" /></label>
            <label class="field"><span>Rendering NPI</span>
              <input :value="enc.claim.renderingProvider?.npi ?? ''" @input="setRendering('npi', valueOf($event))" /></label>
          </div>
        </CollapsiblePanel>

        <CollapsiblePanel eyebrow="2400" :icon="FileText" title="Service Lines" :summary="`${enc.lines.length} lines`">
          <div class="line-list">
            <div v-for="(line, i) in enc.lines" class="line-card" :key="i">
              <div class="line-fields">
                <label v-if="isI" class="field"><span>Revenue (SV2-01)</span>
                  <input v-model="line.revenueCode" /></label>
                <label class="field"><span>{{ isD ? "CDT proc (SV3-01)" : isI ? "HCPCS" : "Procedure (SV1-01)" }}</span>
                  <input v-model="line.hcpcs" /></label>
                <label v-if="!isD" class="field"><span>Modifiers (comma)</span>
                  <input :value="(line.modifiers ?? []).join(',')" @change="setLineList(i, 'modifiers', valueOf($event))" /></label>
                <template v-if="isP">
                  <label class="field"><span>POS (SV1-05)</span>
                    <input v-model="line.placeOfService" /></label>
                  <label class="field"><span>Dx pointers (comma)</span>
                    <input :value="(line.diagnosisPointers ?? []).join(',')" @change="setLineList(i, 'diagnosisPointers', valueOf($event))" /></label>
                </template>
                <template v-if="isD">
                  <label class="field"><span>Tooth # (TOO02)</span>
                    <input v-model="line.toothNumber" /></label>
                  <label class="field"><span>Surfaces (comma)</span>
                    <input :value="(line.toothSurfaces ?? []).join(',')" @change="setLineList(i, 'toothSurfaces', valueOf($event))" /></label>
                </template>
                <label class="field"><span>Charge</span>
                  <input type="number" v-model.number="line.charge" /></label>
                <label class="field"><span>Units</span>
                  <input type="number" v-model.number="line.units" /></label>
                <label class="field"><span>Service date</span>
                  <input type="date" v-model="line.serviceDate" /></label>
              </div>
              <button class="row-button" @click="removeLine(i)" type="button" aria-label="Remove line">
                <Trash2 :size="15" />
              </button>
            </div>
          </div>
          <div class="action-row">
            <button class="icon-button labeled" @click="addLine" type="button"><Plus :size="16" /> Add line</button>
          </div>
        </CollapsiblePanel>
      </div>

      <div class="workspace-stack">
        <CollapsiblePanel eyebrow="Preview" :icon="FileCode2" title="X12 5010 output"
          :summary="result ? `${result.segmentCount} segments` : 'n/a'">
          <template v-if="result">
            <div class="inline-status">
              <strong>{{ loops }} segments</strong>
              <span>{{ errorCount }} errors</span>
              <span>{{ warnCount }} warnings</span>
              <span>{{ enc.variant }} / {{ spec?.implementationRef }}</span>
            </div>
            <span class="mini-note">Export file: {{ exportName }}</span>
            <div v-if="result.notes.length > 0" class="edit-code-list">
              <span
                v-for="(note, idx) in result.notes"
                :key="idx"
                :class="['validation-message', { 'danger-text': note.severity === 'error' }]"
              >
                <AlertTriangle :size="14" />
                {{ note.loop ? `[${note.loop}] ` : "" }}{{ note.message }}
              </span>
            </div>
            <pre class="code-output tall">{{ result.x12 }}</pre>
          </template>
          <div v-else class="empty-state">No generator registered for {{ enc.variant }}.</div>
        </CollapsiblePanel>
      </div>
    </section>
  </div>
</template>
