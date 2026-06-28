import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useApi } from '../hooks/useApi';
import { api } from '../services/api';
import Container from '../components/Container';
import StatCard from '../components/StatCard';
import Panel from '../components/Panel';
import LoadingSpinner from '../components/LoadingSpinner';
import { FiAlertCircle, FiCheckCircle, FiUsers, FiRadio, FiUserPlus, FiCamera, FiVideo, FiActivity } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import styles from './Dashboard.module.css';

const Dashboard = () => {
  const { theme } = useTheme();
  const [alerts, setAlerts] = useState([]);
  const { data: alertsData, loading, refetch } = useApi(() => api.fetchAlerts(), []);

  useEffect(() => {
    if (alertsData) {
      setAlerts(alertsData.alerts || []);
    }
  }, [alertsData]);

  useEffect(() => {
    const interval = setInterval(refetch, 3000);
    return () => clearInterval(interval);
  }, [refetch]);

  const criticalCount = alerts.filter(
    (a) => a.data?.event_type?.includes('critical') || a.data?.event_type?.includes('intrusion')
  ).length;

  const detectionCount = alerts.reduce((sum, a) => sum + (a.data?.detections?.length || 0), 0);

  const getAlertSeverity = (alert) => {
    const eventType = (alert.data?.event_type || '').toLowerCase();
    if (eventType.includes('critical') || eventType.includes('intrusion') || eventType.includes('detection')) {
      return 'danger';
    }
    return 'warning';
  };

  return (
    <Container>
      {/* Console Status Header */}
      <div className={styles.consoleHeader} style={{ borderColor: theme.border }}>
        <div className={styles.consoleTitle}>
          <h2>SECURITY OPERATIONS CONSOLE</h2>
          <p style={{ color: theme.textSecondary }}>System active and monitoring streams</p>
        </div>
        <div className={styles.liveIndicator} style={{ backgroundColor: `${theme.success}10`, borderColor: theme.success }}>
          <div className={styles.livePulse} style={{ backgroundColor: theme.success }} />
          <span style={{ color: theme.success, fontFamily: theme.fontMono }}>LIVE STREAM ONLINE</span>
        </div>
      </div>

      {/* Stats Section */}
      <div className={styles.statsGrid}>
        <StatCard label="Total Alerts" value={alerts.length} icon={FiAlertCircle} color="accent" />
        <StatCard label="Critical Events" value={criticalCount} icon={FiAlertCircle} color="error" />
        <StatCard label="Suspects Logged" value={detectionCount} icon={FiUsers} color="success" />
        <StatCard label="System Status" value="ACTIVE" icon={FiActivity} color="success" />
      </div>

      <div className={styles.mainContent}>
        {/* Alert Feed */}
        <Panel title="Real-Time Surveillance Log">
          {loading && alerts.length === 0 ? (
            <div className={styles.loadingContainer}>
              <LoadingSpinner size="medium" />
              <p style={{ marginTop: '1rem', color: theme.textSecondary }}>Loading feed logs...</p>
            </div>
          ) : alerts.length === 0 ? (
            <div className={styles.emptyState}>
              <FiCheckCircle size={48} style={{ color: theme.success, marginBottom: '1rem' }} />
              <p style={{ color: theme.textPrimary, fontWeight: '600' }}>No active threats detected</p>
              <p style={{ color: theme.textSecondary, fontSize: '0.9rem' }}>Surveillance feeds are clear</p>
            </div>
          ) : (
            <div className={styles.tableContainer}>
              <table className={styles.table} style={{ borderColor: theme.border }}>
                <thead>
                  <tr style={{ borderBottomColor: theme.border }}>
                    <th style={{ color: theme.textSecondary }}>Severity</th>
                    <th style={{ color: theme.textSecondary }}>Event Details</th>
                    <th style={{ color: theme.textSecondary }}>Source</th>
                    <th style={{ color: theme.textSecondary }}>Captured Threat</th>
                    <th style={{ color: theme.textSecondary }}>Log Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {alerts.map((alert, idx) => {
                    const severity = getAlertSeverity(alert);
                    return (
                      <tr key={idx} className={styles.alertRow} style={{ borderBottomColor: theme.border }}>
                        <td>
                          <span 
                            className={`${styles.severityBadge} ${severity === 'danger' ? styles.badgeDanger : styles.badgeWarning}`}
                            style={{ 
                              color: severity === 'danger' ? theme.error : theme.warning,
                              borderColor: severity === 'danger' ? theme.error : theme.warning,
                              backgroundColor: severity === 'danger' ? `${theme.error}15` : `${theme.warning}15`
                            }}
                          >
                            {severity === 'danger' ? 'CRITICAL' : 'WARNING'}
                          </span>
                        </td>
                        <td>
                          <strong style={{ color: theme.textPrimary }}>
                            {alert.data?.event_type?.replace(/_/g, ' ') || 'Unknown Alert'}
                          </strong>
                        </td>
                        <td>
                          <span className={styles.sourceSpan} style={{ color: theme.accent, backgroundColor: `${theme.accent}10` }}>
                            {alert.data?.source || 'Unknown'}
                          </span>
                        </td>
                        <td>
                          {alert.data?.detections?.length > 0 ? (
                            <div className={styles.detectionList}>
                              {alert.data.detections.map((d, dIdx) => (
                                <span 
                                  key={dIdx} 
                                  className={styles.detectionTag} 
                                  style={{ color: theme.error, backgroundColor: `${theme.error}10`, borderColor: `${theme.error}30` }}
                                >
                                  🚨 {d.name} ({d.confidence}%)
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span style={{ color: theme.textSecondary }}>—</span>
                          )}
                        </td>
                        <td style={{ color: theme.textSecondary, fontSize: '0.85rem', fontFamily: theme.fontMono }}>
                          {new Date(alert.received_at).toLocaleTimeString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Panel>

        {/* Quick Actions Panel */}
        <Panel title="Command Operations">
          <div className={styles.actions}>
            <Link 
              to="/register" 
              className={styles.actionBtn} 
              style={{ 
                borderColor: theme.border,
                backgroundColor: theme.background,
                '--hover-glow': `0 8px 24px ${theme.glow}`,
                '--hover-border': theme.accent
              }}
            >
              <div className={styles.actionIconContainer} style={{ backgroundColor: `${theme.accent}12` }}>
                <FiUserPlus size={22} style={{ color: theme.accent }} />
              </div>
              <div className={styles.actionText}>
                <span className={styles.actionTitle} style={{ color: theme.textPrimary }}>Enroll Suspect</span>
                <span className={styles.actionDesc} style={{ color: theme.textSecondary }}>Register facial profile</span>
              </div>
            </Link>
            
            <Link 
              to="/surveillance/image" 
              className={styles.actionBtn} 
              style={{ 
                borderColor: theme.border,
                backgroundColor: theme.background,
                '--hover-glow': `0 8px 24px ${theme.glow}`,
                '--hover-border': theme.accent
              }}
            >
              <div className={styles.actionIconContainer} style={{ backgroundColor: `${theme.accent}12` }}>
                <FiCamera size={22} style={{ color: theme.accent }} />
              </div>
              <div className={styles.actionText}>
                <span className={styles.actionTitle} style={{ color: theme.textPrimary }}>Scan Image</span>
                <span className={styles.actionDesc} style={{ color: theme.textSecondary }}>Static snapshot verification</span>
              </div>
            </Link>
            
            <Link 
              to="/surveillance/video" 
              className={styles.actionBtn} 
              style={{ 
                borderColor: theme.border,
                backgroundColor: theme.background,
                '--hover-glow': `0 8px 24px ${theme.glow}`,
                '--hover-border': theme.accent
              }}
            >
              <div className={styles.actionIconContainer} style={{ backgroundColor: `${theme.accent}12` }}>
                <FiVideo size={22} style={{ color: theme.accent }} />
              </div>
              <div className={styles.actionText}>
                <span className={styles.actionTitle} style={{ color: theme.textPrimary }}>Scan Video</span>
                <span className={styles.actionDesc} style={{ color: theme.textSecondary }}>Stream clip classification</span>
              </div>
            </Link>
            
            <Link 
              to="/camera" 
              className={styles.actionBtn} 
              style={{ 
                borderColor: theme.border,
                backgroundColor: theme.background,
                '--hover-glow': `0 8px 24px ${theme.glow}`,
                '--hover-border': theme.accent
              }}
            >
              <div className={styles.actionIconContainer} style={{ backgroundColor: `${theme.accent}12` }}>
                <FiRadio size={22} style={{ color: theme.accent }} />
              </div>
              <div className={styles.actionText}>
                <span className={styles.actionTitle} style={{ color: theme.textPrimary }}>Live Camera</span>
                <span className={styles.actionDesc} style={{ color: theme.textSecondary }}>Monitor active local feeds</span>
              </div>
            </Link>
          </div>
        </Panel>
      </div>
    </Container>
  );
};

export default Dashboard;
