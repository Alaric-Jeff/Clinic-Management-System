import { useState, useEffect } from "react";
import api from "../../axios/api";
import Toast from "../../components/Toast/Toast";
import ConfirmModal from "../../components/ConfirmModal/ConfirmModal";
import "./PatientEditModal.css";

const EditPatientModal = ({ patient, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    firstName: patient.firstName || "",
    lastName: patient.lastName || "",
    middleName: patient.middleName || "",
    birthDate: patient.birthDate ? patient.birthDate.split("T")[0] : "",
    age: patient.age || "",
    gender: patient.gender || "",
    mobileNumber: patient.mobileNumber || "",
    residentialAddress: patient.residentialAddress || "",
    csdIdOrPwdId: patient.csdIdOrPwdId || "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  
  // Modal and Toast states
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    type: 'warning',
    title: '',
    message: '',
    onConfirm: null,
    isLoading: false
  });
  const [toastConfig, setToastConfig] = useState({
    isVisible: false,
    message: '',
    type: 'success',
    duration: 4000
  });

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

  // Show modal function
  const showModal = (title, message, type = 'warning', onConfirm) => {
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Validate birth date if it's the birthDate field
    if (name === "birthDate" && value) {
      const selectedDate = new Date(value);
      const today = new Date();
      
      // Reset time part for accurate comparison
      today.setHours(0, 0, 0, 0);
      selectedDate.setHours(0, 0, 0, 0);
      
      if (selectedDate > today) {
        setError("Birth date cannot be in the future");
        return;
      }
    }
    
    setFormData({ ...formData, [name]: value });
    setError("");
  };

  const validateForm = () => {
    const trimmedFirstName = formData.firstName.trim();
    const trimmedLastName = formData.lastName.trim();

    if (!trimmedFirstName || !trimmedLastName) {
      setError("First name and last name are required.");
      return false;
    }

    // Validate birth date
    if (formData.birthDate) {
      const selectedDate = new Date(formData.birthDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      selectedDate.setHours(0, 0, 0, 0);
      
      if (selectedDate > today) {
        setError("Birth date cannot be in the future");
        return false;
      }
    }

    // Validate mobile number format (if provided)
    if (formData.mobileNumber && !/^09\d{9}$/.test(formData.mobileNumber.replace(/\s/g, ''))) {
      setError("Please enter a valid Philippine mobile number (09XXXXXXXXX)");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!validateForm()) {
      return;
    }

    // Show confirmation modal instead of directly submitting
    showModal(
      "Confirm Patient Update",
      "Are you sure you want to update this patient's information?",
      'warning',
      performUpdate
    );
  };

  const performUpdate = async () => {
    try {
      const trimmedFirstName = formData.firstName.trim();
      const trimmedLastName = formData.lastName.trim();

      setModalLoading(true);
      setLoading(true);

      const payload = {
        id: patient.id,
        firstName: trimmedFirstName !== patient.firstName ? trimmedFirstName : null,
        lastName: trimmedLastName !== patient.lastName ? trimmedLastName : null,
        middleName: formData.middleName !== patient.middleName ? (formData.middleName || null) : null,
        birthDate: formData.birthDate !== patient.birthDate?.split("T")[0] ? formData.birthDate : null,
        gender: formData.gender !== patient.gender ? (formData.gender || null) : null,
        mobileNumber: formData.mobileNumber !== patient.mobileNumber ? (formData.mobileNumber || null) : null,
        residentialAddress: formData.residentialAddress !== patient.residentialAddress ? (formData.residentialAddress || null) : null,
        csdIdOrPwdId: formData.csdIdOrPwdId !== patient.csdIdOrPwdId ? (formData.csdIdOrPwdId || null) : null,
      };

      console.log("Patient ID being sent:", payload.id);
      console.log("Full Payload:", payload);
      console.log("Patient object:", patient);

      const res = await api.patch("/patient/patch-patient", payload);
      console.log("Response:", res.data);

      if (res.data.success) {
        showToast('Patient updated successfully', 'success');
        onSuccess?.();
        onClose();
      } else {
        throw new Error(res.data.message || "Failed to update patient");
      }
    } catch (err) {
      console.error("Error updating patient:", err);
      const errorMessage = err.response?.data?.message || "Unable to update patient. Please try again.";
      showToast(errorMessage, 'error');
    } finally {
      setLoading(false);
      setModalLoading(false);
      closeModal();
    }
  };

  // Get max date for birth date (today)
  const getMaxBirthDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  return (
    <>
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h2>Edit Patient</h2>
          </div>

          <form onSubmit={handleSubmit} className="patient-form">
            {error && <div className="form-error">{error}</div>}

            {/* Name Section */}
            <div className="form-section">
              <h3 className="section-title">Personal Information</h3>
              <div className="form-row">
                <div className="form-group">
                  <label>Last Name *</label>
                  <input
                    type="text"
                    name="lastName"
                    placeholder="Enter last name"
                    value={formData.lastName}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>First Name *</label>
                  <input
                    type="text"
                    name="firstName"
                    placeholder="Enter first name"
                    value={formData.firstName}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Middle Name</label>
                  <input
                    type="text"
                    name="middleName"
                    placeholder="Enter middle name (optional)"
                    value={formData.middleName}
                    onChange={handleChange}
                  />
                </div>
                <div></div>
              </div>
            </div>

            {/* Birth & Gender Section */}
            <div className="form-section">
              <h3 className="section-title">Demographics</h3>
              <div className="form-row">
                <div className="form-group">
                  <label>Birth Date *</label>
                  <input
                    type="date"
                    name="birthDate"
                    value={formData.birthDate}
                    onChange={handleChange}
                    required
                    max={getMaxBirthDate()} // Prevent future dates
                  />
                </div>
                <div className="form-group">
                  <label>Age</label>
                  <input
                    type="number"
                    name="age"
                    value={formData.age}
                    readOnly
                    className="readonly-input"
                  />
                </div>
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

            {/* Contact Section */}
            <div className="form-section">
              <h3 className="section-title">Contact Information</h3>
              <div className="form-group">
                <label>Contact No.</label>
                <input
                  type="tel"
                  name="mobileNumber"
                  placeholder="Enter contact number (09XXXXXXXXX)"
                  value={formData.mobileNumber}
                  onChange={handleChange}
                  pattern="09[0-9]{9}"
                  title="Please enter a valid Philippine mobile number (09XXXXXXXXX)"
                />
              </div>

              <div className="form-group">
                <label>Address</label>
                <textarea
                  name="residentialAddress"
                  placeholder="Enter residential address"
                  value={formData.residentialAddress}
                  onChange={handleChange}
                  rows="3"
                />
              </div>
            </div>

            {/* Additional Information Section */}
            <div className="form-section">
              <h3 className="section-title">Additional Information</h3>
              <div className="form-row">
                <div className="form-group">
                  <label>Senior/PWD ID No.</label>
                  <input
                    type="text"
                    name="csdIdOrPwdId"
                    placeholder="Enter ID number (optional)"
                    value={formData.csdIdOrPwdId}
                    onChange={handleChange}
                  />
                </div>
                <div></div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="form-actions">
              <button
                type="button"
                className="btn-cancel"
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-save"
                disabled={loading}
              >
                {loading ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Confirm Modal - Rendered at root level */}
      <ConfirmModal
        isOpen={modalConfig.isOpen}
        onClose={closeModal}
        onConfirm={modalConfig.onConfirm}
        title={modalConfig.title}
        message={modalConfig.message}
        type={modalConfig.type}
        isLoading={modalConfig.isLoading}
        confirmText="Yes, Update"
        cancelText="Cancel"
      />

      {/* Toast Notification - Rendered at root level */}
      <Toast
        isVisible={toastConfig.isVisible}
        onClose={closeToast}
        message={toastConfig.message}
        type={toastConfig.type}
        duration={toastConfig.duration}
        position="bottom-right"
      />
    </>
  );
};

export default EditPatientModal;