import { NextRequest } from 'next/server';

// Serves the track.js script — injected via script tag into any site.
// Supports:
//   data-key="..."           customer key (required)
//   data-idle-seconds="20"   idle threshold before agent activates (default 60)
//   data-debug="true"        log to console with [AF] prefix

const TRACK_SCRIPT = `
(function() {
  'use strict';

  var API_BASE = 'http://localhost:3000';
  var customerKey = __AF_KEY__;
  var debugMode = __AF_DEBUG__;
  var sessionId = null;
  var idleTimer = null;
  var idleInterval = null;
  var idleSeconds = 0;
  var idleStart = null;
  var IDLE_CHECK_INTERVAL = 1000;   // check every 1s
  var IDLE_THRESHOLD = __AF_IDLE__;
  var IDLE_INACTIVITY_WAIT = 1000;  // wait 1s of no activity before counting idle
  var lastUrl = window.location.pathname;
  var agentConfigs = [];
  var widgetActive = false;
  var sessionContext = {};          // builds up as user moves through the site
  var agentExecuting = false;       // true while executeStep is performing a click — suppresses passive event listeners

  // Outer-scope refs so remountWidgetWithMessage can rebuild a full chat widget
  var activeAgent = null;
  var activePageContext = {};
  var activeMessages = [];

  function saveChatHistory() {
    try {
      var clean = activeMessages.filter(function(m) { return m.content.charAt(0) !== '['; });
      sessionStorage.setItem('af_chat_history', JSON.stringify(clean));
    } catch(e) {}
  }

  // ── Debug logging ──────────────────────────────────────────────────────

  function log() {
    if (!debugMode) return;
    var args = Array.prototype.slice.call(arguments);
    args.unshift('[AF]');
    console.log.apply(console, args);
  }

  // ── Session ID (hashed, non-reversible) ───────────────────────────────

  function generateSessionId() {
    var raw = Date.now() + '-' + Math.random() + '-' + (navigator.userAgent || '');
    var hash = 0;
    for (var i = 0; i < raw.length; i++) {
      hash = ((hash << 5) - hash) + raw.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash).toString(36) + Date.now().toString(36);
  }

  function getSessionId() {
    if (!sessionId) {
      sessionId = sessionStorage.getItem('__af_sid__');
      if (!sessionId) {
        sessionId = generateSessionId();
        sessionStorage.setItem('__af_sid__', sessionId);
      }
    }
    return sessionId;
  }

  // ── PII stripping ──────────────────────────────────────────────────────

  function sanitizePath(url) {
    try {
      var u = new URL(url, window.location.origin);
      return u.pathname;
    } catch(e) {
      return '/';
    }
  }

  // ── Observer push ──────────────────────────────────────────────────────

  function pushToObserver(data) {
    if (!customerKey) return;
    var payload = Object.assign({ customerKey: customerKey, sessionId: getSessionId() }, data);
    log('observer event:', data.type, data);
    fetch(API_BASE + '/api/observer/push', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).catch(function(err) {
      log('observer push failed:', err.message);
    });
  }

  // ── Page metadata reader (data-af-* attributes) ────────────────────────
  // Demo store pages expose product/step context via data attributes.
  // track.js reads these without knowing anything about the site's internals.

  function readPageMeta() {
    var meta = {};
    // Product metadata
    var productEl = document.querySelector('[data-af-product]');
    if (productEl) {
      meta.productName  = productEl.getAttribute('data-af-product');
      meta.productPrice = productEl.getAttribute('data-af-price');
      meta.productBrand = productEl.getAttribute('data-af-brand');
      meta.productId    = productEl.getAttribute('data-af-product-id');
    }
    // Checkout step
    var stepEl = document.querySelector('[data-af-step]');
    if (stepEl) meta.checkoutStep = stepEl.getAttribute('data-af-step');

    return meta;
  }

  // ── Load agent configs ─────────────────────────────────────────────────

  function loadAgents() {
    log('fetching agents for key:', customerKey);
    fetch(API_BASE + '/api/agents?key=' + customerKey)
      .then(function(r) { return r.json(); })
      .then(function(agents) {
        agentConfigs = agents || [];
        log('agents loaded:', agentConfigs.length, agentConfigs.map(function(a) { return a.name; }));

        // Only auto-open if a plan just completed and needs to show a summary.
        // Normal first-open always waits for the idle trigger.
        var hasPendingSummary = !!sessionStorage.getItem('af_pending_summary');
        var hasPendingPlan = !!sessionStorage.getItem('af_pending_plan');
        if (hasPendingSummary && !hasPendingPlan && agentConfigs.length > 0 && !widgetActive) {
          widgetActive = true;
          mountWidget(agentConfigs[0], buildPageContext());
        }
      })
      .catch(function(err) {
        log('agent load failed (no agents will activate):', err.message);
        agentConfigs = [];
      });
  }

  // ── Idle detection ─────────────────────────────────────────────────────
  // IDLE_INACTIVITY_WAIT: how long user must be inactive before idle clock starts.
  // IDLE_THRESHOLD:       how many idle seconds before agent activates.
  // Combined = IDLE_INACTIVITY_WAIT/1000 + IDLE_THRESHOLD seconds from last activity.

  function startIdleTracking() {
    idleStart = Date.now();
    idleSeconds = 0;
    log('idle clock started — threshold:', IDLE_THRESHOLD + 's');

    idleInterval = setInterval(function() {
      idleSeconds = Math.floor((Date.now() - idleStart) / 1000);
      var path = sanitizePath(window.location.href);
      var meta = readPageMeta();

      // Send observer update every 5s on checkout page — stop once agent activates
      if (!widgetActive && idleSeconds > 0 && idleSeconds % 5 === 0 && path.indexOf('/checkout') !== -1) {
        pushToObserver({
          type: 'idle_warning',
          pageUrl: path,
          seconds: idleSeconds,
          checkoutStep: meta.checkoutStep || 'payment',
          threshold: IDLE_THRESHOLD,
        });
      }

      // Check triggers
      if (!widgetActive) {
        checkTriggers({ type: 'idle', idleSeconds: idleSeconds, pageUrl: path });
      }
    }, IDLE_CHECK_INTERVAL);
  }

  function resetIdle() {
    if (idleInterval) {
      clearInterval(idleInterval);
      idleInterval = null;
    }
    idleSeconds = 0;
    idleStart = null;
    clearTimeout(idleTimer);
    idleTimer = setTimeout(startIdleTracking, IDLE_INACTIVITY_WAIT);
  }

  // ── Trigger evaluation ─────────────────────────────────────────────────

  function checkTriggers(signal) {
    for (var i = 0; i < agentConfigs.length; i++) {
      var agent = agentConfigs[i];
      if (matchesTrigger(agent.triggerCondition, signal)) {
        log('trigger matched:', agent.name);
        activateAgent(agent);
        return;
      }
    }
  }

  function matchesTrigger(trigger, signal) {
    if (!trigger) return false;
    if (trigger.type === 'idle') {
      var matches = (
        signal.type === 'idle' &&
        signal.idleSeconds >= trigger.seconds &&
        signal.pageUrl.indexOf(trigger.pagePattern) !== -1
      );
      if (signal.idleSeconds > 0 && signal.idleSeconds % 10 === 0) {
        log('idle check:', signal.idleSeconds + 's /', trigger.seconds + 's threshold, page:', signal.pageUrl, 'match:', matches);
      }
      return matches;
    }
    return false;
  }

  // ── Page context builder (structural, no PII) ──────────────────────────

  function buildPageContext() {
    var forms = [];
    var formEls = document.querySelectorAll('form');
    for (var i = 0; i < formEls.length; i++) {
      var form = formEls[i];
      var fields = [];
      var inputs = form.querySelectorAll('input, select, textarea');
      for (var j = 0; j < inputs.length; j++) {
        var el = inputs[j];
        var labelEl = document.querySelector('label[for="' + el.id + '"]');
        fields.push({
          type: el.type || el.tagName.toLowerCase(),
          label: labelEl ? labelEl.textContent.trim() : null,
          hasValue: !!el.value,
          isRequired: el.required || false,
        });
      }
      forms.push({ id: form.id, fields: fields });
    }

    var savedIndicators = [];
    var savedEls = document.querySelectorAll('[data-saved], [data-af-saved]');
    for (var k = 0; k < savedEls.length; k++) {
      var saved = savedEls[k];
      savedIndicators.push({
        type: saved.getAttribute('data-saved') || saved.getAttribute('data-af-saved'),
        label: saved.textContent.trim().slice(0, 100),
      });
    }

    // Also scan for data-af-context on the current page (supplements cached sessionContext.pageContent)
    var currentPageContent = '';
    var contextEls = document.querySelectorAll('[data-af-context]');
    contextEls.forEach(function(el) {
      var key = el.getAttribute('data-af-context');
      currentPageContent += '\\n\\n[' + key + ']\\n' + el.innerText.trim();
    });

    var ctx = Object.assign({
      url: sanitizePath(window.location.href),
      pageTitle: document.title,
      forms: forms,
      savedIndicators: savedIndicators,
    }, sessionContext);

    // Current page content takes priority; falls back to cached product page content
    if (currentPageContent.trim()) {
      ctx.pageContent = currentPageContent.trim();
    }

    return ctx;
  }

  // ── Live site map — scans each page for interactive elements ──────────
  // Accumulated in sessionContext.siteMap[pathname] so Claude can generate
  // ACTION_PLANs from real DOM evidence rather than static documentation.

  function scanPageForSiteMap() {
    var path = sanitizePath(window.location.href);
    var entry = { path: path, links: [], buttons: [], sizes: [], products: [] };

    // Navigation links
    var links = document.querySelectorAll('a[href]');
    for (var li = 0; li < links.length; li++) {
      var href = links[li].getAttribute('href');
      var txt = (links[li].innerText || links[li].textContent || '').trim().slice(0, 40);
      if (href && href.indexOf('http') !== 0) {
        entry.links.push({ href: href, text: txt });
      }
    }

    // Buttons with data-action
    var actions = document.querySelectorAll('[data-action]');
    for (var ai = 0; ai < actions.length; ai++) {
      var act = actions[ai].getAttribute('data-action');
      var atxt = (actions[ai].innerText || actions[ai].textContent || '').trim().slice(0, 40);
      entry.buttons.push({ selector: '[data-action="' + act + '"]', text: atxt });
    }

    // Size buttons
    var sizes = document.querySelectorAll('[data-af-size]');
    for (var si = 0; si < sizes.length; si++) {
      entry.sizes.push('[data-af-size="' + sizes[si].getAttribute('data-af-size') + '"]');
    }

    // Product links
    var products = document.querySelectorAll('a[href^="/product/"]');
    for (var pi = 0; pi < products.length; pi++) {
      var phref = products[pi].getAttribute('href');
      var ptxt = (products[pi].innerText || products[pi].textContent || '').trim().slice(0, 40);
      entry.products.push({ href: phref, text: ptxt, selector: 'a[href="' + phref + '"]' });
    }

    // Persist across page navigations — merge into sessionStorage so siteMap
    // survives full-page reloads and accumulates data from every visited page.
    var stored = sessionStorage.getItem('af_site_map');
    var fullMap = stored ? JSON.parse(stored) : {};
    fullMap[path] = entry;
    sessionStorage.setItem('af_site_map', JSON.stringify(fullMap));

    sessionContext.siteMap = fullMap;
    console.log('[AF] siteMap updated for', path, '— total pages:', Object.keys(fullMap).length);
  }

  // ── Interaction tracking ───────────────────────────────────────────────

  function trackPageView(url) {
    var path = sanitizePath(url);
    var meta = readPageMeta();

    // Enrich session context with what we know about this page
    if (meta.productName) {
      sessionContext.productName  = meta.productName;
      sessionContext.productPrice = meta.productPrice;
      sessionContext.productBrand = meta.productBrand;
      sessionContext.productId    = meta.productId;
    }
    if (meta.checkoutStep) {
      sessionContext.checkoutStep = meta.checkoutStep;
    }

    // Cache data-af-context content (sizing guide, reviews, etc.) from the current page.
    // The agent activates later on the checkout page where these elements are gone,
    // so we save them to sessionContext here while they're in the DOM.
    var contextEls = document.querySelectorAll('[data-af-context]');
    if (contextEls.length > 0) {
      var cachedContent = '';
      contextEls.forEach(function(el) {
        var key = el.getAttribute('data-af-context');
        cachedContent += '\\n\\n[' + key + ']\\n' + el.innerText.trim();
      });
      sessionContext.pageContent = cachedContent.trim();
    }

    // Scan page for live site map after DOM is settled
    setTimeout(scanPageForSiteMap, 400);

    pushToObserver(Object.assign({ type: 'page_view', pageUrl: path }, meta));
  }

  function checkNavigation() {
    var currentUrl = window.location.pathname;
    if (currentUrl !== lastUrl) {
      log('navigation:', lastUrl, '->', currentUrl);
      lastUrl = currentUrl;
      trackPageView(window.location.href);
    }
  }

  // Watch for checkout step changes (shipping → payment) via data-af-step
  var lastCheckoutStep = null;
  function checkCheckoutStep() {
    var stepEl = document.querySelector('[data-af-step]');
    if (!stepEl) return;
    var step = stepEl.getAttribute('data-af-step');
    if (step && step !== lastCheckoutStep) {
      lastCheckoutStep = step;
      sessionContext.checkoutStep = step;
      log('checkout step changed to:', step);
      pushToObserver({ type: 'checkout_step', step: step, pageUrl: sanitizePath(window.location.href) });
    }
  }

  // ── Agent activation ───────────────────────────────────────────────────

  function activateAgent(agent) {
    if (widgetActive) return;
    widgetActive = true;

    var pageContext = buildPageContext();
    log('activating agent:', agent.name, '| page context:', pageContext);

    pushToObserver({
      type: 'pattern_match',
      patternKey: agent.workflow,
      confidence: 0.87,
      coverage: 0.67,
      dropOffStep: sanitizePath(window.location.href),
      sessionContext: sessionContext,
    });

    setTimeout(function() {
      pushToObserver({
        type: 'friction_classified',
        frictionType: agent.frictionType,
        sessionContext: sessionContext,
      });

      setTimeout(function() {
        pushToObserver({
          type: 'agent_activated',
          agentName: agent.name,
          frictionType: agent.frictionType,
          triggerSeconds: agent.triggerCondition && agent.triggerCondition.seconds,
        });

        mountWidget(agent, pageContext);
      }, 600);
    }, 800);
  }

  // ── Agent widget ───────────────────────────────────────────────────────

  function mountWidget(agent, pageContext) {
    if (document.getElementById('af-widget')) return;

    // Persist refs for cross-page completion remount
    activeAgent = agent;
    activePageContext = pageContext;

    var widget = document.createElement('div');
    widget.id = 'af-widget';
    widget.style.cssText = [
      'position:fixed',
      'bottom:24px',
      'right:24px',
      'width:340px',
      'z-index:99999',
      'font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif',
      'animation:af-slide-up 0.35s cubic-bezier(0.16,1,0.3,1)',
    ].join(';');

    var style = document.createElement('style');
    style.textContent = [
      '@keyframes af-slide-up{from{transform:translateY(24px);opacity:0}to{transform:translateY(0);opacity:1}}',
      '#af-widget *{box-sizing:border-box}',
      '#af-widget .af-card{background:#0f172a!important;border:1px solid #1e293b;border-radius:16px;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,0.5)}',
      '#af-widget .af-header{display:flex;align-items:center;gap:10px;padding:14px 16px 12px;border-bottom:1px solid #1e293b;background:#0f172a!important}',
      '#af-widget .af-avatar{width:28px;height:28px;border-radius:8px;background:#3730a3;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:13px;color:#a5b4fc}',
      '#af-widget .af-title{font-size:13px;font-weight:600;color:#f1f5f9}',
      '#af-widget .af-subtitle{font-size:11px;color:#64748b;margin-top:1px}',
      '#af-widget .af-close{margin-left:auto;background:none;border:none;cursor:pointer;color:#475569;padding:4px;border-radius:6px;line-height:1}',
      '#af-widget .af-close:hover{color:#94a3b8;background:#1e293b}',
      '#af-widget .af-messages{padding:12px 14px;max-height:240px;overflow-y:auto;background:#0f172a!important}',
      '#af-widget .af-bubble{padding:10px 12px;border-radius:12px;font-size:13px;line-height:1.5;margin-bottom:8px}',
      '#af-widget .af-bubble-agent{background:#1e293b!important;color:#cbd5e1!important;border-bottom-left-radius:4px}',
      '#af-widget .af-bubble-user{background:#4338ca;color:#fff;border-bottom-right-radius:4px;margin-left:32px}',
      '#af-widget .af-typing{display:flex;align-items:center;gap:4px;padding:10px 12px;color:#475569;font-size:12px}',
      '#af-widget .af-dot{width:6px;height:6px;border-radius:50%;background:#475569;animation:af-pulse 1.4s ease-in-out infinite}',
      '#af-widget .af-dot:nth-child(2){animation-delay:0.2s}',
      '#af-widget .af-dot:nth-child(3){animation-delay:0.4s}',
      '@keyframes af-pulse{0%,80%,100%{transform:scale(0.8);opacity:0.5}40%{transform:scale(1);opacity:1}}',
      '#af-widget .af-input-row{display:flex;gap:8px;padding:10px 14px;border-top:1px solid #1e293b}',
      '#af-widget .af-input{flex:1;background:#1e293b;border:1px solid #334155;border-radius:8px;color:#f1f5f9;font-size:13px;padding:8px 12px;outline:none}',
      '#af-widget .af-input:focus{border-color:#4f46e5}',
      '#af-widget .af-send{background:#4338ca;border:none;border-radius:8px;color:#fff;width:34px;height:34px;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:16px}',
      '#af-widget .af-send:hover{background:#4f46e5}',
      '#af-widget .af-confirm-box{margin:0 14px 14px;border:1px solid #1e293b;border-radius:12px;overflow:hidden}',
      '#af-widget .af-confirm-title{padding:10px 14px 8px;font-size:12px;font-weight:600;color:#94a3b8;border-bottom:1px solid #1e293b}',
      '#af-widget .af-confirm-items{padding:10px 14px}',
      '#af-widget .af-confirm-item{display:flex;align-items:center;gap:8px;font-size:12px;color:#94a3b8;margin-bottom:6px}',
      '#af-widget .af-confirm-cta{display:flex;gap:8px;padding:10px 14px;border-top:1px solid #1e293b}',
      '#af-widget .af-btn-confirm{flex:1;background:#4338ca;border:none;border-radius:8px;color:#fff;font-size:13px;font-weight:600;padding:10px;cursor:pointer}',
      '#af-widget .af-btn-confirm:hover{background:#4f46e5}',
      '#af-widget .af-btn-dismiss{background:none;border:none;color:#475569;font-size:12px;cursor:pointer;padding:10px 8px}',
      '#af-widget .af-btn-dismiss:hover{color:#64748b}',
      '#af-widget .af-progress{padding:8px 14px 14px;border-top:1px solid #1e293b}',
      '#af-widget .af-progress-hd{font-size:10px;font-weight:600;color:#475569;margin-bottom:8px;text-transform:uppercase;letter-spacing:0.07em}',
      '#af-widget .af-step{display:flex;align-items:center;gap:8px;padding:4px 0;font-size:12px;color:#475569;transition:color 0.3s}',
      '#af-widget .af-step-icon{width:14px;text-align:center;flex-shrink:0}',
    ].join('');
    document.head.appendChild(style);

    widget.innerHTML = [
      '<div class="af-card">',
      '  <div class="af-header">',
      '    <div class="af-avatar">⚡</div>',
      '    <div><div class="af-title">Sole Society Assistant</div><div class="af-subtitle">Here to help</div></div>',
      '    <button class="af-close" id="af-close-btn">✕</button>',
      '  </div>',
      '  <div class="af-messages" id="af-messages"></div>',
      '</div>',
    ].join('');

    document.body.appendChild(widget);

    document.getElementById('af-close-btn').onclick = function() {
      widget.remove();
      widgetActive = false;
    };

    var messages = activeMessages;  // shared ref — survives into remountWidgetWithMessage
    var firstResponseDone = false;
    var proposedAction = null; // { type: 'update_cart_size', newSize } | { type: 'prefill_payment' }

    // Persist clean conversation history (delegates to outer-scope saveChatHistory)
    function persistMessages() { saveChatHistory(); }

    // Render a single message as a chat bubble (no scroll)
    function renderBubble(role, content) {
      var container = document.getElementById('af-messages');
      if (!container) return;
      var b = document.createElement('div');
      b.className = 'af-bubble af-bubble-' + (role === 'user' ? 'user' : 'agent');
      b.textContent = content;
      container.appendChild(b);
    }

    function addMessage(role, content) {
      var container = document.getElementById('af-messages');
      if (!container) return;
      var bubble = document.createElement('div');
      bubble.className = 'af-bubble af-bubble-' + role;
      bubble.textContent = content;
      container.appendChild(bubble);
      container.scrollTop = container.scrollHeight;
    }

    function showTyping() {
      if (document.getElementById('af-typing')) return; // prevent duplicate typing indicators
      var container = document.getElementById('af-messages');
      if (!container) return;
      var t = document.createElement('div');
      t.className = 'af-typing';
      t.id = 'af-typing';
      t.innerHTML = '<span class="af-dot"></span><span class="af-dot"></span><span class="af-dot"></span>';
      container.appendChild(t);
      container.scrollTop = container.scrollHeight;
    }

    function hideTyping() {
      var t = document.getElementById('af-typing');
      if (t) t.remove();
    }

    function showInputRow() {
      var card = widget.querySelector('.af-card');
      if (!card || document.getElementById('af-input-row')) return;
      var row = document.createElement('div');
      row.className = 'af-input-row';
      row.id = 'af-input-row';
      row.innerHTML = '<input class="af-input" id="af-text-input" placeholder="Reply..." /><button class="af-send" id="af-send-btn">&#10148;</button>';
      card.appendChild(row);

      document.getElementById('af-send-btn').onclick = sendUserMessage;
      document.getElementById('af-text-input').onkeydown = function(e) {
        if (e.key === 'Enter') sendUserMessage();
      };
    }

    function sendUserMessage() {
      var input = document.getElementById('af-text-input');
      if (!input || !input.value.trim()) return;
      var text = input.value.trim();
      input.value = '';
      addMessage('user', text);
      messages.push({ role: 'user', content: text });
      persistMessages();
      pushToObserver({ type: 'customer_message', text: text });
      sendToAgent();
    }

    function sendToAgent() {
      showTyping();
      var confirmBox = document.getElementById('af-confirm-box');
      if (confirmBox) confirmBox.remove();

      log('sending to agent, messages:', messages.length);

      fetch(API_BASE + '/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: messages,
          agentConfig: agent,
          pageContext: pageContext,
          customerKey: customerKey,
          sessionId: getSessionId(),
        }),
      }).then(function(res) {
        if (!res.ok || !res.body) {
          hideTyping();
          log('chat API error:', res.status);
          addMessage('agent', 'Sorry, I ran into an issue. Please try completing checkout manually.');
          return;
        }

        var reader = res.body.getReader();
        var decoder = new TextDecoder();
        var agentText = '';

        // Keep typing indicator visible the whole time Claude is thinking.
        // The bubble is NOT appended during streaming — we reveal the complete
        // response atomically when the stream ends so the customer never sees
        // partial text or thinking block flashes.

        function read() {
          reader.read().then(function(result) {
            if (result.done) {
              hideTyping();

              var container = document.getElementById('af-messages');

              // Check for ACTION_PLAN block — no bubble shown, plan executes silently
              var apMatch = agentText.match(/\\[ACTION_PLAN\\]([\\s\\S]*?)\\[\\/ACTION_PLAN\\]/);
              if (apMatch) {
                var displayText = agentText.replace(/\\s*\\[ACTION_PLAN\\][\\s\\S]*?\\[\\/ACTION_PLAN\\]\\s*/, '').trim();
                messages.push({ role: 'assistant', content: displayText });
                persistMessages();
                console.log('[AF] ACTION_PLAN detected, raw JSON:', apMatch[1].slice(0, 120));
                try {
                  var plan = JSON.parse(apMatch[1].trim());
                  plan.currentStep = 0;
                  sessionStorage.setItem('af_pending_plan', JSON.stringify(plan));
                  console.log('[AF] Plan saved — goal:', plan.goal, '| steps:', plan.steps && plan.steps.length);
                  setTimeout(function() { resumePendingPlan(); }, 500);
                } catch (apErr) {
                  console.error('[AF] ACTION_PLAN JSON parse failed:', apErr.message, '| raw:', apMatch[1].slice(0, 200));
                  showInputRow();
                }
                return;
              }

              // Reveal the complete response atomically — add bubble now
              var bubble = document.createElement('div');
              bubble.className = 'af-bubble af-bubble-agent';
              bubble.textContent = agentText;
              if (container) {
                container.appendChild(bubble);
                container.scrollTop = container.scrollHeight;
              }

              messages.push({ role: 'assistant', content: agentText });
              persistMessages();
              log('agent response complete, length:', agentText.length);

              firstResponseDone = true;

              var lower = agentText.toLowerCase();

              // Detect cart size update proposal: "Want me to update your cart to size X?"
              var cartUpdateMatch = agentText.match(/want me to update your cart to size (\\d+\\.?\\d*)/i);
              var wantsCartUpdate = !!cartUpdateMatch;

              // Detect payment pre-fill proposal
              var wantsPaymentFill =
                lower.indexOf("shall i fill in") !== -1 ||
                lower.indexOf("shall i go ahead") !== -1 ||
                lower.indexOf("shall i proceed") !== -1 ||
                lower.indexOf("want me to fill") !== -1;

              if (wantsCartUpdate && cartUpdateMatch) {
                var newSize = cartUpdateMatch[1];
                var cartRaw = sessionStorage.getItem('af_cart');
                var currentCart = cartRaw ? JSON.parse(cartRaw) : null;
                var oldSize = currentCart ? currentCart.size : '?';
                proposedAction = { type: 'update_cart_size', newSize: newSize };
                showConfirmBox(agent, {
                  title: 'Update your cart',
                  items: ['Change size ' + oldSize + ' → size ' + newSize],
                  cta: 'Update Cart',
                  dismiss: 'Keep current size',
                });
              } else if (wantsPaymentFill) {
                proposedAction = { type: 'prefill_payment' };
                showConfirmBox(agent, null);
              } else {
                showInputRow();
              }
              return;
            }
            // Accumulate silently — no DOM updates during streaming
            var chunk = decoder.decode(result.value, { stream: true });
            agentText += chunk;
            read();
          }).catch(function(err) {
            log('stream read error:', err.message);
            hideTyping();
          });
        }
        read();
      }).catch(function(err) {
        hideTyping();
        log('chat fetch error:', err.message);
        addMessage('agent', 'Connection issue. Please try again.');
      });
    }

    // opts: { title, items: string[], cta, dismiss } — overrides agent defaults
    function showConfirmBox(agent, opts) {
      var card = widget.querySelector('.af-card');
      if (!card) return;

      var title = (opts && opts.title) || agent.confirmationTitle || "Here's what I'll do";
      var cta   = (opts && opts.cta)   || agent.confirmationCta   || 'Confirm';
      var dism  = (opts && opts.dismiss) || agent.dismissLabel    || 'Not now';

      var itemsHtml;
      if (opts && opts.items && opts.items.length) {
        itemsHtml = opts.items.map(function(item) {
          return '<div class="af-confirm-item"><span style="color:#6366f1">&#10003;</span> ' + item + '</div>';
        }).join('');
      } else {
        itemsHtml = (pageContext.savedIndicators || []).map(function(s) {
          return '<div class="af-confirm-item"><span style="color:#6366f1">&#10003;</span> ' + s.label.replace(/</g, '&lt;') + '</div>';
        }).join('');
        if (!itemsHtml) {
          itemsHtml = '<div class="af-confirm-item"><span style="color:#6366f1">&#10003;</span> Complete your order with saved details</div>';
        }
      }

      var box = document.createElement('div');
      box.className = 'af-confirm-box';
      box.id = 'af-confirm-box';
      box.innerHTML = [
        '<div class="af-confirm-title">' + title + '</div>',
        '<div class="af-confirm-items">' + itemsHtml + '</div>',
        '<div class="af-confirm-cta">',
        '  <button class="af-btn-confirm" id="af-confirm-btn">' + cta + '</button>',
        '  <button class="af-btn-dismiss" id="af-dismiss-btn">' + dism + '</button>',
        '</div>',
      ].join('');

      card.appendChild(box);

      document.getElementById('af-confirm-btn').onclick = function() {
        box.remove();
        var capturedAction = proposedAction;
        pushToObserver({
          type: 'agent_confirmed',
          frictionType: agent.frictionType,
          confirmedAction: capturedAction ? capturedAction.type : 'prefill_payment',
          newSize: capturedAction ? capturedAction.newSize : null,
        });
        executeActions(agent, pageContext);
      };

      document.getElementById('af-dismiss-btn').onclick = function() {
        box.remove();
        proposedAction = null;
        pushToObserver({ type: 'agent_rejected', frictionType: agent.frictionType });
        addMessage('agent', "No problem — I'm here if you change your mind.");
        showInputRow();
      };
    }

    function executeActions(agent, ctx) {
      var action = proposedAction;
      proposedAction = null;

      if (action && action.type === 'update_cart_size') {
        // Send confirmation to Claude — it responds with ACTION_PLAN which track.js executes
        var confirmMsg = 'Yes, please update my cart to size ' + action.newSize;
        addMessage('user', confirmMsg);
        messages.push({ role: 'user', content: confirmMsg });
        sendToAgent();
      } else {
        executePaymentPrefill();
      }
    }

    function executePaymentPrefill() {
      log('pre-filling payment details (not submitting — customer clicks Place Order)');

      // Select saved payment method radio
      var savedRadio = document.querySelector('[data-af-saved="saved_payment"] input[type="radio"]');
      if (savedRadio) {
        savedRadio.checked = true;
        savedRadio.dispatchEvent(new Event('change', { bubbles: true }));
        log('saved payment selected');
      }

      // Pulse-highlight the Place Order button
      var submitBtn = document.querySelector('[data-af-submit]') || document.querySelector('button[type="submit"]');
      if (submitBtn) {
        if (!document.getElementById('af-pulse-style')) {
          var pulse = document.createElement('style');
          pulse.id = 'af-pulse-style';
          pulse.textContent = '@keyframes af-btn-pulse { 0%,100%{ box-shadow:0 0 0 0 rgba(99,102,241,0.5); } 50%{ box-shadow:0 0 0 8px rgba(99,102,241,0); } }';
          document.head.appendChild(pulse);
        }
        submitBtn.style.animation = 'af-btn-pulse 1.4s ease-in-out infinite';
        submitBtn.style.outline = '2px solid #6366f1';
        submitBtn.style.outlineOffset = '3px';
        submitBtn.scrollIntoView({ behavior: 'smooth', block: 'center' });
        log('Place Order button highlighted');
      }

      addMessage('agent', "Your saved Visa ending in 4242 and address at 123 Main St are all set. The Place Order button is highlighted below — click it whenever you're ready.");
      pushToObserver({ type: 'task_complete' });
    }

    // Restore conversation history from previous page navigations
    var historyRaw = sessionStorage.getItem('af_chat_history');
    if (historyRaw) {
      try {
        var history = JSON.parse(historyRaw);
        var container = document.getElementById('af-messages');
        history.forEach(function(m) {
          messages.push(m);
          renderBubble(m.role, m.content);
        });
        if (container) container.scrollTop = container.scrollHeight;
      } catch(e) {}
    }

    // Check for post-plan summary request — call Claude to describe what was just done
    var summaryRaw = sessionStorage.getItem('af_pending_summary');
    var completionMsg = sessionStorage.getItem('af_completion_msg');
    if (summaryRaw) {
      sessionStorage.removeItem('af_pending_summary');
      try {
        var summaryData = JSON.parse(summaryRaw);
        var stepList = summaryData.steps.join(', ');
        persistMessages(); // save clean history before injecting trigger
        messages.push({ role: 'user', content: '[PLAN_COMPLETE] You just executed these steps for the customer: ' + stepList + '. Goal: "' + summaryData.goal + '". Write a brief warm past-tense summary (1-2 sentences) of what you did. Plain text only.' });
        sendToAgent(); // sendToAgent calls showTyping() internally
      } catch(e) {
        setTimeout(function() { sendToAgent(); showInputRow(); }, 800);
      }
    } else if (completionMsg) {
      sessionStorage.removeItem('af_completion_msg');
      addMessage('agent', completionMsg);
      messages.push({ role: 'assistant', content: completionMsg });
      persistMessages();
      showInputRow();
    } else if (historyRaw) {
      // Returning mid-session after page navigation (e.g. plan execution) — skip greeting, show input
      showInputRow();
    } else {
      // Kick off with initial greeting from Claude
      setTimeout(function() {
        showTyping();
        setTimeout(function() {
          hideTyping();
          sendToAgent();
          showInputRow();
        }, 800);
      }, 200);
    }
  }

  // ── Forbidden action blocklist ────────────────────────────────────────

  var FORBIDDEN_SELECTORS = [
    '[data-af-submit]',
    'button[type="submit"]',
    '#card-number',
    '#cvv',
    '#expiry',
    '[data-af-saved="saved_payment"]',
  ];

  function isForbiddenAction(selector) {
    for (var fi = 0; fi < FORBIDDEN_SELECTORS.length; fi++) {
      if (selector === FORBIDDEN_SELECTORS[fi] || selector.indexOf(FORBIDDEN_SELECTORS[fi]) !== -1) {
        return true;
      }
    }
    return false;
  }

  // ── Agent banner (visible on all pages during plan execution) ─────────

  function showAgentBanner(message) {
    var existing = document.getElementById('af-agent-banner');
    if (existing) {
      var textEl = document.getElementById('af-banner-text');
      if (textEl) textEl.textContent = message;
      return;
    }
    if (!document.getElementById('af-spin-style')) {
      var spinStyle = document.createElement('style');
      spinStyle.id = 'af-spin-style';
      spinStyle.textContent = '@keyframes af-spin{to{transform:rotate(360deg)}}';
      document.head.appendChild(spinStyle);
    }
    var banner = document.createElement('div');
    banner.id = 'af-agent-banner';
    banner.style.cssText = [
      'position:fixed',
      'top:0',
      'left:0',
      'right:0',
      'z-index:999999',
      'background:#312e81',
      'color:#e0e7ff',
      'font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif',
      'font-size:13px',
      'padding:10px 16px',
      'display:flex',
      'align-items:center',
      'gap:10px',
      'border-bottom:1px solid #4338ca',
    ].join(';');
    banner.innerHTML =
      '<span style="display:inline-block;width:14px;height:14px;border:2px solid #6366f1;border-top-color:#a5b4fc;border-radius:50%;animation:af-spin 0.8s linear infinite;flex-shrink:0"></span>' +
      '<span id="af-banner-text">' + message + '</span>';
    document.body.insertBefore(banner, document.body.firstChild);
  }

  function hideAgentBanner() {
    var banner = document.getElementById('af-agent-banner');
    if (!banner) return;
    banner.style.transition = 'opacity 0.3s';
    banner.style.opacity = '0';
    setTimeout(function() { if (banner.parentNode) banner.remove(); }, 350);
  }

  // ── Wait for DOM element ──────────────────────────────────────────────

  function waitForElement(selector, timeout, callback) {
    var start = Date.now();
    var poll = setInterval(function() {
      var el = document.querySelector(selector);
      if (el) {
        clearInterval(poll);
        callback(el);
      } else if (Date.now() - start > timeout) {
        clearInterval(poll);
        pushToObserver({ type: 'cart_step', message: 'Element not found: ' + selector + ' — attempting recovery' });
        recoverPlan();
      }
    }, 100);
  }

  // ── DOM scanner for plan recovery ─────────────────────────────────────

  function scanVisibleElements() {
    var result = [];
    var buttons = document.querySelectorAll('button, [role="button"]');
    for (var bi = 0; bi < buttons.length; bi++) {
      var btn = buttons[bi];
      var btnText = (btn.innerText || btn.textContent || '').trim().slice(0, 50);
      var btnAction = btn.getAttribute('data-action');
      if (btnText || btnAction) {
        result.push({ tag: 'button', text: btnText, dataAction: btnAction, id: btn.id || null });
      }
    }
    var links = document.querySelectorAll('a[href]');
    for (var li = 0; li < links.length; li++) {
      var link = links[li];
      result.push({ tag: 'a', href: link.getAttribute('href'), text: (link.innerText || '').trim().slice(0, 50) });
    }
    var sizes = document.querySelectorAll('[data-af-size]');
    for (var si = 0; si < sizes.length; si++) {
      result.push({ tag: 'size-btn', size: sizes[si].getAttribute('data-af-size') });
    }
    return result;
  }

  // ── Plan state machine ────────────────────────────────────────────────

  function clearPlan() {
    sessionStorage.removeItem('af_pending_plan');
  }

  function recoverPlan() {
    var raw = sessionStorage.getItem('af_pending_plan');
    if (!raw) return;
    var plan;
    try { plan = JSON.parse(raw); } catch (e) { return; }
    var failedStep = plan.steps[plan.currentStep] || {};
    showAgentBanner('Recalculating...');
    fetch(API_BASE + '/api/action-step', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        goal: plan.goal,
        currentUrl: window.location.pathname,
        visibleElements: scanVisibleElements(),
        failedStep: failedStep,
        history: plan.steps.slice(0, plan.currentStep).map(function(s) { return s.description; }),
      }),
    }).then(function(res) { return res.json(); })
      .then(function(newSteps) {
        if (Array.isArray(newSteps) && newSteps.length > 0) {
          plan.steps = plan.steps.slice(0, plan.currentStep).concat(newSteps);
          sessionStorage.setItem('af_pending_plan', JSON.stringify(plan));
          executeStep(plan);
        } else {
          clearPlan();
          hideAgentBanner();
        }
      })
      .catch(function() { clearPlan(); hideAgentBanner(); });
  }

  function executeStep(plan) {
    var step = plan.steps[plan.currentStep];
    if (!step) { console.log('[AF] executeStep — no step at index', plan.currentStep); return; }
    console.log('[AF] executeStep —', step.action, '|', step.description, '| selector/to:', step.selector || step.to || '(complete)');
    showAgentBanner(step.description);
    pushToObserver({ type: 'cart_step', message: step.description });

    if (step.action === 'navigate') {
      plan.currentStep++;
      sessionStorage.setItem('af_pending_plan', JSON.stringify(plan));
      // Brief pause so the banner label is readable before the page jumps
      setTimeout(function() { window.location.href = step.to; }, 600);

    } else if (step.action === 'click') {
      if (isForbiddenAction(step.selector)) {
        clearPlan();
        hideAgentBanner();
        pushToObserver({ type: 'agent_rejected', message: 'Forbidden selector blocked: ' + step.selector });
        remountWidgetWithMessage("I can complete the setup, but placing the order and payment details are yours to confirm — I won't touch those.");
        return;
      }
      waitForElement(step.selector, 3000, function(el) {
        // Scroll into view and flash indigo ring so the customer can see what's being clicked
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        var savedOutline    = el.style.outline;
        var savedShadow     = el.style.boxShadow;
        var savedTransition = el.style.transition;
        el.style.transition  = 'outline 0.15s, box-shadow 0.15s';
        el.style.outline     = '3px solid #6366f1';
        el.style.outlineOffset = '3px';
        el.style.boxShadow   = '0 0 0 5px rgba(99,102,241,0.25)';

        setTimeout(function() {
          // Restore styles, then click
          el.style.outline     = savedOutline;
          el.style.outlineOffset = '';
          el.style.boxShadow   = savedShadow;
          el.style.transition  = savedTransition;

          agentExecuting = true;
          el.click();
          agentExecuting = false;

          plan.currentStep++;
          sessionStorage.setItem('af_pending_plan', JSON.stringify(plan));
          var next = plan.steps[plan.currentStep];
          if (next) {
            // Always advance — navigation clicks unload harmlessly; resumePendingPlan takes over.
            setTimeout(function() { executeStep(plan); }, 900);
          }
        }, 600);
      });

    } else if (step.action === 'complete') {
      clearPlan();
      pushToObserver({ type: 'cart_updated', message: 'Plan complete: ' + plan.goal });
      hideAgentBanner();
      if (window.location.pathname.indexOf('/checkout') !== -1) {
        // Store completed steps so mountWidget can ask Claude to summarise what was done
        var completedSteps = plan.steps
          .filter(function(s) { return s.action !== 'complete'; })
          .map(function(s) { return s.description; });
        sessionStorage.setItem('af_pending_summary', JSON.stringify({ goal: plan.goal, steps: completedSteps }));
        // Mount widget immediately — don't rely on loadAgents (may have already resolved and missed the flag)
        if (agentConfigs.length > 0 && !widgetActive) {
          widgetActive = true;
          mountWidget(agentConfigs[0], buildPageContext());
        }
        // loadAgents fallback: if agentConfigs not yet loaded, it will detect af_pending_summary when it resolves
      }
    }
  }

  function resumePendingPlan() {
    var raw = sessionStorage.getItem('af_pending_plan');
    if (!raw) return;
    var plan;
    try { plan = JSON.parse(raw); } catch (e) { sessionStorage.removeItem('af_pending_plan'); return; }
    console.log('[AF] resumePendingPlan — goal:', plan.goal, '| step:', plan.currentStep, '/', plan.steps && plan.steps.length);
    setTimeout(function() { executeStep(plan); }, 300);
  }

  // ── Remount widget with completion message ────────────────────────────
  // Called at the terminal step. If the widget is still mounted (same page),
  // inject the message and show input. If we navigated to a new page, rebuild
  // a full chat widget using the stored activeAgent/activePageContext refs.

  function remountWidgetWithMessage(message) {
    // Case 1: widget already on the page — just append message and show input
    var existingWidget = document.getElementById('af-widget');
    if (existingWidget) {
      var container = document.getElementById('af-messages');
      if (container) {
        var b = document.createElement('div');
        b.className = 'af-bubble af-bubble-agent';
        b.textContent = message;
        container.appendChild(b);
        container.scrollTop = container.scrollHeight;
      }
      // Show input row if not already present
      var card = existingWidget.querySelector('.af-card');
      if (card && !document.getElementById('af-input-row')) {
        var row = document.createElement('div');
        row.className = 'af-input-row';
        row.id = 'af-input-row';
        row.innerHTML = '<input class="af-input" id="af-text-input" placeholder="Reply..." /><button class="af-send" id="af-send-btn">&#10148;</button>';
        card.appendChild(row);
        document.getElementById('af-send-btn').onclick = remountSend;
        document.getElementById('af-text-input').onkeydown = function(e) { if (e.key === 'Enter') remountSend(); };
      }
      return;
    }

    // Case 2: new page load — seed completion message so mountWidget (called by loadAgents) displays it
    // Whether or not activeAgent is loaded yet, this path handles it:
    // loadAgents resolves async and calls mountWidget which checks af_completion_msg.
    sessionStorage.setItem('af_completion_msg', message);
    if (activeAgent) {
      widgetActive = false; // allow mountWidget to proceed
      mountWidget(activeAgent, buildPageContext());
    }
    // If activeAgent is not yet loaded, loadAgents will call mountWidget shortly and pick up af_completion_msg
  }

  function remountSend() {
    if (!activeAgent) return;
    var input = document.getElementById('af-text-input');
    if (!input || !input.value.trim()) return;
    var text = input.value.trim();
    input.value = '';
    // Add user bubble
    var container = document.getElementById('af-messages');
    if (container) {
      var ub = document.createElement('div');
      ub.className = 'af-bubble af-bubble-user';
      ub.textContent = text;
      container.appendChild(ub);
      container.scrollTop = container.scrollHeight;
    }
    activeMessages.push({ role: 'user', content: text });
    saveChatHistory();
    pushToObserver({ type: 'customer_message', text: text });
    // Fetch response
    var typingEl = document.createElement('div');
    typingEl.className = 'af-typing';
    typingEl.id = 'af-typing';
    typingEl.innerHTML = '<span class="af-dot"></span><span class="af-dot"></span><span class="af-dot"></span>';
    if (container) { container.appendChild(typingEl); container.scrollTop = container.scrollHeight; }
    fetch(API_BASE + '/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: activeMessages,
        agentConfig: activeAgent,
        pageContext: activePageContext,
        customerKey: customerKey,
        sessionId: getSessionId(),
      }),
    }).then(function(res) {
      var t = document.getElementById('af-typing');
      if (t) t.remove();
      if (!res.ok || !res.body) return;
      var reader = res.body.getReader();
      var decoder = new TextDecoder();
      var replyText = '';
      var cont = document.getElementById('af-messages');
      var rb = document.createElement('div');
      rb.className = 'af-bubble af-bubble-agent';
      if (cont) { cont.appendChild(rb); }
      (function pump() {
        reader.read().then(function(chunk) {
          if (chunk.done) {
            activeMessages.push({ role: 'assistant', content: replyText });
            saveChatHistory();
            return;
          }
          replyText += decoder.decode(chunk.value, { stream: true });
          rb.textContent = replyText;
          if (cont) cont.scrollTop = cont.scrollHeight;
          pump();
        });
      })();
    }).catch(function() {
      var t = document.getElementById('af-typing');
      if (t) t.remove();
    });
  }

  // ── Init ───────────────────────────────────────────────────────────────

  function init() {
    if (!customerKey) {
      console.warn('[AF] track.js: no customer key configured. Pass ?key=your-key in the script src URL.');
      return;
    }

    log('loaded — key:', customerKey, '| idle threshold:', IDLE_THRESHOLD + 's | debug:', debugMode);

    // Clear chat history unless we are mid-plan or just finished one.
    // This ensures a fresh page load or refresh always starts a clean conversation.
    var midPlan = !!sessionStorage.getItem('af_pending_plan');
    var postPlan = !!sessionStorage.getItem('af_pending_summary');
    if (!midPlan && !postPlan) {
      sessionStorage.removeItem('af_chat_history');
    }

    // Restore accumulated siteMap from previous page navigations
    var storedMap = sessionStorage.getItem('af_site_map');
    if (storedMap) {
      try { sessionContext.siteMap = JSON.parse(storedMap); } catch(e) {}
    }

    loadAgents();
    trackPageView(window.location.href);
    pushToObserver({ type: 'session_start', pageUrl: sanitizePath(window.location.href) });

    // Idle detection — reset on any user activity
    var activityEvents = ['mousemove', 'keydown', 'scroll', 'click', 'touchstart'];
    activityEvents.forEach(function(evt) {
      window.addEventListener(evt, resetIdle, { passive: true });
    });
    resetIdle();

    // Poll for navigation changes (SPA-compatible)
    setInterval(checkNavigation, 500);

    // Poll for checkout step changes
    setInterval(checkCheckoutStep, 500);

    // Click event tracking
    // ── Semantic click handler (named actions + size selects) ──────────────
    document.addEventListener('click', function(e) {
      // Skip — agent is executing a plan step; cart_step events cover it
      if (agentExecuting) return;

      var el = e.target;
      if (!el) return;
      // Walk up to nearest Element node (clicks can land on text nodes)
      while (el && el.nodeType !== 1) el = el.parentNode;
      if (!el || el === document.body) return;

      while (el && el !== document.body) {
        if (el.nodeType !== 1) { el = el.parentNode; continue; }
        var action = el.getAttribute('data-action') || '';
        var afSize = el.getAttribute('data-af-size');

        if (action === 'add-to-cart') {
          log('cart add detected');
          pushToObserver({ type: 'cart_add', pageUrl: sanitizePath(window.location.href), product: sessionContext.productName });
          return;
        }
        if (action === 'edit-cart') {
          log('cart edit detected');
          pushToObserver({ type: 'cart_edit', pageUrl: sanitizePath(window.location.href) });
          return;
        }
        if (afSize) {
          log('size selected:', afSize);
          sessionContext.selectedSize = afSize;
          pushToObserver({ type: 'size_select', size: afSize, pageUrl: sanitizePath(window.location.href), product: sessionContext.productName });
          return;
        }
        el = el.parentElement;
      }
    }, true);

    // ── Generic click narrator — reads actual DOM text of whatever was clicked ──
    // Fires for any button or link NOT already handled by the semantic handler above.
    // Skips the agent widget itself and agent-driven clicks.
    document.addEventListener('click', function(e) {
      if (agentExecuting) return;
      var el = e.target;
      if (!el) return;

      // Walk up to nearest Element (clicks can land on text nodes)
      while (el && el.nodeType !== 1) el = el.parentNode;
      if (!el || el === document.body) return;

      // Bail out if the click is inside the agent widget
      var check = el;
      while (check && check !== document.body) {
        if (check.nodeType === 1 && check.id === 'af-widget') return;
        check = check.parentElement;
      }

      // Walk up looking for a clickable element
      var node = el;
      while (node && node !== document.body) {
        // Only operate on Element nodes
        if (node.nodeType !== 1) { node = node.parentNode; continue; }

        // Skip elements already covered by the semantic handler
        if (node.getAttribute('data-af-size') || node.getAttribute('data-action')) return;

        var tag = node.tagName.toLowerCase();
        var role = node.getAttribute('role');

        if (tag === 'button' || tag === 'a' || role === 'button') {
          // Read the real label from innerText — what the customer actually sees
          var label = (node.innerText || node.textContent || '').trim().replace(/\\s+/g, ' ').slice(0, 80);
          if (label && label.length > 1) {
            log('generic click:', label);
            pushToObserver({
              type: 'user_click',
              elementText: label,
              pageUrl: sanitizePath(window.location.href),
            });
          }
          return;
        }

        // Radio / checkbox — read from associated label
        if (tag === 'input' && (node.type === 'radio' || node.type === 'checkbox')) {
          var labelEl = node.id ? document.querySelector('label[for="' + node.id + '"]') : null;
          var labelText = labelEl
            ? (labelEl.innerText || labelEl.textContent || '').trim().replace(/\\s+/g, ' ').slice(0, 60)
            : node.value || tag;
          if (labelText) {
            log('generic select:', labelText);
            pushToObserver({
              type: 'user_select',
              elementText: labelText,
              pageUrl: sanitizePath(window.location.href),
            });
          }
          return;
        }

        node = node.parentElement;
      }
    }, true);

    // ── Form field focus narrator — reads actual <label> text ──────────────
    // Shows which field the customer is actively interacting with.
    document.addEventListener('focusin', function(e) {
      var el = e.target;
      if (!el || !el.tagName) return;
      if (el.id === 'af-text-input') return; // skip agent widget input

      var tag = el.tagName.toLowerCase();
      if (tag !== 'input' && tag !== 'select' && tag !== 'textarea') return;
      if (el.type === 'radio' || el.type === 'checkbox') return; // handled by click

      // Read label from <label for="..."> or placeholder or id
      var labelEl = el.id ? document.querySelector('label[for="' + el.id + '"]') : null;
      var label = labelEl
        ? (labelEl.innerText || labelEl.textContent || '').trim()
        : (el.placeholder || el.getAttribute('aria-label') || el.id || '');

      if (label) {
        log('field focus:', label);
        pushToObserver({
          type: 'field_focus',
          label: label.slice(0, 60),
          fieldType: el.type || tag,
          pageUrl: sanitizePath(window.location.href),
        });
      }
    }, true);

    // Resume any in-progress plan from a previous page (survives navigation via sessionStorage)
    resumePendingPlan();
  }

  // ── Bootstrap ──────────────────────────────────────────────────────────
  // Config (key, idle threshold, debug) is injected at serve-time via URL params.
  // No DOM parsing needed.

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
`;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const key   = searchParams.get('key')   || '';
  const idle  = searchParams.get('idle')  || '60';
  const debug = searchParams.get('debug') || 'false';

  // Inject the config directly into the script so it never needs to find itself in the DOM
  const script = TRACK_SCRIPT
    .replace('__AF_KEY__',   JSON.stringify(key))
    .replace('__AF_IDLE__',  JSON.stringify(parseInt(idle, 10)))
    .replace('__AF_DEBUG__', JSON.stringify(debug === 'true'));

  return new Response(script, {
    headers: {
      'Content-Type': 'application/javascript',
      'Cache-Control': 'no-store',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
