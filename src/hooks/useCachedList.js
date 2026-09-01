import { useEffect, useState } from "react";
import CacheStore from "../services/CacheStore";

export default function useCachedList(
    cacheKey,
    service,
    methodName = "getAll"
) {
    const cachedData = CacheStore.get(cacheKey);

    const [data, setData] = useState(cachedData || []);
    const [loading, setLoading] = useState(!CacheStore.has(cacheKey));

    useEffect(() => {
        let mounted = true;

        const unsubscribe = CacheStore.subscribe(
            cacheKey,
            (value) => {
                if (!mounted) return;

                setData(value || []);
                setLoading(false);
            }
        );

        // Cache sudah ada, tidak perlu request ulang.
        if (CacheStore.has(cacheKey)) {
            setLoading(false);
            return () => {
                mounted = false;
                unsubscribe();
            };
        }

        setLoading(true);

        service[methodName]()
            .then((result) => {
                if (!mounted) return;

                CacheStore.set(cacheKey, result || []);
            })
            .catch((error) => {
                console.error(
                    `Gagal memuat data untuk cache "${cacheKey}":`,
                    error
                );

                if (mounted) {
                    setData([]);
                    setLoading(false);
                }
            });

        return () => {
            mounted = false;
            unsubscribe();
        };
    }, [cacheKey, service, methodName]);

    return {
        data,
        loading,
        setData,
    };
}