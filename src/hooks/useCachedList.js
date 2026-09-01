// src/hooks/useCachedList.js
import { useEffect, useState } from "react";
import CacheStore from "../services/CacheStore";

export default function useCachedList(cacheKey, service, methodName = "getAll") {
    const [data, setData] = useState(CacheStore.get(cacheKey) || []);
    const [loading, setLoading] = useState(!CacheStore.has(cacheKey));

    useEffect(() => {
        const unsubscribe = CacheStore.subscribe(cacheKey, setData);

        service[methodName]().then((result) => {
            setData(result);
            setLoading(false);
        });

        return unsubscribe;
    }, [cacheKey]);

    return { data, loading, setData };
}