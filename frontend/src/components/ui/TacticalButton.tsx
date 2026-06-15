import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import './TacticalButton.css';

interface TacticalButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'primary' | 'danger';
  size?: 'default' | 'large';
  fullWidth?: boolean;
  children: ReactNode;
}

export function TacticalButton({
  variant = 'default',
  size = 'default',
  fullWidth = false,
  children,
  onClick,
  onMouseEnter,
  disabled,
  ...props
}: TacticalButtonProps) {
  const { playHover, playClick } = useSoundEffects();

  const className = [
    'tactical-btn',
    variant !== 'default' && `tactical-btn--${variant}`,
    size === 'large' && 'tactical-btn--large',
    fullWidth && 'tactical-btn--full',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      className={className}
      disabled={disabled}
      onClick={(e) => {
        if (!disabled) playClick();
        onClick?.(e);
      }}
      onMouseEnter={(e) => {
        if (!disabled) playHover();
        onMouseEnter?.(e);
      }}
      {...props}
    >
      {children}
    </button>
  );
}
