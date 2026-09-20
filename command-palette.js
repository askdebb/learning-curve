// Mintlify-Style Global Command Palette for Learning Curve
(function() {
  const catalog = [
    // 1. Documentation & Engineering Reflections
    {
      type: "doc",
      category: "📚 Documentation & Reflections",
      title: "Financial Dashboard Chart Data Orchestration",
      subtitle: "Rolling ledger windowing, responsive axis scaling & dual telemetry",
      url: "/docs?entry=financial-dashboard-chart-data-orchestration",
      badge: "REACT 19",
      icon: "📈"
    },
    {
      type: "doc",
      category: "📚 Documentation & Reflections",
      title: "Next Payouts Metric Modeling & Plain-English FinTech",
      subtitle: "In-flight batch aggregation (pending + processing), currency isolation & 0% equilibrium",
      url: "/docs?entry=next-payouts-metric-modeling-and-plain-english-fintech",
      badge: "FINTECH",
      icon: "💳"
    },
    {
      type: "doc",
      category: "📚 Documentation & Reflections",
      title: "Merchant Dashboard Reactive State & Query Invalidation",
      subtitle: "Centralized queryKeys factory, auto-hydration & directionless 0% UI physics",
      url: "/docs?entry=merchant-dashboard-reactive-state-and-query-invalidation",
      badge: "ZUSTAND",
      icon: "⚡"
    },
    {
      type: "doc",
      category: "📚 Documentation & Reflections",
      title: "Enterprise Authentication Architecture & Security Hardening",
      subtitle: "OWASP enumeration mitigation, uncontrolled input keystroke protection & Yup schemas",
      url: "/docs?entry=authentication-architecture",
      badge: "SECURITY",
      icon: "🔒"
    },
    {
      type: "doc",
      category: "📚 Documentation & Reflections",
      title: "Bitnormous Merchant API Architecture & Render Guard",
      subtitle: "3-Tier State Taxonomy (Server State vs. Zustand drafts vs. Ephemeral) & decoupled drawers",
      url: "/docs?entry=merchant-api-state-architecture",
      badge: "REACT 19",
      icon: "🛡️"
    },
    {
      type: "doc",
      category: "📚 Documentation & Reflections",
      title: "Crypto Stepper Persistence & Socket Lifecycle",
      subtitle: "Tab suspension resilience, localStorage quota recovery & Web Push notifications",
      url: "/docs?entry=checkout-stepper-and-notifications",
      badge: "REALTIME",
      icon: "🔄"
    },
    {
      type: "doc",
      category: "📚 Documentation & Reflections",
      title: "Global Storage vs. Server State Cache",
      subtitle: "Architectural boundaries: TanStack Query vs. Zustand drafts vs. Ephemeral state",
      url: "/docs?entry=01-global-storage-vs-server-cache",
      badge: "SPEC",
      icon: "🗄️"
    },
    {
      type: "doc",
      category: "📚 Documentation & Reflections",
      title: "Preventing Re-renders in Custom Query Action Hooks",
      subtitle: "The Three Pillars of Render Protection: useRef callbacks, useMemo slices, useCallback selectors",
      url: "/docs?entry=02-preventing-rerenders-in-query-hooks",
      badge: "PERF",
      icon: "🎯"
    },
    {
      type: "doc",
      category: "📚 Documentation & Reflections",
      title: "Component to API Endpoint Mapping & Taxonomy",
      subtitle: "Master architectural contract binding UI modules to REST backend services",
      url: "/docs?entry=03-component-endpoint-mapping",
      badge: "API",
      icon: "🗺️"
    },

    // 2. Interactive Playbooks
    {
      type: "playbook",
      category: "🎮 Interactive Playbooks",
      title: "Playbook: Chart Scaling & Rolling Windowing",
      subtitle: "Live simulator testing monthly, quarterly, and yearly responsive axis scales",
      url: "/playbooks/financial-dashboard-chart-data-orchestration.html",
      badge: "SIMULATOR",
      icon: "🎮"
    },
    {
      type: "playbook",
      category: "🎮 Interactive Playbooks",
      title: "Playbook: Next Payouts & FinTech Velocity",
      subtitle: "Interactive velocity slider, dynamic currency selector & 0% equilibrium tester",
      url: "/playbooks/next-payouts-metric-modeling-and-plain-english-fintech.html",
      badge: "SIMULATOR",
      icon: "🎮"
    },
    {
      type: "playbook",
      category: "🎮 Interactive Playbooks",
      title: "Playbook: Reactive State & Equilibrium UI",
      subtitle: "Visual store inspector and cache invalidation playground",
      url: "/playbooks/merchant-dashboard-reactive-state-and-query-invalidation.html",
      badge: "SIMULATOR",
      icon: "🎮"
    },
    {
      type: "playbook",
      category: "🎮 Interactive Playbooks",
      title: "Playbook: Enterprise Authentication Hardening",
      subtitle: "Uncontrolled form keystroke render bench and OWASP generic message inspector",
      url: "/playbooks/authentication-architecture.html",
      badge: "SIMULATOR",
      icon: "🎮"
    },
    {
      type: "playbook",
      category: "🎮 Interactive Playbooks",
      title: "Playbook: Merchant API State Taxonomy Bench",
      subtitle: "Render telemetry bench and decoupled drawer store orchestrator",
      url: "/playbooks/merchant-api-state-architecture.html",
      badge: "SIMULATOR",
      icon: "🎮"
    },
    {
      type: "playbook",
      category: "🎮 Interactive Playbooks",
      title: "Playbook: Crypto Stepper & Push Lifecycle",
      subtitle: "Mobile browser tab suspension simulator & push notification triggers",
      url: "/playbooks/checkout-stepper-and-notifications.html",
      badge: "SIMULATOR",
      icon: "🎮"
    },

    // 3. Curated Authoritative Extra Resources
    {
      type: "resource",
      category: "🌐 Curated Extra Resources & RFCs",
      title: "ISO 20022 Financial Messaging Standard",
      subtitle: "Global methodology for financial transaction data exchange & settlement rails",
      url: "https://www.iso20022.org/",
      badge: "FINTECH",
      icon: "🏛️"
    },
    {
      type: "resource",
      category: "🌐 Curated Extra Resources & RFCs",
      title: "Stripe Connect & Payouts Architecture",
      subtitle: "Deep-dive standard on in-flight batching, balance states, and merchant settlement",
      url: "https://docs.stripe.com/payouts",
      badge: "FINTECH",
      icon: "💳"
    },
    {
      type: "resource",
      category: "🌐 Curated Extra Resources & RFCs",
      title: "OWASP Authentication Verification Standard",
      subtitle: "Comprehensive cheat sheet on credential defense, enumeration, and timing protection",
      url: "https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html",
      badge: "OWASP",
      icon: "🛡️"
    },
    {
      type: "resource",
      category: "🌐 Curated Extra Resources & RFCs",
      title: "RFC 6749: OAuth 2.0 Authorization Framework",
      subtitle: "IETF standard specification for secure third-party delegated authorization",
      url: "https://datatracker.ietf.org/doc/html/rfc6749",
      badge: "RFC",
      icon: "📜"
    },
    {
      type: "resource",
      category: "🌐 Curated Extra Resources & RFCs",
      title: "RFC 7636: Proof Key for Code Exchange (PKCE)",
      subtitle: "OAuth security extension preventing authorization code interception attacks",
      url: "https://datatracker.ietf.org/doc/html/rfc7636",
      badge: "RFC",
      icon: "📜"
    },
    {
      type: "resource",
      category: "🌐 Curated Extra Resources & RFCs",
      title: "TkDodo's Practical React Query Architecture",
      subtitle: "Essential patterns for query key factories, cache invalidation, and custom hooks",
      url: "https://tkdodo.eu/blog/practical-react-query",
      badge: "GUIDE",
      icon: "📖"
    },
    {
      type: "resource",
      category: "🌐 Curated Extra Resources & RFCs",
      title: "TanStack Query v5 Official Documentation",
      subtitle: "Comprehensive guide for caching, optimistic updates, and infinite scrolling",
      url: "https://tanstack.com/query/v5",
      badge: "DOCS",
      icon: "⚡"
    },
    {
      type: "resource",
      category: "🌐 Curated Extra Resources & RFCs",
      title: "Zustand Documentation & Slice Pattern",
      subtitle: "State management best practices, shallow selectors, and auto-hydration",
      url: "https://zustand.docs.pmnd.rs/",
      badge: "DOCS",
      icon: "🐻"
    },
    {
      type: "resource",
      category: "🌐 Curated Extra Resources & RFCs",
      title: "RFC 6455: The WebSocket Protocol",
      subtitle: "IETF standard defining bidirectional realtime socket communication",
      url: "https://datatracker.ietf.org/doc/html/rfc6455",
      badge: "RFC",
      icon: "🌐"
    },
    {
      type: "resource",
      category: "🌐 Curated Extra Resources & RFCs",
      title: "W3C Web Notifications API",
      subtitle: "Official standard for presenting contextual user alerts across desktop and mobile",
      url: "https://www.w3.org/TR/push-api/",
      badge: "W3C",
      icon: "🔔"
    }
  ];

  function injectPalette() {
    if (document.getElementById("mintCmdOverlay")) return;

    const overlay = document.createElement("div");
    overlay.id = "mintCmdOverlay";
    overlay.className = "mint-cmd-overlay";
    overlay.innerHTML = `
      <div class="mint-cmd-modal" role="dialog" aria-modal="true" aria-label="Command Palette">
        <div class="mint-cmd-input-row">
          <span class="mint-cmd-search-icon">🔍</span>
          <input type="text" id="mintCmdInput" class="mint-cmd-input" placeholder="Search documentation, playbooks, reflections, RFCs..." autocomplete="off">
          <span class="mint-kbd">ESC</span>
        </div>
        <div class="mint-cmd-results" id="mintCmdResults"></div>
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

    const input = document.getElementById("mintCmdInput");
    const resultsContainer = document.getElementById("mintCmdResults");

    // Close on overlay click
    overlay.addEventListener("click", function(e) {
      if (e.target === overlay) closePalette();
    });

    // Input filter
    input.addEventListener("input", function() {
      renderResults(input.value.trim());
    });

    // Keyboard navigation inside modal
    input.addEventListener("keydown", function(e) {
      const items = resultsContainer.querySelectorAll(".mint-cmd-item");
      let selectedIndex = -1;
      items.forEach((item, idx) => {
        if (item.classList.contains("selected")) selectedIndex = idx;
      });

      if (e.key === "ArrowDown") {
        e.preventDefault();
        if (items.length === 0) return;
        if (selectedIndex >= 0) items[selectedIndex].classList.remove("selected");
        const nextIdx = (selectedIndex + 1) % items.length;
        items[nextIdx].classList.add("selected");
        items[nextIdx].scrollIntoView({ block: "nearest" });
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        if (items.length === 0) return;
        if (selectedIndex >= 0) items[selectedIndex].classList.remove("selected");
        const prevIdx = (selectedIndex - 1 + items.length) % items.length;
        items[prevIdx].classList.add("selected");
        items[prevIdx].scrollIntoView({ block: "nearest" });
      } else if (e.key === "Enter") {
        e.preventDefault();
        const selected = resultsContainer.querySelector(".mint-cmd-item.selected");
        if (selected) {
          window.location.href = selected.getAttribute("href");
          closePalette();
        } else if (items.length > 0) {
          window.location.href = items[0].getAttribute("href");
          closePalette();
        }
      } else if (e.key === "Escape") {
        closePalette();
      }
    });
  }

  function renderResults(query) {
    const resultsContainer = document.getElementById("mintCmdResults");
    if (!resultsContainer) return;

    const lower = query.toLowerCase();
    const filtered = catalog.filter(item => {
      if (!lower) return true;
      return item.title.toLowerCase().includes(lower) ||
             item.subtitle.toLowerCase().includes(lower) ||
             item.category.toLowerCase().includes(lower) ||
             item.badge.toLowerCase().includes(lower);
    });

    if (filtered.length === 0) {
      resultsContainer.innerHTML = `
        <div style="padding: 36px 20px; text-align: center; color: #94A3B8;">
          <p style="font-size: 24px; margin-bottom: 8px;">🤔</p>
          <p style="font-size: 14px; font-weight: 600; color: #FFF;">No matching entries found</p>
          <p style="font-size: 12px; margin-top: 4px;">Try searching for "payouts", "yup", "zustand", "rfc", or "owasp".</p>
        </div>
      `;
      return;
    }

    // Group by category
    const grouped = {};
    filtered.forEach(item => {
      if (!grouped[item.category]) grouped[item.category] = [];
      grouped[item.category].push(item);
    });

    let html = "";
    let isFirst = true;

    for (const [catName, items] of Object.entries(grouped)) {
      html += `<div class="mint-cmd-group-label">${catName}</div>`;
      items.forEach(item => {
        const isSelected = isFirst ? " selected" : "";
        isFirst = false;
        const targetAttr = item.url.startsWith("http") ? 'target="_blank" rel="noopener noreferrer"' : '';
        html += `
          <a href="${item.url}" class="mint-cmd-item${isSelected}" ${targetAttr}>
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
      });
    }

    resultsContainer.innerHTML = html;
  }

  function openPalette() {
    injectPalette();
    const overlay = document.getElementById("mintCmdOverlay");
    const input = document.getElementById("mintCmdInput");
    if (!overlay || !input) return;

    overlay.classList.add("active");
    input.value = "";
    renderResults("");
    setTimeout(() => input.focus(), 50);
  }

  function closePalette() {
    const overlay = document.getElementById("mintCmdOverlay");
    if (overlay) overlay.classList.remove("active");
  }

  // Global Keydown Listener
  window.addEventListener("keydown", function(e) {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
      e.preventDefault();
      const overlay = document.getElementById("mintCmdOverlay");
      if (overlay && overlay.classList.contains("active")) {
        closePalette();
      } else {
        openPalette();
      }
    } else if (e.key === "Escape") {
      closePalette();
    }
  });

  // Attach to any search triggers on the page
  document.addEventListener("DOMContentLoaded", function() {
    injectPalette();
    document.querySelectorAll(".mint-search-trigger, [data-open-cmd]").forEach(el => {
      el.addEventListener("click", function(e) {
        e.preventDefault();
        openPalette();
      });
    });
  });

  // Expose global controller
  window.MintPalette = {
    open: openPalette,
    close: closePalette
  };
})();
