import { trans } from '../../utils/textUtils';
import type { LanguageMode } from '../../types';
import React from 'react';
import { ACCESSORIES, AVATAR_COLORS, AVATAR_SPECIES, BODY_COLORS, HAIR_COLORS, HAIR_STYLES, KART_SHAPES, EXPRESSIONS, EXPRESSION_ICONS, type KartAvatar } from './avatar';
export default function AvatarCreator({ value, onChange, languageMode, activity = 'kart' }: { value: KartAvatar; onChange: (avatar: KartAvatar) => void; languageMode: LanguageMode; activity?: 'kart' | 'golf' }) {
  const t = (text: string) => trans(text, languageMode);
  const colors = (label: string, key: 'body' | 'outfit' | 'hair', palette: string[]) => <fieldset><legend>{t(label)}</legend><div className="gk-avatar-swatches">{palette.map((color, i) => <button type="button" key={color} aria-label={`${t(label)} ${i + 1}`} aria-pressed={value[key] === i} style={{ '--swatch': color } as React.CSSProperties} onClick={() => onChange({ ...value, [key]: i })}><span />{value[key] === i && <b aria-hidden="true">✓</b>}</button>)}</div></fieldset>;
  return <section className="gk-avatar-editor" aria-label={t('キャラクタークリエイト')}><div className="gk-avatar-heading"><span>{activity === 'golf' ? 'YOUR GOLFER' : 'YOUR DRIVER'}</span><h3>{t('キャラクタークリエイト')}</h3></div><p>{t(activity === 'golf' ? 'ラウンド開始前まで自由に変更できます。' : 'レース開始前まで自由に変更できます。')}</p>
    <fieldset><legend>{t('キャラクターの種類')}</legend><div className="gk-avatar-species">{AVATAR_SPECIES.map((s, i) => <button type="button" key={s.id} aria-pressed={value.species === i} onClick={() => onChange({ ...value, species: i })}><span aria-hidden="true">{s.icon}</span><b>{t(s.name)}</b></button>)}</div></fieldset>
    <fieldset><legend>{t('表情')}</legend><div className="gk-avatar-options gk-expressions">{EXPRESSIONS.map((expression, i) => <button type="button" key={expression} aria-pressed={value.expression === i} onClick={() => onChange({ ...value, expression: i })}><span aria-hidden="true">{EXPRESSION_ICONS[i]}</span> {t(expression)}</button>)}</div></fieldset>
    {value.species === 0 && <fieldset><legend>{t('髪型')}</legend><div className="gk-avatar-options gk-hairstyles">{HAIR_STYLES.map((style, i) => <button type="button" key={style} aria-pressed={value.hairStyle === i} onClick={() => onChange({ ...value, hairStyle: i })}>{t(style)}</button>)}</div></fieldset>}
    {activity === 'kart' && <fieldset><legend>{t('カートの形')}</legend><div className="gk-avatar-options gk-kart-shapes">{KART_SHAPES.map((shape, i) => <button type="button" key={shape} aria-pressed={value.kart === i} onClick={() => onChange({ ...value, kart: i })}>{t(shape)}</button>)}</div><small>{t('形は見た目のみ変わります。走行性能は共通です。')}</small></fieldset>}
    {colors('体・肌の色', 'body', BODY_COLORS)}{colors(activity === 'golf' ? '服の色' : '服・カートの色', 'outfit', AVATAR_COLORS)}{value.species === 0 && value.hairStyle !== 11 && colors('髪の色', 'hair', HAIR_COLORS)}
    {value.species === 0 && value.accessory === 2 && <p>{t('ヘルメットを外すと選んだ髪型が見えます。')}</p>}
    <fieldset><legend>{t('アクセサリー')}</legend><div className="gk-avatar-accessories">{ACCESSORIES.map((a, i) => <button type="button" key={a} aria-pressed={value.accessory === i} onClick={() => onChange({ ...value, accessory: i })}>{t(a)}</button>)}</div></fieldset>
    <small>{t('作成したキャラクターは次回も使えます。')}</small>
  </section>;
}
