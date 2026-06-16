import React, { useState, useEffect, useRef } from 'react';
import { doc, getDoc, updateDoc, addDoc, collection, increment, serverTimestamp } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db } from '../lib/firebase';
import { useParams } from 'react-router-dom';
import {
  FaStar, FaCamera, FaCheckCircle, FaExclamationTriangle,
  FaSpinner, FaUserAlt, FaCommentDots, FaImage, FaEye,
  FaPaperPlane, FaHeart
} from 'react-icons/fa';
import { HiSparkles } from 'react-icons/hi';

type TokenData = {
  active: boolean;
  eventName?: string;
  submissions?: number;
};

type ViewState = 'loading' | 'invalid' | 'form' | 'success';

const SubmitFeedbackPage: React.FC = () => {
  const { tokenId } = useParams<{ tokenId: string }>();

  const [view, setView] = useState<ViewState>('loading');
  const [tokenData, setTokenData] = useState<TokenData | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // form state
  const [name, setName] = useState('');
  const [usedFor, setUsedFor] = useState('');
  const [experience, setExperience] = useState('');
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [showPhoto, setShowPhoto] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const verifyToken = async () => {
      if (!tokenId) {
        setView('invalid');
        return;
      }
      try {
        const tokenRef = doc(db, 'feedbackTokens', tokenId);
        const snap = await getDoc(tokenRef);

        if (!snap.exists() || snap.data().active === false) {
          setView('invalid');
          return;
        }

        setTokenData(snap.data() as TokenData);
        setView('form');
      } catch (err) {
        console.error('Token verification failed:', err);
        setView('invalid');
      }
    };

    verifyToken();
  }, [tokenId]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrors((prev) => ({ ...prev, photo: 'Please select an image file' }));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErrors((prev) => ({ ...prev, photo: 'Image must be under 5MB' }));
      return;
    }

    setErrors((prev) => ({ ...prev, photo: '' }));
    setPhoto(file);
    const reader = new FileReader();
    reader.onload = (ev) => setPhotoPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const removePhoto = () => {
    setPhoto(null);
    setPhotoPreview(null);
    setShowPhoto(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = 'Please tell us your name';
    if (!usedFor.trim()) newErrors.usedFor = 'Please share what you used StageCheck for';
    if (!experience.trim()) newErrors.experience = 'Please share your experience';
    if (rating === 0) newErrors.rating = 'Please give a rating';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || !tokenId) return;

    setSubmitting(true);

    try {
      let photoUrl: string | null = null;

      if (photo) {
        const storage = getStorage();
        const photoRef = ref(storage, `feedbackPhotos/${tokenId}/${Date.now()}_${photo.name}`);
        await uploadBytes(photoRef, photo);
        photoUrl = await getDownloadURL(photoRef);
      }

      await addDoc(collection(db, 'feedbackSubmissions'), {
        tokenId,
        name: name.trim(),
        usedFor: usedFor.trim(),
        experience: experience.trim(),
        rating,
        photoUrl,
        showPhoto: photoUrl ? showPhoto : false,
        submittedAt: serverTimestamp(),
        converted: false,
      });

      const tokenRef = doc(db, 'feedbackTokens', tokenId);
      await updateDoc(tokenRef, {
        submissions: increment(1),
      });

      setView('success');
    } catch (err) {
      console.error('Submission failed:', err);
      setErrors((prev) => ({ ...prev, submit: 'Something went wrong. Please try again.' }));
    } finally {
      setSubmitting(false);
    }
  };

  // ---------- LOADING ----------
  if (view === 'loading') {
    return (
      <div style={styles.page}>
        <style>{globalStyles}</style>
        <div style={styles.bgGlow1} />
        <div style={styles.bgGlow2} />
        <div style={styles.centerWrap}>
          <div style={{ ...styles.card, textAlign: 'center', padding: '60px 40px' }}>
            <div style={styles.spinnerWrap}>
              <FaSpinner style={styles.spinnerIcon} />
            </div>
            <p style={{ ...styles.mutedText, marginTop: 24, fontSize: 15 }}>
              Verifying your link...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ---------- INVALID ----------
  if (view === 'invalid') {
    return (
      <div style={styles.page}>
        <style>{globalStyles}</style>
        <div style={styles.bgGlow1} />
        <div style={styles.bgGlow2} />
        <div style={styles.centerWrap}>
          <div className="fade-in-up" style={{ ...styles.card, textAlign: 'center', padding: '50px 40px', maxWidth: 440 }}>
            <div style={{ ...styles.iconCircle, background: 'rgba(255,77,77,0.10)', border: '1px solid rgba(255,77,77,0.25)' }}>
              <FaExclamationTriangle style={{ fontSize: 32, color: '#ff6b6b' }} />
            </div>
            <h1 style={{ ...styles.heading, fontSize: 26, marginTop: 24 }}>Link Invalid or Expired</h1>
            <p style={{ ...styles.mutedText, marginTop: 12, fontSize: 15, lineHeight: 1.6 }}>
              This feedback link is no longer active. Please reach out to the event organizer
              for a new link.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ---------- SUCCESS ----------
  if (view === 'success') {
    return (
      <div style={styles.page}>
        <style>{globalStyles}</style>
        <div style={styles.bgGlow1} />
        <div style={styles.bgGlow2} />
        {/* confetti */}
        <div className="confetti-wrap">
          {Array.from({ length: 24 }).map((_, i) => (
            <span
              key={i}
              className="confetti-piece"
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 1.2}s`,
                background: i % 2 === 0 ? '#0dc75e' : '#f0faf2',
              }}
            />
          ))}
        </div>
        <div style={styles.centerWrap}>
          <div className="success-pop" style={{ ...styles.card, textAlign: 'center', padding: '56px 40px', maxWidth: 460 }}>
            <div className="success-icon-bounce" style={{ ...styles.iconCircle, background: 'rgba(13,199,94,0.10)', border: '1px solid rgba(13,199,94,0.22)' }}>
              <FaCheckCircle style={{ fontSize: 36, color: '#0dc75e' }} />
            </div>
            <h1 style={{ ...styles.heading, fontSize: 28, marginTop: 24 }}>
              Thank You! <FaHeart style={{ color: '#0dc75e', fontSize: 20, marginLeft: 4 }} />
            </h1>
            <p style={{ ...styles.mutedText, marginTop: 12, fontSize: 15, lineHeight: 1.6 }}>
              Your feedback means the world to us. We appreciate you taking the time
              to share your experience with StageCheck.
            </p>
            <div style={{ marginTop: 28, display: 'flex', justifyContent: 'center', gap: 8 }}>
              {Array.from({ length: rating }).map((_, i) => (
                <FaStar key={i} style={{ color: '#0dc75e', fontSize: 18 }} />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ---------- FORM ----------
  return (
    <div style={styles.page}>
      <style>{globalStyles}</style>
      <div style={styles.bgGlow1} />
      <div style={styles.bgGlow2} />
      <div style={styles.centerWrap}>
        <div className="fade-in-up" style={{ ...styles.card, maxWidth: 560, width: '100%', padding: '40px 36px' }}>
          {/* header */}
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={styles.badge}>
              <HiSparkles style={{ color: '#0dc75e', fontSize: 14 }} />
              <span>Share Your Experience</span>
            </div>
            <h1 style={{ ...styles.heading, fontSize: 28, marginTop: 16 }}>
              We'd Love Your Feedback
            </h1>
            <p style={{ ...styles.mutedText, marginTop: 8, fontSize: 14.5 }}>
              {tokenData?.eventName
                ? `Tell us about your experience with ${tokenData.eventName}`
                : 'Your thoughts help us improve StageCheck for everyone'}
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Name */}
            <div style={styles.fieldGroup}>
              <label style={styles.label}>
                <FaUserAlt style={styles.labelIcon} /> Your Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Jordan Mensah"
                style={{
                  ...styles.input,
                  borderColor: errors.name ? 'rgba(255,77,77,0.4)' : 'rgba(255,255,255,0.07)',
                }}
              />
              {errors.name && <span style={styles.errorText}>{errors.name}</span>}
            </div>

            {/* Used for */}
            <div style={styles.fieldGroup}>
              <label style={styles.label}>
                <HiSparkles style={styles.labelIcon} /> What did you use StageCheck for?
              </label>
              <input
                type="text"
                value={usedFor}
                onChange={(e) => setUsedFor(e.target.value)}
                placeholder="e.g. Church choir audition night"
                style={{
                  ...styles.input,
                  borderColor: errors.usedFor ? 'rgba(255,77,77,0.4)' : 'rgba(255,255,255,0.07)',
                }}
              />
              {errors.usedFor && <span style={styles.errorText}>{errors.usedFor}</span>}
            </div>

            {/* Experience */}
            <div style={styles.fieldGroup}>
              <label style={styles.label}>
                <FaCommentDots style={styles.labelIcon} /> Tell us about your experience
              </label>
              <textarea
                value={experience}
                onChange={(e) => setExperience(e.target.value)}
                placeholder="What did you enjoy? What could be better?"
                rows={4}
                style={{
                  ...styles.input,
                  ...styles.textarea,
                  borderColor: errors.experience ? 'rgba(255,77,77,0.4)' : 'rgba(255,255,255,0.07)',
                }}
              />
              {errors.experience && <span style={styles.errorText}>{errors.experience}</span>}
            </div>

            {/* Rating */}
            <div style={styles.fieldGroup}>
              <label style={styles.label}>
                <FaStar style={styles.labelIcon} /> Rate your experience
              </label>
              <div style={styles.starRow}>
                {Array.from({ length: 10 }).map((_, i) => {
                  const value = i + 1;
                  const active = value <= (hoverRating || rating);
                  return (
                    <button
                      type="button"
                      key={value}
                      onClick={() => setRating(value)}
                      onMouseEnter={() => setHoverRating(value)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="star-btn"
                      style={{
                        ...styles.starBtn,
                        color: active ? '#0dc75e' : 'rgba(255,255,255,0.15)',
                        transform: active ? 'scale(1.1)' : 'scale(1)',
                      }}
                      aria-label={`Rate ${value}`}
                    >
                      <FaStar />
                    </button>
                  );
                })}
              </div>
              <div style={{ textAlign: 'center', marginTop: 8 }}>
                <span style={{ color: '#0dc75e', fontWeight: 700, fontSize: 18, fontFamily: "'Syne', sans-serif" }}>
                  {rating > 0 ? `${rating}/10` : '—'}
                </span>
              </div>
              {errors.rating && <span style={{ ...styles.errorText, display: 'block', textAlign: 'center' }}>{errors.rating}</span>}
            </div>

            {/* Photo upload */}
            <div style={styles.fieldGroup}>
              <label style={styles.label}>
                <FaCamera style={styles.labelIcon} /> Add a photo (optional)
              </label>

              {!photoPreview ? (
                <div
                  className="upload-zone"
                  onClick={() => fileInputRef.current?.click()}
                  style={styles.uploadZone}
                >
                  <FaImage style={{ fontSize: 24, color: '#0dc75e', marginBottom: 8 }} />
                  <p style={{ ...styles.mutedText, fontSize: 13.5 }}>Click to upload a photo</p>
                  <p style={{ ...styles.mutedText, fontSize: 11.5, marginTop: 4 }}>PNG, JPG up to 5MB</p>
                </div>
              ) : (
                <div className="fade-in-up" style={styles.previewWrap}>
                  <img src={photoPreview} alt="Preview" style={styles.previewImg} />
                  <button type="button" onClick={removePhoto} style={styles.removeBtn}>
                    Remove
                  </button>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                style={{ display: 'none' }}
              />
              {errors.photo && <span style={styles.errorText}>{errors.photo}</span>}
            </div>

            {/* Show photo toggle */}
            {photoPreview && (
              <div className="fade-in-up" style={styles.toggleRow}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <FaEye style={{ color: '#0dc75e', fontSize: 15 }} />
                  <span style={{ fontSize: 14, color: '#f0faf2' }}>Show this photo publicly on the event page</span>
                </div>
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={showPhoto}
                    onChange={(e) => setShowPhoto(e.target.checked)}
                  />
                  <span className="slider"></span>
                </label>
              </div>
            )}

            {errors.submit && (
              <p style={{ ...styles.errorText, textAlign: 'center', marginTop: 12 }}>{errors.submit}</p>
            )}

            <button type="submit" disabled={submitting} className="submit-btn" style={styles.submitBtn}>
              {submitting ? (
                <>
                  <FaSpinner className="spin" /> Submitting...
                </>
              ) : (
                <>
                  <FaPaperPlane /> Submit Feedback
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

const globalStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:wght@400;500;600&display=swap');

  * { font-family: 'DM Sans', sans-serif; box-sizing: border-box; }

  @keyframes fadeInUp {
    from { opacity: 0; transform: translateY(16px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .fade-in-up { animation: fadeInUp 0.5s ease-out; }

  @keyframes spin { to { transform: rotate(360deg); } }
  .spin { animation: spin 1s linear infinite; }

  .spinner-icon { animation: spin 1s linear infinite; }

  @keyframes bounce {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.15); }
  }
  .success-icon-bounce { animation: bounce 0.6s ease-in-out; }

  @keyframes popIn {
    0% { opacity: 0; transform: scale(0.9) translateY(20px); }
    100% { opacity: 1; transform: scale(1) translateY(0); }
  }
  .success-pop { animation: popIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1); }

  .star-btn {
    background: none;
    border: none;
    cursor: pointer;
    font-size: 22px;
    transition: transform 0.15s ease, color 0.15s ease;
    padding: 2px;
  }

  .upload-zone {
    cursor: pointer;
    transition: border-color 0.2s ease, background 0.2s ease;
  }
  .upload-zone:hover {
    border-color: rgba(13,199,94,0.4) !important;
    background: rgba(13,199,94,0.05) !important;
  }

  .submit-btn {
    transition: transform 0.15s ease, box-shadow 0.2s ease, opacity 0.2s ease;
  }
  .submit-btn:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(13,199,94,0.35);
  }
  .submit-btn:active:not(:disabled) {
    transform: translateY(0);
  }
  .submit-btn:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }

  input::placeholder, textarea::placeholder {
    color: rgba(255,255,255,0.3);
  }

  input:focus, textarea:focus {
    outline: none;
    border-color: rgba(13,199,94,0.5) !important;
    box-shadow: 0 0 0 3px rgba(13,199,94,0.08);
  }

  /* toggle switch */
  .switch {
    position: relative;
    display: inline-block;
    width: 44px;
    height: 24px;
    flex-shrink: 0;
  }
  .switch input { opacity: 0; width: 0; height: 0; }
  .slider {
    position: absolute;
    cursor: pointer;
    top: 0; left: 0; right: 0; bottom: 0;
    background-color: rgba(255,255,255,0.1);
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 24px;
    transition: 0.3s;
  }
  .slider:before {
    position: absolute;
    content: "";
    height: 18px; width: 18px;
    left: 2px; bottom: 2px;
    background-color: #f0faf2;
    border-radius: 50%;
    transition: 0.3s;
  }
  .switch input:checked + .slider {
    background-color: #0dc75e;
    border-color: rgba(13,199,94,0.22);
  }
  .switch input:checked + .slider:before {
    transform: translateX(20px);
  }

  /* confetti */
  .confetti-wrap {
    position: fixed;
    top: 0; left: 0; width: 100%; height: 100%;
    pointer-events: none;
    overflow: hidden;
    z-index: 1;
  }
  .confetti-piece {
    position: absolute;
    top: -10px;
    width: 8px;
    height: 8px;
    border-radius: 2px;
    opacity: 0.8;
    animation: confettiFall 2.8s ease-in forwards;
  }
  @keyframes confettiFall {
    0% { transform: translateY(-10px) rotate(0deg); opacity: 0.9; }
    100% { transform: translateY(100vh) rotate(540deg); opacity: 0; }
  }

  @media (max-width: 480px) {
    .card-padding { padding: 28px 20px !important; }
  }
`;

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    width: '100%',
    background: '#000612',
    position: 'relative',
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
  },
  bgGlow1: {
    position: 'absolute',
    top: '-15%',
    left: '-10%',
    width: '500px',
    height: '500px',
    background: 'radial-gradient(circle, rgba(13,199,94,0.12) 0%, transparent 70%)',
    filter: 'blur(60px)',
    pointerEvents: 'none',
  },
  bgGlow2: {
    position: 'absolute',
    bottom: '-15%',
    right: '-10%',
    width: '500px',
    height: '500px',
    background: 'radial-gradient(circle, rgba(13,199,94,0.08) 0%, transparent 70%)',
    filter: 'blur(60px)',
    pointerEvents: 'none',
  },
  centerWrap: {
    position: 'relative',
    zIndex: 2,
    width: '100%',
    display: 'flex',
    justifyContent: 'center',
  },
  card: {
    background: '#060e1c',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: '20px',
    boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
    backdropFilter: 'blur(20px)',
  },
  heading: {
    fontFamily: "'Syne', sans-serif",
    fontWeight: 700,
    color: '#f0faf2',
    margin: 0,
  },
  mutedText: {
    color: 'rgba(255,255,255,0.55)',
    margin: 0,
  },
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '6px 14px',
    borderRadius: '999px',
    background: 'rgba(13,199,94,0.10)',
    border: '1px solid rgba(13,199,94,0.22)',
    color: '#0dc75e',
    fontSize: 12.5,
    fontWeight: 600,
    letterSpacing: '0.02em',
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto',
  },
  spinnerWrap: {
    width: 56,
    height: 56,
    margin: '0 auto',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  spinnerIcon: {
    fontSize: 32,
    color: '#0dc75e',
    animation: 'spin 1s linear infinite',
  } as React.CSSProperties,
  fieldGroup: {
    marginBottom: 20,
  },
  label: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 13.5,
    fontWeight: 600,
    color: '#f0faf2',
    marginBottom: 8,
    fontFamily: "'Syne', sans-serif",
  },
  labelIcon: {
    color: '#0dc75e',
    fontSize: 13,
  },
  input: {
    width: '100%',
    padding: '12px 16px',
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: '12px',
    color: '#f0faf2',
    fontSize: 14.5,
    transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
  },
  textarea: {
    resize: 'vertical',
    minHeight: 100,
    fontFamily: "'DM Sans', sans-serif",
  },
  starRow: {
    display: 'flex',
    justifyContent: 'center',
    gap: 4,
    padding: '8px 0',
    flexWrap: 'wrap',
  },
  starBtn: {},
  uploadZone: {
    border: '1.5px dashed rgba(255,255,255,0.12)',
    borderRadius: '14px',
    padding: '28px 16px',
    textAlign: 'center',
    background: 'rgba(255,255,255,0.02)',
  },
  previewWrap: {
    position: 'relative',
    borderRadius: '14px',
    overflow: 'hidden',
    border: '1px solid rgba(255,255,255,0.07)',
  },
  previewImg: {
    width: '100%',
    maxHeight: 220,
    objectFit: 'cover',
    display: 'block',
  },
  removeBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    background: 'rgba(0,6,18,0.75)',
    border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: '8px',
    color: '#f0faf2',
    fontSize: 12.5,
    padding: '6px 12px',
    cursor: 'pointer',
    backdropFilter: 'blur(8px)',
  },
  toggleRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    padding: '14px 16px',
    background: 'rgba(13,199,94,0.05)',
    border: '1px solid rgba(13,199,94,0.15)',
    borderRadius: '12px',
    marginBottom: 20,
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: 12,
    marginTop: 6,
    display: 'inline-block',
  },
  submitBtn: {
    width: '100%',
    padding: '15px',
    background: '#0dc75e',
    border: 'none',
    borderRadius: '12px',
    color: '#000612',
    fontSize: 15.5,
    fontWeight: 700,
    fontFamily: "'Syne', sans-serif",
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 8,
  },
};

export default SubmitFeedbackPage;