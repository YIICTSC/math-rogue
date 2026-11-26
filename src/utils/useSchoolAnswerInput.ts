import { useRef } from 'react';
import type { ChangeEvent, CompositionEvent } from 'react';

export function useSchoolAnswerInput(setInput: (value: string) => void, checkCorrect: (value: string) => void) {
  const composing = useRef(false);
  return {
    isComposing: () => composing.current,
    onChange: (event: ChangeEvent<HTMLInputElement>) => {
      const value = event.currentTarget.value;
      setInput(value);
      if (!composing.current && !(event.nativeEvent as InputEvent).isComposing) checkCorrect(value);
    },
    onCompositionStart: () => { composing.current = true; },
    onCompositionEnd: (event: CompositionEvent<HTMLInputElement>) => {
      composing.current = false;
      const value = event.currentTarget.value;
      setInput(value);
      checkCorrect(value);
    },
  };
}
