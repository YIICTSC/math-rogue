import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, Camera, CheckCircle2, ImagePlus, RefreshCw, Save, Sparkles, Upload } from 'lucide-react';
import type { Card, CardType as CardTypeValue, LanguageMode, TargetType } from '../types';
import { CardType } from '../types';
import CardView from './Card';

type EffectKind = 'GOOD' | 'BAD';

type EffectDefinition = {
  id: string;
  label: string;
  englishLabel: string;
  hiraganaLabel: string;
  apply: (card: Card) => void;
};

type EffectSlot = {
  kind: EffectKind;
  effectId: string;
};

const builderText = (languageMode: LanguageMode, japanese: string, english: string, hiragana: string = japanese) => {
  if (languageMode === 'ENGLISH') return english;
  if (languageMode === 'HIRAGANA') return hiragana;
  return japanese;
};

const GOOD_ATTACK_EFFECTS: EffectDefinition[] = [
  { id: 'damage-8', label: 'ダメージ8', englishLabel: 'Deal 8 damage', hiraganaLabel: 'だめーじ8', apply: card => { card.damage = 8; } },
  { id: 'block-8', label: 'ブロック8', englishLabel: 'Gain 8 Block', hiraganaLabel: 'ぶろっく8', apply: card => { card.block = 8; } },
  { id: 'draw-1', label: 'カードを1枚引く', englishLabel: 'Draw 1 card', hiraganaLabel: 'かーどを1まいひく', apply: card => { card.draw = 1; } },
  { id: 'heal-5', label: 'HPを5回復', englishLabel: 'Heal 5 HP', hiraganaLabel: 'HPを5かいふく', apply: card => { card.heal = 5; } },
  { id: 'energy-1', label: 'エナジー1を得る', englishLabel: 'Gain 1 Energy', hiraganaLabel: 'えなじー1をえる', apply: card => { card.energy = 1; } },
  { id: 'weak-2', label: '敵にへろへろ2', englishLabel: 'Apply 2 Weak', hiraganaLabel: 'てきにへろへろ2', apply: card => { card.weak = 2; } },
  { id: 'vulnerable-2', label: '敵にびくびく2', englishLabel: 'Apply 2 Vulnerable', hiraganaLabel: 'てきにびくびく2', apply: card => { card.vulnerable = 2; } },
  { id: 'poison-3', label: '敵にドクドク3', englishLabel: 'Apply 3 Poison', hiraganaLabel: 'てきにどくどく3', apply: card => { card.poison = 3; } },
  { id: 'remove-block', label: '敵のブロックを解除', englishLabel: 'Remove enemy Block', hiraganaLabel: 'てきのぶろっくをかいじょ', apply: card => { card.removeEnemyBlock = true; } },
];

const GOOD_SELF_EFFECTS: EffectDefinition[] = [
  { id: 'block-8', label: 'ブロック8', englishLabel: 'Gain 8 Block', hiraganaLabel: 'ぶろっく8', apply: card => { card.block = 8; } },
  { id: 'draw-1', label: 'カードを1枚引く', englishLabel: 'Draw 1 card', hiraganaLabel: 'かーどを1まいひく', apply: card => { card.draw = 1; } },
  { id: 'heal-5', label: 'HPを5回復', englishLabel: 'Heal 5 HP', hiraganaLabel: 'HPを5かいふく', apply: card => { card.heal = 5; } },
  { id: 'energy-1', label: 'エナジー1を得る', englishLabel: 'Gain 1 Energy', hiraganaLabel: 'えなじー1をえる', apply: card => { card.energy = 1; } },
  { id: 'strength-2', label: 'ムキムキ2', englishLabel: 'Gain 2 Strength', hiraganaLabel: 'むきむき2', apply: card => { card.strength = 2; } },
  { id: 'next-draw-1', label: '次のターンに1枚ドロー', englishLabel: 'Draw 1 extra card next turn', hiraganaLabel: 'つぎのたーんに1まいどろー', apply: card => { card.nextTurnDraw = 1; } },
  { id: 'next-energy-1', label: '次のターンにエナジー1', englishLabel: 'Gain 1 Energy next turn', hiraganaLabel: 'つぎのたーんにえなじー1', apply: card => { card.nextTurnEnergy = 1; } },
  { id: 'upgrade-hand', label: '手札を強化', englishLabel: 'Upgrade your hand', hiraganaLabel: 'てふだをきょうか', apply: card => { card.upgradeHand = true; } },
];

