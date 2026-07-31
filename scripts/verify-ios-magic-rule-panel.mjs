import { readFile } from 'node:fs/promises';

const [component, styles] = await Promise.all([
  readFile(new URL('../src/components/MagicRulePanel.tsx', import.meta.url), 'utf8'),
  readFile(new URL('../src/styles.css', import.meta.url), 'utf8'),
]);

const requiredComponentClasses = [
  'magic-rule-panel-mobile-summary',
  'magic-rule-panel-mobile-copy',
  'magic-rule-panel-mobile-name',
  'magic-rule-panel-mobile-progress',
  'magic-rule-panel-mobile-slots',
  'magic-rule-panel-mobile-remaining',
  'magic-rule-panel-mobile-body',
  'ios-edge-to-edge-visual',
];

for (const className of requiredComponentClasses) {
  if (!component.includes(className)) {
    throw new Error(`Magic rule panel is missing semantic class: ${className}`);
  }
}

const requiredStyleFragments = [
  '@media (orientation: landscape) and (max-height: 600px) and (max-width: 1100px)',
  'html.app-platform-ios .battle-scene-root.battle-magic .magic-rule-panel-mobile:not([open])',
  'width: min(10rem, calc(100vw - var(--ios-ui-safe-left) - var(--ios-ui-safe-right) - 1rem))',
  'padding: 0 !important',
  '.ios-edge-to-edge-visual, .magic-rule-panel-mobile, canvas',
  'grid-template-columns: 1rem minmax(0, 1fr) 0.875rem',
  'grid-template-rows: auto auto',
  'flex-flow: row nowrap',
  'white-space: nowrap',
  'overflow-y: auto',
  'touch-action: pan-y',
];

for (const fragment of requiredStyleFragments) {
  if (!styles.includes(fragment)) {
    throw new Error(`iOS Magic rule panel CSS is missing: ${fragment}`);
  }
}

console.log('iOS Magic rule panel landscape layout verification passed.');
