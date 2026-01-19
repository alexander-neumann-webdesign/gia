var _ = Object.defineProperty;
var p = (o, e, s) => e in o ? _(o, e, { enumerable: !0, configurable: !0, writable: !0, value: s }) : o[e] = s;
var u = (o, e, s) => p(o, typeof e != "symbol" ? e + "" : e, s);
class m {
  constructor() {
    u(this, "_options", {
      log: !1,
      attrPrefix: "data"
      // data-component="HelloWorld"
    });
  }
  set(e, s) {
    this._options[e] = s;
  }
  get(e) {
    return this._options[e];
  }
}
const a = new m();
function g(o, e, s, t) {
  s.prototype._name = e;
  const n = new s(o, t);
  return a.get("log") && console.info(`Created instance of component "${e}".`), n;
}
function d(o) {
  return typeof o == "string" && (o = document.getElementById(o), !o) ? null : o.__gia_component__;
}
function h(o, e = document) {
  return typeof o != "string" ? o : Array.prototype.slice.call(e.querySelectorAll(o));
}
function b(o = {}, e = document.documentElement) {
  if (!o || Object.keys(o).length === 0) {
    console.warn("App has no components");
    return;
  }
  const s = [], t = `${a.get("attrPrefix")}-component`;
  h(`[${t}]`, e).forEach((n) => {
    const i = d(n);
    if (i)
      return console.warn("Error: instance exists: ", i), !0;
    const r = n.getAttribute(t);
    typeof o[r] == "function" ? s.push(
      g(n, r, o[r])
    ) : console.warn(`Constructor "${r}" not found.`);
  }), s.forEach((n) => {
    n._load();
  });
}
function $(o) {
  const e = d(o);
  if (e) {
    const s = e._name;
    e.unmount(), o.__gia_component__ = null, a.get("log") && console.info(`Removed component "${s}".`);
  }
}
function P(o = document.documentElement) {
  h(`[${a.get("attrPrefix")}-component]`, o).forEach(
    (e) => {
      $(e);
    }
  );
}
let A = class {
  constructor(e, s) {
    this.element = e, this.element.__gia_component__ = this, this._ref = {}, this._options = s || {}, this._state = {}, this._autoBindFunctions(), this._autoBindActions();
  }
  get ref() {
    return this._ref;
  }
  set ref(e) {
    const s = `${a.get("attrPrefix")}-ref`, t = h(`[${s}]`, this.element);
    Object.keys(e).length === 0 ? t.forEach((n) => {
      const i = n.getAttribute(s);
      if (i.indexOf(":") !== -1) {
        const r = i.split(":");
        if (r[0] === this._name)
          this._ref[r[1]] || (this._ref[r[1]] = t.filter((f) => f.getAttribute(s) === i));
        else
          return;
      } else
        this._ref[i] || (this._ref[i] = t.filter((r) => r.getAttribute(s) === i));
    }) : this._ref = Object.keys(e).map((n) => {
      const i = Array.isArray(e[n]);
      if (e[n] !== null && i && e[n].length > 0)
        return {
          name: n,
          value: e[n]
        };
      const r = n, f = `${this._name}:${r}`;
      let l = t.filter((c) => c.getAttribute(s) === f);
      return l.length === 0 && (l = t.filter((c) => c.getAttribute(s) === r)), i || (l = l.length ? l[0] : null), {
        name: n,
        value: l
      };
    }).reduce((n, i) => (n[i.name] = i.value, n), {});
  }
  get options() {
    return this._options;
  }
  set options(e) {
    const s = this.element.getAttribute(`${a.get("attrPrefix")}-options`), t = s ? JSON.parse(s) : {};
    this._options = {
      ...this._options,
      ...e,
      ...t
    };
  }
  get state() {
    return this._state;
  }
  set state(e) {
    console.warn("Use setState instead."), this._state = e;
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
  loadScript(e, s) {
    if (s && window[s])
      return Promise.resolve(window[s]);
    const t = document.getElementById(`${e}-js`);
    return t ? (t._loadPromise || (t._loadPromise = new Promise((n, i) => {
      const r = () => {
        t.onload = null, t.onerror = null;
      };
      t.onload = () => {
        r(), n(s ? window[s] : !0);
      }, t.onerror = () => {
        r(), delete t._loadPromise, i(new Error(`Failed to load script: ${e}`));
      }, !t.src && t.dataset.src ? (t.src = t.dataset.src, delete t.dataset.src) : !t.src && !t.dataset.src && (r(), i(new Error(`Script tag '${e}-js' has no src or data-src.`)));
    })), t._loadPromise) : Promise.reject(new Error(`Script tag with ID '${e}-js' not found.`));
  }
  mount() {
  }
  unmount() {
  }
  getRef(e, s = !1) {
    return `[${a.get("attrPrefix")}-ref="${s ? `${this._name}:` : ""}${e}"]`;
  }
  setState(e) {
    const s = {};
    Object.keys(e).forEach((t) => {
      Array.isArray(e[t]) ? this._state[t] != null && Array.isArray(this._state[t]) ? this._state[t].length === e[t].length ? e[t].some((n, i) => this._state[t][i] !== n ? (s[t] = e[t], this._state[t] = s[t], !0) : !1) : (s[t] = e[t], this._state[t] = s[t]) : (s[t] = e[t], this._state[t] = s[t]) : typeof e[t] == "object" ? (this._state[t] != null && typeof this._state[t] == "object" ? (s[t] = {}, Object.keys(e[t]).forEach((n) => {
        this._state[t][n] !== e[t][n] && (s[t][n] = e[t][n]);
      })) : s[t] = e[t], this._state[t] = {
        ...this._state[t],
        ...s[t]
      }) : this._state[t] !== e[t] && (s[t] = e[t], this._state[t] = e[t]);
    }), Object.keys(s).forEach((t) => {
      Array.isArray(e[t]) ? s[t].length === 0 && delete s[t] : typeof e[t] == "object" && Object.keys(s[t]).length === 0 && delete s[t];
    }), this.stateChange(s);
  }
  stateChange(e) {
    return e;
  }
  _autoBindFunctions() {
    const e = Object.getOwnPropertyNames(Object.getPrototypeOf(this)), s = ["constructor", "require", "mount", "unmount", "getRef", "setState", "stateChange", "loadScript"];
    e.forEach((t) => {
      s.includes(t) || t.startsWith("_") || typeof this[t] == "function" && (this[t] = this[t].bind(this));
    });
  }
  _autoBindActions() {
    this.element.querySelectorAll("[data-action]").forEach((s) => {
      s.dataset.action.split(" ").forEach((n) => {
        const [i, r] = n.split("->");
        this[r] ? s.addEventListener(i, (f) => this[r](f)) : console.warn(`Method "${r}" not found in component.`);
      });
    });
  }
};
class C extends A {
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
  emit(e, s = {}) {
    s._name = e, this.list[e] ? (a.get("log") && console.info(
      `${this.list[e].length} handler${this.list[e].length > 1 ? "s" : ""} called on event '${e}'`
    ), this.list[e].forEach((t) => {
      t.handler(s), t.once && this.off(e, t.handler);
    })) : a.get("log") && console.info(`0 handlers called on event '${e}'`);
  }
  on(e, s, t = !1) {
    this.list[e] ? this.list[e].push({ once: t, handler: s }) : (this.list[e] = [], this.list[e].push({ once: t, handler: s }));
  }
  once(e, s) {
    this.on(e, s, !0);
  }
  off(e, s) {
    var t;
    if (e != null)
      if (s != null)
        if ((t = this.list[e]) != null && t.filter(
          (n) => n.handler === s
        ).length) {
          const n = this.list[e].filter(
            (r) => r.handler === s
          )[0], i = this.list[e].indexOf(n);
          i > -1 && this.list[e].splice(i, 1);
        } else
          console.warn(
            `Event ${e} cannot be unsubscribed - does not exist.`
          );
      else
        this.list[e] = [];
    else
      this.list = {};
  }
}
const j = new E();
export {
  A as BaseComponent,
  C as Component,
  a as config,
  g as createInstance,
  P as destroyInstance,
  j as eventbus,
  d as getComponentFromElement,
  b as loadComponents,
  P as removeComponents
};
