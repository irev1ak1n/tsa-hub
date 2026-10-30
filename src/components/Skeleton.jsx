export function Skeleton({ w, h, r, className = '', style }) {
    return <span aria-hidden="true" className={`sk ${className}`.trim()} style={{ width: w, height: h, borderRadius: r, ...style }} />;
}

export function SkeletonLines({ lines = 3, lastWidth = '60%' }) {
    return (
        <span className="sk-stack" aria-hidden="true">
            {Array.from({ length: lines }, (_, i) => (
                <Skeleton key={i} className="sk-line" w={i === lines - 1 ? lastWidth : '100%'} />
            ))}
        </span>
    );
}

export function LoadingRegion({ label = 'Loading', className, style, children }) {
    return (
        <div className={className} style={style} role="status" aria-busy="true" aria-live="polite">
            <span className="sk-sr">{label}</span>
            {children}
        </div>
    );
}

export function LoadError({ message, onRetry }) {
    return (
        <div className="sk-notice" role="alert">
            <span>{message}</span>
            {onRetry && <button type="button" onClick={onRetry}>Try again</button>}
        </div>
    );
}

export function DetailSkeleton({ sections = 4, label = 'Loading' }) {
    return (
        <LoadingRegion label={label}>
            <div className="section">
                <Skeleton w="34%" h={12} style={{ marginBottom: 12 }} />
                <Skeleton w="76%" h={32} style={{ marginBottom: 12 }} />
                <Skeleton w="46%" h={14} />
            </div>
            {Array.from({ length: sections }, (_, i) => (
                <div className="evd-section" key={i}>
                    <Skeleton w="28%" h={11} style={{ marginBottom: 14 }} />
                    <SkeletonLines lines={3} />
                </div>
            ))}
        </LoadingRegion>
    );
}
