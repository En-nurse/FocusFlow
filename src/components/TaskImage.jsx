import { useState, useEffect } from 'react';
import { getTaskSignedUrl, getCachedSignedUrl } from '../lib/taskStorage';

const isDirectUrl = (val) =>
  typeof val === 'string' &&
  (val.startsWith('data:') ||
    val.startsWith('blob:') ||
    val.startsWith('http://') ||
    val.startsWith('https://'));

export default function TaskImage({
  src,
  alt = '',
  className = '',
  onClick,
  title,
  style,
  fallback = null,
  ...props
}) {
  const isDirect = isDirectUrl(src);
  const initialCached = !isDirect && src ? getCachedSignedUrl(src) : '';

  const [asyncUrl, setAsyncUrl] = useState(initialCached);
  const [loading, setLoading] = useState(!isDirect && !!src && !initialCached);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let isMounted = true;

    // หากเป็น direct URL (Base64, Blob, HTTP) หรือไม่มีค่า ไม่ต้องทำ async fetch
    if (!src || isDirectUrl(src)) {
      return;
    }

    const cached = getCachedSignedUrl(src);
    if (cached) {
      return;
    }

    getTaskSignedUrl(src)
      .then((url) => {
        if (!isMounted) return;
        setAsyncUrl(url);
        setLoading(false);
      })
      .catch(() => {
        if (!isMounted) return;
        setHasError(true);
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [src]);

  const displayUrl = isDirect ? src : (asyncUrl || initialCached);

  const handleImgError = async () => {
    if (src && !isDirectUrl(src)) {
      try {
        const freshUrl = await getTaskSignedUrl(src, true);
        if (freshUrl && freshUrl !== displayUrl) {
          setAsyncUrl(freshUrl);
          setHasError(false);
          return;
        }
      } catch {
        // ignore
      }
    }
    setHasError(true);
  };

  if (!src || hasError || (!displayUrl && !loading)) {
    return fallback;
  }

  return (
    <img
      src={displayUrl}
      alt={alt}
      className={className}
      onClick={(e) => onClick && onClick(e, displayUrl)}
      title={title}
      style={{
        ...style,
        opacity: loading ? 0.6 : 1,
        transition: 'opacity 0.2s ease',
      }}
      onError={handleImgError}
      {...props}
    />
  );
}
