var d = Object.defineProperty;
var m = (o, e, n) => e in o ? d(o, e, { enumerable: !0, configurable: !0, writable: !0, value: n }) : o[e] = n;
var u = (o, e, n) => m(o, typeof e != "symbol" ? e + "" : e, n);
class p {
  constructor() {
    u(this, "_options", {
      log: !1,
      attrPrefix: "data"
      // data-component="HelloWorld"
    });
  }
  set(e, n) {
    this._options[e] = n;
  }
  get(e) {
    return this._options[e];
  }
}
const a = new p();
function g(o, e, n, t) {
  if (o.__gia_component__)
    return console.warn(`Component "${e}" already exists.`), o.__gia_component__;
  try {
    const s = new n(o, t);
    return a.get("log") && console.info(`Created instance of component "${e}".`), s;
  } catch (s) {
    return console.error(`Failed to create component "${e}".`, s), null;
  }
}
function _(o) {
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
  const n = [], t = `${a.get("attrPrefix")}-component`;
  h(`[${t}]`, e).forEach((s) => {
    const i = _(s);
    if (i) {
      console.warn("Error: instance exists: ", i);
      return;
    }
    const r = s.getAttribute(t);
    typeof o[r] == "function" ? n.push(g(s, r, o[r])) : console.warn(`Constructor "${r}" not found.`);
  }), n.forEach((s) => {
    s._load();
  });
}
function $(o) {
  const e = _(o);
  if (e) {
    const n = e._name || "Unknown";
    try {
      e.unmount();
    } catch (t) {
      console.error(`Gia: Error unmounting component "${n}".`, t);
    }
    o.__gia_component__ = null, e.element && (e.element = null), a.get("log") && console.info(`Removed component "${n}".`);
  }
}
function x(o = document.documentElement) {
  h(`[${a.get("attrPrefix")}-component]`, o).forEach(
    (e) => {
      $(e);
    }
  );
}
let E = class {
  constructor(e, n) {
    this.element = e, this.element.__gia_component__ = this, this._name = this.constructor.name, this._ref = {}, this._options = n || {}, this._state = {}, this._autoBindFunctions(), this._autoBindActions();
  }
  get ref() {
    return this._ref;
  }
  set ref(e) {
    const n = `${a.get("attrPrefix")}-ref`, t = h(`[${n}]`, this.element);
    Object.keys(e).length === 0 ? t.forEach((s) => {
      const i = s.getAttribute(n);
      if (i.indexOf(":") !== -1) {
        const r = i.split(":");
        if (r[0] === this._name)
          this._ref[r[1]] || (this._ref[r[1]] = t.filter((c) => c.getAttribute(n) === i));
        else
          return;
      } else
        this._ref[i] || (this._ref[i] = t.filter((r) => r.getAttribute(n) === i));
    }) : this._ref = Object.keys(e).map((s) => {
      const i = Array.isArray(e[s]);
      if (e[s] !== null && i && e[s].length > 0)
        return {
          name: s,
          value: e[s]
        };
      const r = s, c = `${this._name}:${r}`;
      let l = t.filter((f) => f.getAttribute(n) === c);
      return l.length === 0 && (l = t.filter((f) => f.getAttribute(n) === r)), i || (l = l.length ? l[0] : null), {
        name: s,
        value: l
      };
    }).reduce((s, i) => (s[i.name] = i.value, s), {});
  }
  get options() {
    return this._options;
  }
  set options(e) {
    const n = this.element.getAttribute(`${a.get("attrPrefix")}-options`), t = n ? JSON.parse(n) : {};
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
  loadScript(e, n) {
    if (n && window[n])
      return Promise.resolve(window[n]);
    const t = document.getElementById(`${e}-js`);
    return t ? (t._loadPromise || (t._loadPromise = new Promise((s, i) => {
      const r = () => {
        t.onload = null, t.onerror = null;
      };
      t.onload = () => {
        r(), s(n ? window[n] : !0);
      }, t.onerror = () => {
        r(), delete t._loadPromise, i(new Error(`Failed to load script: ${e}`));
      }, !t.src && t.dataset.src ? (t.src = t.dataset.src, delete t.dataset.src) : !t.src && !t.dataset.src && (r(), i(new Error(`Script tag '${e}-js' has no src or data-src.`)));
    })), t._loadPromise) : Promise.reject(new Error(`Script tag with ID '${e}-js' not found.`));
  }
  mount() {
  }
  unmount() {
  }
  getRef(e, n = !1) {
    return `[${a.get("attrPrefix")}-ref="${n ? `${this._name}:` : ""}${e}"]`;
  }
  setState(e) {
    const n = {};
    Object.keys(e).forEach((t) => {
      Array.isArray(e[t]) ? this._state[t] != null && Array.isArray(this._state[t]) ? this._state[t].length === e[t].length ? e[t].some((s, i) => this._state[t][i] !== s ? (n[t] = e[t], this._state[t] = n[t], !0) : !1) : (n[t] = e[t], this._state[t] = n[t]) : (n[t] = e[t], this._state[t] = n[t]) : typeof e[t] == "object" ? (this._state[t] != null && typeof this._state[t] == "object" ? (n[t] = {}, Object.keys(e[t]).forEach((s) => {
        this._state[t][s] !== e[t][s] && (n[t][s] = e[t][s]);
      })) : n[t] = e[t], this._state[t] = {
        ...this._state[t],
        ...n[t]
      }) : this._state[t] !== e[t] && (n[t] = e[t], this._state[t] = e[t]);
    }), Object.keys(n).forEach((t) => {
      Array.isArray(e[t]) ? n[t].length === 0 && delete n[t] : typeof e[t] == "object" && Object.keys(n[t]).length === 0 && delete n[t];
    }), this.stateChange(n);
  }
  stateChange(e) {
    return e;
  }
  _autoBindFunctions() {
    const e = Object.getOwnPropertyNames(Object.getPrototypeOf(this)), n = /* @__PURE__ */ new Set(["constructor", "require", "mount", "unmount", "getRef", "setState", "stateChange", "loadScript"]);
    e.forEach((t) => {
      n.has(t) || t.startsWith("_") || typeof this[t] == "function" && (this[t] = this[t].bind(this));
    });
  }
  _autoBindActions() {
    this.element.querySelectorAll("[data-action]").forEach((n) => {
      n.dataset.action.split(" ").forEach((s) => {
        const [i, r] = s.split("->");
        this[r] ? n.addEventListener(i, (c) => this[r](c)) : console.warn(`Method "${r}" not found in component.`);
      });
    });
  }
};
class P extends E {
  async require() {
  }
  _load() {
    this.require().then(this.mount.bind(this));
  }
}
class A {
  constructor() {
    u(this, "list", {});
  }
  emit(e, n = {}) {
    n._name = e, this.list[e] ? (a.get("log") && console.info(
      `${this.list[e].length} handler${this.list[e].length > 1 ? "s" : ""} called on event '${e}'`
    ), this.list[e].forEach((t) => {
      t.handler(n), t.once && this.off(e, t.handler);
    })) : a.get("log") && console.info(`0 handlers called on event '${e}'`);
  }
  on(e, n, t = !1) {
    this.list[e] ? this.list[e].push({ once: t, handler: n }) : (this.list[e] = [], this.list[e].push({ once: t, handler: n }));
  }
  once(e, n) {
    this.on(e, n, !0);
  }
  off(e, n) {
    var t;
    if (e != null)
      if (n != null)
        if ((t = this.list[e]) != null && t.filter(
          (s) => s.handler === n
        ).length) {
          const s = this.list[e].filter(
            (r) => r.handler === n
          )[0], i = this.list[e].indexOf(s);
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
const j = new A();
export {
  E as BaseComponent,
  P as Component,
  a as config,
  g as createInstance,
  x as destroyInstance,
  j as eventbus,
  _ as getComponentFromElement,
  b as loadComponents,
  x as removeComponents
};
