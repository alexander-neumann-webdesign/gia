var _ = Object.defineProperty;
var w = (o, t, e) => t in o ? _(o, t, { enumerable: !0, configurable: !0, writable: !0, value: e }) : o[t] = e;
var m = (o, t, e) => w(o, typeof t != "symbol" ? t + "" : t, e);
typeof window < "u" && (window.gia = window.gia || {}, window.gia.components = window.gia.components || {}, window.gia.register = (o) => {
  if (typeof o != "function") {
    console.error("Gia: Register failed. Expected a Class, got:", o);
    return;
  }
  const t = o.name;
  if (!t) {
    console.warn("Gia: Cannot register an anonymous class. Please use a named class.");
    return;
  }
  window.gia.components[t] = o;
});
class E {
  constructor() {
    m(this, "_options", {
      log: !1,
      attrPrefix: "data",
      // data-component="HelloWorld"
      autoMountComponents: !1,
      // Use MutationObserver to automatically mount/unmount components
      autoBindActions: !1
      // Automatically bind actions using data-action attributes
    });
  }
  set(t, e) {
    this._options[t] = e;
  }
  get(t) {
    return this._options[t];
  }
}
const a = new E();
function $(o, t, e, n) {
  if (o.__gia_component__)
    return console.warn(`Component "${t}" already exists.`), o.__gia_component__;
  try {
    const s = new e(o, n);
    return a.get("log") && console.info(`Created instance of component "${t}".`), s;
  } catch (s) {
    return console.error(`Failed to create component "${t}".`, s), null;
  }
}
function p(o) {
  return typeof o == "string" && (o = document.getElementById(o), !o) ? null : o.__gia_component__;
}
function u(o, t = document) {
  return typeof o != "string" ? o : t.querySelectorAll(o);
}
function C(o = {}, t = document.documentElement) {
  if (!o || Object.keys(o).length === 0) {
    console.warn("App has no components");
    return;
  }
  const e = [], n = `${a.get("attrPrefix")}-component`;
  u(`[${n}]`, t).forEach((s) => {
    const r = p(s);
    if (r) {
      console.warn("Error: instance exists: ", r);
      return;
    }
    const i = s.getAttribute(n);
    typeof o[i] == "function" ? e.push($(s, i, o[i])) : console.warn(`Constructor "${i}" not found.`);
  }), e.forEach((s) => {
    s._load();
  });
}
function h(o) {
  const t = p(o);
  if (t) {
    const e = t._name || "Unknown";
    try {
      t.unmount();
    } catch (n) {
      console.error(`Gia: Error unmounting component "${e}".`, n);
    }
    o.__gia_component__ = null, t.element && (t.element = null), a.get("log") && console.info(`Removed component "${e}".`);
  }
}
function S(o = document.documentElement) {
  u(`[${a.get("attrPrefix")}-component]`, o).forEach(
    (t) => {
      h(t);
    }
  );
}
let v = class {
  constructor(t, e) {
    this.element = t, this.element.__gia_component__ = this, this._name = this.constructor.name, this._ref = {}, this._options = e || {}, this._state = {}, this._autoBindFunctions(), a.get("autoBindActions") && this._autoBindActions();
  }
  get ref() {
    return this._ref;
  }
  set ref(t) {
    const e = `${a.get("attrPrefix")}-ref`, n = u(`[${e}]`, this.element), s = {};
    for (let r = 0; r < n.length; r++) {
      const i = n[r], c = i.getAttribute(e);
      s[c] || (s[c] = []), s[c].push(i);
    }
    Object.keys(t).length === 0 ? n.forEach((r) => {
      const i = r.getAttribute(e);
      if (i.includes(":")) {
        const [c, d] = i.split(":");
        c === this._name && !this._ref[d] && (this._ref[d] = s[i]);
      } else
        this._ref[i] || (this._ref[i] = s[i]);
    }) : this._ref = Object.keys(t).reduce((r, i) => {
      const c = Array.isArray(t[i]);
      if (t[i] !== null && c && t[i].length > 0)
        return r[i] = t[i], r;
      const d = `${this._name}:${i}`;
      let l = s[d] || [];
      return l.length === 0 && (l = s[i] || []), r[i] = c ? l : l[0] ?? null, r;
    }, {});
  }
  get options() {
    return this._options;
  }
  set options(t) {
    const e = this.element.getAttribute(`${a.get("attrPrefix")}-options`);
    let n = {};
    if (e)
      try {
        n = JSON.parse(e);
      } catch (s) {
        console.error(`Failed to parse options for component "${this._name}": ${s.message}`);
      }
    this._options = {
      ...this._options,
      ...t,
      ...n
    };
  }
  get state() {
    return this._state;
  }
  set state(t) {
    console.warn("Use setState instead."), this._state = t;
  }
  _load() {
    this.mount();
  }
  /**
   * Loads a script that is already defined in the DOM with a data-src attribute.
   * Prevents double-loading and handles race conditions.
   * * @param {string} scriptId - The ID of the script tag (without "-js" suffix)
   * @param {string} [globalName] - Optional: The global variable this script exposes (e.g. "multipleSelect")
   * @return {Promise}
   */
  loadScript(t, e) {
    if (e && window[e])
      return Promise.resolve(window[e]);
    const n = document.getElementById(`${t}-js`);
    return n ? (n._loadPromise || (n._loadPromise = new Promise((s, r) => {
      const i = () => {
        n.onload = null, n.onerror = null;
      };
      n.onload = () => {
        i(), s(e ? window[e] : !0);
      }, n.onerror = () => {
        i(), delete n._loadPromise, r(new Error(`Failed to load script: ${t}`));
      }, !n.src && n.dataset.src ? (n.src = n.dataset.src, delete n.dataset.src) : !n.src && !n.dataset.src && (i(), r(new Error(`Script tag '${t}-js' has no src or data-src.`)));
    })), n._loadPromise) : Promise.reject(new Error(`Script tag with ID '${t}-js' not found.`));
  }
  mount() {
  }
  unmount() {
  }
  getRef(t, e = !1) {
    return `[${a.get("attrPrefix")}-ref="${e ? `${this._name}:` : ""}${t}"]`;
  }
  setState(t) {
    const e = {};
    let n = !1;
    Object.keys(t).forEach((s) => {
      this._state[s] !== t[s] && (e[s] = t[s], this._state[s] = t[s], n = !0);
    }), n && (this._pendingStateChanges || (this._pendingStateChanges = {}, requestAnimationFrame(() => {
      this.stateChange(this._pendingStateChanges), this._pendingStateChanges = null;
    })), Object.assign(this._pendingStateChanges, e));
  }
  stateChange(t) {
    return t;
  }
  _autoBindFunctions() {
    const t = Object.getOwnPropertyNames(Object.getPrototypeOf(this)), e = /* @__PURE__ */ new Set(["constructor", "require", "mount", "unmount", "getRef", "setState", "stateChange", "loadScript"]);
    t.forEach((n) => {
      e.has(n) || n.startsWith("_") || typeof this[n] == "function" && (this[n] = this[n].bind(this));
    });
  }
  _autoBindActions() {
    u("[data-action]", this.element).forEach((e) => {
      e.dataset.action.split(" ").forEach((s) => {
        const [r, i] = s.split("->");
        this[i] ? e.addEventListener(r, (c) => this[i](c)) : console.warn(`Method "${i}" not found in component.`);
      });
    });
  }
};
class O extends v {
  async require() {
  }
  _load() {
    this.require().then(this.mount.bind(this));
  }
}
class y extends EventTarget {
  emit(t, e = {}) {
    a.get("log") && console.info(`Emitting event '${t}'`);
    const n = new CustomEvent(t, { detail: e });
    n._name = t, this.dispatchEvent(n);
  }
  on(t, e, n = !1) {
    const s = (r) => e({ ...r.detail, _name: r._name });
    e._wrapped = s, this.addEventListener(t, s, { once: n });
  }
  once(t, e) {
    this.on(t, e, !0);
  }
  off(t, e) {
    e && e._wrapped ? this.removeEventListener(t, e._wrapped) : e && this.removeEventListener(t, e), e || console.warn("EventBus.off requires a handler to remove a specific listener when using native EventTarget.");
  }
}
const B = new y();
let f = null;
function b(o) {
  const t = `${a.get("attrPrefix")}-component`, e = typeof window < "u" && window.gia ? window.gia.components : {};
  let n = !1;
  o.forEach((s) => {
    s.removedNodes.forEach((r) => {
      r.nodeType === Node.ELEMENT_NODE && (r.hasAttribute(t) && h(r), u(`[${t}]`, r).forEach((c) => h(c)));
    }), s.addedNodes.length > 0 && (n = !0);
  }), n && C(e, document.body);
}
function g() {
  typeof document > "u" || (a.get("autoMountComponents") && !f ? (f = new MutationObserver(b), f.observe(document.body, {
    childList: !0,
    subtree: !0
  })) : !a.get("autoMountComponents") && f && (f.disconnect(), f = null));
}
const A = a.set;
a.set = function(o, t) {
  A.call(this, o, t), o === "autoMountComponents" && g();
};
typeof window < "u" && setTimeout(g, 0);
export {
  v as BaseComponent,
  O as Component,
  a as config,
  $ as createInstance,
  S as destroyInstance,
  B as eventbus,
  p as getComponentFromElement,
  C as loadComponents,
  S as removeComponents
};
