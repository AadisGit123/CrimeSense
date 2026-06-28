import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FiMoon, FiSun, FiMenu, FiX, FiShield } from 'react-icons/fi';
import { useTheme } from '../context/ThemeContext';
import styles from './Header.module.css';

const Header = () => {
  const { theme, isDark, toggleTheme } = useTheme();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path) => location.pathname === path;

  const links = [
    { name: 'Dashboard', path: '/' },
    { name: 'Register', path: '/register' },
    { name: 'Criminals', path: '/criminals' },
    { name: 'Image Scan', path: '/surveillance/image' },
    { name: 'Video Scan', path: '/surveillance/video' },
    { name: 'Live Camera', path: '/camera' },
  ];

  return (
    <header 
      className={styles.headerContainer} 
      style={{ 
        backgroundColor: theme.surfaceCard, 
        borderBottomColor: theme.border,
        boxShadow: `0 4px 20px ${theme.shadow}`
      }}
    >
      <nav className={styles.header}>
        <div className={styles.logo}>
          <Link to="/" className={styles.logoText} style={{ color: theme.accent }}>
            <FiShield className={styles.logoIcon} style={{ color: theme.accent }} />
            <span>CRIMESENSE</span>
          </Link>
        </div>

        {/* Desktop Links */}
        <div className={styles.navLinks}>
          {links.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`${styles.navLink} ${isActive(link.path) ? styles.active : ''}`}
              style={{ 
                color: isActive(link.path) ? theme.accent : theme.textSecondary,
                '--hover-color': theme.accent,
                '--active-border': theme.accent
              }}
            >
              {link.name}
            </Link>
          ))}
        </div>

        <div className={styles.actions}>
          <button
            className={styles.themeToggle}
            onClick={toggleTheme}
            title={isDark ? 'Switch to Light Console' : 'Switch to Dark Console'}
            style={{ color: theme.accent, backgroundColor: theme.borderLight }}
          >
            {isDark ? <FiSun size={18} /> : <FiMoon size={18} />}
          </button>
          
          <button 
            className={styles.mobileMenuToggle}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={{ color: theme.textPrimary }}
          >
            {mobileMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
          </button>
        </div>
      </nav>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div 
          className={styles.mobileDrawer}
          style={{ backgroundColor: theme.surface, borderTopColor: theme.border }}
        >
          {links.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              onClick={() => setMobileMenuOpen(false)}
              className={`${styles.mobileNavLink} ${isActive(link.path) ? styles.mobileActive : ''}`}
              style={{ 
                color: isActive(link.path) ? theme.accent : theme.textPrimary,
                borderBottomColor: theme.borderLight
              }}
            >
              {link.name}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
};

export default Header;
