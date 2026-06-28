import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { api } from '../services/api';
import Container from '../components/Container';
import Panel from '../components/Panel';
import LoadingSpinner from '../components/LoadingSpinner';
import { FiUploadCloud, FiTrash2, FiPlay, FiAlertTriangle, FiCheckCircle, FiFilm } from 'react-icons/fi';
import styles from './SurveillanceVideo.module.css';

const SurveillanceVideo = () => {
  const { theme } = useTheme();
  const [video, setVideo] = useState(null);
  const [videoName, setVideoName] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleVideoSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setVideo(file);
      setVideoName(file.name);
      setError('');
      setResults(null);
    }
  };

  const handleVideoDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('video/')) {
      setVideo(file);
      setVideoName(file.name);
      setError('');
      setResults(null);
    }
  };

  const handleAnalyze = async () => {
    if (!video) {
      setError('Please select a video file first');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const response = await api.analyzeVideo(video);
      setResults(response);
    } catch (err) {
      setError(err.message || 'Video processing timeline failed');
    } finally {
      setLoading(false);
    }
  };

  const resetScanner = () => {
    setVideo(null);
    setVideoName('');
    setResults(null);
    setError('');
  };

  return (
    <Container>
      {/* Page Header */}
      <div className={styles.pageHeader} style={{ borderColor: theme.border }}>
        <h2>VIDEO SURVEILLANCE PIPELINE</h2>
        <p style={{ color: theme.textSecondary }}>Process closed-circuit video recordings to extract frames and verify threats</p>
      </div>

      <div className={styles.scannerLayout}>
        {/* Left Column: Video Selector & Upload */}
        <div className={styles.leftCol}>
          <Panel title="Surveillance Video Source">
            <div className={styles.content}>
              {videoName ? (
                <div className={styles.videoSelectedContainer} style={{ borderColor: theme.border, backgroundColor: theme.borderLight }}>
                  <FiFilm size={44} style={{ color: theme.accent }} className={styles.videoIcon} />
                  <div className={styles.videoDetails}>
                    <span className={styles.fileName} style={{ color: theme.textPrimary }}>{videoName}</span>
                    <span className={styles.fileSize} style={{ color: theme.textSecondary }}>Ready for extraction</span>
                  </div>
                  {!loading && !results && (
                    <button 
                      onClick={resetScanner}
                      className={styles.resetBadge} 
                      style={{ color: theme.error, backgroundColor: `${theme.error}15`, borderColor: theme.error }}
                    >
                      <FiTrash2 size={13} style={{ marginRight: '4px' }} /> REMOVE
                    </button>
                  )}
                </div>
              ) : (
                <div
                  className={styles.uploadArea}
                  onDrop={handleVideoDrop}
                  onDragOver={(e) => e.preventDefault()}
                  style={{
                    borderColor: theme.border,
                    backgroundColor: theme.borderLight,
                  }}
                  onClick={() => document.getElementById('video-input').click()}
                >
                  <div className={styles.uploadPrompt}>
                    <FiUploadCloud size={44} className={styles.uploadIcon} style={{ color: theme.accent }} />
                    <p style={{ fontWeight: '600', marginTop: '1rem' }}>DRAG & DROP VIDEO CLIP</p>
                    <p style={{ color: theme.textSecondary, fontSize: '0.85rem' }}>MP4, MKV, AVI or MOV formats supported</p>
                    <input
                      type="file"
                      accept="video/*"
                      onChange={handleVideoSelect}
                      style={{ display: 'none' }}
                      id="video-input"
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
              {videoName && !results && !loading && (
                <button
                  onClick={handleAnalyze}
                  style={{ backgroundColor: theme.accent }}
                  className="btn-primary"
                  type="button"
                >
                  <FiPlay size={16} /> START SEQUENCE EXTRACTION
                </button>
              )}

              {loading && (
                <div className={styles.statusDisplay} style={{ color: theme.accent }}>
                  <LoadingSpinner size="small" />
                  <div className={styles.loadingTextContainer}>
                    <span style={{ fontFamily: theme.fontMono, display: 'block' }}>EXTRACTING FRAME CONVECTORS...</span>
                    <span style={{ fontSize: '0.75rem', color: theme.textSecondary }}>Processing first 300 keyframes in background</span>
                  </div>
                </div>
              )}
            </div>
          </Panel>
        </div>

        {/* Right Column: Video Scanning Output Telemetry */}
        <div className={styles.rightCol}>
          <Panel title="Extraction telemetry">
            {!results && !loading && (
              <div className={styles.dossierEmpty}>
                <FiFilm size={32} style={{ opacity: 0.3, marginBottom: '0.75rem' }} />
                <p style={{ color: theme.textSecondary }}>Waiting for video analysis sequence initialization...</p>
              </div>
            )}

            {loading && (
              <div className={styles.dossierEmpty}>
                <div className={styles.scanRadar} style={{ borderColor: theme.accent, borderTopColor: 'transparent' }} />
                <p style={{ color: theme.textSecondary, marginTop: '1rem' }}>Processing frame buffers...</p>
              </div>
            )}

            {results && (
              <div className={styles.resultsPanel}>
                <div className={styles.resultsSummary}>
                  {results.detections && results.detections.length > 0 ? (
                    <div className={styles.alertHeader} style={{ borderColor: theme.error, backgroundColor: `${theme.error}10` }}>
                      <FiAlertTriangle size={24} style={{ color: theme.error }} />
                      <div className={styles.alertHeaderText}>
                        <h4 style={{ color: theme.error }}>THREAT IDENTIFIED IN TIMELINE</h4>
                        <span style={{ color: theme.textSecondary }}>Detected matching watchlist suspect records</span>
                      </div>
                    </div>
                  ) : (
                    <div className={styles.alertHeader} style={{ borderColor: theme.success, backgroundColor: `${theme.success}10` }}>
                      <FiCheckCircle size={24} style={{ color: theme.success }} />
                      <div className={styles.alertHeaderText}>
                        <h4 style={{ color: theme.success }}>TIMELINE SECURE</h4>
                        <span style={{ color: theme.textSecondary }}>No watchlisted face profiles matched</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Video Metrics */}
                <div className={styles.metricsGrid}>
                  <div className={styles.metricCard} style={{ borderColor: theme.border, backgroundColor: theme.borderLight }}>
                    <span className={styles.metricLabel} style={{ color: theme.textSecondary }}>FRAMES PROCESSED</span>
                    <span className={styles.metricValue} style={{ color: theme.accent, fontFamily: theme.fontMono }}>
                      {results.frames_processed || 300}
                    </span>
                  </div>
                  <div className={styles.metricCard} style={{ borderColor: theme.border, backgroundColor: theme.borderLight }}>
                    <span className={styles.metricLabel} style={{ color: theme.textSecondary }}>THREAT MATCHES</span>
                    <span className={styles.metricValue} style={{ color: results.detections?.length > 0 ? theme.error : theme.success, fontFamily: theme.fontMono }}>
                      {results.detections?.length || 0}
                    </span>
                  </div>
                </div>

                <h4 className={styles.resultsSubtitle} style={{ color: theme.textPrimary, borderBottomColor: theme.border }}>WATCHLIST DETECTIONS LOG</h4>

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
                          <span className={styles.suspectLabel} style={{ color: theme.textPrimary }}>SUSPECT:</span>
                          <span className={styles.suspectName} style={{ color: theme.error }}>{detection.name}</span>
                        </div>
                        <div className={styles.dossierRow}>
                          <span className={styles.suspectLabel} style={{ color: theme.textSecondary }}>CONFIDENCE:</span>
                          <span className={styles.suspectConf} style={{ color: theme.success, fontFamily: theme.fontMono }}>
                            {parseFloat(detection.confidence).toFixed(1)}%
                          </span>
                        </div>
                        {detection.timestamp && (
                          <div className={styles.dossierRow} style={{ borderTop: `1px solid ${theme.border}`, marginTop: '4px', paddingTop: '4px' }}>
                            <span className={styles.suspectLabel} style={{ color: theme.textSecondary }}>TIMELINE POSITION:</span>
                            <span className={styles.suspectFrame} style={{ color: theme.accent, fontFamily: theme.fontMono }}>
                              FRAME {detection.timestamp}
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className={styles.noDetections}>
                    <p style={{ color: theme.textSecondary }}>No suspects identified in video frames.</p>
                  </div>
                )}

                <button
                  onClick={resetScanner}
                  style={{ color: theme.accent, borderColor: theme.accent }}
                  className={styles.resetBtn}
                >
                  LOAD NEW VIDEO CLIP
                </button>
              </div>
            )}
          </Panel>
        </div>
      </div>
    </Container>
  );
};

export default SurveillanceVideo;
