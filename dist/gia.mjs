//#region src/registry.js
typeof window < "u" && (window.gia = window.gia || {}, window.gia.components = window.gia.components || {}, window.gia.register = (e) => {
	if (typeof e != "function") {
		console.error("Gia: Register failed. Expected a Class, got:", e);
		return;
	}
	let t = e.name;
	if (!t) {
		console.warn("Gia: Cannot register an anonymous class. Please use a named class.");
		return;
	}
	window.gia.components[t] = e;
});
var e = new class {
	_options = {
		log: !1,
		attrPrefix: "data",
		autoMountComponents: !1,
		autoBindActions: !1
	};
	set(e, t) {
		this._options[e] = t;
	}
	get(e) {
		return this._options[e];
	}
}();
//#endregion
//#region src/createInstance.js
function t(t, n, r, i) {
	if (t.__gia_component__) return console.warn(`Component "${n}" already exists.`), t.__gia_component__;
	try {
		let a = new r(t, i);
		return e.get("log") && console.info(`Created instance of component "${n}".`), a;
	} catch (e) {
		return console.error(`Failed to create component "${n}".`, e), null;
	}
}
//#endregion
//#region src/getComponentFromElement.js
function n(e) {
	return typeof e == "string" && (e = document.getElementById(e), !e) ? null : e.__gia_component__;
}
//#endregion
//#region src/utils.js
function r(e, t = document) {
	return typeof e == "string" ? t.querySelectorAll(e) : e;
}
//#endregion
//#region src/loadComponents.js
function i(i = {}, a = document.documentElement) {
	let o = !0;
	if (i) {
		for (let e in i) if (Object.prototype.hasOwnProperty.call(i, e)) {
			o = !1;
			break;
		}
	}
	if (o) {
		console.warn("App has no components");
		return;
	}
	let s = [], c = `${e.get("attrPrefix")}-component`, l = r(`[${c}]`, a), u = l.length, d = (e) => {
		if (n(e)) return;
		let r = e.getAttribute(c);
		typeof i[r] == "function" ? s.push(t(e, r, i[r])) : console.warn(`Constructor "${r}" not found.`);
	};
	for (let e = 0; e < u; e++) d(l[e]);
	a instanceof Element && a.hasAttribute(c) && d(a), s.forEach((e) => {
		e._load();
	});
}
//#endregion
//#region src/destroyInstance.js
function a(t) {
	let r = n(t);
	if (r) {
		let n = r._name || "Unknown";
		try {
			typeof r._destroy == "function" ? r._destroy() : r.unmount();
		} catch (e) {
			console.error(`Gia: Error unmounting component "${n}".`, e);
		}
		t.__gia_component__ = null, r.element &&= null, e.get("log") && console.info(`Removed component "${n}".`);
	}
}
//#endregion
//#region src/removeComponents.js
function o(t = document.documentElement) {
	r(`[${e.get("attrPrefix")}-component]`, t).forEach((e) => {
		a(e);
	});
}
//#endregion
//#region src/BaseComponent.js
var s = null, c = /* @__PURE__ */ new Map(), l = /* @__PURE__ */ new Map(), u = new Set([
	"constructor",
	"require",
	"mount",
	"unmount",
	"getRef",
	"setState",
	"stateChange",
	"loadScript"
]), d = /* @__PURE__ */ new WeakMap();
function f(e) {
	let t = e.root || null, n = e.rootMargin || "0px 0px 0px 0px", r = e.threshold || 0, i = Array.isArray(r) ? r.join(",") : r.toString();
	return `${t ? t.id || "root-element" : "null"}|${n}|${i}`;
}
var p = class {
	constructor(t, n) {
		this.element = t, this.element.__gia_component__ = this, this._name = this.constructor.name, this._ref = {}, this._options = n || {}, this._state = {}, this._stateAttributeCache = {}, this._autoBindFunctions(), e.get("autoBindActions") && this._autoBindActions();
	}
	get ref() {
		return this._ref;
	}
	set ref(t) {
		let n = `${e.get("attrPrefix")}-ref`, i = r(`[${n}]`, this.element), a = {};
		for (let e = 0; e < i.length; e++) {
			let t = i[e], r = t.getAttribute(n);
			a[r] || (a[r] = []), a[r].push(t);
		}
		let o = !0;
		for (let e in t) if (Object.prototype.hasOwnProperty.call(t, e)) {
			o = !1;
			break;
		}
		if (o) {
			for (let e in a) if (Object.prototype.hasOwnProperty.call(a, e)) {
				let t = e.indexOf(":");
				if (t !== -1) {
					let n = e.substring(0, t), r = e.substring(t + 1);
					n === this._name && !this._ref[r] && (this._ref[r] = a[e]);
				} else this._ref[e] || (this._ref[e] = a[e]);
			}
		} else {
			this._ref = {};
			for (let e in t) if (Object.prototype.hasOwnProperty.call(t, e)) {
				let n = Array.isArray(t[e]);
				if (t[e] !== null && n && t[e].length > 0) {
					this._ref[e] = t[e];
					continue;
				}
				let r = a[`${this._name}:${e}`] || [];
				r.length === 0 && (r = a[e] || []), this._ref[e] = n ? r : r[0] ?? null;
			}
		}
	}
	get options() {
		return this._options;
	}
	set options(t) {
		let n = this.element.getAttribute(`${e.get("attrPrefix")}-options`), r = {};
		if (n) try {
			r = JSON.parse(n);
		} catch (e) {
			console.error(`Failed to parse options for component "${this._name}": ${e.message}`);
		}
		this._options = {
			...this._options,
			...t,
			...r
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
	_destroy() {
		if (this.unmount(), this._observedResizeElements) for (let e of this._observedResizeElements.keys()) this.unobserveResize(e);
		if (this._observedIntersectionElements) for (let e of this._observedIntersectionElements.keys()) this.unobserveIntersection(e);
	}
	observeResize(e, t) {
		typeof window > "u" || !window.ResizeObserver || (s ||= new ResizeObserver((e) => {
			for (let t of e) {
				let e = c.get(t.target);
				e && e.forEach((e) => e([t]));
			}
		}), c.has(e) || (c.set(e, /* @__PURE__ */ new Set()), s.observe(e)), c.get(e).add(t), this._observedResizeElements ||= /* @__PURE__ */ new Map(), this._observedResizeElements.has(e) || this._observedResizeElements.set(e, /* @__PURE__ */ new Set()), this._observedResizeElements.get(e).add(t));
	}
	unobserveResize(e, t = null) {
		if (!this._observedResizeElements) return;
		let n = this._observedResizeElements.get(e);
		if (!n) return;
		if (t) {
			n.delete(t);
			let r = c.get(e);
			r && r.delete(t);
		} else {
			let t = c.get(e);
			t && n.forEach((e) => t.delete(e)), n.clear();
		}
		n.size === 0 && this._observedResizeElements.delete(e);
		let r = c.get(e);
		r && r.size === 0 && (c.delete(e), s && s.unobserve(e));
	}
	observeIntersection(e, t, n = {}) {
		if (typeof window > "u" || !window.IntersectionObserver) return;
		let r = f(n), i = l.get(r);
		i || (i = {
			observer: new IntersectionObserver((e) => {
				for (let t of e) {
					let e = i.callbacks.get(t.target);
					e && e.forEach((e) => e([t]));
				}
			}, n),
			callbacks: /* @__PURE__ */ new Map()
		}, l.set(r, i)), i.callbacks.has(e) || (i.callbacks.set(e, /* @__PURE__ */ new Set()), i.observer.observe(e)), i.callbacks.get(e).add(t), this._observedIntersectionElements ||= /* @__PURE__ */ new Map(), this._observedIntersectionElements.has(e) || this._observedIntersectionElements.set(e, /* @__PURE__ */ new Map());
		let a = this._observedIntersectionElements.get(e);
		a.has(r) || a.set(r, /* @__PURE__ */ new Set()), a.get(r).add(t);
	}
	unobserveIntersection(e, t = null) {
		if (!this._observedIntersectionElements) return;
		let n = this._observedIntersectionElements.get(e);
		n && (n.forEach((r, i) => {
			let a = l.get(i);
			if (t) r.has(t) && (r.delete(t), a && a.callbacks.has(e) && a.callbacks.get(e).delete(t));
			else {
				if (a && a.callbacks.has(e)) {
					let t = a.callbacks.get(e);
					r.forEach((e) => t.delete(e));
				}
				r.clear();
			}
			if (r.size === 0 && n.delete(i), a) {
				let t = a.callbacks.get(e);
				t && t.size === 0 && (a.callbacks.delete(e), a.observer.unobserve(e)), a.callbacks.size === 0 && (a.observer.disconnect(), l.delete(i));
			}
		}), n.size === 0 && this._observedIntersectionElements.delete(e));
	}
	loadScript(e, t) {
		if (t && window[t]) return Promise.resolve(window[t]);
		let n = document.getElementById(`${e}-js`);
		return n ? (n._loadPromise ||= new Promise((r, i) => {
			let a = () => {
				n.onload = null, n.onerror = null;
			};
			n.onload = () => {
				a(), r(t ? window[t] : !0);
			}, n.onerror = () => {
				a(), delete n._loadPromise, i(/* @__PURE__ */ Error(`Failed to load script: ${e}`));
			}, !n.src && n.dataset.src ? (n.src = n.dataset.src, delete n.dataset.src) : !n.src && !n.dataset.src && (a(), i(/* @__PURE__ */ Error(`Script tag '${e}-js' has no src or data-src.`)));
		}), n._loadPromise) : Promise.reject(/* @__PURE__ */ Error(`Script tag with ID '${e}-js' not found.`));
	}
	mount() {}
	unmount() {}
	getRef(t, n = !1) {
		return `[${e.get("attrPrefix")}-ref="${n ? `${this._name}:` : ""}${t}"]`;
	}
	setState(e) {
		let t = {}, n = !1;
		for (let r in e) Object.prototype.hasOwnProperty.call(e, r) && this._state[r] !== e[r] && (t[r] = e[r], this._state[r] = e[r], n = !0);
		if (n) {
			this._pendingStateChanges || (this._pendingStateChanges = {}, this._pendingAttributeChanges = {}, requestAnimationFrame(() => {
				for (let e in this._pendingAttributeChanges) if (Object.prototype.hasOwnProperty.call(this._pendingAttributeChanges, e)) {
					let t = this._pendingAttributeChanges[e];
					this.element.getAttribute(e) !== t && this.element.setAttribute(e, t);
				}
				this.stateChange(this._pendingStateChanges), this._pendingStateChanges = null, this._pendingAttributeChanges = null;
			}));
			for (let e in t) if (Object.prototype.hasOwnProperty.call(t, e)) {
				let n = t[e], r = typeof n;
				if (r === "boolean" || r === "string") {
					if (!this._stateAttributeCache[e]) {
						let t = e.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
						this._stateAttributeCache[e] = `data-${t}`;
					}
					let t = this._stateAttributeCache[e];
					this._pendingAttributeChanges[t] = r === "boolean" ? n ? "true" : "false" : n;
				}
			}
			Object.assign(this._pendingStateChanges, t);
		}
	}
	stateChange(e) {
		return e;
	}
	_autoBindFunctions() {
		let e = Object.getPrototypeOf(this), t = d.get(e);
		t || (t = Object.getOwnPropertyNames(e).filter((t) => !u.has(t) && !t.startsWith("_") && typeof Object.getOwnPropertyDescriptor(e, t)?.value == "function"), d.set(e, t));
		for (let e = 0; e < t.length; e++) {
			let n = t[e];
			this[n] = this[n].bind(this);
		}
	}
	_autoBindActions() {
		r("[data-action]", this.element).forEach((e) => {
			e.dataset.action.split(" ").forEach((t) => {
				let n = t.indexOf("->"), r, i;
				n === -1 ? (r = t, i = void 0) : (r = t.substring(0, n), i = t.substring(n + 2)), this[i] && typeof this[i] == "function" && !i.startsWith("_") && !u.has(i) ? e.addEventListener(r, (e) => this[i](e)) : console.warn(`Method "${i}" not found or not allowed in component.`);
			});
		});
	}
}, m = class extends p {
	async require() {}
	_load() {
		this.require().then(this.mount.bind(this));
	}
}, h = new class extends EventTarget {
	emit(t, n = {}) {
		e.get("log") && console.info(`Emitting event '${t}'`);
		let r = new CustomEvent(t, { detail: n });
		r._name = t, this.dispatchEvent(r);
	}
	on(e, t, n = !1) {
		let r = (e) => t({
			...e.detail,
			_name: e._name
		});
		t._wrapped = r, this.addEventListener(e, r, { once: n });
	}
	once(e, t) {
		this.on(e, t, !0);
	}
	off(e, t) {
		t && t._wrapped ? this.removeEventListener(e, t._wrapped) : t && this.removeEventListener(e, t), t || console.warn("EventBus.off requires a handler to remove a specific listener when using native EventTarget.");
	}
}(), g = null;
function _(t) {
	let n = `${e.get("attrPrefix")}-component`, o = typeof window < "u" && window.gia ? window.gia.components : {}, s = /* @__PURE__ */ new Set();
	t.forEach((e) => {
		e.removedNodes.forEach((e) => {
			e.nodeType === Node.ELEMENT_NODE && (e.hasAttribute(n) && a(e), r(`[${n}]`, e).forEach((e) => a(e)));
		}), e.addedNodes.forEach((e) => {
			e.nodeType === Node.ELEMENT_NODE && s.add(e);
		});
	}), s.forEach((e) => {
		e.isConnected && i(o, e);
	});
}
function v() {
	typeof document > "u" || (e.get("autoMountComponents") && !g ? (g = new MutationObserver(_), g.observe(document.body, {
		childList: !0,
		subtree: !0
	})) : !e.get("autoMountComponents") && g && (g.disconnect(), g = null));
}
var y = e.set;
//#endregion
//#region lib/main.js
e.set = function(e, t) {
	y.call(this, e, t), e === "autoMountComponents" && v();
}, typeof window < "u" && setTimeout(v, 0);
//#endregion
export { p as BaseComponent, m as Component, e as config, t as createInstance, o as destroyInstance, o as removeComponents, h as eventbus, n as getComponentFromElement, i as loadComponents };
