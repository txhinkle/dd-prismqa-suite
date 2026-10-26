import { ref } from 'vue'
import { sampleFor } from '@/edi/samples';
import type { Edi837Encounter, Edi837Variant } from '../edi/types.ts';

const clone = (e: Edi837Encounter): Edi837Encounter => JSON.parse(JSON.stringify(e));

const activeComponent = ref('Home');
const enc = ref<Edi837Encounter>(clone(sampleFor('837I')));

// Replace the working encounter with a fresh copy of the preloaded sample.
const loadSample = function (variant: Edi837Variant) {
    enc.value = clone(sampleFor(variant));
}

// Reload the preloaded sample for whichever variant is currently selected.
const toggleVariant = function () {
    enc.value = clone(sampleFor(enc.value.variant));
}

export default function useShared() {
    return {
        activeComponent,
        enc,
        loadSample,
        toggleVariant
    }
}
