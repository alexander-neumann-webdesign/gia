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
    k(this, "n", {
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
    this.n[e] = t;
  }
  get(e) {
    return this.n[e];
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
    n[l].h();
}
function E(o) {
  if (!o) return;
  let e = o.__gia_component__;
  if (!e && typeof o == "string") {
    const t = document.getElementById(o);
    t && (e = t.__gia_component__, o = t);
  }
  if (e) {
    const t = e.s || "Unknown";
    try {
      typeof e._ == "function" ? e._() : e.unmount();
    } catch (n) {
      console.error(`Gia: Error unmounting component "${t}".`, n);
    }
    o.__gia_component__ = null, e.element && (e.element = null), f.get("log") && console.info(`Removed component "${t}".`);
  }
}
function we(o = document.documentElement) {
  const e = p(`[${f.get("attrPrefix")}-component]`, o);
  for (let t = 0; t < e.length; t++)
    E(e[t]);
}
let b = !1, m = !1;
const N = /* @__PURE__ */ new Set(), ee = typeof navigator < "u" && !!navigator.userAgent.match(/(Android|iPod|iPhone|iPad|BlackBerry|IEMobile|Opera Mini)/i), x = ee ? "orientationchange" : "resize", v = /* @__PURE__ */ new Set();
let h = null;
const C = { scroll: 0, velocity: 0 }, S = { width: 0, height: 0 }, I = [null], te = (o) => o(C), ne = (o) => o(S), R = (o) => o(I), oe = function(o, e) {
  this.unobserveResize(e);
}, ie = function(o, e) {
  this.unobserveIntersection(e);
}, se = (o) => o.d();
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
  S.width = window.innerWidth, S.height = window.innerHeight, ce();
}
let w = null;
const _ = /* @__PURE__ */ new Map(), A = /* @__PURE__ */ new Map(), j = /* @__PURE__ */ new Set(["constructor", "require", "mount", "unmount", "getRef", "setState", "stateChange", "loadScript", "loadStyle"]), B = /* @__PURE__ */ new WeakMap(), D = /* @__PURE__ */ new Map();
function ae(o) {
  const e = o.root || null, t = o.rootMargin || "0px 0px 0px 0px", n = o.threshold || 0, i = Array.isArray(n) ? n.join(",") : n.toString();
  return `${e ? e.id || "root-element" : "null"}|${t}|${i}`;
}
let fe = class {
  constructor(e, t) {
    this.element = e, this.element.__gia_component__ = this, this.s = this.constructor.name, this.o = {}, this.n = t || {}, this.f = {}, this.d = this.d.bind(this), this.w(), f.get("autoBindActions") && this.b();
  }
  get ref() {
    return this.o;
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
          c === this.s && !this.o[a] && (this.o[a] = i[r]);
        } else
          this.o[r] || (this.o[r] = i[r]);
      }
    else {
      this.o = {};
      for (const r in e) {
        if (!Object.prototype.hasOwnProperty.call(e, r)) continue;
        const l = Array.isArray(e[r]);
        if (e[r] !== null && l && e[r].length > 0) {
          this.o[r] = e[r];
          continue;
        }
        const c = `${this.s}:${r}`;
        let a = i[c] || [];
        a.length === 0 && (a = i[r] || []), this.o[r] = l ? a : a[0] ?? null;
      }
    }
  }
  get options() {
    return this.n;
  }
  set options(e) {
    if (typeof __GIA_NANO__ < "u" && __GIA_NANO__) {
      this.n = { ...this.n, ...e };
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
          console.error(`Failed to parse options for component "${this.s}": ${s.message}`);
        }
    }
    this.n = {
      ...this.n,
      ...e,
      ...n
    };
  }
  get state() {
    return this.f;
  }
  set state(e) {
    console.warn("Use setState instead."), this.f = e;
  }
  h() {
    this.mount();
  }
  _() {
    this.unmount(), !(typeof __GIA_NANO__ < "u" && __GIA_NANO__) && (this.r && this.r.forEach(this.unobserveScroll, this), this.l && this.l.forEach(this.unobserveWindowResize, this), this.i && this.i.forEach(oe, this), this.e && this.e.forEach(ie, this));
  }
  observeScroll(e) {
    typeof __GIA_NANO__ < "u" && __GIA_NANO__ || typeof window > "u" || (b || (b = !0, window.lenis ? (h = window.lenis, h.on("scroll", y)) : window.addEventListener("scroll", y, { passive: !0 })), this.r || (this.r = /* @__PURE__ */ new Set()), this.r.add(e), N.add(e));
  }
  unobserveScroll(e) {
    typeof __GIA_NANO__ < "u" && __GIA_NANO__ || (this.r && this.r.delete(e), N.delete(e), N.size === 0 && b && (b = !1, h ? (h.off("scroll", y), h = null) : window.removeEventListener("scroll", y)));
  }
  observeWindowResize(e) {
    typeof __GIA_NANO__ < "u" && __GIA_NANO__ || typeof window > "u" || (m || (m = !0, window.addEventListener(x, T, { passive: !0 })), this.l || (this.l = /* @__PURE__ */ new Set()), this.l.add(e), v.add(e));
  }
  unobserveWindowResize(e) {
    typeof __GIA_NANO__ < "u" && __GIA_NANO__ || (this.l && this.l.delete(e), v.delete(e), v.size === 0 && m && (m = !1, window.removeEventListener(x, T)));
  }
  observeResize(e, t) {
    if (typeof __GIA_NANO__ < "u" && __GIA_NANO__ || typeof window > "u" || !window.ResizeObserver) return;
    w || (w = new ResizeObserver((s) => {
      for (let r = 0; r < s.length; r++) {
        const l = s[r], c = _.get(l.target);
        c && (I[0] = l, c.forEach(R));
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
        P && (I[0] = z, P.forEach(R));
      }
    }, n), callbacks: /* @__PURE__ */ new Map() }, A.set(i, s));
    let r = s.callbacks.get(e);
    r || (r = /* @__PURE__ */ new Set(), s.callbacks.set(e, r), s.observer.observe(e)), r.add(t), this.e || (this.e = /* @__PURE__ */ new Map());
    let l = this.e.get(e);
    l || (l = /* @__PURE__ */ new Map(), this.e.set(e, l));
    let c = l.get(i);
    c || (c = /* @__PURE__ */ new Set(), l.set(i, c)), c.add(t);
  }
  m(e, t) {
    const n = A.get(t), i = this.g, s = this.p;
    if (s)
      e.has(s) && (e.delete(s), n && n.callbacks.has(i) && n.callbacks.get(i).delete(s));
    else {
      if (n && n.callbacks.has(i)) {
        const r = n.callbacks.get(i);
        e.forEach(Set.prototype.delete, r);
      }
      e.clear();
    }
    if (e.size === 0 && this.e.get(i).delete(t), n) {
      const r = n.callbacks.get(i);
      r && r.size === 0 && (n.callbacks.delete(i), n.observer.unobserve(i)), n.callbacks.size === 0 && (n.observer.disconnect(), A.delete(t));
    }
  }
  unobserveIntersection(e, t = null) {
    if (typeof __GIA_NANO__ < "u" && __GIA_NANO__ || !this.e) return;
    const n = this.e.get(e);
    n && (this.g = e, this.p = t, n.forEach(this.m, this), this.g = null, this.p = null, n.size === 0 && this.e.delete(e));
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
    return n ? n instanceof HTMLScriptElement ? n.t ? n.t : (n.t = new Promise((i, s) => {
      const r = () => {
        n.onload = null, n.onerror = null;
      };
      n.onload = () => {
        r(), i(t ? window[t] : !0);
      }, n.onerror = () => {
        r(), delete n.t, s(new Error(`Failed to load script: ${e}`));
      }, !n.src && n.hasAttribute("data-src") ? (n.src = n.getAttribute("data-src"), n.removeAttribute("data-src")) : !n.src && !n.hasAttribute("data-src") && (r(), s(new Error(`Script tag '${e}' has no src or data-src.`)));
    }), n.t) : Promise.reject(new Error(`Element with ID '${e}' is not a valid script tag.`)) : Promise.reject(new Error(`Script tag with ID '${e}' not found.`));
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
    return t ? t instanceof HTMLLinkElement ? t.t ? t.t : (t.t = new Promise((n, i) => {
      const s = () => {
        t.onload = null, t.onerror = null;
      };
      if (t.onload = () => {
        s(), n(!0);
      }, t.onerror = () => {
        s(), delete t.t, i(new Error(`Failed to load style: ${e}`));
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
    }), t.t) : Promise.reject(new Error(`Element with ID '${e}' is not a valid link tag.`)) : Promise.reject(new Error(`Link tag with ID '${e}' not found.`));
  }
  mount() {
  }
  unmount() {
  }
  getRef(e, t = !1) {
    return `[${f.get("attrPrefix")}-ref="${t ? `${this.s}:` : ""}${e}"]`;
  }
  setState(e) {
    if (e)
      for (const t in e) {
        if (!Object.prototype.hasOwnProperty.call(e, t)) continue;
        const n = e[t];
        if (this.f[t] !== n && (this.f[t] = n, this.u || (this.u = {}, this.c = {}, G.add(this), $ || ($ = !0, requestAnimationFrame(re))), this.u[t] = n, typeof __GIA_NANO__ > "u" || !__GIA_NANO__)) {
          const i = typeof n;
          if (i === "boolean" || i === "string") {
            let s = D.get(t);
            s || (s = `data-${t.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase()}`, D.set(t, s)), this.c[s] = i === "boolean" ? n ? "true" : "false" : n;
          }
        }
      }
  }
  d() {
    if (typeof __GIA_NANO__ > "u" || !__GIA_NANO__) {
      let e = !1;
      for (const t in this.c) {
        e = !0;
        break;
      }
      if (e)
        for (const t in this.c) {
          if (!Object.prototype.hasOwnProperty.call(this.c, t)) continue;
          const n = this.c[t];
          this.element.getAttribute(t) !== n && this.element.setAttribute(t, n);
        }
    }
    this.stateChange(this.u), this.u = null, this.c = null;
  }
  stateChange(e) {
    return e;
  }
  w() {
    var n;
    const e = Object.getPrototypeOf(this);
    let t = B.get(e);
    if (!t) {
      t = [];
      const i = Object.getOwnPropertyNames(e);
      for (let s = 0; s < i.length; s++) {
        const r = i[s];
        !j.has(r) && !r.startsWith("_") && typeof ((n = Object.getOwnPropertyDescriptor(e, r)) == null ? void 0 : n.value) == "function" && t.push(r);
      }
      B.set(e, t);
    }
    for (let i = 0; i < t.length; i++) {
      const s = t[i];
      this[s] = this[s].bind(this);
    }
  }
  b() {
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
          a !== -1 ? (d = c.substring(0, a), u = c.substring(a + 2)) : (d = c, u = void 0), this[u] && typeof this[u] == "function" && !u.startsWith("_") && !j.has(u) ? i.addEventListener(d, this[u]) : console.warn(`Method "${u}" not found, is restricted, or is not a function in component.`);
        }
        r = l + 1;
      }
    }
  }
};
class me extends fe {
  async require() {
  }
  h() {
    this.require().then(this.mount.bind(this));
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
    const i = { ...t, s: e }, s = n.slice();
    for (let r = 0; r < s.length; r++)
      s[r](i);
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
    t.a && t.a[e] ? (i = t.a[e], delete t.a[e]) : t.y && (i = t.y);
    const s = n.indexOf(i);
    s !== -1 && n.splice(s, 1);
  }
}
const ye = new ue();
let g = null, M = null;
const O = /* @__PURE__ */ new Set(), de = (o) => {
  o.isConnected && X(M, o);
};
function he(o) {
  const e = `${f.get("attrPrefix")}-component`, t = typeof window < "u" && window.gia ? window.gia.components : {};
  O.clear();
  for (let n = 0; n < o.length; n++) {
    const i = o[n];
    for (let s = 0; s < i.removedNodes.length; s++) {
      const r = i.removedNodes[s];
      if (r.nodeType === Node.ELEMENT_NODE) {
        r.hasAttribute(e) && E(r);
        const l = p(`[${e}]`, r);
        for (let c = 0; c < l.length; c++)
          E(l[c]);
      }
    }
    for (let s = 0; s < i.addedNodes.length; s++) {
      const r = i.addedNodes[s];
      r.nodeType === Node.ELEMENT_NODE && (r.hasAttribute(e) || r.querySelector(`[${e}]`)) && O.add(r);
    }
  }
  M = t, O.forEach(de), M = null;
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
  E as destroyInstance,
  ye as eventbus,
  ge as getComponentFromElement,
  X as loadComponents,
  we as removeComponents,
  pe as utils
};
