/**
 * Learning Curve — Core TypeScript Type Definitions
 * Strict types for all components, documentation structures, command palette, and audio engines.
 */

export type CalloutType = "reflection" | "note" | "tip" | "warning" | "danger";

export interface ReflectionData {
  title?: string;
  whatHappened?: string;
  whyItFailed?: string;
  takeaway?: string;
}

export interface CalloutProps {
  type?: CalloutType;
  icon?: string;
  title?: string;
  content?: string;
  whatHappened?: string;
  whyItFailed?: string;
  takeaway?: string;
  targetId?: string;
}

export interface CodeTabItem {
  name: string;
  code: string;
}

export interface CodeBlockProps {
  tabs: CodeTabItem[];
  id?: string;
}

export interface DocStep {
  number?: number | string;
  title: string;
  body: string;
}

export interface StepsProps {
  steps: DocStep[];
}

export interface ResourceCardData {
  title: string;
  domain: string;
  desc: string;
  url: string;
  icon?: string;
}

export interface ResourceGridProps {
  resources: ResourceCardData[];
}

export interface BreadcrumbProps {
  current: string;
  parent?: string;
  parentUrl?: string;
}

export interface DocEntry {
  slug?: string;
  title: string;
  desc: string;
  category: string;
  readingTime: string;
  status: string;
  verified: string;
  playbook?: string;
  rawMd?: string;
  reflection?: ReflectionData;
  steps?: DocStep[];
  codeTabs?: CodeTabItem[];
  resources?: ResourceCardData[];
}

export interface PagerProps {
  prev?: DocEntry | null;
  next?: DocEntry | null;
}

export interface DocViewerProps {
  doc: DocEntry;
  prevDoc?: DocEntry | null;
  nextDoc?: DocEntry | null;
}

export interface NavbarProps {
  activeRoute?: string;
}

export interface FooterProps {
  subtitle?: string;
}

export interface PortalCardProps {
  icon?: string;
  tag?: string;
  title: string;
  desc: string;
  link: string;
  linkText?: string;
  isFeatured?: boolean;
}

export interface StatItem {
  number: string;
  label: string;
}

export interface StatsRibbonProps {
  stats?: StatItem[];
}

export interface CommandPaletteItem {
  type: string;
  category: string;
  title: string;
  subtitle: string;
  url: string;
  badge: string;
  icon: string;
}

export interface CommandPaletteOptions {
  catalog?: CommandPaletteItem[];
}

export type TTSState = "idle" | "playing" | "paused";

export interface TTSButtonProps {
  targetId: string;
  label?: string;
  className?: string;
}
