// The tool list shared by the sidebar (App.vue) and the dashboard cards (Home.vue).
// `key` is the activeComponent name in App.vue's componentMap.
import type { Component } from 'vue';
import Calculator from './components/icons/Calculator.vue';
import ClipboardCheck from './components/icons/ClipboardCheck.vue';
import ClipboardList from './components/icons/ClipboardList.vue';
import FileCode2 from './components/icons/FileCode2.vue';
import FileText from './components/icons/FileText.vue';
import ListChecks from './components/icons/ListChecks.vue';
import TableProperties from './components/icons/TableProperties.vue';

export type Tool = {
  key: string;
  title: string;
  label: string;
  meta: string;
  icon: Component;
  comingSoon?: boolean;
};

export const tools: Tool[] = [
  { key: 'opps', title: '3M Grouper', label: 'OPPS claim simulator', icon: Calculator,
    meta: 'CMS rulesets, OCE edits, APC payment', comingSoon: true },
  { key: 'claims', title: 'Claims', label: 'Claim workspace', icon: FileText,
    meta: 'Medicare and Medicaid fee-for-service claim inventory', comingSoon: true },
  { key: 'EDI', title: '837 EDI Builder', label: '837 EDI builder', icon: FileCode2,
    meta: 'Build, preview, and export 837I/P/D claims and encounters' },
  { key: 'MUE', title: 'MUE Files', label: 'NCCI MUE builder', icon: ListChecks,
    meta: 'Create and export Practitioner / Hospital / DME MUE CSV files', comingSoon: true },
  // Members (eligibility repository, LokiJS) left out for now - unsure about its persistence.
  { key: 'sql', title: 'SQL Queries', label: 'Oracle query builder', icon: TableProperties,
    meta: 'Reusable SQL templates, including member finder queries', comingSoon: true },
  { key: 'tm4j', title: 'Test Cases', label: 'TM4J generator', icon: ClipboardCheck,
    meta: 'Draft, preview, and export CSV files for JIRA TM4J', comingSoon: true },
  { key: 'egrid', title: 'eGrid Calculator', label: 'RAC mapper', icon: ClipboardList,
    meta: 'XML cleanup, RAC extraction, benefit plan mapping', comingSoon: true }
];
