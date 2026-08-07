import React, { useEffect, useMemo, useState } from 'react';
import { WEB_PERFORMANCE_MODE } from '../config/runtime';

interface ResilientAssetImageProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  sources: Array<string | null | undefined>;
  fallback?: React.ReactNode;
}

const ResilientAssetImage: React.FC<ResilientAssetImageProps> = ({ sources, fallback = null, ...props }) => {
  const candidates = useMemo(
    () => Array.from(new Set(sources.filter((source): source is string => Boolean(source)))),
    [sources]
  );
  const [sourceIndex, setSourceIndex] = useState(0);

  useEffect(() => {
    setSourceIndex(0);
  }, [candidates.join('\n')]);

  if (sourceIndex >= candidates.length) {
    return <>{fallback}</>;
  }

  return (
    <img
      {...props}
      src={candidates[sourceIndex]}
      loading={props.loading ?? (WEB_PERFORMANCE_MODE ? 'eager' : undefined)}
      decoding={props.decoding ?? 'async'}
      fetchPriority={props.fetchPriority ?? (WEB_PERFORMANCE_MODE ? 'high' : undefined)}
      onError={(event) => {
        props.onError?.(event);
        setSourceIndex((current) => current + 1);
      }}
    />
  );
};

export default ResilientAssetImage;