const BAD_EFFECTS: EffectDefinition[] = [
  { id: 'self-damage-4', label: '自分に4ダメージ', englishLabel: 'Take 4 damage', hiraganaLabel: 'じぶんに4だめーじ', apply: card => { card.selfDamage = 4; } },
  { id: 'exhaust', label: '使用後、この戦闘中は廃棄', englishLabel: 'Exhaust after use', hiraganaLabel: 'しようご、このせんとうちゅうははいき', apply: card => { card.exhaust = true; } },
  { id: 'consumed', label: '使用後、このゲーム中は使い切り', englishLabel: 'Remove this card after use', hiraganaLabel: 'しようご、このげーむちゅうはつかいきり', apply: card => { card.consumedOnUse = true; } },
];

const getGoodEffects = (type: CardTypeValue) => type === CardType.ATTACK ? GOOD_ATTACK_EFFECTS : GOOD_SELF_EFFECTS;
const getBadEffects = (type: CardTypeValue) => type === CardType.POWER
  ? BAD_EFFECTS.filter(effect => effect.id !== 'exhaust')
  : BAD_EFFECTS;
const getEffect = (slot: EffectSlot, type: CardTypeValue) => {
  const pool = slot.kind === 'BAD' ? getBadEffects(type) : getGoodEffects(type);
  return pool.find(effect => effect.id === slot.effectId) || pool[0];
};

const pickRandom = <T,>(items: T[]): T => items[Math.floor(Math.random() * items.length)];

const rollEffectSlots = (type: CardTypeValue): EffectSlot[] => {
  const available = [...getGoodEffects(type)];
  const goodSlots: EffectSlot[] = [];
  for (let i = 0; i < 3; i += 1) {
    const effect = pickRandom(available);
    goodSlots.push({ kind: 'GOOD', effectId: effect.id });
    available.splice(available.indexOf(effect), 1);
  }
  return [...goodSlots, { kind: 'BAD', effectId: pickRandom(getBadEffects(type)).id }];
};

const compressCanvas = (canvas: HTMLCanvasElement): string => {
  const webp = canvas.toDataURL('image/webp', 0.82);
  return webp.startsWith('data:image/webp') ? webp : canvas.toDataURL('image/jpeg', 0.82);
};

const compressImageFile = (file: File): Promise<string> => new Promise((resolve, reject) => {
  if (!file.type.startsWith('image/')) {
    reject(new Error('画像ファイルを選んでください。'));
    return;
  }
  const reader = new FileReader();
  reader.onerror = () => reject(new Error('画像を読み込めませんでした。'));
  reader.onload = () => {
    const image = new Image();
    image.onerror = () => reject(new Error('画像を読み込めませんでした。'));
    image.onload = () => {
      const maxSide = 512;
      const scale = Math.min(1, maxSide / Math.max(image.naturalWidth, image.naturalHeight));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
      canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
      const context = canvas.getContext('2d');
      if (!context) {
        reject(new Error('画像を処理できませんでした。'));
        return;
      }
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      resolve(compressCanvas(canvas));
    };
    image.src = String(reader.result || '');
  };
  reader.readAsDataURL(file);
});

const captureVideoFrame = (video: HTMLVideoElement): string | null => {
  if (!video.videoWidth || !video.videoHeight) return null;
  const maxSide = 512;
  const scale = Math.min(1, maxSide / Math.max(video.videoWidth, video.videoHeight));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(video.videoWidth * scale));
  canvas.height = Math.max(1, Math.round(video.videoHeight * scale));
  const context = canvas.getContext('2d');
  if (!context) return null;
  context.drawImage(video, 0, 0, canvas.width, canvas.height);
  return compressCanvas(canvas);
};

