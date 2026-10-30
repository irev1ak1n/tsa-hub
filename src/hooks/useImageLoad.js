import { useCallback, useEffect, useState } from 'react';

export function useImageLoad(src) {
    const [loaded, setLoaded] = useState(false);
    const [node, setNode] = useState(null);

    useEffect(() => {
        setLoaded(Boolean(node && node.complete && node.naturalWidth > 0));
    }, [src, node]);

    const ref = useCallback((el) => setNode(el), []);
    const onLoad = useCallback(() => setLoaded(true), []);
    return { ref, loaded, onLoad };
}
