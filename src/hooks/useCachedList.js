import { useCallback, useEffect, useState } from "react";
import CacheStore from "../services/CacheStore";

export default function useCachedList(
    cacheKey,
    service,
    methodName = "getAll"
) {
    const [data, setData] = useState(() => {
        const cached = CacheStore.get(cacheKey);
        return Array.isArray(cached) ? cached : [];
    });

    const [loading, setLoading] = useState(
        () => !CacheStore.has(cacheKey)
    );

    const fetchData = useCallback(async () => {
        setLoading(true);

        try {
            const result = await service[methodName]();

            // Pastikan data yang masuk ke cache selalu array.
            const normalizedData = Array.isArray(result)
                ? result
                : [];

            CacheStore.set(cacheKey, normalizedData);

            return normalizedData;
        } catch (error) {
            console.error(
                `Gagal memuat data untuk cache "${cacheKey}":`,
                error
            );

            setData([]);
            setLoading(false);

            return [];
        }
    }, [cacheKey, service, methodName]);

    useEffect(() => {
        let mounted = true;

        const handleCacheUpdate = (value) => {
            if (!mounted) return;

            /*
             * undefined berarti cache di-clear/invalidate.
             * Ambil ulang data dari API.
             */
            if (value === undefined) {
                fetchData();
                return;
            }

            /*
             * Cache harus selalu berupa array.
             */
            const normalizedData = Array.isArray(value)
                ? value
                : [];

            setData(normalizedData);
            setLoading(false);
        };

        const unsubscribe = CacheStore.subscribe(
            cacheKey,
            handleCacheUpdate
        );

        /*
         * Inisialisasi state dijadwalkan setelah effect selesai. Ini juga
         * menangani perubahan cacheKey tanpa melakukan setState sinkron di
         * dalam effect.
         */
        const initializeTimer = window.setTimeout(() => {
            if (!mounted) return;

            if (CacheStore.has(cacheKey)) {
                const cached = CacheStore.get(cacheKey);

                if (Array.isArray(cached)) {
                    handleCacheUpdate(cached);
                } else {
                    CacheStore.clear(cacheKey);
                }
            } else {
                fetchData();
            }
        }, 0);

        return () => {
            mounted = false;
            window.clearTimeout(initializeTimer);
            unsubscribe();
        };
    }, [cacheKey, fetchData]);

    return {
        data,
        loading,
        setData,
    };
}
