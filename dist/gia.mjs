var _ = Object.defineProperty;
var m = (s, t, n) => t in s ? _(s, t, { enumerable: !0, configurable: !0, writable: !0, value: n }) : s[t] = n;
var u = (s, t, n) => m(s, typeof t != "symbol" ? t + "" : t, n);
typeof window < "u" && (window.gia = window.gia || {}, window.gia.components = window.gia.components || {}, window.gia.register = (s) => {
  if (typeof s != "function") {
    console.error("Gia: Register failed. Expected a Class, got:", s);
    return;
  }
  const t = s.name;
  if (!t) {
    console.warn("Gia: Cannot register an anonymous class. Please use a named class.");
    return;
  }
  window.gia.components[t] = s;
});
class p {
  constructor() {
    u(this, "_options", {
      log: !1,
      attrPrefix: "data"
      // data-component="HelloWorld"
    });
  }
  set(t, n) {
    this._options[t] = n;
  }
  get(t) {
    return this._options[t];
  }
}
const a = new p();
function g(s, t, n, e) {
  if (s.__gia_component__)
    return console.warn(`Component "${t}" already exists.`), s.__gia_component__;
  try {
    const o = new n(s, e);
    return a.get("log") && console.info(`Created instance of component "${t}".`), o;
  } catch (o) {
    return console.error(`Failed to create component "${t}".`, o), null;
  }
}
function d(s) {
  return typeof s == "string" && (s = document.getElementById(s), !s) ? null : s.__gia_component__;
}
function h(s, t = document) {
  return typeof s != "string" ? s : Array.prototype.slice.call(t.querySelectorAll(s));
}
function x(s = {}, t = document.documentElement) {
  if (!s || Object.keys(s).length === 0) {
    console.warn("App has no components");
    return;
  }
  const n = [], e = `${a.get("attrPrefix")}-component`;
  h(`[${e}]`, t).forEach((o) => {
    const i = d(o);
    if (i) {
      console.warn("Error: instance exists: ", i);
      return;
    }
    const r = o.getAttribute(e);
    typeof s[r] == "function" ? n.push(g(o, r, s[r])) : console.warn(`Constructor "${r}" not found.`);
  }), n.forEach((o) => {
    o._load();
  });
}
function w(s) {
  const t = d(s);
  if (t) {
    const n = t._name || "Unknown";
    try {
      t.unmount();
    } catch (e) {
      console.error(`Gia: Error unmounting component "${n}".`, e);
    }
    s.__gia_component__ = null, t.element && (t.element = null), a.get("log") && console.info(`Removed component "${n}".`);
  }
}
function P(s = document.documentElement) {
  h(`[${a.get("attrPrefix")}-component]`, s).forEach(
    (t) => {
      w(t);
    }
  );
}
let $ = class {
  constructor(t, n) {
    this.element = t, this.element.__gia_component__ = this, this._name = this.constructor.name, this._ref = {}, this._options = n || {}, this._state = {}, this._autoBindFunctions(), this._autoBindActions();
  }
  get ref() {
    return this._ref;
  }
  set ref(t) {
    const n = `${a.get("attrPrefix")}-ref`, e = h(`[${n}]`, this.element);
    Object.keys(t).length === 0 ? e.forEach((o) => {
      const i = o.getAttribute(n);
      if (i.indexOf(":") !== -1) {
        const r = i.split(":");
        if (r[0] === this._name)
          this._ref[r[1]] || (this._ref[r[1]] = e.filter((c) => c.getAttribute(n) === i));
        else
          return;
      } else
        this._ref[i] || (this._ref[i] = e.filter((r) => r.getAttribute(n) === i));
    }) : this._ref = Object.keys(t).map((o) => {
      const i = Array.isArray(t[o]);
      if (t[o] !== null && i && t[o].length > 0)
        return {
          name: o,
          value: t[o]
        };
      const r = o, c = `${this._name}:${r}`;
      let l = e.filter((f) => f.getAttribute(n) === c);
      return l.length === 0 && (l = e.filter((f) => f.getAttribute(n) === r)), i || (l = l.length ? l[0] : null), {
        name: o,
        value: l
      };
    }).reduce((o, i) => (o[i.name] = i.value, o), {});
  }
  get options() {
    return this._options;
  }
  set options(t) {
    const n = this.element.getAttribute(`${a.get("attrPrefix")}-options`), e = n ? JSON.parse(n) : {};
    this._options = {
      ...this._options,
      ...t,
      ...e
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
  loadScript(t, n) {
    if (n && window[n])
      return Promise.resolve(window[n]);
    const e = document.getElementById(`${t}-js`);
    return e ? (e._loadPromise || (e._loadPromise = new Promise((o, i) => {
      const r = () => {
        e.onload = null, e.onerror = null;
      };
      e.onload = () => {
        r(), o(n ? window[n] : !0);
      }, e.onerror = () => {
        r(), delete e._loadPromise, i(new Error(`Failed to load script: ${t}`));
      }, !e.src && e.dataset.src ? (e.src = e.dataset.src, delete e.dataset.src) : !e.src && !e.dataset.src && (r(), i(new Error(`Script tag '${t}-js' has no src or data-src.`)));
    })), e._loadPromise) : Promise.reject(new Error(`Script tag with ID '${t}-js' not found.`));
  }
  mount() {
  }
  unmount() {
  }
  getRef(t, n = !1) {
    return `[${a.get("attrPrefix")}-ref="${n ? `${this._name}:` : ""}${t}"]`;
  }
  setState(t) {
    const n = {};
    Object.keys(t).forEach((e) => {
      Array.isArray(t[e]) ? this._state[e] != null && Array.isArray(this._state[e]) ? this._state[e].length === t[e].length ? t[e].some((o, i) => this._state[e][i] !== o ? (n[e] = t[e], this._state[e] = n[e], !0) : !1) : (n[e] = t[e], this._state[e] = n[e]) : (n[e] = t[e], this._state[e] = n[e]) : typeof t[e] == "object" ? (this._state[e] != null && typeof this._state[e] == "object" ? (n[e] = {}, Object.keys(t[e]).forEach((o) => {
        this._state[e][o] !== t[e][o] && (n[e][o] = t[e][o]);
      })) : n[e] = t[e], this._state[e] = {
        ...this._state[e],
        ...n[e]
      }) : this._state[e] !== t[e] && (n[e] = t[e], this._state[e] = t[e]);
    }), Object.keys(n).forEach((e) => {
      Array.isArray(t[e]) ? n[e].length === 0 && delete n[e] : typeof t[e] == "object" && Object.keys(n[e]).length === 0 && delete n[e];
    }), this.stateChange(n);
  }
  stateChange(t) {
    return t;
  }
  _autoBindFunctions() {
    const t = Object.getOwnPropertyNames(Object.getPrototypeOf(this)), n = /* @__PURE__ */ new Set(["constructor", "require", "mount", "unmount", "getRef", "setState", "stateChange", "loadScript"]);
    t.forEach((e) => {
      n.has(e) || e.startsWith("_") || typeof this[e] == "function" && (this[e] = this[e].bind(this));
    });
  }
  _autoBindActions() {
    this.element.querySelectorAll("[data-action]").forEach((n) => {
      n.dataset.action.split(" ").forEach((o) => {
        const [i, r] = o.split("->");
        this[r] ? n.addEventListener(i, (c) => this[r](c)) : console.warn(`Method "${r}" not found in component.`);
      });
    });
  }
};
class j extends $ {
  async require() {
  }
  _load() {
    this.require().then(this.mount.bind(this));
  }
}
class E {
  constructor() {
    u(this, "list", {});
  }
  emit(t, n = {}) {
    n._name = t, this.list[t] ? (a.get("log") && console.info(
      `${this.list[t].length} handler${this.list[t].length > 1 ? "s" : ""} called on event '${t}'`
    ), this.list[t].forEach((e) => {
      e.handler(n), e.once && this.off(t, e.handler);
    })) : a.get("log") && console.info(`0 handlers called on event '${t}'`);
  }
  on(t, n, e = !1) {
    this.list[t] ? this.list[t].push({ once: e, handler: n }) : (this.list[t] = [], this.list[t].push({ once: e, handler: n }));
  }
  once(t, n) {
    this.on(t, n, !0);
  }
  off(t, n) {
    var e;
    if (t != null)
      if (n != null)
        if ((e = this.list[t]) != null && e.filter(
          (o) => o.handler === n
        ).length) {
          const o = this.list[t].filter(
            (r) => r.handler === n
          )[0], i = this.list[t].indexOf(o);
          i > -1 && this.list[t].splice(i, 1);
        } else
          console.warn(
            `Event ${t} cannot be unsubscribed - does not exist.`
          );
      else
        this.list[t] = [];
    else
      this.list = {};
  }
}
const C = new E();
export {
  $ as BaseComponent,
  j as Component,
  a as config,
  g as createInstance,
  P as destroyInstance,
  C as eventbus,
  d as getComponentFromElement,
  x as loadComponents,
  P as removeComponents
};
