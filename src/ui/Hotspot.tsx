import type { KeyboardEvent, ReactNode } from 'react';

/** Klick- und tastaturbedienbarer Bereich im Schreibtischbild (gemeinsam für beide Grafikstile) */
export function Hotspot({
  id,
  label,
  onSelect,
  selected,
  children,
}: {
  id: string;
  label: string;
  onSelect: (id: string) => void;
  selected: boolean;
  children: ReactNode;
}) {
  const key = (e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelect(id);
    }
  };
  return (
    <g
      className={`hotspot${selected ? ' selected' : ''}`}
      role="button"
      tabIndex={0}
      aria-label={label}
      data-hotspot={id}
      onClick={() => onSelect(id)}
      onKeyDown={key}
    >
      <title>{label}</title>
      {children}
    </g>
  );
}
