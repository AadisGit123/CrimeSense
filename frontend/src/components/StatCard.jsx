import React from 'react';
import { useTheme } from '../context/ThemeContext';
import styles from './StatCard.module.css';

const StatCard = ({ label, value, icon: Icon, color = 'accent' }) => {
  const { theme } = useTheme();

  // Get matching theme color variables
  const colorValue = theme[color] || theme.accent;
  
  // Custom neon glows based on color classification
  const glowShadow = color === 'error' 
    ? '0 0 15px rgba(244, 63, 94, 0.25)' 
    : color === 'success'
    ? '0 0 15px rgba(16, 185, 129, 0.25)'
    : `0 0 15px ${theme.glow}`;

  return (
    <div 
      className={styles.card} 
      style={{ 
        borderColor: theme.border,
        backgroundColor: theme.surfaceCard,
        '--hover-glow': glowShadow,
        '--hover-border': colorValue
      }}
    >
      <div className={styles.header}>
        {Icon && (
          <div className={styles.iconContainer} style={{ backgroundColor: `${colorValue}15` }}>
            <Icon size={20} color={colorValue} />
          </div>
        )}
        <span style={{ color: theme.textSecondary }} className={styles.label}>
          {label}
        </span>
      </div>
      <div 
        className={styles.value} 
        style={{ 
          color: colorValue,
          fontFamily: theme.fontMono 
        }}
      >
        {value}
      </div>
    </div>
  );
};

export default StatCard;
