import React from 'react';
import type { LanguageMode } from '../types';
import { trans } from '../utils/textUtils';

const TRANSLATED_STRING_PROPS = new Set(['alt', 'aria-label', 'placeholder', 'title']);

const translatePreservingWhitespace = (value: string, mode: LanguageMode): string => {
  if (mode === 'JAPANESE' || value.trim() === '') return value;
  const leading = value.match(/^\s*/)?.[0] ?? '';
  const trailing = value.match(/\s*$/)?.[0] ?? '';
  const core = value.slice(leading.length, value.length - trailing.length);
  return `${leading}${trans(core, mode)}${trailing}`;
};

const translateNode = (node: React.ReactNode, mode: LanguageMode): React.ReactNode => {
  if (typeof node === 'string') return translatePreservingWhitespace(node, mode);
  if (Array.isArray(node)) return node.map((child) => translateNode(child, mode));
  if (!React.isValidElement(node)) return node;

  const props = node.props as Record<string, unknown>;
  const translatedProps: Record<string, unknown> = {};
  for (const propName of TRANSLATED_STRING_PROPS) {
    if (typeof props[propName] === 'string') {
      translatedProps[propName] = translatePreservingWhitespace(props[propName], mode);
    }
  }
  if ('children' in props) translatedProps.children = React.Children.map(props.children as React.ReactNode, (child) => translateNode(child, mode));
  return React.cloneElement(node, translatedProps);
};

const TranslatedUiTree: React.FC<{ mode: LanguageMode; children: React.ReactNode }> = ({ mode, children }) => (
  <>{translateNode(children, mode)}</>
);

export default TranslatedUiTree;
