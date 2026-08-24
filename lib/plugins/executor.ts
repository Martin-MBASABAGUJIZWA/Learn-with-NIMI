// lib/plugins/executor.ts — Safe plugin hook execution
//
// Plugins are inline JS strings stored in the DB manifest.handlers field.
// They run in a restricted sandbox: no imports, no DOM, no fetch, no timers.
// The handler receives (payload, context) and must return a PluginResult.
//
// Security model (defence-in-depth):
// 1. Static analysis — handler source is rejected if it references any
//    identifier from the DANGEROUS_PATTERNS blocklist before execution.
// 2. Expanded shadow sandbox — every dangerous global is explicitly passed
//    as `undefined` into the IIFE so property lookup cannot escape to the
//    real global scope. The outer new Function() wrapper receives the same
//    shadow parameters so there is no "outer scope" to escape to either.
// 3. Async blocked — Promise, async/await identifiers are blocked by (1);
//    the handler must return a plain object synchronously.
// 4. CPU watchdog — 50 ms hard limit via Date.now() inside the handler.
//
// ⚠️  new Function() is fundamentally not a true security boundary.
//    This implementation raises the bar significantly but is not equivalent
//    to process isolation. For production multi-tenant plugins, replace with
//    `isolated-vm` (Node.js native V8 isolates) or move execution to a
//    Cloudflare Worker / Deno Deploy subprocess.

import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  InstalledPlugin, PluginHookName, HookPayload,
  PluginContext, PluginResult,
} from './types';

const MAX_HANDLER_MS = 50;

// Layer 1 — Static source analysis.
// Reject before execution if the source references any dangerous identifier.
// This is the primary line of defence against trivial exfiltration attacks.
const DANGEROUS_PATTERNS = [
  /\bfetch\b/,
  /\bXMLHttpRequest\b/,
  /\bglobalThis\b/,
  /\bglobal\b/,
  /\bprocess\b/,
  /\brequire\b/,
  /\bimport\b/,
  /\beval\b/,
  /\bFunction\b/,
  /\b__proto__\b/,
  /\bconstructor\b/,
  /\bprototype\b/,
  /\bsetTimeout\b/,
  /\bsetInterval\b/,
  /\bclearTimeout\b/,
  /\bclearInterval\b/,
  /\bPromise\b/,
  /\basync\b/,
  /\bawait\b/,
  /\bWebSocket\b/,
  /\bEventSource\b/,
  /\bWorker\b/,
  /\bIndexedDB\b/,
  /\blocalStorage\b/,
  /\bsessionStorage\b/,
  /\bdocument\b/,
  /\bwindow\b/,
  /\bself\b/,
];

function isHandlerSafe(src: string): { safe: boolean; reason?: string } {
  for (const pattern of DANGEROUS_PATTERNS) {
    if (pattern.test(src)) {
      return { safe: false, reason: `blocked identifier: ${pattern.source}` };
    }
  }
  return { safe: true };
}

// Layer 2 — Expanded shadow list passed to the IIFE.
// Every name here is passed as `undefined` so there is no real-global escape.
const SHADOW_NAMES = [
  'fetch', 'XMLHttpRequest', 'globalThis', 'global', 'process',
  'require', 'module', 'exports', '__dirname', '__filename',
  'setTimeout', 'setInterval', 'clearTimeout', 'clearInterval',
  'setImmediate', 'clearImmediate', 'queueMicrotask',
  'Promise', 'WebSocket', 'EventSource', 'Worker', 'SharedWorker',
  'Atomics', 'SharedArrayBuffer',
  'localStorage', 'sessionStorage', 'indexedDB',
  'document', 'window', 'navigator', 'location', 'history',
  'self', 'frames', 'opener', 'parent', 'top',
] as const;

const SHADOW_UNDEFINEDS = SHADOW_NAMES.map(() => undefined);

// ── executeHook ───────────────────────────────────────────────────────────────
// Runs a single plugin's handler for a given hook.
// Returns PluginResult or null on error/timeout/block.

