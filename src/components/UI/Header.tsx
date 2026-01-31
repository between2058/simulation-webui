import './Header.css';

interface HeaderProps {
  title?: string;
  subtitle?: string;
}

export function Header({
  title = 'ROBOT DOG SIMULATION',
  subtitle = 'UNITREE GO2 · MuJoCo Physics Engine'
}: HeaderProps) {
  return (
    <header className="header">
      <div className="header__brand">
        <div className="header__logo">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
          </svg>
        </div>
        <div className="header__titles">
          <h1 className="header__title">{title}</h1>
          <p className="header__subtitle">{subtitle}</p>
        </div>
      </div>

      <div className="header__status">
        <div className="header__status-item">
          <span className="header__status-dot header__status-dot--active" />
          <span className="header__status-label">PHYSICS</span>
        </div>
        <div className="header__status-item">
          <span className="header__status-dot header__status-dot--active" />
          <span className="header__status-label">RENDERER</span>
        </div>
        <div className="header__status-item">
          <span className="header__status-dot" />
          <span className="header__status-label">GO2</span>
        </div>
      </div>

      <div className="header__line" />
    </header>
  );
}
