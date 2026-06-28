import React from 'react';
import { useTheme } from '../context/ThemeContext';
import styles from './Panel.module.css';

const Panel = ({ title, children, className = '' }) => {
  const { theme } = useTheme();

  return (
    <div
      className={`${styles.panel} ${className}`}
      style={{ 
        backgroundColor: theme.surfaceCard, 
        borderColor: theme.border,
        boxShadow: `0 8px 32px ${theme.shadow}`
      }}
    >
      {title && (
        <div className={styles.header} style={{ borderBottomColor: theme.border }}>
          <h3 style={{ color: theme.accent, fontFamily: theme.fontTitle }}>{title}</h3>
        </div>
      )}
      <div className={styles.body}>{children}</div>
    </div>
  );
};

export default Panel;
