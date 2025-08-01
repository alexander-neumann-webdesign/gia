var m = Object.defineProperty;
var p = (n, t, s) => t in n ? m(n, t, { enumerable: !0, configurable: !0, writable: !0, value: s }) : n[t] = s;
var u = (n, t, s) => p(n, typeof t != "symbol" ? t + "" : t, s);
class d {
  constructor() {
    u(this, "_options", {
      log: !1,
      attrPrefix: "data"
      // data-component="HelloWorld"
    });
  }
  set(t, s) {
    this._options[t] = s;
  }
  get(t) {
    return this._options[t];
  }
}
const l = new d();
function g(n, t, s, e) {
  s.prototype._name = t;
  const o = new s(n, e);
  return l.get("log") && console.info(`Created instance of component "${t}".`), o;
}
function _(n) {
  return typeof n == "string" && (n = document.getElementById(n), !n) ? null : n.__gia_component__;
}
function c(n, t = document) {
  return typeof n != "string" ? n : Array.prototype.slice.call(t.querySelectorAll(n));
}
function E(n = {}, t = document.documentElement) {
  if (!n || Object.keys(n).length === 0) {
    console.warn("App has no components");
    return;
  }
  const s = [], e = `[${l.get("attrPrefix")}-component]`;
  c(e, t).forEach((o) => {
    const i = _(o);
    if (i)
      return console.warn("Error: instance exists: ", i), !0;
    const r = o.getAttribute(e);
    typeof n[r] == "function" ? s.push(
      g(o, r, n[r])
    ) : console.warn(`Constructor for component "${r}" not found.`);
  }), s.forEach((o) => {
    o._load();
  });
}
function A(n) {
  const t = _(n);
  if (t) {
    const s = t._name;
    t.unmount(), n.__gia_component__ = null, l.get("log") && console.info(`Removed component "${s}".`);
  }
}
function x(n = document.documentElement) {
  c(`[${l.get("attrPrefix")}-component]`, n).forEach(
    (t) => {
      A(t);
    }
  );
}
let $ = class {
  constructor(t, s) {
    this.element = t, this.element.__gia_component__ = this, this._ref = {}, this._options = s || {}, this._state = {};
  }
  get ref() {
    return this._ref;
  }
  set ref(t) {
    const s = `[${l.get("attrPrefix")}-ref]`, e = c(s, this.element);
    Object.keys(t).length === 0 ? e.forEach((o) => {
      const i = o.getAttribute(s);
      if (i.indexOf(":") !== -1) {
        const r = i.split(":");
        if (r[0] === this._name)
          this._ref[r[1]] || (this._ref[r[1]] = e.filter((f) => f.getAttribute(s) === i));
        else
          return;
      } else
        this._ref[i] || (this._ref[i] = e.filter((r) => r.getAttribute(s) === i));
    }) : this._ref = Object.keys(t).map((o) => {
      const i = Array.isArray(t[o]);
      if (t[o] !== null && i && t[o].length > 0)
        return {
          name: o,
          value: t[o]
        };
      const r = o, f = `${this._name}:${r}`;
      let a = e.filter(
        (h) => h.getAttribute(s) === f
      );
      return a.length === 0 && (a = e.filter(
        (h) => h.getAttribute(s) === r
      )), i || (a = a.length ? a[0] : null), {
        name: o,
        value: a
      };
    }).reduce((o, i) => (o[i.name] = i.value, o), {});
  }
  get options() {
    return this._options;
  }
  set options(t) {
    const s = this.element.getAttribute(
      `[${l.get("attrPrefix")}-options]`
    ), e = s ? JSON.parse(s) : {};
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
    console.warn("You should not change state manually. Use setState instead."), this._state = t;
  }
  _load() {
    this.mount();
  }
  mount() {
    console.warn(`Component ${this._name} does not have "mount" method.`);
  }
  unmount() {
  }
  getRef(t, s = !1) {
    return `[${l.get("attrPrefix")}-ref="${s ? `${this._name}:` : ""}${t}"]`;
  }
  setState(t) {
    const s = {};
    Object.keys(t).forEach((e) => {
      Array.isArray(t[e]) ? this._state[e] != null && Array.isArray(this._state[e]) ? this._state[e].length === t[e].length ? t[e].some((o, i) => this._state[e][i] !== o ? (s[e] = t[e], this._state[e] = s[e], !0) : !1) : (s[e] = t[e], this._state[e] = s[e]) : (s[e] = t[e], this._state[e] = s[e]) : typeof t[e] == "object" ? (this._state[e] != null && typeof this._state[e] == "object" ? (s[e] = {}, Object.keys(t[e]).forEach((o) => {
        this._state[e][o] !== t[e][o] && (s[e][o] = t[e][o]);
      })) : s[e] = t[e], this._state[e] = {
        ...this._state[e],
        ...s[e]
      }) : this._state[e] !== t[e] && (s[e] = t[e], this._state[e] = t[e]);
    }), Object.keys(s).forEach((e) => {
      Array.isArray(t[e]) ? s[e].length === 0 && delete s[e] : typeof t[e] == "object" && Object.keys(s[e]).length === 0 && delete s[e];
    }), this.stateChange(s);
  }
  stateChange(t) {
    return console.warn(`Component ${this._name} does not have "stateChange" method.`), t;
  }
};
class j extends $ {
  async require() {
  }
  _load() {
    this.require().then(this.mount.bind(this));
  }
}
class b {
  constructor() {
    u(this, "list", {});
  }
  emit(t, s = {}) {
    s._name = t, this.list[t] ? (l.get("log") && console.info(
      `${this.list[t].length} handler${this.list[t].length > 1 ? "s" : ""} called on event '${t}'`
    ), this.list[t].forEach((e) => {
      e.handler(s), e.once && this.off(t, e.handler);
    })) : l.get("log") && console.info(`0 handlers called on event '${t}'`);
  }
  on(t, s, e = !1) {
    this.list[t] ? this.list[t].push({ once: e, handler: s }) : (this.list[t] = [], this.list[t].push({ once: e, handler: s }));
  }
  once(t, s) {
    this.on(t, s, !0);
  }
  off(t, s) {
    var e;
    if (t != null)
      if (s != null)
        if ((e = this.list[t]) != null && e.filter(
          (o) => o.handler === s
        ).length) {
          const o = this.list[t].filter(
            (r) => r.handler === s
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
const O = new b();
export {
  $ as BaseComponent,
  j as Component,
  l as config,
  g as createInstance,
  x as destroyInstance,
  O as eventbus,
  _ as getComponentFromElement,
  E as loadComponents,
  x as removeComponents
};
