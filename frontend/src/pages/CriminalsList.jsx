import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useApi } from '../hooks/useApi';
import { api } from '../services/api';
import Container from '../components/Container';
import Panel from '../components/Panel';
import LoadingSpinner from '../components/LoadingSpinner';
import StatCard from '../components/StatCard';
import { FiUsers, FiSearch, FiFileText, FiUser, FiCalendar, FiActivity } from 'react-icons/fi';
import styles from './CriminalsList.module.css';

const CriminalsList = () => {
  const { theme } = useTheme();
  const [criminals, setCriminals] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const { data: criminalsData, loading } = useApi(() => api.fetchCriminals(), []);

  useEffect(() => {
    if (criminalsData) {
      setCriminals(criminalsData.criminals || criminalsData || []);
    }
  }, [criminalsData]);

  const filteredCriminals = criminals.filter((criminal) =>
    criminal.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    criminal.crimes?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Container>
      {/* Page Title */}
      <div className={styles.pageHeader} style={{ borderColor: theme.border }}>
        <h2>INTELLIGENCE WATCHLIST DATABASE</h2>
        <p style={{ color: theme.textSecondary }}>System-wide directory of registered suspect records</p>
      </div>

      {/* Stats */}
      <div className={styles.statsSection}>
        <StatCard label="Suspect Records" value={criminals.length} icon={FiUsers} color="accent" />
        <StatCard label="Filtered Targets" value={filteredCriminals.length} icon={FiActivity} color="success" />
      </div>

      {/* Criminals Panel */}
      <Panel title="Suspect Dossier Gallery">
        <div className={styles.searchBox} style={{ borderColor: theme.border, backgroundColor: theme.borderLight }}>
          <FiSearch className={styles.searchIcon} style={{ color: theme.textSecondary }} />
          <input
            type="text"
            placeholder="Filter database by name or charge classification..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              backgroundColor: 'transparent',
              color: theme.textPrimary,
              border: 'none',
              padding: 0,
              boxShadow: 'none'
            }}
          />
        </div>

        {loading ? (
          <div className={styles.loadingContainer}>
            <LoadingSpinner size="medium" />
            <p style={{ marginTop: '1rem', color: theme.textSecondary }}>Accessing security mainframe...</p>
          </div>
        ) : filteredCriminals.length === 0 ? (
          <div className={styles.emptyState}>
            <p style={{ color: theme.textPrimary, fontWeight: '600' }}>No files found in registry</p>
            <p style={{ color: theme.textSecondary, fontSize: '0.9rem' }}>Verify filter parameters or enroll a new suspect</p>
          </div>
        ) : (
          <div className={styles.criminalsGrid}>
            {filteredCriminals.map((criminal, idx) => (
              <div
                key={idx}
                className={styles.criminalCard}
                style={{
                  borderColor: theme.border,
                  backgroundColor: theme.surface,
                  boxShadow: `0 4px 15px ${theme.shadow}`,
                  '--glow-color': theme.accent
                }}
              >
                {/* Dossier Badge Overlay */}
                <span className={styles.dossierBadge} style={{ color: theme.error, borderColor: theme.error }}>
                  DOSSIER // DEPT
                </span>

                <div className={styles.cardImage} style={{ borderColor: theme.border }}>
                  {criminal.profile_pic ? (
                    <img src={`http://localhost:5000/${criminal.profile_pic}`} alt={criminal.name} className={styles.suspectPic} />
                  ) : (
                    <div className={styles.placeholder} style={{ backgroundColor: theme.borderLight, color: theme.textSecondary }}>
                      <FiUser size={48} />
                      <span>NO IMAGE AVAILABLE</span>
                    </div>
                  )}
                </div>

                <div className={styles.cardContent}>
                  <h3 className={styles.suspectName} style={{ color: theme.textPrimary, fontFamily: theme.fontTitle }}>{criminal.name}</h3>
                  
                  <div className={styles.dossierGrid}>
                    <div className={styles.detailRow} style={{ borderBottomColor: theme.borderLight }}>
                      <span className={styles.detailLabel} style={{ color: theme.textSecondary }}>FATHER:</span>
                      <span className={styles.detailValue} style={{ color: theme.textPrimary }}>{criminal.father_name || 'UNKNOWN'}</span>
                    </div>
                    <div className={styles.detailRow} style={{ borderBottomColor: theme.borderLight }}>
                      <span className={styles.detailLabel} style={{ color: theme.textSecondary }}>GENDER:</span>
                      <span className={styles.detailValue} style={{ color: theme.textPrimary }}>{criminal.gender || 'UNKNOWN'}</span>
                    </div>
                    <div className={styles.detailRow} style={{ borderBottomColor: theme.borderLight }}>
                      <span className={styles.detailLabel} style={{ color: theme.textSecondary }}>D.O.B:</span>
                      <span className={styles.detailValue} style={{ color: theme.textPrimary }}>{criminal.dob || 'UNKNOWN'}</span>
                    </div>
                  </div>

                  <div className={styles.crimesContainer}>
                    <div className={styles.crimeLabel} style={{ color: theme.textSecondary }}>
                      <FiFileText size={14} style={{ marginRight: '4px' }} /> CHARGES / CLASSIFICATION:
                    </div>
                    <div className={styles.crimeDetails} style={{ color: theme.error, backgroundColor: `${theme.error}10`, borderColor: `${theme.error}25` }}>
                      {criminal.crimes || 'No recorded convictions'}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </Container>
  );
};

export default CriminalsList;
