import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '../context/ThemeContext';
import { api } from '../services/api';
import Container from '../components/Container';
import Panel from '../components/Panel';
import LoadingSpinner from '../components/LoadingSpinner';
import { FiRadio, FiCamera, FiAlertTriangle, FiCheckCircle, FiVideoOff, FiActivity, FiList } from 'react-icons/fi';
import styles from './Camera.module.css';

const Camera = () => {
  const { theme } = useTheme();
  const [streamActive, setStreamActive] = useState(false);
  const [recentDetections, setRecentDetections] = useState([]);
  const [alertLogs, setAlertLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [useFallback, setUseFallback] = useState(false);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // Initialize camera stream
  useEffect(() => {
    let activeStream = null;

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { width: 640, height: 480, facingMode: 'environment' } 
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          activeStream = stream;
          setStreamActive(true);
          setUseFallback(false);
        }
      } catch (err) {
        console.warn('Webcam access failed, falling back to simulated monitoring mode:', err);
        setUseFallback(true);
        setStreamActive(false);
      }
    };

    startCamera();

    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Poll alerts history every 5 seconds
  useEffect(() => {
    const fetchCameraAlerts = async () => {
      try {
        const data = await api.fetchAlerts();
        // Get alerts with source containing 'Camera' or 'iot_hub'
        const cameraAlerts = (data.alerts || [])
          .filter(a => a.data?.source?.toLowerCase().includes('camera') || a.data?.source?.toLowerCase().includes('iot'))
          .slice(-10)
          .reverse();

        setAlertLogs(cameraAlerts);
      } catch (err) {
        console.error('Failed to sync console alert logs:', err);
      }
    };

    fetchCameraAlerts();
    const interval = setInterval(fetchCameraAlerts, 5000);
    return () => clearInterval(interval);
  }, []);

  // Capture frame and send for analysis
  const captureFrame = async () => {
    if (useFallback) {
      // If camera is not available, allow uploading a mock file or trigger simulated scan
      document.getElementById('fallback-input').click();
      return;
    }

    if (!videoRef.current || !canvasRef.current) return;

    setLoading(true);
    setError('');
    setMessage('');

    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      // Draw current video frame to canvas
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Convert canvas to blob
      canvas.toBlob(async (blob) => {
        if (!blob) {
          setError('Failed to extract frame buffer data.');
          setLoading(false);
          return;
        }

        try {
          const file = new File([blob], 'camera_frame.png', { type: 'image/png' });
          const response = await api.detectFromCamera(file);

          if (response.status === 'success' && response.detections && response.detections.length > 0) {
            setMessage('ALERT: Suspect identified in monitor stream!');
            
            // Add to local recent detections
            const newDetections = response.detections.map(d => ({
              name: d.name,
              confidence: d.confidence,
              time: new Date().toLocaleTimeString()
            }));
            
            setRecentDetections(prev => [...newDetections, ...prev].slice(0, 10));
          } else {
            setMessage('Scan sequence complete - no watchlist threat detected.');
          }
        } catch (err) {
          setError(err.message || 'Stream extraction pipeline error.');
        } finally {
          setLoading(false);
        }
      }, 'image/png');

    } catch (err) {
      setError(err.message || 'Frame buffer processing error.');
      setLoading(false);
    }
  };

  // Handle file select upload in simulation/fallback mode
  const handleFallbackFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await api.detectFromCamera(file);
      if (response.status === 'success' && response.detections && response.detections.length > 0) {
        setMessage('ALERT: Suspect identified in uploaded stream frame!');
        const newDetections = response.detections.map(d => ({
          name: d.name,
          confidence: d.confidence,
          time: new Date().toLocaleTimeString()
        }));
        setRecentDetections(prev => [...newDetections, ...prev].slice(0, 10));
      } else {
        setMessage('Scan complete - frame is secure.');
      }
    } catch (err) {
      setError(err.message || 'Static scan failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container>
      {/* Page Header */}
      <div className={styles.pageHeader} style={{ borderColor: theme.border }}>
        <h2>LIVE SURVEILLANCE FEED</h2>
        <p style={{ color: theme.textSecondary }}>Monitor connected local camera nodes and push real-time face scan vectors</p>
      </div>

      <div className={styles.scannerLayout}>
        {/* Left Column: Camera Screen */}
        <div className={styles.leftCol}>
          <Panel title="Surveillance Monitor Node // 01">
            <div className={styles.feedContainer}>
              <div className={styles.feedHeader} style={{ borderBottomColor: theme.border }}>
                <span className={styles.feedTitle} style={{ color: theme.accent, fontFamily: theme.fontTitle }}>STREAM FEED // LOCAL_NODE</span>
                <span 
                  className={styles.feedStatus} 
                  style={{ 
                    color: streamActive ? theme.success : theme.warning, 
                    backgroundColor: streamActive ? `${theme.success}10` : `${theme.warning}10`,
                    borderColor: streamActive ? theme.success : theme.warning 
                  }}
                >
                  <span className={styles.pulseLight} style={{ backgroundColor: streamActive ? theme.success : theme.warning }} />
                  {streamActive ? 'LIVEFEED' : 'SIMULATION'}
                </span>
              </div>

              <div className={styles.videoWorkspace} style={{ backgroundColor: '#05070a' }}>
                <canvas ref={canvasRef} style={{ display: 'none' }} />
                
                {useFallback ? (
                  <div className={styles.fallbackScreen}>
                    <FiVideoOff size={44} style={{ color: theme.warning, marginBottom: '1rem' }} />
                    <p style={{ fontWeight: '600', color: theme.textPrimary }}>Webcam Feed Offline</p>
                    <p style={{ color: theme.textSecondary, fontSize: '0.8rem', maxWidth: '300px', margin: '0 auto 1.5rem auto' }}>
                      Camera access was denied or node is unavailable. Simulated scanner uploads enabled.
                    </p>
                    <input 
                      type="file" 
                      id="fallback-input" 
                      accept="image/*" 
                      onChange={handleFallbackFile} 
                      style={{ display: 'none' }} 
                    />
                    <button 
                      type="button" 
                      onClick={() => document.getElementById('fallback-input').click()}
                      className="btn-primary"
                      style={{ backgroundColor: theme.accent }}
                    >
                      <FiCamera size={16} /> UPLOAD CAMERA FRAME
                    </button>
                  </div>
                ) : (
                  <div className={`${styles.videoContainer} ${loading ? 'scanline-container' : ''}`}>
                    <video ref={videoRef} autoPlay playsInline muted className={styles.liveVideo} />
                    <div className={styles.overlayGrid} style={{ borderColor: `${theme.accent}30` }} />
                    <div className={styles.viewfinderCorner} style={{ borderLeftColor: theme.accent, borderTopColor: theme.accent }} />
                  </div>
                )}
              </div>

              {/* Console Trigger Button */}
              {!useFallback && (
                <div className={styles.controlsBar}>
                  <button
                    onClick={captureFrame}
                    disabled={loading}
                    className="btn-primary"
                    style={{ backgroundColor: theme.accent, width: '100%' }}
                  >
                    <FiCamera size={16} /> SCAN ACTIVE STREAM FRAME
                  </button>
                </div>
              )}
            </div>
          </Panel>

          {/* Messages */}
          {error && (
            <div className={styles.error} style={{ borderColor: theme.error, color: theme.error, backgroundColor: `${theme.error}10` }}>
              <FiAlertTriangle style={{ marginRight: '8px' }} /> {error}
            </div>
          )}
          {message && (
            <div 
              className={message.includes('ALERT') ? styles.threatAlert : styles.infoMessage} 
              style={{ 
                borderColor: message.includes('ALERT') ? theme.error : theme.success, 
                color: message.includes('ALERT') ? theme.error : theme.success,
                backgroundColor: message.includes('ALERT') ? `${theme.error}10` : `${theme.success}10`
              }}
            >
              {message.includes('ALERT') ? <FiAlertTriangle style={{ marginRight: '8px' }} /> : <FiCheckCircle style={{ marginRight: '8px' }} />}
              <span>{message}</span>
            </div>
          )}
        </div>

        {/* Right Column: Console Log Telemetry */}
        <div className={styles.rightCol}>
          {/* Recent Scan Panel */}
          <Panel title="Recent Detections">
            <div className={styles.detectionsBody}>
              {recentDetections.length === 0 ? (
                <div className={styles.noDetections}>
                  <FiActivity size={24} style={{ opacity: 0.3, marginBottom: '0.5rem' }} />
                  <p style={{ color: theme.textSecondary, fontSize: '0.85rem' }}>No detections recorded this session.</p>
                </div>
              ) : (
                <div className={styles.detectionsList}>
                  {recentDetections.map((d, idx) => (
                    <div 
                      key={idx} 
                      className={styles.detectionCard} 
                      style={{ borderColor: theme.error, backgroundColor: `${theme.error}05` }}
                    >
                      <div className={styles.detectionMain}>
                        <span className={styles.threatText} style={{ color: theme.error }}>🚨 MATCH DETECTED</span>
                        <span className={styles.threatTime} style={{ color: theme.textSecondary, fontFamily: theme.fontMono }}>{d.time}</span>
                      </div>
                      <div className={styles.detectionSuspect}>
                        <strong style={{ color: theme.textPrimary }}>{d.name}</strong>
                        <span style={{ color: theme.success, fontFamily: theme.fontMono }}>{(d.confidence * 100).toFixed(0)}% Match</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Panel>

          {/* Central System Log Panel */}
          <div style={{ marginTop: '1.5rem' }}>
            <Panel title="Central Alert History">
              <div className={styles.logsBody}>
                {alertLogs.length === 0 ? (
                  <div className={styles.noDetections}>
                    <FiList size={24} style={{ opacity: 0.3, marginBottom: '0.5rem' }} />
                    <p style={{ color: theme.textSecondary, fontSize: '0.85rem' }}>No database alerts logged.</p>
                  </div>
                ) : (
                  <div className={styles.logsList}>
                    {alertLogs.map((log, idx) => (
                      <div 
                        key={idx} 
                        className={styles.logItem}
                        style={{ borderBottomColor: theme.borderLight }}
                      >
                        <div className={styles.logHeader}>
                          <span style={{ color: theme.error, fontWeight: '700' }}>
                            {log.data?.event_type?.toUpperCase().replace(/_/g, ' ') || 'SUSPECT DETECTED'}
                          </span>
                          <span style={{ color: theme.textSecondary, fontSize: '0.75rem', fontFamily: theme.fontMono }}>
                            {new Date(log.received_at).toLocaleTimeString()}
                          </span>
                        </div>
                        <div className={styles.logDetails} style={{ color: theme.textPrimary }}>
                          Source: <strong style={{ color: theme.accent }}>{log.data?.source || 'Camera'}</strong>
                          {log.data?.detections?.map((d, dIdx) => (
                            <div key={dIdx} className={styles.logSuspectRow}>
                              • Suspect: <strong style={{ color: theme.error }}>{d.name}</strong> ({d.confidence}%)
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Panel>
          </div>
        </div>
      </div>
    </Container>
  );
};

export default Camera;
