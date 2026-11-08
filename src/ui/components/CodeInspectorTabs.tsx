"use client";

import React, { useId, useRef, useState } from "react";
import type { CodeSnippetTab } from "@/types/portfolio";

export interface CodeInspectorTabsProps {
  systemTitle: string;
  tabs: CodeSnippetTab[];
}

export function CodeInspectorTabs({
  systemTitle,
  tabs
}: CodeInspectorTabsProps) {
  const baseId = useId();
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [copiedTabId, setCopiedTabId] = useState<string | null>(null);
  const tabButtonRefs = useRef<(HTMLButtonElement | null)[]>([]);

  if (!tabs || tabs.length === 0) {
    return null;
  }

  const safeActiveIndex =
    activeIndex >= 0 && activeIndex < tabs.length ? activeIndex : 0;
  const activeTab = tabs[safeActiveIndex] ?? tabs[0];

  const activateTabAtIndex = (nextIndex: number, focusButton = false) => {
    const boundedIndex = (nextIndex + tabs.length) % tabs.length;
    setActiveIndex(boundedIndex);
    setCopiedTabId(null);
    if (focusButton) {
      tabButtonRefs.current[boundedIndex]?.focus();
    }
  };

  const handleTabKeyDown = (
    event: React.KeyboardEvent<HTMLButtonElement>,
    index: number
  ) => {
    if (event.key === "ArrowRight") {
      event.preventDefault();
      activateTabAtIndex(index + 1, true);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      activateTabAtIndex(index - 1, true);
    } else if (event.key === "Home") {
      event.preventDefault();
      activateTabAtIndex(0, true);
    } else if (event.key === "End") {
      event.preventDefault();
      activateTabAtIndex(tabs.length - 1, true);
    }
  };

  const handleCopyCode = async (tab: CodeSnippetTab) => {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(tab.code);
        setCopiedTabId(tab.id);
      }
    } catch {
      // Clipboard API may be restricted in non-secure or headless contexts
      setCopiedTabId(null);
    }
  };

  return (
    <div className="border border-[var(--outline-variant)] bg-[var(--surface-container-lowest)] rounded-[2px] flex flex-col h-full">
      {/* Inspector Window Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-[var(--outline-variant)] bg-[var(--surface-container-low)]">
        <div className="flex items-center gap-2.5">
          <span
            aria-hidden="true"
            className="h-2 w-2 rounded-full bg-[var(--secondary)]"
          />
          <span className="mono-label text-[var(--primary)]">
            CODE INSPECTOR // READONLY ARTIFACT
          </span>
        </div>

        <div className="flex items-center gap-2">
          {activeTab && (
            <span className="px-2 py-0.5 border border-[var(--outline-variant)] bg-[var(--surface-container-lowest)] rounded-[2px] mono-label text-[var(--secondary)]">
              {activeTab.layer.toUpperCase()} · {activeTab.language.toUpperCase()}
            </span>
          )}
          <span className="px-2 py-0.5 border border-[var(--outline-variant)] bg-[var(--surface-container-high)] rounded-[2px] mono-label text-[var(--primary)]">
            READONLY
          </span>
        </div>
      </div>

      {/* Interactive ARIA Tablist */}
      <div
        role="tablist"
        aria-label={`Archivos de código de ${systemTitle}`}
        className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 border-b border-[var(--outline-variant)] bg-[var(--surface-container-lowest)]"
      >
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab, index) => {
            const isSelected = index === safeActiveIndex;
            const tabId = `${baseId}-tab-${tab.id}`;
            const panelId = `${baseId}-panel-${tab.id}`;

            return (
              <button
                key={tab.id}
                ref={(el) => {
                  tabButtonRefs.current[index] = el;
                }}
                id={tabId}
                type="button"
                role="tab"
                aria-selected={isSelected}
                aria-controls={panelId}
                tabIndex={isSelected ? 0 : -1}
                onClick={() => activateTabAtIndex(index, false)}
                onKeyDown={(event) => handleTabKeyDown(event, index)}
                className={`px-3 py-1.5 border rounded-[2px] mono-code text-xs transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--secondary)] ${
                  isSelected
                    ? "border-[var(--primary)] bg-[var(--primary)] text-[var(--background)] font-medium"
                    : "border-[var(--outline-variant)] bg-[var(--surface-container-low)] text-[var(--primary)] hover:bg-[var(--surface-container-high)]"
                }`}
              >
                {tab.filename}
              </button>
            );
          })}
        </div>

        {activeTab && (
          <button
            type="button"
            onClick={() => handleCopyCode(activeTab)}
            aria-label={`Copiar código del archivo ${activeTab.filename}`}
            className="px-2.5 py-1 border border-[var(--outline-variant)] bg-[var(--surface-container-low)] hover:bg-[var(--surface-container-high)] text-[var(--primary)] rounded-[2px] mono-label transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--secondary)]"
          >
            {copiedTabId === activeTab.id ? "COPIED // OK" : "COPY SNIPPET"}
          </button>
        )}
      </div>

      {/* Tab Panels */}
      <div className="flex-1 bg-[var(--surface-container-lowest)]">
        {tabs.map((tab, index) => {
          const isSelected = index === safeActiveIndex;
          const tabId = `${baseId}-tab-${tab.id}`;
          const panelId = `${baseId}-panel-${tab.id}`;
          const codeLines = tab.code.split("\n");

          return (
            <div
              key={tab.id}
              id={panelId}
              role="tabpanel"
              aria-labelledby={tabId}
              tabIndex={isSelected ? 0 : -1}
              hidden={!isSelected}
              className="p-4 sm:p-5 overflow-x-auto focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--secondary)]"
            >
              <div className="flex items-center justify-between border-b border-[var(--outline-variant)] pb-2.5 mb-3">
                <span className="mono-code text-xs font-medium text-[var(--primary)]">
                  {tab.filename}
                </span>
                <span className="mono-label text-[var(--tertiary-fixed)]">
                  {codeLines.length} LINES · 0 CRLF · VERIFIED
                </span>
              </div>

              <pre className="mono-code text-xs sm:text-sm leading-relaxed text-[var(--primary)] overflow-x-auto">
                <code>
                  {codeLines.map((line, lineIdx) => (
                    <span
                      key={`${tab.id}-L${lineIdx + 1}`}
                      className="grid grid-cols-[2.25rem_1fr] gap-3 py-0.5 hover:bg-[var(--surface-container-low)] px-1 rounded-[2px]"
                    >
                      <span
                        aria-hidden="true"
                        className="select-none text-right text-[var(--on-surface-variant)] opacity-75"
                      >
                        {String(lineIdx + 1).padStart(2, "0")}
                      </span>
                      <span className="whitespace-pre">{line}</span>
                    </span>
                  ))}
                </code>
              </pre>
            </div>
          );
        })}
      </div>
    </div>
  );
}
