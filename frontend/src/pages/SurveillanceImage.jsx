import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { api } from '../services/api';
import Container from '../components/Container';
import Panel from '../components/Panel';
import LoadingSpinner from '../components/LoadingSpinner';
import { FiUploadCloud, FiTrash2, FiMaximize2, FiAlertTriangle, FiCheckCircle } from 'react-icons/fi';
import styles from './SurveillanceImage.module.css';

const SurveillanceImage = () => {
  const { theme } = useTheme();
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target.result);
      reader.readAsDataURL(file);
      setError('');
      setResults(null);
    }
  };

  const handleImageDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setImage(file);
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target.result);
      reader.readAsDataURL(file);
      setError('');
      setResults(null);
    }
  };

  const handleAnalyze = async () => {
    if (!image) {
      setError('Please select an image first');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const response = await api.analyzeImage(image);
      setResults(response);
    } catch (err) {
      setError(err.message || 'Image scan sequence failed');
    } finally {
      setLoading(false);
    }
  };

  const resetScanner = () => {
    setImage(null);
    setImagePreview(null);
    setResults(null);
    setError('');
  };

  return (
    <Container>
      {/* Page Header */}
      <div className={styles.pageHeader} style={{ borderColor: theme.border }}>
        <h2>FACIAL RECOGNITION SCANNER</h2>
        <p style={{ color: theme.textSecondary }}>Upload static surveillance snapshots to detect watchlist targets</p>
      </div>

      <div className={styles.scannerLayout}>
        {/* Left Column: Image Area */}
        <div className={styles.leftCol}>
          <Panel title="Surveillance Stream Feed">
            <div className={styles.content}>
              {imagePreview ? (
                <div className={`${styles.previewContainer} ${loading ? 'scanline-container' : ''}`}>
                  {results && results.image_id ? (
                    <img 
                      src={`http://localhost:5000/uploads/${results.image_id}_processed.png`} 
                      alt="Processed Scan" 
                      className={styles.mainImage} 
                    />
                  ) : (
                    <img src={imagePreview} alt="Target Source" className={styles.mainImage} />
                  )}
                  
                  {!loading && !results && (
                    <button 
                      onClick={resetScanner} 
                      className={styles.resetBadge} 
                      style={{ color: theme.error, backgroundColor: `${theme.error}15`, borderColor: theme.error }}
                    >
                      <FiTrash2 size={13} style={{ marginRight: '4px' }} /> CLEAR
                    </button>
                  )}
                </div>
              ) : (
                <div
                  className={styles.uploadArea}
                  onDrop={handleImageDrop}
                  onDragOver={(e) => e.preventDefault()}
                  style={{
                    borderColor: theme.border,
                    backgroundColor: theme.borderLight,
                  }}
                  onClick={() => document.getElementById('image-input').click()}
                >
                  <div className={styles.uploadPrompt}>
                    <FiUploadCloud size={44} className={styles.uploadIcon} style={{ color: theme.accent }} />
                    <p style={{ fontWeight: '600', marginTop: '1rem' }}>DRAG & DROP IMAGE FILE</p>
                    <p style={{ color: theme.textSecondary, fontSize: '0.85rem' }}>or click to browse local storage</p>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageSelect}
                      style={{ display: 'none' }}
                      id="image-input"
                    />
                  </div>
                </div>
              )}

              {error && (
                <div
                  className={styles.error}
                  style={{ borderColor: theme.error, color: theme.error, backgroundColor: `${theme.error}10` }}
                >
                  <FiAlertTriangle style={{ marginRight: '8px' }} /> {error}
                </div>
              )}

              {/* Action Trigger */}
              {imagePreview && !results && !loading && (
                <button
                  onClick={handleAnalyze}
                  style={{ backgroundColor: theme.accent }}
                  className="btn-primary"
                  type="button"
                >
                  <FiMaximize2 size={16} /> INITIALIZE FACE SCAN
                </button>
              )}

              {loading && (
                <div className={styles.statusDisplay} style={{ color: theme.accent }}>
                  <LoadingSpinner size="small" />
                  <span style={{ fontFamily: theme.fontMono }}>PROCESSING RECOGNITION PIPELINE...</span>
                </div>
              )}
            </div>
          </Panel>
        </div>

        {/* Right Column: Scan Dossier Analysis */}
        <div className={styles.rightCol}>
          <Panel title="Scan Output telemetry">
            {!results && !loading && (
              <div className={styles.dossierEmpty}>
                <FiUploadCloud size={32} style={{ opacity: 0.3, marginBottom: '0.75rem' }} />
                <p style={{ color: theme.textSecondary }}>Waiting for snapshot scanning sequence initialization...</p>
              </div>
            )}
            
            {loading && (
              <div className={styles.dossierEmpty}>
                <div className={styles.scanRadar} style={{ borderColor: theme.accent, borderTopColor: 'transparent' }} />
                <p style={{ color: theme.textSecondary, marginTop: '1rem' }}>Extracting facial vectors...</p>
              </div>
            )}

            {results && (
              <div className={styles.resultsPanel}>
                <div className={styles.resultsSummary}>
                  {results.watched_count > 0 ? (
                    <div className={styles.alertHeader} style={{ borderColor: theme.error, backgroundColor: `${theme.error}10` }}>
                      <FiAlertTriangle size={24} style={{ color: theme.error }} />
                      <div className={styles.alertHeaderText}>
                        <h4 style={{ color: theme.error }}>THREAT DETECTED</h4>
                        <span style={{ color: theme.textSecondary }}>{results.watched_count} match(es) registered in watchlist</span>
                      </div>
                    </div>
                  ) : (
                    <div className={styles.alertHeader} style={{ borderColor: theme.success, backgroundColor: `${theme.success}10` }}>
                      <FiCheckCircle size={24} style={{ color: theme.success }} />
                      <div className={styles.alertHeaderText}>
                        <h4 style={{ color: theme.success }}>NO SUSPECTS FOUND</h4>
                        <span style={{ color: theme.textSecondary }}>No watchlisted face profiles matched</span>
                      </div>
                    </div>
                  )}
                </div>

                <h4 className={styles.resultsSubtitle} style={{ color: theme.textPrimary, borderBottomColor: theme.border }}>MATCH TELEMETRY LOG</h4>

                {results.detections && results.detections.length > 0 ? (
                  <div className={styles.detectionsList}>
                    {results.detections.map((detection, idx) => (
                      <div
                        key={idx}
                        className={styles.detectionCard}
                        style={{
                          borderColor: theme.border,
                          backgroundColor: theme.borderLight,
                        }}
                      >
                        <div className={styles.dossierRow}>
                          <span className={styles.suspectLabel} style={{ color: theme.textPrimary }}>SUSPECT NAME:</span>
                          <span className={styles.suspectName} style={{ color: theme.error }}>{detection.name}</span>
                        </div>
                        <div className={styles.dossierRow}>
                          <span className={styles.suspectLabel} style={{ color: theme.textSecondary }}>MATCH ACCURACY:</span>
                          <span className={styles.suspectConf} style={{ color: theme.success, fontFamily: theme.fontMono }}>
                            {parseFloat(detection.confidence).toFixed(1)}% CONFIDENCE
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className={styles.noDetections}>
                    <p style={{ color: theme.textSecondary }}>No faces recognized in static framework.</p>
                  </div>
                )}

                <button
                  onClick={resetScanner}
                  style={{ color: theme.accent, borderColor: theme.accent }}
                  className={styles.resetBtn}
                >
                  SCAN NEW SNAPSHOT
                </button>
              </div>
            )}
          </Panel>
        </div>
      </div>
    </Container>
  );
};

export default SurveillanceImage;
