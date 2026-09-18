# Bitnormous Merchant API Integration - Learning Curve & Architecture Guide

This directory contains comprehensive architectural documentation, design patterns, and engineering rationale behind the **Bitnormous Merchant Platform API Integration**.

## Overview

The Bitnormous Merchant application connects frontend interfaces with over 50 backend endpoints spanning 14 functional domains. To guarantee scalability, eliminate React re-render thrashing, and maintain clean separation of concerns, the integration follows a strict layered architecture:

```
┌─────────────────────────────────────────────────────────────┐
│                    React UI Components                      │
│     (Pages, Drawers, Modals, Wizards, Cards, Tables)        │
└──────────────┬───────────────────────────────┬──────────────┘
               │                               │
               ▼                               ▼
┌─────────────────────────────┐ ┌─────────────────────────────┐
│  TanStack Query Action Hooks│ │    Zustand Global Stores    │
│  (Server State, Polling,    │ │ (Draft State, UI Selection, │
│   Cache, Memoized Helpers)  │ │  Global Hierarchy Context)  │
└──────────────┬──────────────┘ └─────────────────────────────┘
               │
               ▼
┌─────────────────────────────┐
│    Domain Controllers       │
│ (Extends Base Controller,   │
│  HTTP Auth, Param Cleaning) │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│   HttpRequest / Axios Core  │
│(Interceptors, Bearer Auth)  │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│     TypeScript Interfaces   │
│   (Strict API Contracts)    │
└─────────────────────────────┘
```

---

## Documentation Index

1. **[Global Storage vs. Server State Cache](./01-global-storage-vs-server-cache.md)**
   - Analysis of when Zustand is required vs. when it is an anti-pattern.
   - The boundary between Server Cache (TanStack Query), Global Client State (Zustand), and Ephemeral Component State.
   - Practical scenarios: Cross-hierarchy merchant context, multi-step transaction wizards, slide-over drawer selections, and one-time secrets.

2. **[Preventing Re-renders in Custom Query Action Hooks](./02-preventing-rerenders-in-query-hooks.md)**
   - Why custom TanStack Query hooks often cause render thrashing in consumer components.
   - The Three Pillars of Render Protection:
     - `useRef` for callbacks (`successCallback`, `errorCallback`, `onSettled`).
     - `useMemo` for derived lists and lookup structures.
     - `useCallback` for stable helper methods (converters, validators, selectors).
   - Window focus and polling optimization.

3. **[Component to Endpoint Mapping Matrix](./03-component-endpoint-mapping.md)**
   - Complete inventory of all 50 endpoints across 14 domains.
   - Exact mapping of which pages, modals, and drawers consume each endpoint, backed by architectural and UX justifications.

4. **[Layered Architecture & Codebase Structure](./04-architecture-and-folder-structure.md)**
   - Deep dive into directory structure: `interfaces/`, `controllers/`, `actions/`, and `store/`.
   - Conventions for query param sanitization (`cleanQueryParams`), authentication injection (`withApiKey`), and atomic cache invalidation.
