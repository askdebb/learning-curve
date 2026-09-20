/**
 * Learning Curve — Mintlify Documentation Component System (TypeScript)
 * Declarative, pure component functions rendering architecture documentation, reflections, code tabs, and audio controls.
 */

import {
  CalloutProps,
  CodeBlockProps,
  StepsProps,
  ResourceCardData,
  ResourceGridProps,
  BreadcrumbProps,
  PagerProps,
  DocViewerProps,
  DocEntry,
  TTSState,
  TTSButtonProps,
} from "./types";

declare global {
  interface Window {
    MintlifyComponents?: {
      CalloutComponent: typeof CalloutComponent;
      CodeBlockComponent: typeof CodeBlockComponent;
      StepsComponent: typeof StepsComponent;
      ResourceCardComponent: typeof ResourceCardComponent;
      ResourceGridComponent: typeof ResourceGridComponent;
      BreadcrumbComponent: typeof BreadcrumbComponent;
      PagerComponent: typeof PagerComponent;
      FeedbackWidgetComponent: typeof FeedbackWidgetComponent;
      DocViewerComponent: typeof DocViewerComponent;
      TTSButtonComponent: typeof TTSButtonComponent;
      ttsManager: TextToSpeechManager;
      copyCode: typeof copyCode;
      copyPageUrl: typeof copyPageUrl;
      handleFeedback: typeof handleFeedback;
    };
    loadDocEntry?: (slug: string) => void;
  }
}

// Helper: Escape HTML entities to prevent XSS
export function escapeHtml(str: string = ""): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// ============================================================================
// Text-to-Speech (TTS) Engine & Component
// ============================================================================

export function TTSButtonComponent(props: TTSButtonProps): string {
  const { targetId, label = "Listen", className = "mint-tts-btn" } = props;
  return `
    <button class="${className}" data-tts-target="${targetId}" data-original-label="${escapeHtml(label)}" aria-label="Listen to this section" type="button">
      <span class="mint-tts-icon" aria-hidden="true">🎙️</span>
      <span class="mint-tts-label">${escapeHtml(label)}</span>
      <span class="mint-tts-waves" aria-hidden="true" style="display: none;">
        <span class="mint-tts-wave-bar"></span>
        <span class="mint-tts-wave-bar"></span>
        <span class="mint-tts-wave-bar"></span>
      </span>
    </button>
  `;
}

export class TextToSpeechManager {
  private activeTargetId: string | null = null;
  private activeButtonEl: HTMLElement | null = null;
  private activeTargetEl: HTMLElement | null = null;
  private state: TTSState = "idle";
  private currentUtterance: SpeechSynthesisUtterance | null = null;

  constructor() {
    this.initDelegation();
  }

  private initDelegation(): void {
    if (typeof document === "undefined") return;

    document.addEventListener("click", (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      const btn = target.closest("[data-tts-target]") as HTMLElement | null;
      if (!btn) return;

      e.preventDefault();
      e.stopPropagation();

      const targetId = btn.getAttribute("data-tts-target");
      if (targetId) {
        this.toggle(targetId, btn);
      }
    });

    window.addEventListener("beforeunload", () => this.stop());
  }

  public toggle(targetId: string, buttonEl?: HTMLElement): void {
    if (this.state === "playing" && this.activeTargetId === targetId) {
      this.stop();
    } else {
      this.play(targetId, buttonEl);
    }
  }

