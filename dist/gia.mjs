var p = Object.defineProperty;
var m = (i, t, e) => t in i ? p(i, t, { enumerable: !0, configurable: !0, writable: !0, value: e }) : i[t] = e;
var h = (i, t, e) => m(i, typeof t != "symbol" ? t + "" : t, e);
class d {
  constructor() {
    h(this, "_options", {
      log: !1,
      attrPrefix: "data"
      // data-component="HelloWorld"
    });
  }
  set(t, e) {
    this._options[t] = e;
  }
  get(t) {
    return this._options[t];
  }
}
const l = new d();
function g(i, t, e, s) {
  e.prototype._name = t;
  const n = new e(i, s);
  return l.get("log") && console.info(`Created instance of component "${t}".`), n;
}
function _(i) {
  return typeof i == "string" && (i = document.getElementById(i), !i) ? null : i.__gia_component__;
}
function c(i, t = document) {
  return typeof i != "string" ? i : Array.prototype.slice.call(t.querySelectorAll(i));
}
function x(i = {}, t = document.documentElement) {
  if (!i || Object.keys(i).length === 0) {
    console.warn("App has no components");
    return;
  }
  const e = [], s = `${l.get("attrPrefix")}-component`;
  c(`[${s}]`, t).forEach((n) => {
    const o = _(n);
    if (o)
      return console.warn("Error: instance exists: ", o), !0;
    const r = n.getAttribute(s);
    typeof i[r] == "function" ? e.push(
      g(n, r, i[r])
    ) : console.warn(`Constructor "${r}" not found.`);
  }), e.forEach((n) => {
    n._load();
  });
}
function A(i) {
  const t = _(i);
  if (t) {
    const e = t._name;
    t.unmount(), i.__gia_component__ = null, l.get("log") && console.info(`Removed component "${e}".`);
  }
}
function C(i = document.documentElement) {
  c(`[${l.get("attrPrefix")}-component]`, i).forEach(
    (t) => {
      A(t);
    }
  );
}
let $ = class {
  constructor(t, e) {
    this.element = t, this.element.__gia_component__ = this, this._ref = {}, this._options = e || {}, this._state = {};
  }
  get ref() {
    return this._ref;
  }
  set ref(t) {
    const e = `${l.get("attrPrefix")}-ref`, s = c(`[${e}]`, this.element);
    Object.keys(t).length === 0 ? s.forEach((n) => {
      const o = n.getAttribute(e);
      if (o.indexOf(":") !== -1) {
        const r = o.split(":");
        if (r[0] === this._name)
          this._ref[r[1]] || (this._ref[r[1]] = s.filter((f) => f.getAttribute(e) === o));
        else
          return;
      } else
        this._ref[o] || (this._ref[o] = s.filter((r) => r.getAttribute(e) === o));
    }) : this._ref = Object.keys(t).map((n) => {
      const o = Array.isArray(t[n]);
      if (t[n] !== null && o && t[n].length > 0)
        return {
          name: n,
          value: t[n]
        };
      const r = n, f = `${this._name}:${r}`;
      let a = s.filter(
        (u) => u.getAttribute(e) === f
      );
      return a.length === 0 && (a = s.filter(
        (u) => u.getAttribute(e) === r
      )), o || (a = a.length ? a[0] : null), {
        name: n,
        value: a
      };
    }).reduce((n, o) => (n[o.name] = o.value, n), {});
  }
  get options() {
    return this._options;
  }
  set options(t) {
    const e = this.element.getAttribute(
      `${l.get("attrPrefix")}-options`
    ), s = e ? JSON.parse(e) : {};
    this._options = {
      ...this._options,
      ...t,
      ...s
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
  mount() {
  }
  unmount() {
  }
  getRef(t, e = !1) {
    return `[${l.get("attrPrefix")}-ref="${e ? `${this._name}:` : ""}${t}"]`;
  }
  setState(t) {
    const e = {};
    Object.keys(t).forEach((s) => {
      Array.isArray(t[s]) ? this._state[s] != null && Array.isArray(this._state[s]) ? this._state[s].length === t[s].length ? t[s].some((n, o) => this._state[s][o] !== n ? (e[s] = t[s], this._state[s] = e[s], !0) : !1) : (e[s] = t[s], this._state[s] = e[s]) : (e[s] = t[s], this._state[s] = e[s]) : typeof t[s] == "object" ? (this._state[s] != null && typeof this._state[s] == "object" ? (e[s] = {}, Object.keys(t[s]).forEach((n) => {
        this._state[s][n] !== t[s][n] && (e[s][n] = t[s][n]);
      })) : e[s] = t[s], this._state[s] = {
        ...this._state[s],
        ...e[s]
      }) : this._state[s] !== t[s] && (e[s] = t[s], this._state[s] = t[s]);
    }), Object.keys(e).forEach((s) => {
      Array.isArray(t[s]) ? e[s].length === 0 && delete e[s] : typeof t[s] == "object" && Object.keys(e[s]).length === 0 && delete e[s];
    }), this.stateChange(e);
  }
  stateChange(t) {
    return t;
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
    h(this, "list", {});
  }
  emit(t, e = {}) {
    e._name = t, this.list[t] ? (l.get("log") && console.info(
      `${this.list[t].length} handler${this.list[t].length > 1 ? "s" : ""} called on event '${t}'`
    ), this.list[t].forEach((s) => {
      s.handler(e), s.once && this.off(t, s.handler);
    })) : l.get("log") && console.info(`0 handlers called on event '${t}'`);
  }
  on(t, e, s = !1) {
    this.list[t] ? this.list[t].push({ once: s, handler: e }) : (this.list[t] = [], this.list[t].push({ once: s, handler: e }));
  }
  once(t, e) {
    this.on(t, e, !0);
  }
  off(t, e) {
    var s;
    if (t != null)
      if (e != null)
        if ((s = this.list[t]) != null && s.filter(
          (n) => n.handler === e
        ).length) {
          const n = this.list[t].filter(
            (r) => r.handler === e
          )[0], o = this.list[t].indexOf(n);
          o > -1 && this.list[t].splice(o, 1);
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
  C as destroyInstance,
  O as eventbus,
  _ as getComponentFromElement,
  x as loadComponents,
  C as removeComponents
};
