import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import KartEntry from '../../src/mini-games/gakuro-kart/KartEntry';
import { GP_VISUAL_FILES, GP_VISUAL_BYTES } from '../../src/generated/kartVisualAssets';
import { GP_VISUAL_CACHE, gpVisualCacheKey } from '../../src/mini-games/gakuro-kart/visualPreload';
import { assetUrl, assetSourceUrl } from '../../src/utils/assetPaths';
import { audioService } from '../../src/services/audioService';
import '../../src/styles.css';

const qa = window as any;
qa.files = GP_VISUAL_FILES; qa.bytes = GP_VISUAL_BYTES; qa.cacheName = GP_VISUAL_CACHE;
qa.cacheKey = gpVisualCacheKey; qa.assetUrl = assetUrl; qa.sourceUrl = assetSourceUrl;
audioService.playBGM = async () => {};
audioService.stopBGM = () => {};
function App() {
  const [open, setOpen] = useState(false);
  return open ? <KartEntry languageMode={new URLSearchParams(location.search).get('lang') as any || 'ENGLISH'} onClose={() => setOpen(false)}/> : <button onClick={() => setOpen(true)}>Play GP</button>;
}
createRoot(document.getElementById('root')!).render(<React.StrictMode><App/></React.StrictMode>);
