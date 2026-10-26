<script setup lang="ts">
import useShared from '@/composables/useShared';
import ArrowRight from './icons/ArrowRight.vue';
import { tools, type Tool } from '@/tools';

const { activeComponent } = useShared();

const selectComponent = function (tool: Tool) {
  if (!tool.comingSoon) {
    activeComponent.value = tool.key;
  }
};
</script>

<template>
  <section class="tool-grid" aria-label="Application tools">
    <button
      v-for="tool in tools"
      :key="tool.key"
      :class="['tool-card', { 'coming-soon': tool.comingSoon }]"
      :aria-disabled="tool.comingSoon || undefined"
      :title="tool.comingSoon ? 'Coming soon' : undefined"
      type="button"
      @click="selectComponent(tool)"
    >
      <span class="tool-card-icon">
        <component :is="tool.icon" :size="22" />
      </span>
      <span>
        <small>{{ tool.label }}</small>
        <strong>{{ tool.title }}</strong>
        <em>{{ tool.meta }}</em>
      </span>
      <ArrowRight :size="18" />
    </button>
  </section>
</template>
<style scoped>
  button {
    margin: 5px;
  }
</style>
