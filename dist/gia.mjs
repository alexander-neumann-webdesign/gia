var _ = Object.defineProperty;
var p = (i, t, s) => t in i ? _(i, t, { enumerable: !0, configurable: !0, writable: !0, value: s }) : i[t] = s;
var h = (i, t, s) => p(i, typeof t != "symbol" ? t + "" : t, s);
function u(i, t = document) {
  return typeof i != "string" ? i : Array.prototype.slice.call(t.querySelectorAll(i));
}
function c(i) {
  return typeof i == "string" && (i = document.getElementById(i), !i) ? null : i.__gia_component__;
}
class m {
  constructor() {
    h(this, "_options", {
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
const r = new m();
function g(i, t, s, e) {
  s.prototype._name = t;
  const n = new s(i, e);
  return r.get("log") && console.info(`Created instance of component "${t}".`), n;
}
function C(i = {}, t = document.documentElement) {
  if (!i || Object.keys(i).length === 0) {
    console.warn("App has no components");
    return;
  }
  let s = [];
  u("[" + r.get("attrPrefix") + "-component]", t).forEach((e) => {
    const n = c(e);
    if (n)
      return console.warn(`Error: instance exists: 
`, n), !0;
    let o = e.getAttribute(r.get("attrPrefix") + "-component");
    typeof i[o] == "function" ? s.push(g(e, o, i[o])) : console.warn(`Constructor for component "${o}" not found.`);
  }), s.forEach((e) => {
    e._load();
  });
}
function d(i) {
  const t = c(i);
  if (t) {
    const s = t._name;
    t.unmount(), i.__gia_component__ = null, r.get("log") && console.info(`Removed component "${s}".`);
  }
}
function $(i = document.documentElement) {
  u("[" + r.get("attrPrefix") + "-component]", i).forEach((t) => {
    d(t);
  });
}
let A = class {
  constructor(t, s) {
    this.element = t, this.element.__gia_component__ = this, this._ref = {}, this._options = s || {}, this._state = {};
  }
  get ref() {
    return this._ref;
  }
  set ref(t) {
    const s = u("[" + r.get("attrPrefix") + "-ref]", this.element);
    return Object.keys(t).length === 0 ? s.forEach((e) => {
      let n = e.getAttribute(r.get("attrPrefix") + "-ref");
      if (n.indexOf(":") !== -1) {
        let o = n.split(":");
        if (o[0] == this._name)
          this._ref[o[1]] || (this._ref[o[1]] = s.filter((f) => f.getAttribute(r.get("attrPrefix") + "-ref") === n));
        else
          return;
      } else
        this._ref[n] || (this._ref[n] = s.filter((o) => o.getAttribute(r.get("attrPrefix") + "-ref") === n));
    }) : this._ref = Object.keys(t).map((e) => {
      const n = Array.isArray(t[e]);
      if (t[e] !== null && n && t[e].length > 0)
        return {
          name: e,
          value: t[e]
        };
      const o = e, f = `${this._name}:${o}`;
      let l = s.filter((a) => a.getAttribute(r.get("attrPrefix") + "-ref") === f);
      return l.length === 0 && (l = s.filter((a) => a.getAttribute(r.get("attrPrefix") + "-ref") === o)), n || (l = l.length ? l[0] : null), {
        name: e,
        value: l
      };
    }).reduce((e, n) => (e[n.name] = n.value, e), {}), this._ref;
  }
  get options() {
    return this._options;
  }
  set options(t) {
    let s = {}, e = this.element.getAttribute(r.get("attrPrefix") + "-options");
    return e && (s = JSON.parse(e)), this._options = {
      ...this._options,
      ...t,
      ...s
    }, this._options;
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
    return `[${r.get("attrPrefix")}-ref="${s ? `${this._name}:` : ""}${t}"]`;
  }
  setState(t) {
    let s = {};
    Object.keys(t).forEach((e) => {
      Array.isArray(t[e]) ? this._state[e] != null && Array.isArray(this._state[e]) ? this._state[e].length === t[e].length ? t[e].some((n, o) => this._state[e][o] !== n ? (s[e] = t[e], this._state[e] = s[e], !0) : !1) : (s[e] = t[e], this._state[e] = s[e]) : (s[e] = t[e], this._state[e] = s[e]) : typeof t[e] == "object" ? (this._state[e] != null && typeof this._state[e] == "object" ? (s[e] = {}, Object.keys(t[e]).forEach((n) => {
        this._state[e][n] !== t[e][n] && (s[e][n] = t[e][n]);
      })) : s[e] = t[e], this._state[e] = {
        ...this._state[e],
        ...s[e]
      }) : this._state[e] !== t[e] && (s[e] = t[e], this._state[e] = t[e]);
    }), Object.keys(s).forEach((e) => {
      Array.isArray(t[e]) ? s[e].length === 0 && delete s[e] : typeof t[e] == "object" && Object.keys(s[e]).length === 0 && delete s[e];
    }), this.stateChange(s);
  }
  stateChange(t) {
  }
};
class P extends A {
  async require() {
  }
  _load() {
    this.require().then(this.mount.bind(this));
  }
}
class x {
  constructor() {
    h(this, "list", {});
  }
  emit(t, s = {}) {
    s._name = t, this.list[t] ? (r.get("log") && console.info(`${this.list[t].length} handler${this.list[t].length > 1 ? "s" : ""} called on event '${t}'`), this.list[t].forEach((e) => {
      e.handler(s), e.once && this.off(t, e.handler);
    })) : r.get("log") && console.info(`0 handlers called on event '${t}'`);
  }
  on(t, s, e = !1) {
    this.list[t] ? this.list[t].push({ once: e, handler: s }) : (this.list[t] = [], this.list[t].push({ once: e, handler: s }));
  }
  once(t, s) {
    this.on(t, s, !0);
  }
  off(t, s) {
    if (t != null)
      if (s != null)
        if (this.list[t] && this.list[t].filter((e) => e.handler === s).length) {
          let e = this.list[t].filter((o) => o.handler === s)[0], n = this.list[t].indexOf(e);
          n > -1 && this.list[t].splice(n, 1);
        } else
          console.warn(`Event ${t} cannot be unsubscribed - does not exist.`);
      else
        this.list[t] = [];
    else
      this.list = {};
  }
}
const w = new x();
export {
  A as BaseComponent,
  P as Component,
  r as config,
  g as createInstance,
  $ as destroyInstance,
  w as eventbus,
  c as getComponentFromElement,
  C as loadComponents,
  $ as removeComponents
};
