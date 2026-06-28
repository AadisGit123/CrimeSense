import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { api } from '../services/api';
import Container from '../components/Container';
import Panel from '../components/Panel';
import LoadingSpinner from '../components/LoadingSpinner';
import { FiUserPlus, FiUploadCloud, FiTrash2, FiAlertCircle, FiCheckCircle } from 'react-icons/fi';
import styles from './Register.module.css';

const Register = () => {
  const { theme } = useTheme();
  const [formData, setFormData] = useState({
    name: '',
    father_name: '',
    gender: 'Male',
    dob: '',
    crimes: '',
  });
  const [images, setImages] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImagesDrop = (e) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    addImages(files);
  };

  const handleImagesSelect = (e) => {
    const files = Array.from(e.target.files);
    addImages(files);
  };

  const addImages = (files) => {
    const imageFiles = files.filter((f) => f.type.startsWith('image/'));
    setImages((prev) => [...prev, ...imageFiles]);

    imageFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviews((prev) => [...prev, e.target.result]);
      };
      reader.readAsDataURL(file);
    });

    setError('');
  };

  const removeImage = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (images.length < 5) {
      setError('A minimum of 5 face snapshot samples are required for algorithm profiling.');
      return;
    }

    if (!formData.name || !formData.father_name || !formData.dob || !formData.crimes) {
      setError('All mandatory dossier tracking fields must be filled.');
      return;
    }

    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('name', formData.name);
      fd.append('father_name', formData.father_name);
      fd.append('gender', formData.gender);
      fd.append('dob', formData.dob);
      fd.append('crimes', formData.crimes);
      // Backend expects profile_image field pointing to selected profile image index
      fd.append('profile_image', 'Image 1'); // defaults to the first image
      images.forEach((img) => fd.append('images', img));

      const response = await api.registerCriminal(fd);
      setMessage(`Suspect dossier for '${formData.name}' successfully cataloged in watch database.`);
      setFormData({ name: '', father_name: '', gender: 'Male', dob: '', crimes: '' });
      setImages([]);
      setPreviews([]);
    } catch (err) {
      setError(err.message || 'Suspect enrollment sequence failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container>
      {/* Page Header */}
      <div className={styles.pageHeader} style={{ borderColor: theme.border }}>
        <h2>BIOMETRIC TARGET REGISTRATION</h2>
        <p style={{ color: theme.textSecondary }}>Enroll new suspect profiles into the face-recognition watch database</p>
      </div>

      <div className={styles.registerLayout}>
        <Panel title="Dossier Enrollment Form">
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label style={{ color: theme.textSecondary }}>SUSPECT FULL NAME *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g. John Doe"
                  style={{
                    borderColor: theme.border,
                    backgroundColor: theme.background,
                    color: theme.textPrimary,
                  }}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label style={{ color: theme.textSecondary }}>FATHER'S NAME *</label>
                <input
                  type="text"
                  name="father_name"
                  value={formData.father_name}
                  onChange={handleInputChange}
                  placeholder="e.g. Richard Doe"
                  style={{
                    borderColor: theme.border,
                    backgroundColor: theme.background,
                    color: theme.textPrimary,
                  }}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label style={{ color: theme.textSecondary }}>BIOLOGICAL GENDER *</label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleInputChange}
                  style={{
                    borderColor: theme.border,
                    backgroundColor: theme.background,
                    color: theme.textPrimary,
                  }}
                >
                  <option>Male</option>
                  <option>Female</option>
                  <option>Other</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label style={{ color: theme.textSecondary }}>DATE OF BIRTH *</label>
                <input
                  type="date"
                  name="dob"
                  value={formData.dob}
                  onChange={handleInputChange}
                  style={{
                    borderColor: theme.border,
                    backgroundColor: theme.background,
                    color: theme.textPrimary,
                  }}
                  required
                />
              </div>
            </div>

            <div className={styles.formGroup} style={{ marginTop: '1.25rem' }}>
              <label style={{ color: theme.textSecondary }}>CRIME CLASSIFICATION / DETAIL CHARGES *</label>
              <textarea
                name="crimes"
                value={formData.crimes}
                onChange={handleInputChange}
                placeholder="Enter details of crimes, warrants, or caution levels..."
                rows="4"
                style={{
                  borderColor: theme.border,
                  backgroundColor: theme.background,
                  color: theme.textPrimary,
                }}
                required
              />
            </div>

            {/* Image Upload Area */}
            <div className={styles.uploadSection}>
              <label style={{ color: theme.textSecondary }}>FACE BIOMETRIC SNAPSHOTS * (MINIMUM 5 SAMPLES)</label>
              <div
                className={styles.dropZone}
                onDrop={handleImagesDrop}
                onDragOver={(e) => e.preventDefault()}
                style={{
                  borderColor: theme.border,
                  backgroundColor: theme.background,
                }}
                onClick={() => document.getElementById('image-upload').click()}
              >
                <FiUploadCloud size={32} style={{ color: theme.accent }} />
                <p style={{ fontWeight: '600', fontSize: '0.9rem', marginTop: '0.5rem' }}>DRAG & DROP PROFILE PHOTOS HERE</p>
                <p style={{ fontSize: '0.75rem', color: theme.textSecondary }}>or click to browse files (PNG, JPG supported)</p>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImagesSelect}
                  style={{ display: 'none' }}
                  id="image-upload"
                />
              </div>
            </div>

            {/* Image Previews */}
            {previews.length > 0 && (
              <div className={styles.previewSection}>
                <p className={styles.previewTitle} style={{ color: theme.textSecondary }}>
                  CATALOGED SAMPLES: <strong style={{ color: theme.accent }}>{images.length} OF 10 MAX</strong>
                </p>
                <div className={styles.previewGrid}>
                  {previews.map((preview, idx) => (
                    <div key={idx} className={styles.previewItem} style={{ borderColor: theme.border }}>
                      <img src={preview} alt={`Sample ${idx}`} />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeImage(idx);
                        }}
                        className={styles.removeBtn}
                        style={{ backgroundColor: theme.error }}
                      >
                        ✕
                      </button>
                      <span className={styles.sampleBadge} style={{ backgroundColor: theme.background, color: theme.textSecondary }}>
                        SAMP {idx + 1}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Error / Success Messages */}
            {error && (
              <div className={styles.error} style={{ borderColor: theme.error, color: theme.error, backgroundColor: `${theme.error}10` }}>
                <FiAlertCircle style={{ marginRight: '8px' }} /> {error}
              </div>
            )}
            {message && (
              <div className={styles.success} style={{ borderColor: theme.success, color: theme.success, backgroundColor: `${theme.success}10` }}>
                <FiCheckCircle style={{ marginRight: '8px' }} /> {message}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              style={{
                backgroundColor: theme.accent,
                boxShadow: `0 4px 15px ${theme.glow}`
              }}
              className={`${styles.submitBtn} btn-primary`}
            >
              {loading ? (
                <div className={styles.loadingWrapper}>
                  <LoadingSpinner size="small" />
                  <span>TRANSMITTING DATABASE VECTOR DATA...</span>
                </div>
              ) : (
                <>
                  <FiUserPlus size={16} /> SUBMIT BIOMETRIC DOSSIER
                </>
              )}
            </button>
          </form>
        </Panel>
      </div>
    </Container>
  );
};

export default Register;
