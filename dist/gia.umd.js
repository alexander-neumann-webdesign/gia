(function(o,f){typeof exports=="object"&&typeof module<"u"?f(exports):typeof define=="function"&&define.amd?define(["exports"],f):(o=typeof globalThis<"u"?globalThis:o||self,f(o.gia={}))})(this,function(o){"use strict";var x=Object.defineProperty;var P=(o,f,a)=>f in o?x(o,f,{enumerable:!0,configurable:!0,writable:!0,value:a}):o[f]=a;var m=(o,f,a)=>P(o,typeof f!="symbol"?f+"":f,a);function f(s,e=document){return typeof s!="string"?s:Array.prototype.slice.call(e.querySelectorAll(s))}function a(s){return typeof s=="string"&&(s=document.getElementById(s),!s)?null:s.__gia_component__}class g{constructor(){m(this,"_options",{log:!1,attrPrefix:"data"})}set(e,i){this._options[e]=i}get(e){return this._options[e]}}const l=new g;function _(s,e,i,t){i.prototype._name=e;const n=new i(s,t);return l.get("log")&&console.info(`Created instance of component "${e}".`),n}function A(s={},e=document.documentElement){if(!s||Object.keys(s).length===0){console.warn("App has no components");return}let i=[];f("["+l.get("attrPrefix")+"-component]",e).forEach(t=>{const n=a(t);if(n)return console.warn(`Error: instance exists: 
`,n),!0;let r=t.getAttribute(l.get("attrPrefix")+"-component");typeof s[r]=="function"?i.push(_(t,r,s[r])):console.warn(`Constructor for component "${r}" not found.`)}),i.forEach(t=>{t._load()})}function b(s){const e=a(s);if(e){const i=e._name;e.unmount(),s.__gia_component__=null,l.get("log")&&console.info(`Removed component "${i}".`)}}function p(s=document.documentElement){f("["+l.get("attrPrefix")+"-component]",s).forEach(e=>{b(e)})}let d=class{constructor(e,i){this.element=e,this.element.__gia_component__=this,this._ref={},this._options=i||{},this._state={}}get ref(){return this._ref}set ref(e){const i=f("["+l.get("attrPrefix")+"-ref]",this.element);return Object.keys(e).length===0?i.forEach(t=>{let n=t.getAttribute(l.get("attrPrefix")+"-ref");if(n.indexOf(":")!==-1){let r=n.split(":");if(r[0]==this._name)this._ref[r[1]]||(this._ref[r[1]]=i.filter(h=>h.getAttribute(l.get("attrPrefix")+"-ref")===n));else return}else this._ref[n]||(this._ref[n]=i.filter(r=>r.getAttribute(l.get("attrPrefix")+"-ref")===n))}):this._ref=Object.keys(e).map(t=>{const n=Array.isArray(e[t]);if(e[t]!==null&&n&&e[t].length>0)return{name:t,value:e[t]};const r=t,h=`${this._name}:${r}`;let u=i.filter(c=>c.getAttribute(l.get("attrPrefix")+"-ref")===h);return u.length===0&&(u=i.filter(c=>c.getAttribute(l.get("attrPrefix")+"-ref")===r)),n||(u=u.length?u[0]:null),{name:t,value:u}}).reduce((t,n)=>(t[n.name]=n.value,t),{}),this._ref}get options(){return this._options}set options(e){let i={},t=this.element.getAttribute(l.get("attrPrefix")+"-options");return t&&(i=JSON.parse(t)),this._options={...this._options,...e,...i},this._options}get state(){return this._state}set state(e){console.warn("You should not change state manually. Use setState instead."),this._state=e}_load(){this.mount()}mount(){console.warn(`Component ${this._name} does not have "mount" method.`)}unmount(){}getRef(e,i=!1){return`[${l.get("attrPrefix")}-ref="${i?`${this._name}:`:""}${e}"]`}setState(e){let i={};Object.keys(e).forEach(t=>{Array.isArray(e[t])?this._state[t]!=null&&Array.isArray(this._state[t])?this._state[t].length===e[t].length?e[t].some((n,r)=>this._state[t][r]!==n?(i[t]=e[t],this._state[t]=i[t],!0):!1):(i[t]=e[t],this._state[t]=i[t]):(i[t]=e[t],this._state[t]=i[t]):typeof e[t]=="object"?(this._state[t]!=null&&typeof this._state[t]=="object"?(i[t]={},Object.keys(e[t]).forEach(n=>{this._state[t][n]!==e[t][n]&&(i[t][n]=e[t][n])})):i[t]=e[t],this._state[t]={...this._state[t],...i[t]}):this._state[t]!==e[t]&&(i[t]=e[t],this._state[t]=e[t])}),Object.keys(i).forEach(t=>{Array.isArray(e[t])?i[t].length===0&&delete i[t]:typeof e[t]=="object"&&Object.keys(i[t]).length===0&&delete i[t]}),this.stateChange(i)}stateChange(e){}};class C extends d{async require(){}_load(){this.require().then(this.mount.bind(this))}}class E{constructor(){m(this,"list",{})}emit(e,i={}){i._name=e,this.list[e]?(l.get("log")&&console.info(`${this.list[e].length} handler${this.list[e].length>1?"s":""} called on event '${e}'`),this.list[e].forEach(t=>{t.handler(i),t.once&&this.off(e,t.handler)})):l.get("log")&&console.info(`0 handlers called on event '${e}'`)}on(e,i,t=!1){this.list[e]?this.list[e].push({once:t,handler:i}):(this.list[e]=[],this.list[e].push({once:t,handler:i}))}once(e,i){this.on(e,i,!0)}off(e,i){if(e!=null)if(i!=null)if(this.list[e]&&this.list[e].filter(t=>t.handler===i).length){let t=this.list[e].filter(r=>r.handler===i)[0],n=this.list[e].indexOf(t);n>-1&&this.list[e].splice(n,1)}else console.warn(`Event ${e} cannot be unsubscribed - does not exist.`);else this.list[e]=[];else this.list={}}}const $=new E;o.BaseComponent=d,o.Component=C,o.config=l,o.createInstance=_,o.destroyInstance=p,o.eventbus=$,o.getComponentFromElement=a,o.loadComponents=A,o.removeComponents=p,Object.defineProperty(o,Symbol.toStringTag,{value:"Module"})});
