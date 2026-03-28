import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import './Header.css';

const navItems = [
  { path: '/', label: 'Home' },
  { path: '/product', label: 'Product' },
  { path: '/member', label: 'Member' },
  { path: '/data', label: 'Data' },
];

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="site-header">
      <div className="header-inner">
        <NavLink to="/" className="header-logo">
          <img src="/img/kth.svg" alt="Rabbit Cave" />
        </NavLink>

        <nav className={`header-nav ${menuOpen ? 'open' : ''}`}>
          {navItems.map(({ path, label }) => (
            <NavLink
              key={path}
              to={path}
              end={path === '/'}
              className={({ isActive }) =>
                `nav-link ${isActive ? 'active' : ''}`
              }
              onClick={() => setMenuOpen(false)}
            >
              {label}
            </NavLink>
          ))}
        </nav>

        <button
          className={`hamburger ${menuOpen ? 'open' : ''}`}
          onClick={() => setMenuOpen((o) => !o)}
          aria-label="Toggle menu"
        >
          <span />
          <span />
          <span />
        </button>
      </div>
    </header>
  );
}
