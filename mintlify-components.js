/**
 * Learning Curve — Mintlify Documentation Component System
 * Implements a purely functional, declarative Component-Based Architecture for documentation rendering.
 */

// Helper: Escape HTML entities to prevent XSS
function escapeHtml(str = "") {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// 1. Callout Component (Reflections, Notes, Tips, Warnings, Danger)
function CalloutComponent(props = {}) {
  const {
    type = "note", // 'reflection' | 'note' | 'tip' | 'warning' | 'danger'
    icon = "ℹ️",
    title = "",
    content = "",
    whatHappened = "",
    whyItFailed = "",
    takeaway = "",
  } = props;

  if (type === "reflection") {
    return `
      <div class="mint-callout mint-callout-reflection" role="region" aria-label="Engineering Reflection">
        <span class="mint-callout-icon" aria-hidden="true">${icon || "💡"}</span>
        <div class="mint-callout-content">
          <div class="mint-callout-title">${escapeHtml(title || "Engineering Reflection & Lessons Learned")}</div>
          ${whatHappened ? `<p style="margin-bottom: 8px;"><strong>What was at stake:</strong> ${escapeHtml(whatHappened)}</p>` : ""}
          ${whyItFailed ? `<p style="margin-bottom: 8px;"><strong>Why the initial approach failed:</strong> ${escapeHtml(whyItFailed)}</p>` : ""}
          ${takeaway ? `<p><strong>Architectural Takeaway:</strong> ${escapeHtml(takeaway)}</p>` : ""}
        </div>
      </div>
    `;
  }

  return `
    <div class="mint-callout mint-callout-${type}" role="alert">
      <span class="mint-callout-icon" aria-hidden="true">${icon}</span>
      <div class="mint-callout-content">
        ${title ? `<strong>${escapeHtml(title)}:</strong> ` : ""}
        ${content}
      </div>
    </div>
  `;
}

// 2. Code Block Component with File Tabs and Copy Button
function CodeBlockComponent(props = {}) {
  const { tabs = [], id = "codeBlock_0" } = props;
  if (!tabs || tabs.length === 0) return "";

  return `
    <div class="mint-code-box" id="${id}">
      <div class="mint-code-header">
        <div class="mint-code-tabs">
          ${tabs.map((tab, idx) => `
            <button class="mint-code-tab${idx === 0 ? " active" : ""}" data-tab-idx="${idx}">
              ${escapeHtml(tab.name || "Snippet")}
            </button>
          `).join("")}
        </div>
        <button class="mint-code-copy-btn" onclick="MintlifyComponents.copyCode(this, '${id}')" aria-label="Copy code to clipboard">
          <span>📋 Copy Code</span>
        </button>
      </div>
      ${tabs.map((tab, idx) => `
        <pre class="mint-code-pre" data-code-panel="${idx}" style="display: ${idx === 0 ? "block" : "none"};"><code>${escapeHtml(tab.code)}</code></pre>
      `).join("")}
    </div>
  `;
}

// 3. Steps Component (Sequential Implementation Pipeline)
function StepsComponent(props = {}) {
  const { steps = [] } = props;
  if (!steps || steps.length === 0) return "";

  return `
    <section class="mint-steps" aria-label="Implementation Steps">
      ${steps.map((step, idx) => `
        <div class="mint-step">
          <div class="mint-step-number" aria-hidden="true">${step.number || idx + 1}</div>
          <h3 class="mint-step-title">${escapeHtml(step.title)}</h3>
          <div class="mint-step-body">${escapeHtml(step.body)}</div>
        </div>
      `).join("")}
    </section>
  `;
}

// 4. Resource Card Component
function ResourceCardComponent(props = {}) {
  const {
    title = "",
    domain = "",
    desc = "",
    url = "#",
    icon = "📖",
  } = props.resource || props;

  return `
    <a href="${url}" target="_blank" rel="noopener noreferrer" class="mint-resource-card" aria-label="${escapeHtml(title)} on ${domain}">
      <div>
        <div class="mint-resource-header">
          <span class="mint-resource-icon" aria-hidden="true">${icon}</span>
          <span class="mint-resource-domain">${escapeHtml(domain)}</span>
        </div>
        <h4 class="mint-resource-title" style="margin-top: 10px;">${escapeHtml(title)}</h4>
        <p class="mint-resource-desc" style="margin-top: 6px;">${escapeHtml(desc)}</p>
      </div>
      <div class="mint-resource-link">
        <span>Read Specification</span>
        <span aria-hidden="true">↗</span>
      </div>
    </a>
  `;
}

// 5. Resource Grid Component
function ResourceGridComponent(props = {}) {
  const { resources = [] } = props;
  if (!resources || resources.length === 0) return "";

  return `
    <section class="mint-resources-section" id="sectionResources" aria-labelledby="resourcesHeading">
      <h2 class="mint-section-heading" id="resourcesHeading">
        <span>📚 Extra Resources & Authoritative References</span>
      </h2>
      <p class="mint-section-subhead">
        Authoritative technical specifications, official RFCs, and engineering guides to explore and deepen your understanding:
      </p>
      <div class="mint-resources-grid">
        ${resources.map(res => ResourceCardComponent({ resource: res })).join("")}
      </div>
    </section>
  `;
}

// 6. Breadcrumb Component
function BreadcrumbComponent(props = {}) {
  const { current = "Documentation", parent = "Documentation", parentUrl = "/specs" } = props;
  return `
    <nav class="mint-breadcrumbs" aria-label="Breadcrumb">
      <a href="/">Learning Curve</a>
      <span aria-hidden="true">/</span>
      <a href="${parentUrl}">${escapeHtml(parent)}</a>
      <span aria-hidden="true">/</span>
      <span style="color: #FFF; font-weight: 500;" aria-current="page">${escapeHtml(current)}</span>
    </nav>
  `;
}

// 7. Pager Component (Previous / Next Article)
function PagerComponent(props = {}) {
  const { prev = null, next = null } = props;

  return `
    <nav class="mint-pager" aria-label="Documentation Pagination">
      ${prev ? `
        <a href="/docs?entry=${prev.slug}" class="mint-pager-btn" data-pager-slug="${prev.slug}">
          <span class="mint-pager-label">← Previous Topic</span>
          <span class="mint-pager-title">${escapeHtml(prev.title)}</span>
        </a>
      ` : `
        <div class="mint-pager-btn" style="visibility: hidden;"></div>
      `}
      ${next ? `
        <a href="/docs?entry=${next.slug}" class="mint-pager-btn" style="text-align: right;" data-pager-slug="${next.slug}">
          <span class="mint-pager-label">Next Topic →</span>
          <span class="mint-pager-title">${escapeHtml(next.title)}</span>
        </a>
      ` : `
        <div class="mint-pager-btn" style="visibility: hidden;"></div>
      `}
    </nav>
  `;
}

// 8. Feedback Widget Component
function FeedbackWidgetComponent() {
  return `
    <div class="mint-feedback-box" role="region" aria-label="Page Feedback">
      <span class="mint-feedback-text">Was this documentation and reflection helpful?</span>
      <div class="mint-feedback-actions">
        <button class="mint-feedback-btn" onclick="MintlifyComponents.handleFeedback('yes')">👍 Yes</button>
        <button class="mint-feedback-btn" onclick="MintlifyComponents.handleFeedback('no')">👎 Needs improvement</button>
      </div>
    </div>
  `;
}

// 9. Master Document Viewer Component (Orchestrates All Components)
function DocViewerComponent(props = {}) {
  const { doc, prevDoc = null, nextDoc = null } = props;
  if (!doc) return `<div class="mint-callout mint-callout-warning">Document not found.</div>`;

  return `
    <!-- 1. Breadcrumbs -->
    ${BreadcrumbComponent({ current: doc.title })}

    <!-- 2. Document Header -->
    <article class="mint-doc-header">
      <div class="mint-doc-meta-row">
        <span class="mint-doc-badge">${escapeHtml(doc.category)}</span>
        <span class="mint-doc-badge">${escapeHtml(doc.readingTime)}</span>
        <span class="mint-doc-badge">${escapeHtml(doc.status)}</span>
        <span class="mint-doc-badge">${escapeHtml(doc.verified)}</span>
      </div>
      <h1 class="mint-doc-title">${escapeHtml(doc.title)}</h1>
      <p class="mint-doc-description">${escapeHtml(doc.desc)}</p>

      <div class="mint-doc-actions">
        ${doc.playbook ? `
          <a href="${doc.playbook}" class="mint-action-btn mint-action-btn-primary">
            <span>🎮 Launch Playbook Simulator</span>
          </a>
        ` : ""}
        <button class="mint-action-btn" onclick="MintlifyComponents.copyPageUrl(this)">
          <span>📋 Copy Link</span>
        </button>
        ${doc.rawMd ? `
          <a href="${doc.rawMd}" target="_blank" rel="noopener noreferrer" class="mint-action-btn">
            <span>📄 Raw Markdown Spec</span>
          </a>
        ` : ""}
      </div>
    </article>

    <!-- 3. Context Summary Callout -->
    <section id="summary" style="margin-bottom: 32px;">
      ${CalloutComponent({
        type: "note",
        icon: "ℹ️",
        title: "Context & Problem Statement",
        content: escapeHtml(doc.desc),
      })}
    </section>

    <!-- 4. Engineering Reflection Callout -->
    ${doc.reflection ? `
      <section id="reflection" style="margin-bottom: 36px;">
        ${CalloutComponent({
          type: "reflection",
          icon: "💡",
          title: doc.reflection.title,
          whatHappened: doc.reflection.whatHappened,
          whyItFailed: doc.reflection.whyItFailed,
          takeaway: doc.reflection.takeaway,
        })}
      </section>
    ` : ""}

    <!-- 5. Sequential Implementation Steps -->
    ${doc.steps && doc.steps.length > 0 ? `
      <section id="implementation" style="margin-bottom: 36px;">
        <h2 class="mint-section-heading">⚡ Implementation Pipeline</h2>
        ${StepsComponent({ steps: doc.steps })}
      </section>
    ` : ""}

    <!-- 6. Production Code Block with Tabs -->
    ${doc.codeTabs && doc.codeTabs.length > 0 ? `
      <section id="code" style="margin-bottom: 36px;">
        <h2 class="mint-section-heading">💻 Production Code Pattern</h2>
        ${CodeBlockComponent({ tabs: doc.codeTabs, id: "docCodeTabs" })}
      </section>
    ` : ""}

    <!-- 7. Curated Extra Resources Grid -->
    ${doc.resources && doc.resources.length > 0 ? `
      ${ResourceGridComponent({ resources: doc.resources })}
    ` : ""}

    <!-- 8. Pagination -->
    ${PagerComponent({ prev: prevDoc, next: nextDoc })}

    <!-- 9. Feedback Widget -->
    ${FeedbackWidgetComponent()}
  `;
}

// Component Interactive Helpers
function copyCode(btn, containerId) {
  const box = document.getElementById(containerId);
  if (!box) return;

  const activePanel = box.querySelector('pre[data-code-panel]:not([style*="none"]) code');
  if (!activePanel) return;

  navigator.clipboard.writeText(activePanel.textContent).then(() => {
    const originalText = btn.innerHTML;
    btn.innerHTML = "<span>✅ Copied!</span>";
    setTimeout(() => { btn.innerHTML = originalText; }, 2000);
  });
}

function copyPageUrl(btn) {
  navigator.clipboard.writeText(window.location.href).then(() => {
    const original = btn.innerHTML;
    btn.innerHTML = "<span>✅ Link Copied!</span>";
    setTimeout(() => { btn.innerHTML = original; }, 2000);
  });
}

function handleFeedback(val) {
  const box = document.querySelector(".mint-feedback-box");
  if (!box) return;
  if (val === "yes") {
    box.innerHTML = '<span style="color: #34D399; font-weight: 600;">🎉 Thank you! Glad this reflection was valuable for your engineering work.</span>';
  } else {
    box.innerHTML = '<span style="color: #FBBF24; font-weight: 600;">🙏 Thanks for the feedback! We will add deeper technical trade-off matrices.</span>';
  }
}

// Delegated Event Listeners for Tab Switching and Pager Navigation
if (typeof document !== "undefined") {
  document.addEventListener("click", function(e) {
    // 1. Tab Switching
    const tabBtn = e.target.closest(".mint-code-tab");
    if (tabBtn) {
      const box = tabBtn.closest(".mint-code-box");
      if (!box) return;
      const idx = tabBtn.getAttribute("data-tab-idx");
      box.querySelectorAll(".mint-code-tab").forEach(t => t.classList.remove("active"));
      tabBtn.classList.add("active");
      box.querySelectorAll("pre[data-code-panel]").forEach(p => {
        p.style.display = p.getAttribute("data-code-panel") === idx ? "block" : "none";
      });
      return;
    }

    // 2. Pager Navigation interception
    const pagerBtn = e.target.closest("[data-pager-slug]");
    if (pagerBtn && typeof window.loadDocEntry === "function") {
      e.preventDefault();
      const slug = pagerBtn.getAttribute("data-pager-slug");
      window.loadDocEntry(slug);
    }
  });
}

// Global Export
window.MintlifyComponents = {
  CalloutComponent,
  CodeBlockComponent,
  StepsComponent,
  ResourceCardComponent,
  ResourceGridComponent,
  BreadcrumbComponent,
  PagerComponent,
  FeedbackWidgetComponent,
  DocViewerComponent,
  copyCode,
  copyPageUrl,
  handleFeedback,
};

