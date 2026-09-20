/**
 * Learning Curve — Text-to-Speech (TTS) Audio Engine
 * Pure TypeScript module managing speech synthesis, playback states, audio equalizers, and section highlighting.
 */

import { TTSState, TTSButtonProps } from "./types";

export function TTSButtonComponent(props: TTSButtonProps): string {
  const { targetId, label = "Listen", className = "mint-tts-btn" } = props;
  return `
    <button class="${className}" data-tts-target="${targetId}" aria-label="Listen to this section" type="button">
      <span class="mint-tts-icon" aria-hidden="true">🎙️</span>
      <span class="mint-tts-label">${label}</span>
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

    // Cancel speech when user navigates away or unloads page
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

    const targetEl = document.getElementById(targetId) || document.querySelector(`[id="${targetId}"]`) as HTMLElement | null;
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

    // Pick best English voice if available
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
    if ("speechSynthesis" in window) {
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

    // Remove buttons, tooltips, tabs, and technical noise
    clone.querySelectorAll("button, .mint-code-header, .mint-toc, script, style, .mint-feedback-box").forEach(el => el.remove());

    let text = clone.textContent || "";
    // Clean up excessive whitespace
    text = text.replace(/\s+/g, " ").trim();
    return text;
  }
}

// Global Singleton Export
export const ttsManager = new TextToSpeechManager();
