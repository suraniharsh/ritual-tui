import React, { useRef, useState, useEffect } from 'react';
import { Text, useInput } from 'ink';

type Props = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (value: string) => void;
  onCancel?: () => void;
  placeholder?: string;
  focus?: boolean;
  placeholderColor?: string;
  cursorColor?: string;
  color?: string;
  maxLength?: number;
};

export const ControlledTextInput: React.FC<Props> = ({
  value,
  onChange,
  onSubmit,
  onCancel,
  placeholder,
  focus = true,
  placeholderColor,
  cursorColor = 'white',
  color,
  maxLength,
}) => {
  // Local state for triggering re-renders
  const [, setRenderTrigger] = useState(0);

  // Refs to always have latest values in useInput callback (avoids stale closures)
  const valueRef = useRef(value);
  const cursorRef = useRef(value.length);

  // Track if we sent the last value to parent
  const sentValueRef = useRef(value);

  // Sync with external value changes (only if different from what we sent)
  useEffect(() => {
    if (value !== sentValueRef.current && value !== valueRef.current) {
      // Genuine external change - accept it
      valueRef.current = value;
      cursorRef.current = value.length;
      sentValueRef.current = value;
      setRenderTrigger((prev) => prev + 1);
    }
  }, [value]);

  // Optimized inline key processing - no function call overhead
  // Uses direct key checks with early returns for maximum performance

  // Optimized inline key processing - no function call overhead
  // Uses direct key checks with early returns for maximum performance

  useInput(
    (input, key) => {
      const val = valueRef.current;
      const cur = cursorRef.current;

      // Exit keys (highest priority)
      if (key.escape) {
        onCancel?.();
        return;
      }
      if (key.return) {
        if (val !== sentValueRef.current) {
          onChange(val);
          sentValueRef.current = val;
        }
        onSubmit(val);
        return;
      }
      if (input === '\r' || input === '\n') return;

      let nextValue = val;
      let nextCursor = cur;

      // Backspace/Delete (common operations)
      if (key.backspace) {
        if (key.ctrl) {
          // Delete word backward
          let i = cur - 1;
          while (i >= 0 && val[i] === ' ') i--;
          while (i >= 0 && val[i] !== ' ') i--;
          const wordStart = i + 1;
          nextValue = val.slice(0, wordStart) + val.slice(cur);
          nextCursor = wordStart;
        } else if (cur > 0) {
          nextValue = val.slice(0, cur - 1) + val.slice(cur);
          nextCursor = cur - 1;
        } else return;
      } else if (key.delete) {
        if (cur >= val.length && cur > 0) {
          nextValue = val.slice(0, cur - 1) + val.slice(cur);
          nextCursor = cur - 1;
        } else if (cur < val.length) {
          nextValue = val.slice(0, cur) + val.slice(cur + 1);
        } else return;
      }
      // Simple cursor movement (very common)
      else if (key.leftArrow && !key.ctrl) {
        nextCursor = Math.max(0, cur - 1);
      } else if (key.rightArrow && !key.ctrl) {
        nextCursor = Math.min(val.length, cur + 1);
      }
      // Word-based cursor movement
      else if (key.leftArrow && key.ctrl) {
        let i = cur - 1;
        while (i >= 0 && val[i] === ' ') i--;
        while (i >= 0 && val[i] !== ' ') i--;
        nextCursor = i + 1;
      } else if (key.rightArrow && key.ctrl) {
        let i = cur;
        while (i < val.length && val[i] === ' ') i++;
        while (i < val.length && val[i] !== ' ') i++;
        nextCursor = i;
      } else if (key.meta && input === 'b') {
        let i = cur - 1;
        while (i >= 0 && val[i] === ' ') i--;
        while (i >= 0 && val[i] !== ' ') i--;
        nextCursor = i + 1;
      } else if (key.meta && input === 'f') {
        let i = cur;
        while (i < val.length && val[i] === ' ') i++;
        while (i < val.length && val[i] !== ' ') i++;
        nextCursor = i;
      }
      // Ctrl key combinations
      else if (key.ctrl && input === 'a') {
        nextCursor = 0;
      } else if (key.ctrl && input === 'e') {
        nextCursor = val.length;
      } else if (key.ctrl && input === 'u') {
        nextValue = val.slice(cur);
        nextCursor = 0;
      } else if (key.ctrl && input === 'k') {
        nextValue = val.slice(0, cur);
      } else if (key.ctrl && input === 'w') {
        let i = cur - 1;
        while (i >= 0 && val[i] === ' ') i--;
        while (i >= 0 && val[i] !== ' ') i--;
        const wordStart = i + 1;
        nextValue = val.slice(0, wordStart) + val.slice(cur);
        nextCursor = wordStart;
      }
      // Regular character input
      else if (!key.ctrl && !key.meta && input.length > 0) {
        // Fast path: single printable ASCII character (most common case)
        if (input.length === 1) {
          const code = input.charCodeAt(0);
          if ((code >= 32 && code <= 126) || code > 127) {
            const possibleValue = val.slice(0, cur) + input + val.slice(cur);
            if (!maxLength || possibleValue.length <= maxLength) {
              nextValue = possibleValue;
              nextCursor = cur + 1;
            } else return;
          } else return;
        } else {
          // Slow path: multi-char or needs filtering
          const filtered = Array.from(input)
            .filter((char) => {
              const code = char.codePointAt(0);
              return code !== undefined && ((code >= 32 && code <= 126) || code > 127);
            })
            .join('');
          if (filtered) {
            const possibleValue = val.slice(0, cur) + filtered + val.slice(cur);
            if (!maxLength || possibleValue.length <= maxLength) {
              nextValue = possibleValue;
              nextCursor = cur + filtered.length;
            } else return;
          } else return;
        }
      } else {
        // Unhandled key
        return;
      }

      // Only update if something changed
      if (nextValue !== val || nextCursor !== cur) {
        valueRef.current = nextValue;
        cursorRef.current = nextCursor;
        setRenderTrigger((prev) => prev + 1);
      }
    },
    { isActive: focus },
  );

  // Read from refs for rendering
  const displayValue = valueRef.current;
  const displayCursor = cursorRef.current;
  const showPlaceholder = !displayValue && placeholder;

  // Split text around cursor
  const beforeCursor = displayValue.slice(0, displayCursor);
  const atCursor = displayValue[displayCursor] || ' ';
  const afterCursor = displayValue.slice(displayCursor + 1);

  return (
    <Text>
      {showPlaceholder ? (
        <>
          <Text dimColor color={placeholderColor}>
            {placeholder}
          </Text>
          {focus && <Text backgroundColor={cursorColor}> </Text>}
        </>
      ) : (
        <>
          <Text color={color}>{beforeCursor}</Text>
          {focus ? (
            <Text color={color} backgroundColor={cursorColor}>
              {atCursor}
            </Text>
          ) : (
            <Text color={color}>{atCursor}</Text>
          )}
          <Text color={color}>{afterCursor}</Text>
        </>
      )}
    </Text>
  );
};
