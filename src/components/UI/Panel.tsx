import type { ReactNode, CSSProperties } from 'react';
import './Panel.css';

interface PanelProps {
  children: ReactNode;
  title?: string;
  className?: string;
  style?: CSSProperties;
  variant?: 'default' | 'floating' | 'minimal';
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  collapsible?: boolean;
  defaultCollapsed?: boolean;
}

export function Panel({
  children,
  title,
  className = '',
  style,
  variant = 'default',
  position,
}: PanelProps) {
  const positionClass = position ? `panel--${position}` : '';

  return (
    <div
      className={`panel panel--${variant} ${positionClass} ${className}`}
      style={style}
    >
      {title && (
        <div className="panel__header">
          <div className="panel__header-accent" />
          <h3 className="panel__title">{title}</h3>
          <div className="panel__header-line" />
        </div>
      )}
      <div className="panel__content">
        {children}
      </div>
      <div className="panel__corner panel__corner--tl" />
      <div className="panel__corner panel__corner--tr" />
      <div className="panel__corner panel__corner--bl" />
      <div className="panel__corner panel__corner--br" />
    </div>
  );
}
