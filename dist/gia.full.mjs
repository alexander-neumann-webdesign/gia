var F = Object.defineProperty;
var H = (o, e, t) => e in o ? F(o, e, { enumerable: !0, configurable: !0, writable: !0, value: t }) : o[e] = t;
var k = (o, e, t) => H(o, typeof e != "symbol" ? e + "" : e, t);
typeof window < "u" && (window.gia = window.gia || {}, window.gia.components = window.gia.components || {}, window.gia.register = (o) => {
  if (typeof o != "function") {
    console.error("Gia: Register failed. Expected a Class, got:", o);
    return;
  }
  const e = o.name;
  if (!e) {
    console.warn("Gia: Cannot register an anonymous class. Please use a named class.");
    return;
  }
  window.gia.components[e] = o;
});
class Y {
  constructor() {
    k(this, "o", {
      log: !1,
      attrPrefix: "data",
      // data-component="HelloWorld"
      autoMountComponents: !1,
      // Use MutationObserver to automatically mount/unmount components
      autoBindActions: !1
      // Automatically bind actions using data-action attributes
    });
  }
  set(e, t) {
    this.o[e] = t;
  }
  get(e) {
    return this.o[e];
  }
}
const f = new Y();
function L(o, e, t, n) {
  if (o.__gia_component__)
    return console.warn(`Component "${e}" already exists.`), o.__gia_component__;
  try {
    const i = new t(o, n);
    return f.get("log") && console.info(`Created instance of component "${e}".`), i;
  } catch (i) {
    return console.error(`Failed to create component "${e}".`, i), null;
  }
}
function ge(o) {
  return typeof o == "string" && (o = document.getElementById(o), !o) ? null : o.__gia_component__;
}
function K(o, e = document) {
  return typeof o != "string" ? o : e.querySelector(o);
}
function p(o, e = document) {
  return typeof o != "string" ? o : e.querySelectorAll(o);
}
function U(o, e, t = null) {
  t === null ? o.classList.toggle(e) : o.classList.toggle(e, !!t);
}
function W(o, e, t) {
  if (!o) return o;
  if (o.length !== void 0 && o.nodeType === void 0)
    for (let n = 0; n < o.length; n++)
      o[n].classList[t](e);
  else
    o.classList[t](e);
  return o;
}
function J(o, e) {
  return W(o, e, "remove");
}
function Q(o, e) {
  return W(o, e, "add");
}
function V(o, e, t = null, n = {
  bubbles: !0,
  cancelable: !0,
  detail: null
}) {
  n.detail = t;
  const i = new CustomEvent(e, n);
  o.dispatchEvent(i);
}
function Z(o, e) {
  let t, n = null, i = null;
  const s = () => {
    if (clearTimeout(t), n) {
      const l = i, c = n;
      i = null, n = null, o.apply(l, c);
    }
  }, r = function() {
    n = arguments, i = this, clearTimeout(t), t = setTimeout(s, e);
  };
  return r.cancel = function() {
    clearTimeout(t), n = null, i = null;
  }, r;
}
const pe = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  addClass: Q,
  debounce: Z,
  query: K,
  queryAll: p,
  removeClass: J,
  toggleClass: U,
  triggerEvent: V
}, Symbol.toStringTag, { value: "Module" }));
function X(o = {}, e = document.documentElement) {
  if (!o) {
    console.warn("App has no components");
    return;
  }
  let t = !1;
  for (const l in o) {
    t = !0;
    break;
  }
  if (!t) {
    console.warn("App has no components");
    return;
  }
  const n = [], i = `${f.get("attrPrefix")}-component`, s = p(`[${i}]`, e), r = s.length;
  for (let l = 0; l < r; l++) {
    const c = s[l];
    if (!c.__gia_component__) {
      const d = c.getAttribute(i);
      typeof o[d] == "function" ? n.push(L(c, d, o[d])) : console.warn(`Constructor "${d}" not found.`);
    }
  }
  if (e instanceof Element && e.hasAttribute(i) && !e.__gia_component__) {
    const c = e.getAttribute(i);
    typeof o[c] == "function" ? n.push(L(e, c, o[c])) : console.warn(`Constructor "${c}" not found.`);
  }
  for (let l = 0; l < n.length; l++)
    n[l].g();
}
function O(o) {
  if (!o) return;
  let e = o.__gia_component__;
  if (!e && typeof o == "string") {
    const t = document.getElementById(o);
    t && (e = t.__gia_component__, o = t);
  }
  if (e) {
    const t = e.r || "Unknown";
    try {
      typeof e.p == "function" ? e.p() : e.unmount();
    } catch (n) {
      console.error(`Gia: Error unmounting component "${t}".`, n);
    }
    o.__gia_component__ = null, e.element && (e.element = null), f.get("log") && console.info(`Removed component "${t}".`);
  }
}
function we(o = document.documentElement) {
  const e = p(`[${f.get("attrPrefix")}-component]`, o);
  for (let t = 0; t < e.length; t++)
    O(e[t]);
}
let b = !1, m = !1;
const N = /* @__PURE__ */ new Set(), ee = typeof navigator < "u" && !!navigator.userAgent.match(/(Android|iPod|iPhone|iPad|BlackBerry|IEMobile|Opera Mini)/i), x = ee ? "orientationchange" : "resize", v = /* @__PURE__ */ new Set();
let h = null;
const C = { scroll: 0, velocity: 0 }, I = { width: 0, height: 0 }, S = [null], te = (o) => o(C), ne = (o) => o(I), R = (o) => o(S), oe = function(o, e) {
  this.unobserveResize(e);
}, ie = function(o, e) {
  this.unobserveIntersection(e);
}, se = (o) => o.h();
let $ = !1;
const G = /* @__PURE__ */ new Set();
function re() {
  $ = !1, G.forEach(se), G.clear();
}
function le() {
  N.forEach(te);
}
function y(o) {
  let e, t;
  h ? (e = h.scroll, t = h.velocity) : o && typeof o.scroll == "number" ? (e = o.scroll, t = o.velocity || 0) : (e = window.scrollY || window.pageYOffset, t = 0), C.scroll = e, C.velocity = t, le();
}
function ce() {
  v.forEach(ne);
}
function T(o) {
  I.width = window.innerWidth, I.height = window.innerHeight, ce();
}
let w = null;
const _ = /* @__PURE__ */ new Map(), A = /* @__PURE__ */ new Map(), B = /* @__PURE__ */ new Set(["constructor", "require", "mount", "unmount", "getRef", "setState", "stateChange", "loadScript", "loadStyle"]), j = /* @__PURE__ */ new WeakMap(), D = /* @__PURE__ */ new Map();
function ae(o) {
  const e = o.root || null, t = o.rootMargin || "0px 0px 0px 0px", n = o.threshold || 0, i = Array.isArray(n) ? n.join(",") : n.toString();
  return `${e ? e.id || "root-element" : "null"}|${t}|${i}`;
}
let fe = class {
  constructor(e, t) {
    this.element = e, this.element.__gia_component__ = this, this.r = this.constructor.name, this.e = {}, this.o = t || {}, this.u = {}, this.h = this.h.bind(this), this.m(), f.get("autoBindActions") && this.y();
  }
  get ref() {
    return this.e;
  }
  set ref(e) {
    const t = `${f.get("attrPrefix")}-ref`, n = p(`[${t}]`, this.element), i = /* @__PURE__ */ Object.create(null);
    for (let r = 0; r < n.length; r++) {
      const l = n[r], c = l.getAttribute(t);
      let a = i[c];
      a === void 0 && (a = [], i[c] = a), a.push(l);
    }
    let s = !0;
    for (const r in e) {
      s = !1;
      break;
    }
    if (s)
      for (const r in i) {
        const l = r.indexOf(":");
        if (l !== -1) {
          const c = r.substring(0, l), a = r.substring(l + 1);
          c === this.r && !this.e[a] && (this.e[a] = i[r]);
        } else
          this.e[r] || (this.e[r] = i[r]);
      }
    else {
      this.e = {};
      for (const r in e) {
        if (!Object.prototype.hasOwnProperty.call(e, r)) continue;
        const l = Array.isArray(e[r]);
        if (e[r] !== null && l && e[r].length > 0) {
          this.e[r] = e[r];
          continue;
        }
        const c = `${this.r}:${r}`;
        let a = i[c] || [];
        a.length === 0 && (a = i[r] || []), this.e[r] = l ? a : a[0] ?? null;
      }
    }
  }
  get options() {
    return this.o;
  }
  set options(e) {
    if (typeof __GIA_NANO__ < "u" && __GIA_NANO__) {
      this.o = { ...this.o, ...e };
      return;
    }
    const t = this.element.getAttribute(`${f.get("attrPrefix")}-options`);
    let n = {};
    if (t) {
      const i = t.trim();
      if (i.startsWith("{") || i.startsWith("["))
        try {
          n = JSON.parse(i);
        } catch (s) {
          console.error(`Failed to parse options for component "${this.r}": ${s.message}`);
        }
    }
    this.o = {
      ...this.o,
      ...e,
      ...n
    };
  }
  get state() {
    return this.u;
  }
  set state(e) {
    console.warn("Use setState instead."), this.u = e;
  }
  g() {
    this.mount();
  }
  p() {
    if (this.unmount(), typeof __GIA_NANO__ < "u" && __GIA_NANO__) {
      this.e = null, this.element && (this.element.__gia_component__ = null, this.element = null);
      return;
    }
    this.l && this.l.forEach(this.unobserveScroll, this), this.c && this.c.forEach(this.unobserveWindowResize, this), this.i && this.i.forEach(oe, this), this.t && this.t.forEach(ie, this), this.e = null, this.element && (this.element.__gia_component__ = null, this.element = null);
  }
  observeScroll(e) {
    typeof __GIA_NANO__ < "u" && __GIA_NANO__ || typeof window > "u" || (b || (b = !0, window.lenis ? (h = window.lenis, h.on("scroll", y)) : window.addEventListener("scroll", y, { passive: !0 })), this.l || (this.l = /* @__PURE__ */ new Set()), this.l.add(e), N.add(e));
  }
  unobserveScroll(e) {
    typeof __GIA_NANO__ < "u" && __GIA_NANO__ || (this.l && this.l.delete(e), N.delete(e), N.size === 0 && b && (b = !1, h ? (h.off("scroll", y), h = null) : window.removeEventListener("scroll", y)));
  }
  observeWindowResize(e) {
    typeof __GIA_NANO__ < "u" && __GIA_NANO__ || typeof window > "u" || (m || (m = !0, window.addEventListener(x, T, { passive: !0 })), this.c || (this.c = /* @__PURE__ */ new Set()), this.c.add(e), v.add(e));
  }
  unobserveWindowResize(e) {
    typeof __GIA_NANO__ < "u" && __GIA_NANO__ || (this.c && this.c.delete(e), v.delete(e), v.size === 0 && m && (m = !1, window.removeEventListener(x, T)));
  }
  observeResize(e, t) {
    if (typeof __GIA_NANO__ < "u" && __GIA_NANO__ || typeof window > "u" || !window.ResizeObserver) return;
    w || (w = new ResizeObserver((s) => {
      for (let r = 0; r < s.length; r++) {
        const l = s[r], c = _.get(l.target);
        c && (S[0] = l, c.forEach(R));
      }
    }));
    let n = _.get(e);
    n || (n = /* @__PURE__ */ new Set(), _.set(e, n), w.observe(e)), n.add(t), this.i || (this.i = /* @__PURE__ */ new Map());
    let i = this.i.get(e);
    i || (i = /* @__PURE__ */ new Set(), this.i.set(e, i)), i.add(t);
  }
  unobserveResize(e, t = null) {
    if (typeof __GIA_NANO__ < "u" && __GIA_NANO__ || !this.i) return;
    const n = this.i.get(e);
    if (!n) return;
    if (t) {
      n.delete(t);
      const s = _.get(e);
      s && s.delete(t);
    } else {
      const s = _.get(e);
      s && n.forEach(Set.prototype.delete, s), n.clear();
    }
    n.size === 0 && this.i.delete(e);
    const i = _.get(e);
    i && i.size === 0 && (_.delete(e), w && w.unobserve(e));
  }
  observeIntersection(e, t, n = {}) {
    if (typeof __GIA_NANO__ < "u" && __GIA_NANO__ || typeof window > "u" || !window.IntersectionObserver) return;
    const i = ae(n);
    let s = A.get(i);
    s || (s = { observer: new IntersectionObserver((d) => {
      for (let u = 0; u < d.length; u++) {
        const z = d[u], P = s.callbacks.get(z.target);
        P && (S[0] = z, P.forEach(R));
      }
    }, n), callbacks: /* @__PURE__ */ new Map() }, A.set(i, s));
    let r = s.callbacks.get(e);
    r || (r = /* @__PURE__ */ new Set(), s.callbacks.set(e, r), s.observer.observe(e)), r.add(t), this.t || (this.t = /* @__PURE__ */ new Map());
    let l = this.t.get(e);
    l || (l = /* @__PURE__ */ new Map(), this.t.set(e, l));
    let c = l.get(i);
    c || (c = /* @__PURE__ */ new Set(), l.set(i, c)), c.add(t);
  }
  A(e, t) {
    const n = A.get(t), i = this.w, s = this.b;
    if (s)
      e.has(s) && (e.delete(s), n && n.callbacks.has(i) && n.callbacks.get(i).delete(s));
    else {
      if (n && n.callbacks.has(i)) {
        const r = n.callbacks.get(i);
        e.forEach(Set.prototype.delete, r);
      }
      e.clear();
    }
    if (e.size === 0 && this.t.get(i).delete(t), n) {
      const r = n.callbacks.get(i);
      r && r.size === 0 && (n.callbacks.delete(i), n.observer.unobserve(i)), n.callbacks.size === 0 && (n.observer.disconnect(), A.delete(t));
    }
  }
  unobserveIntersection(e, t = null) {
    if (typeof __GIA_NANO__ < "u" && __GIA_NANO__ || !this.t) return;
    const n = this.t.get(e);
    n && (this.w = e, this.b = t, n.forEach(this.A, this), this.w = null, this.b = null, n.size === 0 && this.t.delete(e));
  }
  /**
   * Loads a script that is already defined in the DOM with a data-src attribute.
   * Prevents double-loading and handles race conditions.
   * @param {string} scriptId - The exact ID of the script tag
   * @param {string} [globalName] - Optional: The global variable this script exposes (e.g. "multipleSelect")
   * @return {Promise}
   */
  loadScript(e, t) {
    if (typeof __GIA_NANO__ < "u" && __GIA_NANO__) return Promise.resolve();
    if (t && window[t] && !(window[t] instanceof Node) && !(window[t] instanceof HTMLCollection) && !(window[t] instanceof Window))
      return Promise.resolve(window[t]);
    const n = document.getElementById(e);
    return n ? n instanceof HTMLScriptElement ? n.n ? n.n : (n.n = new Promise((i, s) => {
      const r = () => {
        n.onload = null, n.onerror = null;
      };
      n.onload = () => {
        r(), i(t ? window[t] : !0);
      }, n.onerror = () => {
        r(), delete n.n, s(new Error(`Failed to load script: ${e}`));
      }, !n.src && n.hasAttribute("data-src") ? (n.src = n.getAttribute("data-src"), n.removeAttribute("data-src")) : !n.src && !n.hasAttribute("data-src") && (r(), s(new Error(`Script tag '${e}' has no src or data-src.`)));
    }), n.n) : Promise.reject(new Error(`Element with ID '${e}' is not a valid script tag.`)) : Promise.reject(new Error(`Script tag with ID '${e}' not found.`));
  }
  /**
   * Loads a stylesheet that is already defined in the DOM with a data-href attribute.
   * Prevents double-loading and handles race conditions.
   * @param {string} styleId - The exact ID of the link tag
   * @return {Promise}
   */
  loadStyle(e) {
    if (typeof __GIA_NANO__ < "u" && __GIA_NANO__) return Promise.resolve();
    const t = document.getElementById(e);
    return t ? t instanceof HTMLLinkElement ? t.n ? t.n : (t.n = new Promise((n, i) => {
      const s = () => {
        t.onload = null, t.onerror = null;
      };
      if (t.onload = () => {
        s(), n(!0);
      }, t.onerror = () => {
        s(), delete t.n, i(new Error(`Failed to load style: ${e}`));
      }, !t.href && t.hasAttribute("data-href"))
        t.href = t.getAttribute("data-href"), t.removeAttribute("data-href");
      else if (!t.href && !t.hasAttribute("data-href"))
        s(), i(new Error(`Link tag '${e}' has no href or data-href.`));
      else if (t.href && !t.hasAttribute("data-href")) {
        let r = !1;
        for (let l = 0; l < document.styleSheets.length; l++)
          if (document.styleSheets[l].href === t.href) {
            r = !0;
            break;
          }
        r && (s(), n(!0));
      }
    }), t.n) : Promise.reject(new Error(`Element with ID '${e}' is not a valid link tag.`)) : Promise.reject(new Error(`Link tag with ID '${e}' not found.`));
  }
  mount() {
  }
  unmount() {
  }
  getRef(e, t = !1) {
    return `[${f.get("attrPrefix")}-ref="${t ? `${this.r}:` : ""}${e}"]`;
  }
  setState(e) {
    if (e)
      for (const t in e) {
        if (!Object.prototype.hasOwnProperty.call(e, t)) continue;
        const n = e[t];
        if (this.u[t] !== n && (this.u[t] = n, this.f || (this.f = this._ || {}, this.s = this.d || {}, G.add(this), $ || ($ = !0, requestAnimationFrame(re))), this.f[t] = n, typeof __GIA_NANO__ > "u" || !__GIA_NANO__)) {
          const i = typeof n;
          if (i === "boolean" || i === "string") {
            let s = D.get(t);
            s || (s = `data-${t.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase()}`, D.set(t, s)), this.s[s] = i === "boolean" ? n ? "true" : "false" : n;
          }
        }
      }
  }
  h() {
    if (typeof __GIA_NANO__ > "u" || !__GIA_NANO__) {
      let e = !1;
      for (const t in this.s) {
        e = !0;
        break;
      }
      if (e)
        for (const t in this.s) {
          if (!Object.prototype.hasOwnProperty.call(this.s, t)) continue;
          const n = this.s[t];
          this.element.getAttribute(t) !== n && this.element.setAttribute(t, n);
        }
    }
    this.stateChange(this.f), this._ = this.f, this.d = this.s;
    for (const e in this._)
      delete this._[e];
    if (this.d)
      for (const e in this.d)
        delete this.d[e];
    this.f = null, this.s = null;
  }
  stateChange(e) {
    return e;
  }
  m() {
    var n;
    const e = Object.getPrototypeOf(this);
    let t = j.get(e);
    if (!t) {
      t = [];
      const i = Object.getOwnPropertyNames(e);
      for (let s = 0; s < i.length; s++) {
        const r = i[s];
        !B.has(r) && !r.startsWith("_") && typeof ((n = Object.getOwnPropertyDescriptor(e, r)) == null ? void 0 : n.value) == "function" && t.push(r);
      }
      j.set(e, t);
    }
    for (let i = 0; i < t.length; i++) {
      const s = t[i];
      this[s] = this[s].bind(this);
    }
  }
  y() {
    const e = p("[data-action]", this.element), t = e.length;
    for (let n = 0; n < t; n++) {
      const i = e[n], s = i.getAttribute("data-action");
      if (!s) continue;
      let r = 0;
      for (; r < s.length; ) {
        let l = s.indexOf(" ", r);
        if (l === -1 && (l = s.length), l > r) {
          const c = s.substring(r, l), a = c.indexOf("->");
          let d, u;
          a !== -1 ? (d = c.substring(0, a), u = c.substring(a + 2)) : (d = c, u = void 0), this[u] && typeof this[u] == "function" && !u.startsWith("_") && !B.has(u) ? i.addEventListener(d, this[u]) : console.warn(`Method "${u}" not found, is restricted, or is not a function in component.`);
        }
        r = l + 1;
      }
    }
  }
};
class me extends fe {
  async require() {
  }
  g() {
    const e = this.require();
    e && typeof e.then == "function" ? e.then(() => this.mount()) : this.mount();
  }
}
class ue {
  constructor() {
    this.listeners = /* @__PURE__ */ Object.create(null);
  }
  emit(e, t = {}) {
    f.get("log") && console.info(`Emitting event '${e}'`);
    const n = this.listeners[e];
    if (!n || n.length === 0) return;
    t && typeof t == "object" && (t.r = e);
    const i = n.slice();
    for (let s = 0; s < i.length; s++)
      i[s](t);
  }
  on(e, t, n = !1) {
    this.listeners[e] || (this.listeners[e] = []);
    let i = t;
    n && (i = (s) => {
      this.off(e, i), t(s);
    }, t.a || (t.a = /* @__PURE__ */ Object.create(null)), t.a[e] = i), this.listeners[e].push(i);
  }
  once(e, t) {
    this.on(e, t, !0);
  }
  off(e, t) {
    if (!t) {
      this.listeners[e] = [];
      return;
    }
    const n = this.listeners[e];
    if (!n) return;
    let i = t;
    t.a && t.a[e] ? (i = t.a[e], delete t.a[e]) : t.N && (i = t.N);
    const s = n.indexOf(i);
    s !== -1 && (s === n.length - 1 || (n[s] = n[n.length - 1]), n.pop());
  }
}
const ye = new ue();
let g = null, M = null;
const E = /* @__PURE__ */ new Set(), de = (o) => {
  o.isConnected && X(M, o);
};
function he(o) {
  const e = `${f.get("attrPrefix")}-component`, t = typeof window < "u" && window.gia ? window.gia.components : {};
  E.clear();
  for (let n = 0; n < o.length; n++) {
    const i = o[n];
    for (let s = 0; s < i.removedNodes.length; s++) {
      const r = i.removedNodes[s];
      if (r.nodeType === Node.ELEMENT_NODE) {
        r.hasAttribute(e) && O(r);
        const l = p(`[${e}]`, r);
        for (let c = 0; c < l.length; c++)
          O(l[c]);
      }
    }
    i.addedNodes.length > 0 && i.target.nodeType === Node.ELEMENT_NODE && E.add(i.target);
  }
  M = t, E.forEach(de), M = null;
}
function q() {
  typeof document > "u" || (f.get("autoMountComponents") && !g ? (g = new MutationObserver(he), g.observe(document.body, {
    childList: !0,
    subtree: !0
  })) : !f.get("autoMountComponents") && g && (g.disconnect(), g = null));
}
{
  const o = f.set;
  f.set = function(e, t) {
    o.call(this, e, t), e === "autoMountComponents" && q();
  };
}
typeof window < "u" && setTimeout(q, 0);
export {
  fe as BaseComponent,
  me as Component,
  f as config,
  L as createInstance,
  O as destroyInstance,
  ye as eventbus,
  ge as getComponentFromElement,
  X as loadComponents,
  we as removeComponents,
  pe as utils
};
