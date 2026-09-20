/**
 * Learning Curve — Core Layout Component Library (TypeScript)
 * Strongly-typed reusable UI components across all application routes.
 */

import { NavbarProps, FooterProps, PortalCardProps, StatsRibbonProps } from "./types";

declare global {
  interface Window {
    LCComponents?: {
      NavbarComponent: typeof NavbarComponent;
      FooterComponent: typeof FooterComponent;
      PortalCardComponent: typeof PortalCardComponent;
      StatsRibbonComponent: typeof StatsRibbonComponent;
      initComponentMounts: typeof initComponentMounts;
    };
  }
}

// 1. Navigation Bar Component
export function NavbarComponent(props: NavbarProps = {}): string {
  const activeRoute = props.activeRoute || "";
  const isDocs = activeRoute === "docs";
  const brandTag = isDocs ? "Mintlify Docs" : "Engineering Hub";

  const links = [
    { id: "docs", label: "📚 Docs (Mintlify)", href: "/docs", highlight: true },
    { id: "timeline", label: "🗓️ Timeline", href: "/timeline" },
    { id: "playbooks", label: "🎮 Playbooks", href: "/playbooks" },
    { id: "specs", label: "📄 Specs", href: "/specs" },
  ];

  return `
    <header class="navbar" role="banner">
      <div class="navbar-content">
        <a href="/" class="nav-brand" aria-label="Learning Curve Home">
          <div class="brand-icon">⚡</div>
          <div>
            <span class="brand-text">Learning Curve</span>
            <span class="brand-tag">${brandTag}</span>
          </div>
        </a>

        <div style="display: flex; align-items: center; gap: 14px;">
          <button class="mint-search-trigger" style="width: auto; padding: 6px 14px;" data-open-cmd aria-label="Search documentation" type="button">
            <span>🔍 Quick Search</span>
            <span class="mint-kbd">⌘K</span>
          </button>

          <nav class="nav-links" role="navigation" aria-label="Primary Navigation">
            ${links.map(link => {
              const isActive = activeRoute === link.id ? " active" : "";
              const customStyle = link.highlight
                ? ' style="color: #34D399; font-weight: 700;"'
                : '';
              return `<a href="${link.href}" class="nav-link-item${isActive}"${customStyle}>${link.label}</a>`;
            }).join("")}
            <a href="https://github.com/askdebb/learning-curve" target="_blank" rel="noopener noreferrer" class="github-btn" aria-label="GitHub Repository">
              <span>GitHub ↗</span>
            </a>
          </nav>
        </div>
      </div>
    </header>
  `;
}

// 2. Footer Component
export function FooterComponent(props: FooterProps = {}): string {
  const subtitle = props.subtitle || "Personal Engineering Playbook & Knowledge Repository";
  return `
    <footer class="footer" role="contentinfo">
      <p>Learning Curve • ${subtitle} • Automatically Synced to Vercel</p>
    </footer>
  `;
}

// 3. Portal Card Component
export function PortalCardComponent(props: PortalCardProps): string {
  const {
    icon = "📄",
    tag = "Route",
    title = "Title",
    desc = "Description",
    link = "#",
    linkText = "Open Route",
    isFeatured = false,
  } = props;

  const featuredStyle = isFeatured
    ? ' style="border-color: rgba(16, 185, 129, 0.4); background: linear-gradient(135deg, rgba(16, 185, 129, 0.08), rgba(15, 23, 42, 0.9));"'
    : "";

  const iconStyle = isFeatured
    ? ' style="background: rgba(16, 185, 129, 0.2); border-color: rgba(16, 185, 129, 0.4);"'
    : "";

  const tagStyle = isFeatured
    ? ' style="background: rgba(16, 185, 129, 0.15); color: #34D399; border-color: rgba(16, 185, 129, 0.3);"'
    : "";

  const actionStyle = isFeatured ? ' style="color: #34D399;"' : "";

  return `
    <a href="${link}" class="portal-card"${featuredStyle}>
      <div>
        <div class="portal-icon-row">
          <div class="portal-icon"${iconStyle}>${icon}</div>
          <span class="portal-tag"${tagStyle}>${tag}</span>
        </div>
        <h3 class="portal-title">${title}</h3>
        <p class="portal-desc">${desc}</p>
      </div>
      <div class="portal-link-btn"${actionStyle}>
        <span>${linkText}</span>
        <span>→</span>
      </div>
    </a>
  `;
}

// 4. Stats Ribbon Component
export function StatsRibbonComponent(props: StatsRibbonProps = {}): string {
  const stats = props.stats || [
    { number: "10", label: "Mintlify Architecture Docs" },
    { number: "6", label: "Interactive Playbooks" },
    { number: "25+", label: "Official RFCs & References" },
    { number: "100%", label: "Live Vercel Sync" },
  ];

  return `
    <div class="stats-ribbon">
      ${stats.map(stat => `
        <div class="stat-card">
          <div class="stat-number">${stat.number}</div>
          <div class="stat-label">${stat.label}</div>
        </div>
      `).join("")}
    </div>
  `;
}

// 5. Automated Component Mounting
export function initComponentMounts(): void {
  if (typeof document === "undefined") return;

  // Mount Navbars
  document.querySelectorAll('[data-component="navbar"]').forEach(el => {
    const activeRoute = el.getAttribute("data-active") || "";
    el.outerHTML = NavbarComponent({ activeRoute });
  });

  // Mount Footers
  document.querySelectorAll('[data-component="footer"]').forEach(el => {
    const subtitle = el.getAttribute("data-subtitle") || "";
    el.outerHTML = FooterComponent({ subtitle });
  });
}

// Auto-initialize on DOM ready
if (typeof document !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initComponentMounts);
  } else {
    initComponentMounts();
  }
}

// Global Browser Export
if (typeof window !== "undefined") {
  window.LCComponents = {
    NavbarComponent,
    FooterComponent,
    PortalCardComponent,
    StatsRibbonComponent,
    initComponentMounts,
  };
}