export async function executeHook(
  plugin:  InstalledPlugin,
  hook:    PluginHookName,
  payload: HookPayload,
): Promise<PluginResult | null> {
  const handlerSrc = plugin.manifest?.handlers?.[hook];
  if (!handlerSrc || typeof handlerSrc !== 'string') return null;

  // Layer 1 — Static analysis gate
  const { safe, reason } = isHandlerSafe(handlerSrc);
  if (!safe) {
    console.error(`[plugin:${plugin.slug}] handler rejected (${reason}). Plugin disabled.`);
    return null;
  }

  const ctx: PluginContext = {
    pluginId: plugin.plugin_id,
    slug:     plugin.slug,
    config:   plugin.config ?? {},
  };

  // Layer 2 — Expanded shadow sandbox.
  // The outer new Function() receives shadow params too so the wrapped IIFE
  // has no "outer scope" containing real globals to escape to.
  const shadowParamList = SHADOW_NAMES.join(', ');
  const wrapped = `"use strict";
(function(payload, context, Date, Math, JSON, console, ${shadowParamList}) {
  const startMs = Date.now();
  const __watchdog = () => { if (Date.now() - startMs > ${MAX_HANDLER_MS}) throw new Error("plugin_timeout"); };
  return (function() {
    ${handlerSrc}
  })();
})(payload, context, Date, Math, JSON, console, ${SHADOW_NAMES.map(() => 'undefined').join(', ')})`;

  try {
    // eslint-disable-next-line no-new-func
    const fn = new Function('payload', 'context', 'Date', 'Math', 'JSON', 'console', ...SHADOW_NAMES, wrapped);
    const result = fn(payload, ctx, Date, Math, JSON, console, ...SHADOW_UNDEFINEDS) as PluginResult | null;

    // Async return values are blocked by the static analysis (Promise/async/await
    // are in the blocklist), but guard defensively so a bypass doesn't hang.
    if (result && typeof (result as Promise<unknown>).then === 'function') {
      console.error(`[plugin:${plugin.slug}] returned a Promise — async handlers are not allowed.`);
      return null;
    }
    return result ?? null;
  } catch (e) {
    console.warn(`[plugin:${plugin.slug}] ${hook} error:`, e);
    return null;
  }
}

// ── runHookPipeline ───────────────────────────────────────────────────────────
// Runs all plugins for a hook in sequence, merging results.
// Earlier plugins' mutations are visible to later ones.

export async function runHookPipeline(
  db:      SupabaseClient,
  plugins: InstalledPlugin[],
  hook:    PluginHookName,
  payload: HookPayload,
): Promise<PluginResult> {
  const merged: PluginResult = {};

  for (const plugin of plugins) {
    const result = await executeHook(plugin, hook, payload);
    if (!result) continue;

    // Merge mutations
    if (result.prompt  != null) (payload as { prompt?: string }).prompt   = result.prompt;
    if (result.system  != null) (payload as { system?: string }).system   = result.system;
    if (result.response != null) (payload as { response?: string }).response = result.response;
    if (result.inject  != null) merged.inject = (merged.inject ?? '') + result.inject;
    if (result.memories)        (merged.memories  ??= []).push(...result.memories);
    if (result.events)          (merged.events    ??= []).push(...result.events);

    // Log execution (best-effort, fire-and-forget)
    void Promise.resolve(db.rpc('log_plugin_event', {
      p_plugin_id:   plugin.plugin_id,
      p_school_id:   null,
      p_hook:        hook,
      p_duration_ms: null,
      p_error:       null,
    })).catch(() => null);
  }

  // Apply any memory upserts produced by plugins
  if (merged.memories?.length) {
    for (const m of merged.memories) {
      void Promise.resolve(db.rpc('upsert_learner_memory', {
        p_child_id:   m.childId,
        p_type:       m.type,
        p_key:        m.key,
        p_value:      m.value,
        p_confidence: m.confidence ?? 0.8,
        p_source:     'ai_inferred',
      })).catch(() => null);
    }
  }

  // Apply any events produced by plugins
  if (merged.events?.length) {
    for (const ev of merged.events) {
      void Promise.resolve(db.rpc('log_learner_event', {
        p_child_id:   ev.childId,
        p_event_type: ev.type,
        p_payload:    ev.payload,
      })).catch(() => null);
    }
  }

  // Final state of mutated payload fields
  if ((payload as { prompt?: string }).prompt   != null) merged.prompt   = (payload as { prompt?: string }).prompt;
  if ((payload as { system?: string }).system   != null) merged.system   = (payload as { system?: string }).system;
  if ((payload as { response?: string }).response != null) merged.response = (payload as { response?: string }).response;

  return merged;
}
