/**
 * NowWhy Tracker Script
 * Lightweight visitor tracking for real-time intent monitoring
 * Target: <5KB gzip
 */

interface NowWhyConfig {
  projectKey: string;
  endpoint: string;
  spa: boolean;
  ignoreParams: string[];
  maskPaths: string[];
}

interface TrackerEvent {
  type: 'pageview' | 'engagement';
  ts: number;
  project_key: string;
  visitor_id: string;
  session_id: string;
  url_path: string;
  url_query_keys?: string[];
  referrer?: string;
  title?: string;
  viewport?: { w: number; h: number };
  device: 'mobile' | 'desktop' | 'tablet';
  tz_offset_min: number;
  lang: string;
  dnt: boolean;
  mask_applied?: boolean;
  visible?: boolean;
  idle_ms?: number;
}

(function() {
  'use strict';

  // Get config from script tag
  const script = document.currentScript as HTMLScriptElement | null;
  if (!script) return;

  const config: NowWhyConfig = {
    projectKey: script.dataset.project || '',
    endpoint: script.dataset.endpoint || 'https://api.nowwhy.com/v1/collect',
    spa: script.dataset.spa === 'true',
    ignoreParams: (script.dataset.ignoreParams || '').split(',').filter(Boolean),
    maskPaths: (script.dataset.maskPaths || '').split(',').filter(Boolean),
  };

  if (!config.projectKey) {
    console.warn('[NowWhy] Missing project key');
    return;
  }

  // Storage keys
  const VISITOR_KEY = 'nw_vid';
  const SESSION_KEY = 'nw_sid';
  const LAST_ACTIVITY_KEY = 'nw_last';
  const SEEN_KEY = 'nw_seen';
  const QUEUE_KEY = 'nw_q';

  // Constants
  const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
  const BATCH_SIZE = 20;
  const BATCH_WAIT = 2000; // 2 seconds
  const ENGAGEMENT_INTERVAL = 10000; // 10 seconds
  const MAX_QUEUE_SIZE = 100;

  // State
  let eventQueue: TrackerEvent[] = [];
  let batchTimer: ReturnType<typeof setTimeout> | null = null;
  let engagementTimer: ReturnType<typeof setInterval> | null = null;
  let lastActivityTime = Date.now();
  let currentPath = '';

  // Utility: Generate UUID v4
  function uuid(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  // Utility: Get or create visitor ID
  function getVisitorId(): string {
    let vid = localStorage.getItem(VISITOR_KEY);
    if (!vid) {
      vid = uuid();
      try {
        localStorage.setItem(VISITOR_KEY, vid);
      } catch (e) {
        // localStorage unavailable
      }
    }
    return vid;
  }

  // Utility: Get or create session ID
  function getSessionId(): string {
    const lastActivity = parseInt(localStorage.getItem(LAST_ACTIVITY_KEY) || '0', 10);
    const now = Date.now();

    // Check if session expired
    if (now - lastActivity > SESSION_TIMEOUT) {
      const newSid = uuid();
      try {
        sessionStorage.setItem(SESSION_KEY, newSid);
        localStorage.setItem(LAST_ACTIVITY_KEY, now.toString());
      } catch (e) {
        // Storage unavailable
      }
      return newSid;
    }

    let sid = sessionStorage.getItem(SESSION_KEY);
    if (!sid) {
      sid = uuid();
      try {
        sessionStorage.setItem(SESSION_KEY, sid);
      } catch (e) {
        // Storage unavailable
      }
    }

    // Update last activity
    try {
      localStorage.setItem(LAST_ACTIVITY_KEY, now.toString());
    } catch (e) {
      // Storage unavailable
    }

    return sid;
  }

  // Utility: Get device type
  function getDeviceType(): 'mobile' | 'desktop' | 'tablet' {
    const width = window.innerWidth;
    if (width < 768) return 'mobile';
    if (width < 1024) return 'tablet';
    return 'desktop';
  }

  // Utility: Normalize path
  function normalizePath(pathname: string): string {
    // Remove trailing slash except for root
    let path = pathname.replace(/\/$/, '') || '/';

    // Check if path should be masked
    for (const maskPath of config.maskPaths) {
      if (path.startsWith(maskPath)) {
        return '/masked';
      }
    }

    return path;
  }

  // Utility: Get query keys (not values, for privacy)
  function getQueryKeys(): string[] {
    const params = new URLSearchParams(window.location.search);
    const keys: string[] = [];
    params.forEach((_, key) => {
      // Skip ignored params
      if (config.ignoreParams.some(prefix => key.startsWith(prefix))) {
        return;
      }
      keys.push(key);
    });
    return keys;
  }

  // Check Do Not Track
  function isDNT(): boolean {
    return navigator.doNotTrack === '1' || (window as any).doNotTrack === '1';
  }

  // Create pageview event
  function createPageviewEvent(): TrackerEvent {
    const path = normalizePath(window.location.pathname);
    const isMasked = path === '/masked';

    return {
      type: 'pageview',
      ts: Date.now(),
      project_key: config.projectKey,
      visitor_id: getVisitorId(),
      session_id: getSessionId(),
      url_path: path,
      url_query_keys: getQueryKeys(),
      referrer: document.referrer || undefined,
      title: document.title?.substring(0, 120) || undefined,
      viewport: { w: window.innerWidth, h: window.innerHeight },
      device: getDeviceType(),
      tz_offset_min: new Date().getTimezoneOffset(),
      lang: navigator.language,
      dnt: isDNT(),
      mask_applied: isMasked,
    };
  }

  // Create engagement event
  function createEngagementEvent(): TrackerEvent {
    return {
      type: 'engagement',
      ts: Date.now(),
      project_key: config.projectKey,
      visitor_id: getVisitorId(),
      session_id: getSessionId(),
      url_path: normalizePath(window.location.pathname),
      device: getDeviceType(),
      tz_offset_min: new Date().getTimezoneOffset(),
      lang: navigator.language,
      dnt: isDNT(),
      visible: document.visibilityState === 'visible',
      idle_ms: Date.now() - lastActivityTime,
    };
  }

  // Queue event for sending
  function queueEvent(event: TrackerEvent) {
    // Skip if DNT is enabled
    if (event.dnt) return;

    eventQueue.push(event);

    // Flush if batch size reached
    if (eventQueue.length >= BATCH_SIZE) {
      flushEvents();
    } else if (!batchTimer) {
      // Start batch timer
      batchTimer = setTimeout(flushEvents, BATCH_WAIT);
    }
  }

  // Send events to server
  function flushEvents() {
    if (batchTimer) {
      clearTimeout(batchTimer);
      batchTimer = null;
    }

    if (eventQueue.length === 0) return;

    const events = eventQueue.splice(0, BATCH_SIZE);
    const payload = {
      v: 1,
      project_key: config.projectKey,
      sent_at: Date.now(),
      events,
    };

    // Try sendBeacon first
    if (navigator.sendBeacon) {
      const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
      const success = navigator.sendBeacon(config.endpoint, blob);
      if (success) return;
    }

    // Fallback to fetch
    fetch(config.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      keepalive: true,
    }).catch(() => {
      // Save to retry queue
      saveToRetryQueue(events);
    });
  }

  // Save failed events to retry queue
  function saveToRetryQueue(events: TrackerEvent[]) {
    try {
      const existing = JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]') as TrackerEvent[];
      const combined = [...existing, ...events].slice(-MAX_QUEUE_SIZE);
      localStorage.setItem(QUEUE_KEY, JSON.stringify(combined));
    } catch (e) {
      // Storage unavailable or full
    }
  }

  // Retry queued events
  function retryQueuedEvents() {
    try {
      const queued = JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]') as TrackerEvent[];
      if (queued.length > 0) {
        localStorage.removeItem(QUEUE_KEY);
        queued.forEach(event => queueEvent(event));
      }
    } catch (e) {
      // Storage unavailable
    }
  }

  // Start engagement tracking
  function startEngagementTracking() {
    let idleTime = 0;

    engagementTimer = setInterval(() => {
      // Stop after 60s of inactivity
      if (Date.now() - lastActivityTime > 60000) {
        return;
      }

      // Only track if page is visible
      if (document.visibilityState === 'visible') {
        queueEvent(createEngagementEvent());
      }
    }, ENGAGEMENT_INTERVAL);

    // Reset idle on user activity
    const resetIdle = () => {
      lastActivityTime = Date.now();
    };

    document.addEventListener('mousemove', resetIdle, { passive: true });
    document.addEventListener('keydown', resetIdle, { passive: true });
    document.addEventListener('scroll', resetIdle, { passive: true });
    document.addEventListener('click', resetIdle, { passive: true });
  }

  // Handle SPA navigation
  function setupSPATracking() {
    if (!config.spa) return;

    // Track history changes
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    history.pushState = function(...args) {
      originalPushState.apply(this, args);
      onNavigate();
    };

    history.replaceState = function(...args) {
      originalReplaceState.apply(this, args);
      onNavigate();
    };

    window.addEventListener('popstate', onNavigate);
  }

  // Handle navigation
  function onNavigate() {
    const newPath = normalizePath(window.location.pathname);
    if (newPath !== currentPath) {
      currentPath = newPath;
      queueEvent(createPageviewEvent());
    }
  }

  // Mark visitor as seen (for returning visitor detection)
  function markAsSeen() {
    try {
      localStorage.setItem(SEEN_KEY, '1');
    } catch (e) {
      // Storage unavailable
    }
  }

  // Initialize tracker
  function init() {
    // Track initial pageview
    currentPath = normalizePath(window.location.pathname);
    queueEvent(createPageviewEvent());
    markAsSeen();

    // Retry any queued events from previous sessions
    retryQueuedEvents();

    // Start engagement tracking
    startEngagementTracking();

    // Setup SPA tracking if enabled
    setupSPATracking();

    // Flush on page hide
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        flushEvents();
      }
    });

    window.addEventListener('pagehide', flushEvents);
    window.addEventListener('beforeunload', flushEvents);
  }

  // Wait for DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
