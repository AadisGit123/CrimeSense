import React from 'react';
import { useTheme } from '../context/ThemeContext';
import styles from './LoadingSpinner.module.css';

const LoadingSpinner = ({ size = 'medium' }) => {
  const { theme } = useTheme();

  const sizeClass = `spinner-${size}`;

  return (
    <div className={`${styles.container} ${styles[sizeClass]}`}>
      <div className={styles.spinnerWrapper}>
        <div className={styles.spinnerOuter} style={{ borderColor: `${theme.accent}20`, borderTopColor: theme.accent }} />
        <div className={styles.spinnerInner} style={{ borderColor: `${theme.success}20`, borderBottomColor: theme.success }} />
        <div className={styles.pulseNode} style={{ backgroundColor: theme.accent }} />
      </div>
    </div>
  );
};

export default LoadingSpinner;