interface OriginalCardBuilderScreenProps {
  languageMode: LanguageMode;
  onBack: () => void;
  onSave: (card: Card) => void;
}

const OriginalCardBuilderScreen: React.FC<OriginalCardBuilderScreenProps> = ({ languageMode, onBack, onSave }) => {
  const [cardName, setCardName] = useState('');
  const [cardType, setCardType] = useState<CardTypeValue>(CardType.ATTACK);
  const [cost, setCost] = useState(1);
  const [holographic, setHolographic] = useState(false);
  const [imageData, setImageData] = useState<string | undefined>();
  const [imageError, setImageError] = useState<string | null>(null);
  const [slots, setSlots] = useState<EffectSlot[]>(() => rollEffectSlots(CardType.ATTACK));
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const stopCamera = () => {
    cameraStreamRef.current?.getTracks().forEach(track => track.stop());
    cameraStreamRef.current = null;
    setCameraStream(null);
    setCameraOpen(false);
  };

  useEffect(() => {
    if (!cameraOpen) return undefined;
    let cancelled = false;
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError(builderText(languageMode, 'この端末または接続ではカメラを利用できません。', 'Camera access is not available on this device or connection.', 'このたんまつまたはせつぞくではかめらをりようできません。'));
      return () => undefined;
    }

    navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: { ideal: 'environment' },
        width: { ideal: 1280 },
        height: { ideal: 720 },
      },
      audio: false,
    }).then(stream => {
      if (cancelled) {
        stream.getTracks().forEach(track => track.stop());
        return;
      }
      cameraStreamRef.current = stream;
      setCameraError(null);
      setCameraStream(stream);
    }).catch(() => {
      if (!cancelled) {
        setCameraError(builderText(languageMode, 'カメラの起動を許可できませんでした。ファイル取り込みも利用できます。', 'Camera permission was not granted. You can still choose an image file.', 'かめらのきどうをきょかできませんでした。ふぁいるとりこみもりようできます。'));
      }
    });

    return () => {
      cancelled = true;
      cameraStreamRef.current?.getTracks().forEach(track => track.stop());
      cameraStreamRef.current = null;
      setCameraStream(null);
    };
  }, [cameraOpen, languageMode]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !cameraStream) return undefined;
    video.srcObject = cameraStream;
    void video.play().catch(() => undefined);
    return () => {
      if (video.srcObject === cameraStream) video.srcObject = null;
    };
  }, [cameraStream]);

  const updateType = (nextType: CardTypeValue) => {
    setCardType(nextType);
    setSlots(rollEffectSlots(nextType));
    setCost(nextType === CardType.POWER ? 2 : 1);
  };

  const rerollGoodSlot = (slotIndex: number) => {
    const pool = getGoodEffects(cardType).filter(effect => !slots.some((slot, index) => (
      index !== slotIndex && slot.kind === 'GOOD' && slot.effectId === effect.id
    )));
    if (pool.length === 0) return;
    const nextEffect = pickRandom(pool);
    setSlots(previous => previous.map((slot, index) => index === slotIndex ? { ...slot, effectId: nextEffect.id } : slot));
  };

  const rerollBadSlot = () => {
    setSlots(previous => previous.map((slot, index) => index === 3 ? { ...slot, effectId: pickRandom(getBadEffects(cardType)).id } : slot));
  };

  const previewCard = useMemo<Card>(() => {
    const nextCard: Card = {
      id: 'original-card-builder-preview',
      name: cardName.trim() || builderText(languageMode, 'なまえ未設定', 'Unnamed card', 'なまえみせってい'),
      cost,
      type: cardType,
      target: cardType === CardType.ATTACK ? ('ENEMY' as TargetType) : ('SELF' as TargetType),
      description: `${slots.slice(0, 3).map(slot => getEffect(slot, cardType).label).join(' / ')}\nデメリット：${getEffect(slots[3], cardType).label}`,
      rarity: holographic ? 'RARE' : 'UNCOMMON',
      rewardCard: true,
      rewardSource: 'ORIGINAL_BUILDER',
      customCard: true,
      customImageData: imageData,
      customEffectSlots: slots.map(slot => ({ kind: slot.kind, effectId: slot.effectId, label: getEffect(slot, cardType).label })),
      holographic,
      holographicVariant: cardType === CardType.ATTACK ? 'red' : cardType === CardType.POWER ? 'yellow' : 'blue',
      textureRef: `ORIGINAL_${cardType}`,
    };
    slots.forEach(slot => getEffect(slot, cardType).apply(nextCard));
    return nextCard;
  }, [cardName, cardType, cost, holographic, imageData, languageMode, slots]);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setImageError(null);
    try {
      setImageData(await compressImageFile(file));
    } catch (error) {
      setImageError(error instanceof Error ? error.message : '画像を読み込めませんでした。');
      setImageData(undefined);
    } finally {
      event.target.value = '';
    }
  };

  const openCamera = () => {
    setCameraError(null);
    setImageError(null);
    setCameraOpen(true);
  };

  const handleCameraCapture = () => {
    const capturedImage = videoRef.current ? captureVideoFrame(videoRef.current) : null;
    if (!capturedImage) {
      setCameraError(builderText(languageMode, '撮影準備中です。少し待ってからもう一度押してください。', 'The camera is still starting. Wait a moment and try again.', 'さつえいじゅんびちゅうです。すこしまってからもういちどおしてください。'));
      return;
    }
    setImageData(capturedImage);
    setImageError(null);
    stopCamera();
  };

  const handleSave = () => {
    const safeName = cardName.trim();
    if (!safeName) {
      setImageError(builderText(languageMode, 'カード名を入力してください。', 'Enter a card name.', 'かーどめいをにゅうりょくしてください。'));
      return;
    }
    onSave({
      ...previewCard,
      id: `original-card-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      name: safeName,
      grantedAt: new Date().toISOString(),
    });
  };

  const effectLabel = (slot: EffectSlot) => {
    const effect = getEffect(slot, cardType);
    return builderText(languageMode, effect.label, effect.englishLabel, effect.hiraganaLabel);
  };

  const title = builderText(languageMode, 'オリジナルカードビルダー', 'Original Card Builder', 'おりじなるかーどびるだー');
  const typeLabel = (type: CardTypeValue) => type === CardType.ATTACK
    ? builderText(languageMode, '攻撃', 'Attack', 'こうげき')
    : type === CardType.SKILL
      ? builderText(languageMode, 'スキル', 'Skill', 'すきる')
      : builderText(languageMode, 'パワー', 'Power', 'ぱわー');

  return (
    <div className="absolute inset-0 overflow-y-auto bg-[radial-gradient(circle_at_top,#312e81_0%,#111827_48%,#020617_100%)] px-3 py-4 text-white sm:px-6 sm:py-8">
      {cameraOpen && (
        <div
          className="fixed inset-0 z-[2147483647] flex items-center justify-center bg-slate-950/95 p-3 sm:p-6"
          role="presentation"
          onClick={stopCamera}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="original-card-camera-title"
            className="w-full max-w-lg rounded-3xl border-2 border-cyan-300/50 bg-slate-900 p-4 shadow-2xl"
            onClick={event => event.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-lg font-black text-cyan-100" id="original-card-camera-title">
                <Camera className="text-cyan-300" size={21} />
                {builderText(languageMode, 'カメラで撮影', 'Take a photo', 'かめらでさつえい')}
              </div>
              <button type="button" onClick={stopCamera} className="rounded-xl border border-slate-500 px-3 py-2 text-xs font-black text-slate-200 hover:bg-slate-800">
                {builderText(languageMode, '閉じる', 'Close', 'とじる')}
              </button>
            </div>
            <div className="overflow-hidden rounded-2xl border border-cyan-200/30 bg-black">
              {cameraError ? (
                <div className="flex min-h-64 items-center justify-center p-6 text-center text-sm font-bold text-rose-200">
                  {cameraError}
                </div>
              ) : (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="aspect-video w-full object-cover"
                  aria-label={builderText(languageMode, '撮影中のカメラ映像', 'Camera preview', 'さつえいちゅうのかめらえいぞう')}
                />
              )}
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button type="button" onClick={stopCamera} className="rounded-xl border-2 border-slate-500 bg-slate-800 px-3 py-3 text-sm font-black text-slate-100 hover:bg-slate-700">
                {builderText(languageMode, 'キャンセル', 'Cancel', 'きゃんせる')}
              </button>
              <button type="button" onClick={handleCameraCapture} disabled={!cameraStream || !!cameraError} className="rounded-xl border-b-4 border-cyan-700 bg-cyan-300 px-3 py-3 text-sm font-black text-slate-950 hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-40">
                {builderText(languageMode, 'この写真を使う', 'Use this photo', 'このしゃしんをつかう')}
              </button>
            </div>
            {cameraError && (
              <button type="button" onClick={() => { stopCamera(); fileInputRef.current?.click(); }} className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-violet-300/60 bg-violet-600/40 px-3 py-2 text-xs font-black text-violet-50 hover:bg-violet-500/50">
                <ImagePlus size={15} />
                {builderText(languageMode, 'ファイルから選ぶ', 'Choose a file instead', 'ふぁいるからえらぶ')}
              </button>
            )}
          </div>
        </div>
      )}
      <main className="mx-auto w-full max-w-6xl">
        <div className="mb-4 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1 rounded-xl border-2 border-slate-500 bg-slate-900/80 px-3 py-2 text-sm font-black text-slate-100 hover:bg-slate-800"
            aria-label={builderText(languageMode, 'タイトルへ戻る', 'Back to title', 'たいとるへもどる')}
          >
            <ArrowLeft size={18} />
            {builderText(languageMode, 'タイトルへ', 'Title', 'たいとるへ')}
          </button>
          <div className="text-right">
            <div className="flex items-center justify-end gap-2 text-2xl font-black text-violet-100">
              <Sparkles className="text-yellow-300" size={24} />
              {title}
            </div>
            <p className="text-xs text-violet-200/80">
              {builderText(languageMode, 'よい効果3つ＋悪い効果1つで、自分だけのカードを作ろう。', 'Build a card with 3 good effects and 1 drawback.', 'よいこうか3つ＋わるいこうか1つで、じぶんだけのかーどをつくろう。')}
            </p>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
          <section className="rounded-3xl border-2 border-violet-300/30 bg-slate-950/75 p-4 shadow-2xl sm:p-6">
            <div className="mb-5 grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1 block text-xs font-black text-violet-200">{builderText(languageMode, 'カード名', 'Card name', 'かーどめい')}</span>
                <input
                  value={cardName}
                  onChange={event => setCardName(event.target.value.slice(0, 24))}
                  placeholder={builderText(languageMode, '例：ぼくのひっさつ技', 'Example: My Special Move', 'れい：ぼくのひっさつわざ')}
                  className="w-full rounded-xl border-2 border-slate-600 bg-slate-900 px-3 py-3 text-base font-bold text-white outline-none focus:border-violet-300"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-black text-violet-200">{builderText(languageMode, 'コスト', 'Cost', 'こすと')}</span>
                <select value={cost} onChange={event => setCost(Number(event.target.value))} className="w-full rounded-xl border-2 border-slate-600 bg-slate-900 px-3 py-3 text-base font-bold text-white outline-none focus:border-violet-300">
                  {[0, 1, 2, 3].map(value => <option key={value} value={value}>{value}</option>)}
                </select>
              </label>
            </div>

            <div className="mb-5">
              <div className="mb-2 text-xs font-black text-violet-200">{builderText(languageMode, 'カード属性', 'Card type', 'かーどぞくせい')}</div>
              <div className="grid grid-cols-3 gap-2">
                {[CardType.ATTACK, CardType.SKILL, CardType.POWER].map(type => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => updateType(type)}
                    className={`rounded-xl border-2 px-2 py-3 text-sm font-black transition ${cardType === type ? 'border-yellow-300 bg-violet-500/50 text-white shadow-[0_0_18px_rgba(196,181,253,0.45)]' : 'border-slate-600 bg-slate-900 text-slate-300 hover:border-violet-300'}`}
                  >
                    {typeLabel(type)}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-5 flex items-center justify-between gap-3 rounded-2xl border-2 border-cyan-300/25 bg-cyan-950/30 p-3">
              <div>
                <div className="text-sm font-black text-cyan-100">{builderText(languageMode, 'キラカード', 'Holographic card', 'きらかーど')}</div>
                <div className="text-xs text-cyan-200/70">{builderText(languageMode, 'キラ演出を付ける', 'Add the holographic effect', 'きらえんしゅつをつける')}</div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={holographic}
                onClick={() => setHolographic(previous => !previous)}
                className={`rounded-full px-4 py-2 text-xs font-black ${holographic ? 'bg-cyan-300 text-slate-950' : 'bg-slate-700 text-slate-200'}`}
              >
                {holographic ? builderText(languageMode, 'キラ', 'Holo', 'きら') : builderText(languageMode, '通常', 'Normal', 'つうじょう')}
              </button>
            </div>

            <div className="mb-5">
              <div className="mb-2 flex items-center justify-between gap-2">
                <div className="text-sm font-black text-violet-100">{builderText(languageMode, '効果スロット', 'Effect slots', 'こうかすろっと')}</div>
                <button
                  type="button"
                  onClick={() => setSlots(rollEffectSlots(cardType))}
                  className="flex items-center gap-1 rounded-lg border border-violet-300/60 bg-violet-600/40 px-2 py-1 text-xs font-black text-violet-100 hover:bg-violet-500/50"
                >
                  <RefreshCw size={14} />
                  {builderText(languageMode, '全部リロール', 'Reroll all', 'ぜんぶりろーる')}
                </button>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {slots.map((slot, index) => (
                  <div key={`${slot.kind}-${index}`} className={`rounded-2xl border-2 p-3 ${slot.kind === 'GOOD' ? 'border-emerald-300/50 bg-emerald-950/35' : 'border-rose-300/60 bg-rose-950/40'}`}>
                    <div className="mb-2 flex items-center justify-between gap-2 text-[10px] font-black uppercase tracking-wider">
                      <span className={slot.kind === 'GOOD' ? 'text-emerald-200' : 'text-rose-200'}>
                        {slot.kind === 'GOOD' ? builderText(languageMode, `よい効果スロット${index + 1}`, `Good effect slot ${index + 1}`, `よいこうかすろっと${index + 1}`) : builderText(languageMode, '悪い効果スロット', 'Drawback slot', 'わるいこうかすろっと')}
                      </span>
                      <button
                        type="button"
                        onClick={() => slot.kind === 'GOOD' ? rerollGoodSlot(index) : rerollBadSlot()}
                        className="flex items-center gap-1 rounded-lg border border-white/20 bg-black/20 px-2 py-1 text-[10px] font-black text-white hover:bg-white/10"
                        aria-label={builderText(languageMode, 'この効果をリロール', 'Reroll this effect', 'このこうかをりろーる')}
                      >
                        <RefreshCw size={12} />
                        {builderText(languageMode, 'リロール', 'Reroll', 'りろーる')}
                      </button>
                    </div>
                    <div className="text-sm font-black text-white">{effectLabel(slot)}</div>
                  </div>
                ))}
              </div>
              <p className="mt-2 text-[11px] text-slate-400">
                {builderText(languageMode, 'リロール回数に制限はありません。よい効果は同じカード内で重複しません。', 'There is no reroll limit. Good effects do not repeat on the same card.', 'りろーるかいすうにせいげんはありません。よいこうかはおなじかーどないでちょうふくしません。')}
              </p>
            </div>

            <div className="rounded-2xl border-2 border-dashed border-slate-600 bg-slate-900/60 p-3">
              <div className="mb-2 flex items-center gap-2 text-sm font-black text-slate-100">
                <ImagePlus size={17} />
                {builderText(languageMode, 'カード画像', 'Card image', 'かーどがぞう')}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button type="button" onClick={openCamera} className="flex items-center gap-2 rounded-xl border-2 border-cyan-300/60 bg-cyan-600/40 px-3 py-2 text-xs font-black text-cyan-50 hover:bg-cyan-500/50">
                  <Camera size={15} />
                  {builderText(languageMode, 'カメラで撮影', 'Take a photo', 'かめらでさつえい')}
                </button>
                <label className="flex cursor-pointer items-center gap-2 rounded-xl border-2 border-violet-300/60 bg-violet-600/40 px-3 py-2 text-xs font-black text-violet-50 hover:bg-violet-500/50">
                  <ImagePlus size={15} />
                  {builderText(languageMode, '写真・ファイルを取り込む', 'Choose photo or file', 'しゃしん・ふぁいるをとりこむ')}
                  <input ref={fileInputRef} type="file" accept="image/*" capture="environment" onChange={handleFileChange} className="sr-only" />
                </label>
                {imageData && (
                  <button type="button" onClick={() => setImageData(undefined)} className="rounded-xl border border-slate-500 px-3 py-2 text-xs font-black text-slate-200 hover:bg-slate-800">
                    {builderText(languageMode, '画像を外す', 'Remove image', 'がぞうをはずす')}
                  </button>
                )}
                <span className="flex items-center gap-1 text-[11px] text-slate-400"><Upload size={13} />{builderText(languageMode, '512px以内に縮小して保存', 'Saved at up to 512px', '512ぴくせるいないにしゅくしょうしてほぞん')}</span>
              </div>
              {imageError && <p className="mt-2 text-xs font-bold text-rose-300">{imageError}</p>}
            </div>

            <button type="button" onClick={handleSave} className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl border-b-4 border-violet-800 bg-violet-500 px-4 py-3 text-base font-black text-white shadow-lg hover:bg-violet-400 active:translate-y-1 active:border-b-0">
              <Save size={19} />
              {builderText(languageMode, 'ご褒美カード帳に保存', 'Save to reward card album', 'ごほうびかーどちょうにほぞん')}
            </button>
          </section>

          <aside className="rounded-3xl border-2 border-yellow-200/30 bg-slate-950/75 p-4 shadow-2xl sm:p-6">
            <div className="mb-3 flex items-center gap-2 text-sm font-black text-yellow-100">
              <CheckCircle2 className="text-emerald-300" size={18} />
              {builderText(languageMode, '完成イメージ', 'Preview', 'かんせいいめーじ')}
            </div>
            <div className="flex justify-center rounded-2xl border border-white/10 bg-[radial-gradient(circle,#334155,#020617)] p-5">
              <CardView card={previewCard} onClick={() => undefined} disabled={false} languageMode={languageMode} />
            </div>
            <div className="mt-4 space-y-2 rounded-2xl border border-white/10 bg-black/20 p-3 text-xs text-slate-300">
              <div className="font-black text-white">{builderText(languageMode, 'カード帳に保存すると、次の冒険の開始時に選べます。', 'Saved cards can be selected when starting the next adventure.', 'かーどちょうにほぞんすると、つぎのぼうけんのかいしじにえらべます。')}</div>
              <div>{builderText(languageMode, '写真や画像はこの端末内に保存されます。', 'Photos and images are stored on this device.', 'しゃしんやがぞうはこのたんまつないにほぞんされます。')}</div>
              <div className="text-rose-200">{builderText(languageMode, '悪い効果も必ず1つ付きます。', 'One drawback is always included.', 'わるいこうかもかならず1つつきます。')}</div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
};

export default OriginalCardBuilderScreen;
