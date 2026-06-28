import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import Header from './components/Header';
import './styles/global.css';

// Pages
import Dashboard from './pages/Dashboard';
import Register from './pages/Register';
import CriminalsList from './pages/CriminalsList';
import SurveillanceImage from './pages/SurveillanceImage';
import SurveillanceVideo from './pages/SurveillanceVideo';
import Camera from './pages/Camera';

const AppLayout = () => {
  const { theme } = useTheme();

  return (
    <div
      style={{
        backgroundColor: theme.background,
        color: theme.textPrimary,
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        // Dynamic CSS variables binding for CSS module inheritance
        '--bg': theme.background,
        '--surface': theme.surface,
        '--surface-card': theme.surfaceCard,
        '--text-primary': theme.textPrimary,
        '--text-secondary': theme.textSecondary,
        '--accent': theme.accent,
        '--accent-hover': theme.accentHover,
        '--border': theme.border,
        '--border-light': theme.borderLight,
        '--success': theme.success,
        '--warning': theme.warning,
        '--error': theme.error,
        '--shadow': theme.shadow,
        '--glow': theme.glow,
        '--glow-red': theme.glowRed,
      }}
    >
      <Header />
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/register" element={<Register />} />
        <Route path="/criminals" element={<CriminalsList />} />
        <Route path="/surveillance/image" element={<SurveillanceImage />} />
        <Route path="/surveillance/video" element={<SurveillanceVideo />} />
        <Route path="/camera" element={<Camera />} />
      </Routes>
    </div>
  );
};

function App() {
  return (
    <ThemeProvider>
      <Router>
        <AppLayout />
      </Router>
    </ThemeProvider>
  );
}

export default App;
