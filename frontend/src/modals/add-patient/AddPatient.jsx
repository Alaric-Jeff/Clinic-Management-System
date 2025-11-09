import { useState, useEffect, useRef } from "react";
import { Calendar, AlertTriangle, Info, XCircle, X } from "lucide-react";
import api from "../../axios/api";
import ConfirmModal from "../../components/ConfirmModal/ConfirmModal";
import Toast from "../../components/Toast/Toast";
import "./AddPatient.css";

const AddPatient = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    lastName: "",
    firstName: "",
    middleName: "",
    birthDate: "",
    age: "",
    gender: "",
    mobileNumber: "",
    residentialAddress: "",
    csdIdOrPwdId: "",
    registerDate: "",
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // Duplicate detection state
  const [duplicateCheck, setDuplicateCheck] = useState({
    isChecking: false,
    isDuplicate: false,
    warning: null,
    matches: []
  });

  // Debounce timer ref
  const duplicateCheckTimer = useRef(null);

  // Confirmation Modal State
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    type: 'success',
    title: '',
    message: '',
    onConfirm: null,
    isLoading: false
  });

  // Toast State
  const [toastConfig, setToastConfig] = useState({
    isVisible: false,
    message: '',
    type: 'success',
    duration: 4000
  });

  // Refs for date pickers
  const birthDateRef = useRef(null);
  const registerDateRef = useRef(null);

  // Show modal function
  const showModal = (title, message, type = 'success', onConfirm) => {
    setModalConfig({
      isOpen: true,
      type,
      title,
      message,
      onConfirm,
      isLoading: false
    });
  };

  // Close modal function
  const closeModal = () => {
    setModalConfig(prev => ({ ...prev, isOpen: false }));
  };

  // Set modal loading state
  const setModalLoading = (isLoading) => {
    setModalConfig(prev => ({ ...prev, isLoading }));
  };

  // Show toast function
  const showToast = (message, type = 'success', duration = 4000) => {
    setToastConfig({
      isVisible: true,
      message,
      type,
      duration
    });
  };

  // Close toast function
  const closeToast = () => {
    setToastConfig(prev => ({ ...prev, isVisible: false }));
  };

  // ---------------- DUPLICATE CHECK FUNCTION ----------------
  const checkForDuplicates = async (firstName, lastName, middleName) => {
    // Don't check if only first name is provided
    if (!lastName || !firstName) {
      setDuplicateCheck({
        isChecking: false,
        isDuplicate: false,
        warning: null,
        matches: []
      });
      return;
    }

    try {
      setDuplicateCheck(prev => ({ ...prev, isChecking: true }));

      const response = await api.post("/patient/find-existing", {
        firstName: firstName || null,
        lastName: lastName || null,
        middleName: middleName || null
      });

      if (response.data.result) {
        setDuplicateCheck({
          isChecking: false,
          isDuplicate: response.data.result.isDuplicate,
          warning: response.data.result.warning,
          matches: response.data.result.matches || []
        });
      }
    } catch (error) {
      console.error("Error checking for duplicates:", error);
      setDuplicateCheck({
        isChecking: false,
        isDuplicate: false,
        warning: null,
        matches: []
      });
    }
  };

  // ---------------- DEBOUNCED DUPLICATE CHECK ----------------
  useEffect(() => {
    // Clear existing timer
    if (duplicateCheckTimer.current) {
      clearTimeout(duplicateCheckTimer.current);
    }

    // Set new timer for debounced check
    duplicateCheckTimer.current = setTimeout(() => {
      checkForDuplicates(
        formData.firstName,
        formData.lastName,
        formData.middleName
      );
    }, 500); // 500ms debounce

    // Cleanup
    return () => {
      if (duplicateCheckTimer.current) {
        clearTimeout(duplicateCheckTimer.current);
      }
    };
  }, [formData.firstName, formData.lastName, formData.middleName]);

  // ---------------- AUTO AGE ----------------
  useEffect(() => {
    if (formData.birthDate) {
      const birth = new Date(formData.birthDate);
      const today = new Date();
      let age = today.getFullYear() - birth.getFullYear();
      const monthDiff = today.getMonth() - birth.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
      }
      setFormData((prev) => ({ ...prev, age: age > 0 ? age : 0 }));
    }
  }, [formData.birthDate]);

  // ---------------- VALIDATION ----------------
  const validateField = (name, value) => {
    let message = "";
    const nameRegex = /^[A-Za-z\s'-]+$/;
    const contactRegex = /^[0-9]{11}$/;

    const today = new Date();
    today.setHours(0,0,0,0);
    const minRegisterDate = new Date('2015-01-01');
    minRegisterDate.setHours(0,0,0,0);

    switch (name) {
      case "lastName":
      case "firstName":
        if (!value.trim()) message = `${name === "lastName" ? "Last" : "First"} name is required.`;
        else if (value.length < 2) message = "Must be at least 2 characters.";
        else if (!nameRegex.test(value)) message = "Letters only. No numbers or symbols.";
        break;
      case "middleName":
        if (value && !nameRegex.test(value)) message = "Letters only. No numbers or symbols.";
        break;
      case "mobileNumber":
        if (value && !contactRegex.test(value))
          message = "Contact number must be 11 digits only.";
        break;
      case "birthDate":
        if (value) {
          const selected = new Date(value);
          selected.setHours(0,0,0,0);
          if (selected > today) message = "Birth date cannot be in the future.";
        }
        break;
      case "registerDate":
        if (value) {
          const selected = new Date(value);
          selected.setHours(0,0,0,0);
          if (selected > today) message = "Register date cannot be in the future.";
          else if (selected < minRegisterDate) message = "Register date cannot be earlier than 2015.";
        }
        break;
      default:
        break;
    }
    return message;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Restrict contact number input
    if (name === "mobileNumber") {
      const digitsOnly = value.replace(/\D/g, "").slice(0, 11);
      setFormData({ ...formData, [name]: digitsOnly });
      const message = validateField(name, digitsOnly);
      setErrors((prev) => ({ ...prev, [name]: message }));
      return;
    }

    const message = validateField(name, value);
    setFormData({ ...formData, [name]: value });
    setErrors((prev) => ({ ...prev, [name]: message }));
  };

  // ---------------- SAVE PATIENT LOGIC ----------------
  const performSavePatient = async () => {
    try {
      const today = new Date();
      today.setHours(0,0,0,0);
      const minRegisterDate = new Date('2015-01-01');
      minRegisterDate.setHours(0,0,0,0);

      if (formData.registerDate) {
        const selected = new Date(formData.registerDate);
        selected.setHours(0,0,0,0);
        if (selected > today) {
          setErrors({ registerDate: "Register date cannot be in the future." });
          closeModal();
          return;
        }
        if (selected < minRegisterDate) {
          setErrors({ registerDate: "Register date cannot be earlier than 2015." });
          closeModal();
          return;
        }
      }

      setModalLoading(true);
      setLoading(true);
      
      const payload = {
        ...formData,
        // birthDate: send full ISO date-time (backend expects date-time)
        birthDate: formData.birthDate ? new Date(formData.birthDate).toISOString() : null,
        // registerDate: send as 'date' (YYYY-MM-DD) or null to match backend schema
        registerDate: formData.registerDate ? formData.registerDate : null,
      };

      const res = await api.post("/patient/create-patient", payload);
      if (res.data.success) {
        showToast('Patient created successfully', 'success');
        closeModal();
        onSuccess?.();
        onClose();
      } else {
        throw new Error(res.data.message || "Failed to create patient");
      }
    } catch (err) {
      console.error("Error creating patient:", err);
      const errorMessage = err.response?.data?.message ||
        "Unable to create patient. Please try again.";
      setErrors({ general: errorMessage });
      showToast(errorMessage, 'error');
      closeModal();
    } finally {
      setModalLoading(false);
      setLoading(false);
    }
  };

  // ---------------- SUBMIT ----------------
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate all fields before submitting
    const newErrors = {};
    Object.keys(formData).forEach((key) => {
      const msg = validateField(key, formData[key]);
      if (msg) newErrors[key] = msg;
    });
    setErrors(newErrors);

    if (Object.values(newErrors).some((err) => err)) return;

    // If high-level duplicate warning, show confirmation with warning
    if (duplicateCheck.isDuplicate && duplicateCheck.warning?.level === 'high') {
      showModal(
        "Potential Duplicate Patient Detected",
        `${duplicateCheck.warning.message}\n\nAre you absolutely sure you want to proceed with adding this patient?`,
        'warning',
        performSavePatient
      );
    } else {
      // Normal confirmation
      showModal(
        "Add New Patient",
        "Are you sure you want to add this new patient? Please review the details before confirming.",
        'success',
        performSavePatient
      );
    }
  };

  // ---------------- RENDER WARNING COMPONENT ----------------
  const renderDuplicateWarning = () => {
    if (!duplicateCheck.isDuplicate || !duplicateCheck.warning) return null;

    const { level, message } = duplicateCheck.warning;
    
    const getWarningStyle = () => {
      switch (level) {
        case 'high':
          return { 
            className: 'duplicate-warning-high', 
            icon: <XCircle size={20} />,
            bgColor: '#fee2e2',
            borderColor: '#ef4444',
            textColor: '#991b1b'
          };
        case 'medium':
          return { 
            className: 'duplicate-warning-medium', 
            icon: <AlertTriangle size={20} />,
            bgColor: '#fef3c7',
            borderColor: '#f59e0b',
            textColor: '#92400e'
          };
        case 'low':
          return { 
            className: 'duplicate-warning-low', 
            icon: <Info size={20} />,
            bgColor: '#dbeafe',
            borderColor: '#3b82f6',
            textColor: '#1e40af'
          };
        default:
          return { 
            className: 'duplicate-warning-low', 
            icon: <Info size={20} />,
            bgColor: '#dbeafe',
            borderColor: '#3b82f6',
            textColor: '#1e40af'
          };
      }
    };

    const style = getWarningStyle();

    return (
      <div 
        className={`duplicate-warning ${style.className}`}
        style={{
          backgroundColor: style.bgColor,
          border: `2px solid ${style.borderColor}`,
          color: style.textColor,
          padding: '12px 16px',
          borderRadius: '8px',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '12px'
        }}
      >
        <div style={{ flexShrink: 0, marginTop: '2px' }}>
          {style.icon}
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ margin: 0, fontWeight: 600, marginBottom: '8px' }}>
            {message}
          </p>
          {duplicateCheck.matches.length > 0 && (
            <div style={{ marginTop: '8px' }}>
              <p style={{ margin: 0, fontSize: '14px', fontWeight: 500, marginBottom: '6px' }}>
                Existing Patient{duplicateCheck.matches.length > 1 ? 's' : ''}:
              </p>
              <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '14px' }}>
                {duplicateCheck.matches.map((match) => (
                  <li key={match.id} style={{ marginBottom: '4px' }}>
                    <strong>{match.fullName}</strong> - {match.gender}, 
                    Born: {new Date(match.birthDate).toLocaleDateString()}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    );
  };

  // ---------------- RENDER ----------------
  return (
    <>
      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={modalConfig.isOpen}
        onClose={closeModal}
        onConfirm={modalConfig.onConfirm}
        title={modalConfig.title}
        message={modalConfig.message}
        type={modalConfig.type}
        isLoading={modalConfig.isLoading}
        confirmText="Save Patient"
        cancelText="Cancel"
      />

      {/* Toast Notification */}
      <Toast
        isVisible={toastConfig.isVisible}
        onClose={closeToast}
        message={toastConfig.message}
        type={toastConfig.type}
        duration={toastConfig.duration}
        position="bottom-right"
      />

      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h2>Patient Details</h2>
            <button className="close-button" onClick={onClose}>
              <X size={24} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="patient-form">
            {errors.general && <div className="form-error">{errors.general}</div>}

            {/* Duplicate Warning */}
            {renderDuplicateWarning()}

            {/* PERSONAL INFO */}
            <div className="form-section">
              <h3 className="section-title">Personal Information</h3>
              <div className="form-row">
                <div className="form-group">
                  <label>Last Name *</label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    placeholder="Enter last name"
                  />
                  {errors.lastName && <small className="error">{errors.lastName}</small>}
                </div>

                <div className="form-group">
                  <label>First Name *</label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    placeholder="Enter first name"
                  />
                  {errors.firstName && <small className="error">{errors.firstName}</small>}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Middle Name</label>
                  <input
                    type="text"
                    name="middleName"
                    value={formData.middleName}
                    onChange={handleChange}
                    placeholder="Enter middle name (optional)"
                  />
                  {errors.middleName && <small className="error">{errors.middleName}</small>}
                  {duplicateCheck.isChecking && (
                    <small style={{ color: '#6b7280', fontStyle: 'italic' }}>
                      Checking for duplicates...
                    </small>
                  )}
                </div>
                <div className="form-group">
                  <label>Sex *</label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    required
                  >
                    <option value="">-- Select Sex --</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>
              </div>
            </div>

            {/* DEMOGRAPHICS */}
            <div className="form-section">
              <h3 className="section-title">Demographics</h3>
              <div className="form-row">
                <div className="form-group date-field">
                  <label>Birth Date *</label>
                  <div className="input-with-icon">
                    <input
                      ref={birthDateRef}
                      type="date"
                      name="birthDate"
                      value={formData.birthDate}
                      onChange={handleChange}
                      required
                      max={new Date().toISOString().split('T')[0]}
                    />
                    <Calendar
                      className="calendar-icon"
                      onClick={() => birthDateRef.current.showPicker()}
                    />
                  </div>
                  {errors.birthDate && (
                    <small className="error">{errors.birthDate}</small>
                  )}
                </div>

                <div className="form-group">
                  <label>Age</label>
                  <input type="number" name="age" value={formData.age} readOnly />
                </div>
              </div>
            </div>

            {/* CONTACT INFO */}
            <div className="form-section">
              <h3 className="section-title">Contact Information</h3>
              <div className="form-row">
                <div className="form-group">
                  <label>Contact No.</label>
                  <input
                    type="tel"
                    name="mobileNumber"
                    value={formData.mobileNumber}
                    onChange={handleChange}
                    placeholder="11-digit number"
                  />
                  {errors.mobileNumber && (
                    <small className="error">{errors.mobileNumber}</small>
                  )}
                </div>
                <div className="form-group">
                  <label>Address</label>
                  <textarea
                    name="residentialAddress"
                    value={formData.residentialAddress}
                    onChange={handleChange}
                    placeholder="Enter residential address"
                  />
                </div>
              </div>
            </div>

            {/* ADDITIONAL INFO */}
            <div className="form-section">
              <h3 className="section-title">Additional Information</h3>
              <div className="form-row">
                <div className="form-group date-field">
                  <label>Register Date</label>
                  <div className="input-with-icon">
                    <input
                      ref={registerDateRef}
                      type="date"
                      name="registerDate"
                      value={formData.registerDate}
                      onChange={handleChange}
                      max={new Date().toISOString().split("T")[0]}
                      min={'2015-01-01'}
                    />
                    <Calendar
                      className="calendar-icon"
                      onClick={() => registerDateRef.current.showPicker()}
                    />
                  </div>
                  {errors.registerDate && (
                    <small className="error">{errors.registerDate}</small>
                  )}
                </div>
                <div className="form-group">
                  <label>Senior/PWD ID No.</label>
                  <input
                    type="text"
                    name="csdIdOrPwdId"
                    value={formData.csdIdOrPwdId}
                    onChange={handleChange}
                    placeholder="Enter ID number (optional)"
                  />
                </div>
              </div>
            </div>

            {/* ACTION BUTTONS */}
            <div className="form-actions">
              <button
                type="button"
                className="btn-cancel"
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </button>
              <button type="submit" className="btn-save" disabled={loading}>
                {loading ? "Saving..." : "Save Patient"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default AddPatient;