  public play(targetId: string, buttonEl?: HTMLElement): void {
    if (!("speechSynthesis" in window)) {
      alert("Text-to-Speech is not supported in this browser.");
      return;
    }

    this.stop();

    const targetEl = document.getElementById(targetId) || (document.querySelector(`[id="${targetId}"]`) as HTMLElement | null);
    const resolvedBtn = buttonEl || (document.querySelector(`[data-tts-target="${targetId}"]`) as HTMLElement | null);

    if (!targetEl) {
      console.warn(`[TTS] Target section #${targetId} not found.`);
      return;
    }

    const textToRead = this.extractReadableText(targetEl);
    if (!textToRead) {
      console.warn(`[TTS] No readable text found in #${targetId}`);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(textToRead);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    // Pick best natural English voice if available
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(v => v.lang.startsWith("en") && (v.name.includes("Natural") || v.name.includes("Google") || v.name.includes("Samantha")))
      || voices.find(v => v.lang.startsWith("en"));
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    this.activeTargetId = targetId;
    this.activeButtonEl = resolvedBtn;
    this.activeTargetEl = targetEl;
    this.currentUtterance = utterance;

    utterance.onstart = () => {
      this.state = "playing";
      this.updateButtonUI(true);
      targetEl.classList.add("mint-tts-active");
    };

    utterance.onend = () => {
      this.cleanup();
    };

    utterance.onerror = (e) => {
      console.warn("[TTS] Speech error:", e);
      this.cleanup();
    };

    window.speechSynthesis.speak(utterance);
  }

  public stop(): void {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    this.cleanup();
  }

  private cleanup(): void {
    this.state = "idle";
    this.updateButtonUI(false);

    if (this.activeTargetEl) {
      this.activeTargetEl.classList.remove("mint-tts-active");
    }

    this.activeTargetId = null;
    this.activeButtonEl = null;
    this.activeTargetEl = null;
    this.currentUtterance = null;
  }

  private updateButtonUI(isPlaying: boolean): void {
    if (!this.activeButtonEl) return;

    const iconEl = this.activeButtonEl.querySelector(".mint-tts-icon") as HTMLElement | null;
    const labelEl = this.activeButtonEl.querySelector(".mint-tts-label") as HTMLElement | null;
    const wavesEl = this.activeButtonEl.querySelector(".mint-tts-waves") as HTMLElement | null;

    if (isPlaying) {
      this.activeButtonEl.classList.add("is-speaking");
      if (iconEl) iconEl.textContent = "⏹️";
      if (labelEl) labelEl.textContent = "Stop";
      if (wavesEl) wavesEl.style.display = "inline-flex";
    } else {
      this.activeButtonEl.classList.remove("is-speaking");
      if (iconEl) iconEl.textContent = "🎙️";
      if (labelEl) {
        const originalLabel = this.activeButtonEl.getAttribute("data-original-label") || "Listen";
        labelEl.textContent = originalLabel;
      }
      if (wavesEl) wavesEl.style.display = "none";
    }
  }

  private extractReadableText(container: HTMLElement): string {
    const clone = container.cloneNode(true) as HTMLElement;
    clone.querySelectorAll("button, .mint-code-header, .mint-toc, script, style, .mint-feedback-box, .mint-resource-card").forEach(el => el.remove());
    let text = clone.textContent || "";
    return text.replace(/\s+/g, " ").trim();
  }
}

export const ttsManager = new TextToSpeechManager();

// ============================================================================
// Mintlify Documentation Components
// ============================================================================

// 1. Callout Component (Reflections, Notes, Tips, Warnings, Danger)
export function CalloutComponent(props: CalloutProps = {}): string {
  const {
    type = "note",
    icon = "ℹ️",
    title = "",
    content = "",
    whatHappened = "",
    whyItFailed = "",
    takeaway = "",
    targetId = "",
  } = props;

  if (type === "reflection") {
    const sectionId = targetId || "reflection";
    return `
      <div class="mint-callout mint-callout-reflection" id="${sectionId}" role="region" aria-label="Engineering Reflection">
        <span class="mint-callout-icon" aria-hidden="true">${icon || "💡"}</span>
        <div class="mint-callout-content" style="width: 100%;">
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 8px;">
            <div class="mint-callout-title" style="margin-bottom: 0;">${escapeHtml(title || "Engineering Reflection & Lessons Learned")}</div>
            ${TTSButtonComponent({ targetId: sectionId, label: "Listen", className: "mint-callout-audio-btn" })}
          </div>
          ${whatHappened ? `<p style="margin-bottom: 8px;"><strong>What was at stake:</strong> ${escapeHtml(whatHappened)}</p>` : ""}
          ${whyItFailed ? `<p style="margin-bottom: 8px;"><strong>Why the initial approach failed:</strong> ${escapeHtml(whyItFailed)}</p>` : ""}
          ${takeaway ? `<p><strong>Architectural Takeaway:</strong> ${escapeHtml(takeaway)}</p>` : ""}
        </div>
      </div>
    `;
  }

  const sectionId = targetId || "summary";
  const hasAudio = type === "note" && targetId === "summary";

  return `
    <div class="mint-callout mint-callout-${type}" id="${sectionId}" role="alert">
      <span class="mint-callout-icon" aria-hidden="true">${icon}</span>
      <div class="mint-callout-content" style="width: 100%;">
        <div style="display: flex; align-items: flex-start; justify-content: space-between; gap: 12px;">
          <div>
            ${title ? `<strong>${escapeHtml(title)}:</strong> ` : ""}
            ${content}
          </div>
          ${hasAudio ? TTSButtonComponent({ targetId: sectionId, label: "Listen", className: "mint-callout-audio-btn" }) : ""}
        </div>
      </div>
    </div>
  `;
}

// 2. Code Block Component with File Tabs and Copy Button
export function CodeBlockComponent(props: CodeBlockProps): string {
  const { tabs = [], id = "codeBlock_0" } = props;
  if (!tabs || tabs.length === 0) return "";

  return `
    <div class="mint-code-box" id="${id}">
      <div class="mint-code-header">
        <div class="mint-code-tabs">
          ${tabs.map((tab, idx) => `
            <button class="mint-code-tab${idx === 0 ? " active" : ""}" data-tab-idx="${idx}" type="button">
              ${escapeHtml(tab.name || "Snippet")}
            </button>
          `).join("")}
        </div>
        <button class="mint-code-copy-btn" onclick="MintlifyComponents.copyCode(this, '${id}')" aria-label="Copy code to clipboard" type="button">
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
export function StepsComponent(props: StepsProps): string {
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
export function ResourceCardComponent(props: { resource: ResourceCardData } | ResourceCardData): string {
  const res = "resource" in props ? props.resource : props;
  const {
    title = "",
    domain = "",
    desc = "",
    url = "#",
    icon = "📖",
  } = res;

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
export function ResourceGridComponent(props: ResourceGridProps): string {
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
export function BreadcrumbComponent(props: BreadcrumbProps): string {
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
export function PagerComponent(props: PagerProps): string {
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
export function FeedbackWidgetComponent(): string {
  return `
    <div class="mint-feedback-box" role="region" aria-label="Page Feedback">
      <span class="mint-feedback-text">Was this documentation and reflection helpful?</span>
      <div class="mint-feedback-actions">
        <button class="mint-feedback-btn" onclick="MintlifyComponents.handleFeedback('yes')" type="button">👍 Yes</button>
        <button class="mint-feedback-btn" onclick="MintlifyComponents.handleFeedback('no')" type="button">👎 Needs improvement</button>
      </div>
    </div>
  `;
}

// 9. Master Document Viewer Component (Orchestrates All Subcomponents)
export function DocViewerComponent(props: DocViewerProps): string {
  const { doc, prevDoc = null, nextDoc = null } = props;
  if (!doc) return `<div class="mint-callout mint-callout-warning">Document not found.</div>`;

  return `
    <!-- 1. Breadcrumbs -->
    ${BreadcrumbComponent({ current: doc.title })}

    <!-- 2. Document Header -->
    <article class="mint-doc-header" id="docHeader">
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
        ${TTSButtonComponent({ targetId: "docViewerContainer", label: "Read Aloud", className: "mint-action-btn mint-tts-btn" })}
        <button class="mint-action-btn" onclick="MintlifyComponents.copyPageUrl(this)" type="button">
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
        targetId: "summary",
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
          targetId: "reflection",
        })}
      </section>
    ` : ""}

    <!-- 5. Sequential Implementation Steps -->
    ${doc.steps && doc.steps.length > 0 ? `
      <section id="implementation" style="margin-bottom: 36px;">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px;">
          <h2 class="mint-section-heading" style="margin-bottom: 0;">⚡ Implementation Pipeline</h2>
          ${TTSButtonComponent({ targetId: "implementation", label: "Listen to Steps", className: "mint-callout-audio-btn" })}
        </div>
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
export function copyCode(btn: HTMLElement, containerId: string): void {
  const box = document.getElementById(containerId);
  if (!box) return;

  const activePanel = box.querySelector('pre[data-code-panel]:not([style*="none"]) code');
  if (!activePanel) return;

  navigator.clipboard.writeText(activePanel.textContent || "").then(() => {
    const originalText = btn.innerHTML;
    btn.innerHTML = "<span>✅ Copied!</span>";
    setTimeout(() => { btn.innerHTML = originalText; }, 2000);
  });
}

