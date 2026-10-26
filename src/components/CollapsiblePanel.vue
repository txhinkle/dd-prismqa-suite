<script setup lang="ts">
    import { ref } from 'vue';
    import type { Component } from 'vue';
    import ChevronDown from './icons/ChevronDown.vue';
    import ChevronRight from './icons/ChevronRight.vue';

    const props = withDefaults(defineProps<{
        bodyClassName?: string;
        defaultOpen?: boolean;
        eyebrow: string;
        icon?: Component;
        summary?: string;
        title: string;
    }>(), {
        bodyClassName: 'tool-panel',
        defaultOpen: true
    });

    const open = ref(props.defaultOpen);
</script>
<template>
  <div class="panel collapsible-panel">
    <button
      :aria-expanded="open"
      class="collapsible-header"
      @click="open = !open"
      type="button"
    >
      <span class="collapsible-title">
        <ChevronDown v-if="open" />
        <ChevronRight v-else />
        <component v-if="icon" :is="icon" :size="18" />
        <span>
          <span class="eyebrow">{{ eyebrow }}</span>
          <strong>{{ title }}</strong>
        </span>
      </span>
      <span v-if="summary" class="collapse-summary">{{ summary }}</span>
    </button>
    <div v-if="open" :class="['collapsible-body', bodyClassName]">
      <slot />
    </div>
  </div>
</template>
