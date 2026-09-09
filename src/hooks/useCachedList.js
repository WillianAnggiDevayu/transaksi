import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import CacheStore from "../services/CacheStore";

const EMPTY_LIST = Object.freeze([]);
const EMPTY_OPTIONS = Object.freeze({});
const ignoreAutomaticError = () => {};

// args must be JSON-serializable IDs/parameters; include them in cacheKey as well.
export default function useCachedList(cacheKey, service, methodName = "getAll", options = EMPTY_OPTIONS) {
    const { enabled = true, resultType = "array" } = options;
    const argsKey = JSON.stringify(options.args || []);
    const args = useMemo(() => JSON.parse(argsKey), [argsKey]);
    const identity = cacheKey + ":" + argsKey;
    const [checked, setChecked] = useState(null);
    const empty = resultType === "object" ? null : EMPTY_LIST;
    const subscribe = useCallback((callback) => enabled
        ? CacheStore.subscribe(cacheKey, callback) : () => {}, [cacheKey, enabled]);
    const getSnapshot = useCallback(() => CacheStore.snapshot(cacheKey), [cacheKey]);
    const snapshot = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

    const refresh = useCallback(({ dedupe = false } = {}) => {
        if (!enabled) return Promise.resolve(empty);
        return CacheStore.fetch(cacheKey, async () => {
            const result = await service[methodName](...args, { force: true, cache: false });
            const valid = resultType === "array" ? Array.isArray(result)
                : result !== null && typeof result === "object" && !Array.isArray(result);
            if (!valid) throw new Error("Format data tidak sesuai untuk " + cacheKey + ".");
            return result;
        }, { force: true, dedupe }).then((data) => { setChecked(identity); return data; }, (error) => { setChecked(identity); throw error; });
    }, [cacheKey, service, methodName, args, enabled, empty, resultType, identity]);

    useEffect(() => {
        if (!enabled) return;
        let timer;
        let active = true;
        const session = CacheStore.session();
        const schedule = (force = true) => {
            window.clearTimeout(timer);
            timer = window.setTimeout(() => {
                if (!active || CacheStore.session() !== session) return;
                if (!force && !CacheStore.snapshot(cacheKey).stale) { setChecked(identity); return; }
                refresh({ dedupe: true }).catch(ignoreAutomaticError);
            }, 0);
        };
        const unsubscribe = CacheStore.subscribe(cacheKey, (_, event) => {
            if (event === "invalidate") schedule(false);
            if (event === "reset") window.clearTimeout(timer);
        });
        const visible = () => {
            if (document.visibilityState !== "hidden") schedule();
        };
        window.addEventListener("focus", visible);
        document.addEventListener("visibilitychange", visible);
        window.addEventListener("online", visible);
        schedule();
        return () => {
            active = false;
            window.clearTimeout(timer);
            unsubscribe();
            window.removeEventListener("focus", visible);
            document.removeEventListener("visibilitychange", visible);
            window.removeEventListener("online", visible);
        };
    }, [cacheKey, enabled, refresh, identity]);

    const setData = useCallback((value) => {
        if (!enabled) return;
        CacheStore.set(cacheKey, typeof value === "function" ? value(CacheStore.get(cacheKey) ?? empty) : value);
    }, [cacheKey, enabled, empty]);

    return {
        data: enabled ? snapshot.data ?? empty : empty,
        loading: enabled && snapshot.data === undefined && !snapshot.error,
        refreshing: enabled && snapshot.loading,
        stale: enabled && (snapshot.stale || checked !== identity),
        error: enabled ? snapshot.error : null,
        refresh, setData,
    };
}
