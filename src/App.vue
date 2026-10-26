<script setup lang="ts">
import Home from './components/Home.vue';
import EDI from './components/EDI.vue';
import LayoutDashboard from './components/icons/LayoutDashboard.vue';
import useShared from './composables/useShared.ts';
import { tools, type Tool } from './tools';
import type { Component } from 'vue';

const { activeComponent } = useShared();
const componentMap: Record<string, Component> = {
  "Home": Home,
  "EDI": EDI
};

const openTool = function (tool: Tool) {
  if (!tool.comingSoon) activeComponent.value = tool.key;
};
</script>

<template>
  <div>
    <div class="site-frame">
      <aside class="site-sidebar">
        <a class="site-brand" href="#" @click.prevent="activeComponent = 'Home'">
          <span class="site-brand-mark">OS</span>
          <span>
            <strong>Ops Suite</strong>
            <small>OPPS and EGRID tools</small>
          </span>
        </a>
        <nav class="site-nav" aria-label="Primary navigation">
          <a
            href="#"
            :class="{ active: activeComponent === 'Home' }"
            :aria-current="activeComponent === 'Home' ? 'page' : undefined"
            @click.prevent="activeComponent = 'Home'"
          >
            <LayoutDashboard :size="18" />
            <span>Dashboard</span>
          </a>
          <a
            v-for="tool in tools"
            :key="tool.key"
            href="#"
            :class="{ active: activeComponent === tool.key, 'coming-soon': tool.comingSoon }"
            :aria-current="activeComponent === tool.key ? 'page' : undefined"
            :aria-disabled="tool.comingSoon || undefined"
            :title="tool.comingSoon ? 'Coming soon' : undefined"
            @click.prevent="openTool(tool)"
          >
            <component :is="tool.icon" :size="18" />
            <span>{{ tool.title }}</span>
          </a>
        </nav>
      </aside>

      <div class="site-content">
        <main class="app-shell">
          <section class="dashboard-hero" v-if="activeComponent === 'Home'">
            <div>
              <p class="eyebrow">Operations workbench</p>
              <h1>Claims and eligibility tools</h1>
            </div>
          </section>
          <component :is="componentMap[activeComponent]" />
        </main>
      </div>
    </div>
  </div>
</template>
