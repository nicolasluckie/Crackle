import { useEffect, useState, useRef } from 'react';
import { motion } from 'motion/react';
import type { HTMLMotionProps } from 'motion/react';

const styles = {
  wrapper: {
    display: 'inline-block',
    whiteSpace: 'pre-wrap'
  },
  srOnly: {
    position: 'absolute' as 'absolute',
    width: '1px',
    height: '1px',
    padding: 0,
    margin: '-1px',
    overflow: 'hidden',
    clip: 'rect(0,0,0,0)',
    border: 0
  }
};

interface DecryptedTextProps extends HTMLMotionProps<'span'> {
  text: string;
  speed?: number;
  maxIterations?: number;
  sequential?: boolean;
  revealDirection?: 'start' | 'end' | 'center';
  useOriginalCharsOnly?: boolean;
  characters?: string;
  className?: string;
  parentClassName?: string;
  encryptedClassName?: string;
  animateOn?: 'view' | 'hover' | 'both';
  revealByColumn?: boolean;
}

export default function DecryptedText({
  text,
  speed = 50,
  maxIterations = 10,
  sequential = false,
  revealDirection = 'start',
  useOriginalCharsOnly = false,
  characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz!@#$%^&*()_+',
  className = '',
  parentClassName = '',
  encryptedClassName = '',
  animateOn = 'hover',
  revealByColumn = false,
  ...props
}: DecryptedTextProps) {
  const [displayText, setDisplayText] = useState<string>(text);
  const [isHovering, setIsHovering] = useState<boolean>(false);
  const [isScrambling, setIsScrambling] = useState<boolean>(false);
  const [revealedIndices, setRevealedIndices] = useState<Set<number>>(new Set());
  const [hasAnimated, setHasAnimated] = useState<boolean>(false);
  const containerRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    let currentIteration = 0;

    const getNextIndex = (revealedSet: Set<number>): number => {
      const textLength = text.length;

      // If revealing by column, find all characters at the next column position
      if (revealByColumn) {
        const lines = text.split('\n');
        const maxLineLength = Math.max(...lines.map(line => line.length));

        // Determine which column to reveal next based on direction
        let targetColumn: number;
        const revealedColumns = new Set<number>();

        // Build a map of index to column position
        const indexToColumn = new Map<number, number>();
        let currentIndex = 0;
        lines.forEach(line => {
          for (let col = 0; col < line.length; col++) {
            indexToColumn.set(currentIndex, col);
            currentIndex++;
          }
          currentIndex++; // account for newline
        });

        // Find which columns are already revealed
        revealedSet.forEach(idx => {
          const col = indexToColumn.get(idx);
          if (col !== undefined) revealedColumns.add(col);
        });

        // Get next column based on direction
        switch (revealDirection) {
          case 'start':
            targetColumn = revealedColumns.size === 0 ? 0 : Math.max(...Array.from(revealedColumns)) + 1;
            break;
          case 'end':
            targetColumn = revealedColumns.size === 0 ? maxLineLength - 1 : Math.min(...Array.from(revealedColumns)) - 1;
            break;
          case 'center':
            const middle = Math.floor(maxLineLength / 2);
            const offset = Math.floor(revealedColumns.size / 2);
            targetColumn = revealedColumns.size % 2 === 0 ? middle + offset : middle - offset - 1;
            break;
          default:
            targetColumn = revealedColumns.size;
        }

        // Find the first unrevealed index at this column
        for (const [idx, col] of indexToColumn.entries()) {
          if (col === targetColumn && !revealedSet.has(idx)) {
            return idx;
          }
        }

        // Fallback: find any unrevealed index
        for (let i = 0; i < textLength; i++) {
          if (!revealedSet.has(i) && text[i] !== '\n') return i;
        }
        return revealedSet.size;
      }

      // Original logic for non-column-based revealing
      switch (revealDirection) {
        case 'start':
          return revealedSet.size;
        case 'end':
          return textLength - 1 - revealedSet.size;
        case 'center': {
          const middle = Math.floor(textLength / 2);
          const offset = Math.floor(revealedSet.size / 2);
          const nextIndex = revealedSet.size % 2 === 0 ? middle + offset : middle - offset - 1;

          if (nextIndex >= 0 && nextIndex < textLength && !revealedSet.has(nextIndex)) {
            return nextIndex;
          }

          for (let i = 0; i < textLength; i++) {
            if (!revealedSet.has(i)) return i;
          }
          return 0;
        }
        default:
          return revealedSet.size;
      }
    };

    const availableChars = useOriginalCharsOnly
      ? Array.from(new Set(text.split(''))).filter(char => char !== ' ')
      : characters.split('');

    const shuffleText = (originalText: string, currentRevealed: Set<number>): string => {
      if (useOriginalCharsOnly) {
        const positions = originalText.split('').map((char, i) => ({
          char,
          isSpace: char === ' ',
          index: i,
          isRevealed: currentRevealed.has(i)
        }));

        const nonSpaceChars = positions.filter(p => !p.isSpace && !p.isRevealed).map(p => p.char);

        for (let i = nonSpaceChars.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [nonSpaceChars[i], nonSpaceChars[j]] = [nonSpaceChars[j], nonSpaceChars[i]];
        }

        let charIndex = 0;
        return positions
          .map(p => {
            if (p.isSpace) return ' ';
            if (p.isRevealed) return originalText[p.index];
            return nonSpaceChars[charIndex++];
          })
          .join('');
      } else {
        return originalText
          .split('')
          .map((char, i) => {
            if (char === ' ') return ' ';
            if (currentRevealed.has(i)) return originalText[i];
            return availableChars[Math.floor(Math.random() * availableChars.length)];
          })
          .join('');
      }
    };

    if (isHovering) {
      setIsScrambling(true);
      interval = setInterval(() => {
        setRevealedIndices(prevRevealed => {
          if (sequential) {
            if (prevRevealed.size < text.length) {
              const newRevealed = new Set(prevRevealed);

              if (revealByColumn) {
                // Reveal all characters at the same column position simultaneously
                const lines = text.split('\n');
                const indexToColumn = new Map<number, number>();
                let currentIndex = 0;

                lines.forEach(line => {
                  for (let col = 0; col < line.length; col++) {
                    indexToColumn.set(currentIndex, col);
                    currentIndex++;
                  }
                  currentIndex++; // account for newline
                });

                // Find which column to reveal next
                const revealedColumns = new Set<number>();
                prevRevealed.forEach(idx => {
                  const col = indexToColumn.get(idx);
                  if (col !== undefined) revealedColumns.add(col);
                });

                const maxLineLength = Math.max(...lines.map(line => line.length));
                let targetColumn: number;

                switch (revealDirection) {
                  case 'start':
                    targetColumn = revealedColumns.size === 0 ? 0 : Math.max(...Array.from(revealedColumns)) + 1;
                    break;
                  case 'end':
                    targetColumn = revealedColumns.size === 0 ? maxLineLength - 1 : Math.min(...Array.from(revealedColumns)) - 1;
                    break;
                  case 'center':
                    const middle = Math.floor(maxLineLength / 2);
                    const offset = Math.floor(revealedColumns.size / 2);
                    targetColumn = revealedColumns.size % 2 === 0 ? middle + offset : middle - offset - 1;
                    break;
                  default:
                    targetColumn = revealedColumns.size;
                }

                // Reveal all characters at this column across all lines
                for (const [idx, col] of indexToColumn.entries()) {
                  if (col === targetColumn && !prevRevealed.has(idx) && text[idx] !== '\n') {
                    newRevealed.add(idx);
                  }
                }
              } else {
                // Original single-character reveal logic
                const nextIndex = getNextIndex(prevRevealed);
                newRevealed.add(nextIndex);
              }

              setDisplayText(shuffleText(text, newRevealed));
              return newRevealed;
            } else {
              clearInterval(interval);
              setIsScrambling(false);
              return prevRevealed;
            }
          } else {
            setDisplayText(shuffleText(text, prevRevealed));
            currentIteration++;
            if (currentIteration >= maxIterations) {
              clearInterval(interval);
              setIsScrambling(false);
              setDisplayText(text);
            }
            return prevRevealed;
          }
        });
      }, speed);
    } else {
      setDisplayText(text);
      setRevealedIndices(new Set());
      setIsScrambling(false);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isHovering, text, speed, maxIterations, sequential, revealDirection, characters, useOriginalCharsOnly]);

  useEffect(() => {
    if (animateOn !== 'view' && animateOn !== 'both') return;

    const observerCallback = (entries: IntersectionObserverEntry[]) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !hasAnimated) {
          setIsHovering(true);
          setHasAnimated(true);
        }
      });
    };

    const observerOptions = {
      root: null,
      rootMargin: '0px',
      threshold: 0.1
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);
    const currentRef = containerRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [animateOn, hasAnimated]);

  const hoverProps =
    animateOn === 'hover' || animateOn === 'both'
      ? {
          onMouseEnter: () => setIsHovering(true),
          onMouseLeave: () => setIsHovering(false)
        }
      : {};

  return (
    <motion.span className={parentClassName} ref={containerRef} style={styles.wrapper} {...hoverProps} {...props}>
      <span style={styles.srOnly}>{displayText}</span>

      <span aria-hidden="true">
        {displayText.split('').map((char, index) => {
          const isRevealedOrDone = revealedIndices.has(index) || !isScrambling || !isHovering;

          return (
            <span key={index} className={isRevealedOrDone ? className : encryptedClassName}>
              {char}
            </span>
          );
        })}
      </span>
    </motion.span>
  );
}