export function copyPageUrl(btn: HTMLElement): void {
  navigator.clipboard.writeText(window.location.href).then(() => {
    const original = btn.innerHTML;
    btn.innerHTML = "<span>✅ Link Copied!</span>";
    setTimeout(() => { btn.innerHTML = original; }, 2000);
  });
}

export function handleFeedback(val: string): void {
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
  document.addEventListener("click", function(e: MouseEvent) {
    const target = e.target as HTMLElement | null;
    if (!target) return;

    // 1. Tab Switching
    const tabBtn = target.closest(".mint-code-tab") as HTMLElement | null;
    if (tabBtn) {
      const box = tabBtn.closest(".mint-code-box");
      if (!box) return;
      const idx = tabBtn.getAttribute("data-tab-idx");
      box.querySelectorAll(".mint-code-tab").forEach(t => t.classList.remove("active"));
      tabBtn.classList.add("active");
      box.querySelectorAll("pre[data-code-panel]").forEach(p => {
        (p as HTMLElement).style.display = p.getAttribute("data-code-panel") === idx ? "block" : "none";
      });
      return;
    }

    // 2. Pager Navigation Interception
    const pagerBtn = target.closest("[data-pager-slug]") as HTMLElement | null;
    if (pagerBtn && typeof window.loadDocEntry === "function") {
      e.preventDefault();
      const slug = pagerBtn.getAttribute("data-pager-slug");
      if (slug) {
        window.loadDocEntry(slug);
      }
    }
  });
}

// Global Browser Export
if (typeof window !== "undefined") {
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
    TTSButtonComponent,
    ttsManager,
    copyCode,
    copyPageUrl,
    handleFeedback,
  };
}
