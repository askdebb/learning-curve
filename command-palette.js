/**
 * Learning Curve — Command Palette Component
 * Encapsulated state-driven search component implementing a Component-Based Architecture.
 */

class CommandPaletteComponent {
  constructor(options = {}) {
    this.catalog = options.catalog || [];
    this.isOpen = false;
    this.selectedIndex = 0;
    this.overlayEl = null;
    this.inputEl = null;
    this.resultsEl = null;

    this.onKeyDown = this.onKeyDown.bind(this);
    this.onInput = this.onInput.bind(this);
  }

  mount() {
    if (document.getElementById("mintCmdOverlay")) {
      this.overlayEl = document.getElementById("mintCmdOverlay");
      this.inputEl = document.getElementById("mintCmdInput");
      this.resultsEl = document.getElementById("mintCmdResults");
      this.bindTriggers();
      return this;
    }

    const overlay = document.createElement("div");
    overlay.id = "mintCmdOverlay";
    overlay.className = "mint-cmd-overlay";
    overlay.innerHTML = `
      <div class="mint-cmd-modal" role="dialog" aria-modal="true" aria-label="Command Palette">
        <div class="mint-cmd-input-row">
          <span class="mint-cmd-search-icon" aria-hidden="true">🔍</span>
          <input type="text" id="mintCmdInput" class="mint-cmd-input" placeholder="Search documentation, playbooks, reflections, RFCs..." autocomplete="off">
          <span class="mint-kbd">ESC</span>
        </div>
        <div class="mint-cmd-results" id="mintCmdResults" role="listbox"></div>
        <div class="mint-cmd-footer">
          <div style="display:flex; gap:12px;">
            <span><span class="mint-kbd">↑</span> <span class="mint-kbd">↓</span> Navigate</span>
            <span><span class="mint-kbd">↵</span> Select</span>
          </div>
          <span>Learning Curve Knowledge Hub</span>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);
    this.overlayEl = overlay;
    this.inputEl = document.getElementById("mintCmdInput");
    this.resultsEl = document.getElementById("mintCmdResults");

    // Close when clicking backdrop
    this.overlayEl.addEventListener("click", (e) => {
      if (e.target === this.overlayEl) this.close();
    });

    this.inputEl.addEventListener("input", this.onInput);
    this.inputEl.addEventListener("keydown", this.onKeyDown);
    window.addEventListener("keydown", (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        this.toggle();
      } else if (e.key === "Escape" && this.isOpen) {
        this.close();
      }
    });

    this.bindTriggers();
    return this;
  }

  bindTriggers() {
    document.querySelectorAll(".mint-search-trigger, [data-open-cmd]").forEach(el => {
      el.removeEventListener("click", this.handleTriggerClick);
      el.addEventListener("click", this.handleTriggerClick.bind(this));
    });
  }

  handleTriggerClick(e) {
    e.preventDefault();
    this.open();
  }

  toggle() {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  open() {
    if (!this.overlayEl) this.mount();
    this.isOpen = true;
    this.overlayEl.classList.add("active");
    this.inputEl.value = "";
    this.selectedIndex = 0;
    this.renderResults("");
    setTimeout(() => this.inputEl.focus(), 50);
  }

  close() {
    if (!this.overlayEl) return;
    this.isOpen = false;
    this.overlayEl.classList.remove("active");
  }

  onInput() {
    this.selectedIndex = 0;
    this.renderResults(this.inputEl.value.trim());
  }

  onKeyDown(e) {
    const items = this.resultsEl.querySelectorAll(".mint-cmd-item");
    if (items.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      items[this.selectedIndex]?.classList.remove("selected");
      this.selectedIndex = (this.selectedIndex + 1) % items.length;
      items[this.selectedIndex]?.classList.add("selected");
      items[this.selectedIndex]?.scrollIntoView({ block: "nearest" });
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      items[this.selectedIndex]?.classList.remove("selected");
      this.selectedIndex = (this.selectedIndex - 1 + items.length) % items.length;
      items[this.selectedIndex]?.classList.add("selected");
      items[this.selectedIndex]?.scrollIntoView({ block: "nearest" });
    } else if (e.key === "Enter") {
      e.preventDefault();
      const selected = items[this.selectedIndex] || items[0];
      if (selected) {
        const url = selected.getAttribute("href");
        if (url) {
          window.location.href = url;
          this.close();
        }
      }
    }
  }

  renderResults(query) {
    if (!this.resultsEl) return;
    const lower = query.toLowerCase();

    const filtered = this.catalog.filter(item => {
      if (!lower) return true;
      return (
        item.title.toLowerCase().includes(lower) ||
        item.subtitle.toLowerCase().includes(lower) ||
        item.category.toLowerCase().includes(lower) ||
        item.badge.toLowerCase().includes(lower)
      );
    });

    if (filtered.length === 0) {
      this.resultsEl.innerHTML = `
        <div style="padding: 36px 20px; text-align: center; color: #94A3B8;">
          <p style="font-size: 24px; margin-bottom: 8px;">🤔</p>
          <p style="font-size: 14px; font-weight: 600; color: #FFF;">No matching entries found</p>
          <p style="font-size: 12px; margin-top: 4px;">Try searching for "payouts", "yup", "zustand", "rfc", or "owasp".</p>
        </div>
      `;
      return;
    }

    const grouped = {};
    filtered.forEach(item => {
      if (!grouped[item.category]) grouped[item.category] = [];
      grouped[item.category].push(item);
    });

    let html = "";
    let itemCounter = 0;

    for (const [catName, items] of Object.entries(grouped)) {
      html += `<div class="mint-cmd-group-label">${catName}</div>`;
      items.forEach(item => {
        const isSelected = itemCounter === this.selectedIndex ? " selected" : "";
        const targetAttr = item.url.startsWith("http") ? ' target="_blank" rel="noopener noreferrer"' : "";
        html += `
          <a href="${item.url}" class="mint-cmd-item${isSelected}" role="option" data-index="${itemCounter}"${targetAttr}>
            <div class="mint-cmd-item-left">
              <span class="mint-cmd-item-icon">${item.icon}</span>
              <div>
                <div class="mint-cmd-item-title">${item.title}</div>
                <div class="mint-cmd-item-subtitle">${item.subtitle}</div>
              </div>
            </div>
            <span class="mint-tag mint-tag-fintech">${item.badge}</span>
          </a>
        `;
        itemCounter++;
      });
    }

    this.resultsEl.innerHTML = html;
  }
}

// Built-in Catalog Dataset
const defaultPaletteCatalog = [
  // 1. Documentation & Engineering Reflections
  {
    type: "doc",
    category: "📚 Documentation & Reflections",
    title: "Financial Dashboard Chart Data Orchestration",
    subtitle: "Rolling ledger windowing, responsive axis scaling & dual telemetry",
    url: "/docs?entry=financial-dashboard-chart-data-orchestration",
    badge: "REACT 19",
    icon: "📈",
  },
  {
    type: "doc",
    category: "📚 Documentation & Reflections",
    title: "Next Payouts Metric Modeling & Plain-English FinTech",
    subtitle: "In-flight batch aggregation (pending + processing), currency isolation & 0% equilibrium",
    url: "/docs?entry=next-payouts-metric-modeling-and-plain-english-fintech",
    badge: "FINTECH",
    icon: "💳",
  },
  {
    type: "doc",
    category: "📚 Documentation & Reflections",
    title: "Merchant Dashboard Reactive State & Query Invalidation",
    subtitle: "Centralized queryKeys factory, auto-hydration & directionless 0% UI physics",
    url: "/docs?entry=merchant-dashboard-reactive-state-and-query-invalidation",
    badge: "ZUSTAND",
    icon: "⚡",
  },
  {
    type: "doc",
    category: "📚 Documentation & Reflections",
    title: "Enterprise Authentication Architecture & Security Hardening",
    subtitle: "OWASP enumeration mitigation, uncontrolled input keystroke protection & Yup schemas",
    url: "/docs?entry=authentication-architecture",
    badge: "SECURITY",
    icon: "🔒",
  },
  {
    type: "doc",
    category: "📚 Documentation & Reflections",
    title: "Bitnormous Merchant API Architecture & Render Guard",
    subtitle: "3-Tier State Taxonomy (Server State vs. Zustand drafts vs. Ephemeral) & decoupled drawers",
    url: "/docs?entry=merchant-api-state-architecture",
    badge: "REACT 19",
    icon: "🛡️",
  },
  {
    type: "doc",
    category: "📚 Documentation & Reflections",
    title: "Crypto Stepper Persistence & Socket Lifecycle",
    subtitle: "Tab suspension resilience, localStorage quota recovery & Web Push notifications",
    url: "/docs?entry=checkout-stepper-and-notifications",
    badge: "REALTIME",
    icon: "🔄",
  },
  {
    type: "doc",
    category: "📚 Documentation & Reflections",
    title: "Global Storage vs. Server State Cache",
    subtitle: "Architectural boundaries: TanStack Query vs. Zustand drafts vs. Ephemeral state",
    url: "/docs?entry=01-global-storage-vs-server-cache",
    badge: "SPEC",
    icon: "🗄️",
  },
  {
    type: "doc",
    category: "📚 Documentation & Reflections",
    title: "Preventing Re-renders in Custom Query Action Hooks",
    subtitle: "The Three Pillars of Render Protection: useRef callbacks, useMemo slices, useCallback selectors",
    url: "/docs?entry=02-preventing-rerenders-in-query-hooks",
    badge: "PERF",
    icon: "🎯",
  },
  {
    type: "doc",
    category: "📚 Documentation & Reflections",
    title: "Component to API Endpoint Mapping & Taxonomy",
    subtitle: "Master architectural contract binding UI modules to REST backend services",
    url: "/docs?entry=03-component-endpoint-mapping",
    badge: "API",
    icon: "🗺️",
  },

  // 2. Interactive Playbooks
  {
    type: "playbook",
    category: "🎮 Interactive Playbooks",
    title: "Playbook: Chart Scaling & Rolling Windowing",
    subtitle: "Live simulator testing monthly, quarterly, and yearly responsive axis scales",
    url: "/playbooks/financial-dashboard-chart-data-orchestration.html",
    badge: "SIMULATOR",
    icon: "🎮",
  },
  {
    type: "playbook",
    category: "🎮 Interactive Playbooks",
    title: "Playbook: Next Payouts & FinTech Velocity",
    subtitle: "Interactive velocity slider, dynamic currency selector & 0% equilibrium tester",
    url: "/playbooks/next-payouts-metric-modeling-and-plain-english-fintech.html",
    badge: "SIMULATOR",
    icon: "🎮",
  },
  {
    type: "playbook",
    category: "🎮 Interactive Playbooks",
    title: "Playbook: Reactive State & Equilibrium UI",
    subtitle: "Visual store inspector and cache invalidation playground",
    url: "/playbooks/merchant-dashboard-reactive-state-and-query-invalidation.html",
    badge: "SIMULATOR",
    icon: "🎮",
  },
  {
    type: "playbook",
    category: "🎮 Interactive Playbooks",
    title: "Playbook: Enterprise Authentication Hardening",
    subtitle: "Uncontrolled form keystroke render bench and OWASP generic message inspector",
    url: "/playbooks/authentication-architecture.html",
    badge: "SIMULATOR",
    icon: "🎮",
  },
  {
    type: "playbook",
    category: "🎮 Interactive Playbooks",
    title: "Playbook: Merchant API State Taxonomy Bench",
    subtitle: "Render telemetry bench and decoupled drawer store orchestrator",
    url: "/playbooks/merchant-api-state-architecture.html",
    badge: "SIMULATOR",
    icon: "🎮",
  },
  {
    type: "playbook",
    category: "🎮 Interactive Playbooks",
    title: "Playbook: Crypto Stepper & Push Lifecycle",
    subtitle: "Mobile browser tab suspension simulator & push notification triggers",
    url: "/playbooks/checkout-stepper-and-notifications.html",
    badge: "SIMULATOR",
    icon: "🎮",
  },

  // 3. Curated Authoritative Extra Resources
  {
    type: "resource",
    category: "🌐 Curated Extra Resources & RFCs",
    title: "ISO 20022 Financial Messaging Standard",
    subtitle: "Global methodology for financial transaction data exchange & settlement rails",
    url: "https://www.iso20022.org/",
    badge: "FINTECH",
    icon: "🏛️",
  },
  {
    type: "resource",
    category: "🌐 Curated Extra Resources & RFCs",
    title: "Stripe Connect & Payouts Architecture",
    subtitle: "Deep-dive standard on in-flight batching, balance states, and merchant settlement",
    url: "https://docs.stripe.com/payouts",
    badge: "FINTECH",
    icon: "💳",
  },
  {
    type: "resource",
    category: "🌐 Curated Extra Resources & RFCs",
    title: "OWASP Authentication Verification Standard",
    subtitle: "Comprehensive cheat sheet on credential defense, enumeration, and timing protection",
    url: "https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html",
    badge: "OWASP",
    icon: "🛡️",
  },
  {
    type: "resource",
    category: "🌐 Curated Extra Resources & RFCs",
    title: "RFC 6749: OAuth 2.0 Authorization Framework",
    subtitle: "IETF standard specification for secure third-party delegated authorization",
    url: "https://datatracker.ietf.org/doc/html/rfc6749",
    badge: "RFC",
    icon: "📜",
  },
  {
    type: "resource",
    category: "🌐 Curated Extra Resources & RFCs",
    title: "RFC 7636: Proof Key for Code Exchange (PKCE)",
    subtitle: "OAuth security extension preventing authorization code interception attacks",
    url: "https://datatracker.ietf.org/doc/html/rfc7636",
    badge: "RFC",
    icon: "📜",
  },
  {
    type: "resource",
    category: "🌐 Curated Extra Resources & RFCs",
    title: "TkDodo's Practical React Query Architecture",
    subtitle: "Essential patterns for query key factories, cache invalidation, and custom hooks",
    url: "https://tkdodo.eu/blog/practical-react-query",
    badge: "GUIDE",
    icon: "📖",
  },
  {
    type: "resource",
    category: "🌐 Curated Extra Resources & RFCs",
    title: "TanStack Query v5 Official Documentation",
    subtitle: "Comprehensive guide for caching, optimistic updates, and infinite scrolling",
    url: "https://tanstack.com/query/v5",
    badge: "DOCS",
    icon: "⚡",
  },
  {
    type: "resource",
    category: "🌐 Curated Extra Resources & RFCs",
    title: "Zustand Documentation & Slice Pattern",
    subtitle: "State management best practices, shallow selectors, and auto-hydration",
    url: "https://zustand.docs.pmnd.rs/",
    badge: "DOCS",
    icon: "🐻",
  },
  {
    type: "resource",
    category: "🌐 Curated Extra Resources & RFCs",
    title: "RFC 6455: The WebSocket Protocol",
    subtitle: "IETF standard defining bidirectional realtime socket communication",
    url: "https://datatracker.ietf.org/doc/html/rfc6455",
    badge: "RFC",
    icon: "🌐",
  },
  {
    type: "resource",
    category: "🌐 Curated Extra Resources & RFCs",
    title: "W3C Web Notifications API",
    subtitle: "Official standard for presenting contextual user alerts across desktop and mobile",
    url: "https://www.w3.org/TR/push-api/",
    badge: "W3C",
    icon: "🔔",
  },
];

// Instantiate and Mount Component
const cmdPaletteInstance = new CommandPaletteComponent({
  catalog: defaultPaletteCatalog,
});

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => cmdPaletteInstance.mount());
} else {
  cmdPaletteInstance.mount();
}

// Global Export
window.CommandPalette = cmdPaletteInstance;
window.CommandPaletteComponent = CommandPaletteComponent;
