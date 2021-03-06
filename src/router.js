import {getContext} from 'svelte';
import {writable} from 'svelte/store';
import {getAttr,getRouteMatch} from './lib';
import {location} from './location';
import MODES from './modes';

const {subscribe:bc_subscribe, set:bc_set} = writable([]);
let breadcrumb = [];

function locationGo(href) {
    breadcrumb.length = 0;
    location.go(href);
}

export function setBC(name, path) {
    if (name === null) return;
    breadcrumb.push({name, path});
    bc_set(breadcrumb);
}
export const router = routerStore();

function routerStore(){

    const {subscribe} = writable(location.get(), set => {
        location.start(set);
        let un = aClickListener(locationGo);
        return ()=>{
            location.stop();
            un();
        }
    });

    return {
        subscribe,
        goto: href => locationGo(href),
        params: getParams, /* DEPRECATED */
        meta: getMeta,
        breadcrumb: {
            subscribe: bc_subscribe,
        },
        useHashNavigation: s => location.mode(s ? MODES.HASH : MODES.HISTORY), /* DEPRECATED */
        mode: {
            hash: ()=>location.mode(MODES.HASH),
            history: ()=>location.mode(MODES.HISTORY),
            memory: ()=>location.mode(MODES.MEMORY),
        }
    }
}

export function active(node){
    const href = getAttr(node,'href'),
          exact = getAttr(node,'exact',true),
          cl = getAttr(node,'active-class',true,'active');

    return {destroy:router.subscribe(r => {
        const match = getRouteMatch(href,r.path);
        match && (match.exact && exact || !exact) ? node.classList.add(cl) : node.classList.remove(cl);
    })}
}

function aClickListener(go){
    const h = e => {
        const a = e.target.closest('a[href]');
        const t = a  && getAttr(a,'target',false,'_self');
        const i = a  && getAttr(a,'tinro-ignore');
        const k = e.ctrlKey || e.metaKey || e.altKey || e.shiftKey;

        if(t == '_self' && !i && !k && a){
            const href = a.getAttribute('href').replace(/^\/#/,'');

            if(!/^\/\/|^[a-zA-Z]+:/.test(href)) {
                e.preventDefault();
                go(href.startsWith('/') ? href : a.href.replace(window.location.origin,''));
            }
        }
    }

    addEventListener('click', h);
    return () => removeEventListener('click', h);
}

function getMeta(){
    return getContext('tinro').meta;
}

/* DEPRECATED */
function getParams(){
    return getContext('tinro').meta.params;
}
