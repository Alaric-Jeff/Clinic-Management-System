import { useState } from "react";
import Toast from "../../components/Toast/Toast";
import ConfirmModal from "../../components/ConfirmModal/ConfirmModal";
import api from "../../axios/api";
import "./EditDocModal.css";

const EditDocModal = ({ docData, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    assessment: docData.assessment || "",
    diagnosis: docData.diagnosis || "",
    treatment: docData.treatment || "",
    prescription: docData.prescription || "",
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

  // Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setError("");
  };

  // Validate form
  const validateForm = () => {
    if (
      !formData.assessment &&
      !formData.diagnosis &&
      !formData.treatment &&
      !formData.prescription
    ) {
      setError("At least one field must be filled to update the record.");
      return false;
    }

    // Check if there are actual changes
    const hasChanges = 
      formData.assessment !== docData.assessment ||
      formData.diagnosis !== docData.diagnosis ||
      formData.treatment !== docData.treatment ||
      formData.prescription !== docData.prescription;

    if (!hasChanges) {
      setError("No changes detected. Please modify at least one field.");
      return false;
    }

    return true;
  };

  // Handle submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!validateForm()) {
      return;
    }

    // Show confirmation modal instead of directly submitting
    showModal(
      "Update Medical Record",
      "Are you sure you want to update this medical record?",
      'warning',
      performUpdate
    );
  };

  // Perform the actual update
  const performUpdate = async () => {
    try {
      setModalLoading(true);
      setLoading(true);

      const payload = {
        assessment:
          formData.assessment !== docData.assessment
            ? formData.assessment
            : undefined,
        diagnosis:
          formData.diagnosis !== docData.diagnosis
            ? formData.diagnosis
            : undefined,
        treatment:
          formData.treatment !== docData.treatment
            ? formData.treatment
            : undefined,
        prescription:
          formData.prescription !== docData.prescription
            ? formData.prescription
            : undefined,
      };

      const res = await api.patch(
        `/document/update-medical-documentation/${docData.id}`,
        payload
      );

      if (res.data.success) {
        showToast('Medical record updated successfully', 'success');
        onSuccess?.();
        onClose();
      } else {
        throw new Error(res.data.message || "Failed to update medical document.");
      }
    } catch (err) {
      console.error("Error updating document:", err);
      const errorMessage = err.response?.data?.message ||
        "Unable to update document. Please try again.";
      setError(errorMessage);
      showToast(errorMessage, 'error');
    } finally {
      setLoading(false);
      setModalLoading(false);
      closeModal();
    }
  };

  return (
    <>
      <div className="editdoc-modal-overlay" onClick={onClose}>
        <div
          className="editdoc-modal-content"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="editdoc-modal-header">
            <h2>Edit Medical Record</h2>
          </div>

          <form onSubmit={handleSubmit} className="editdoc-form">
            {error && <div className="editdoc-form-error">{error}</div>}

            <div className="editdoc-form-section">
              <h3 className="editdoc-section-title">Medical Information</h3>

              <div className="editdoc-form-group">
                <label>Assessment</label>
                <textarea
                  name="assessment"
                  placeholder="Enter assessment details"
                  value={formData.assessment}
                  onChange={handleChange}
                  rows="4"
                />
              </div>

              <div className="editdoc-form-group">
                <label>Diagnosis</label>
                <textarea
                  name="diagnosis"
                  placeholder="Enter diagnosis"
                  value={formData.diagnosis}
                  onChange={handleChange}
                  rows="4"
                />
              </div>

              <div className="editdoc-form-group">
                <label>Treatment</label>
                <textarea
                  name="treatment"
                  placeholder="Enter treatment details"
                  value={formData.treatment}
                  onChange={handleChange}
                  rows="4"
                />
              </div>

              <div className="editdoc-form-group">
                <label>Prescription</label>
                <textarea
                  name="prescription"
                  placeholder="Enter prescription"
                  value={formData.prescription}
                  onChange={handleChange}
                  rows="4"
                />
              </div>
            </div>

            <div className="editdoc-form-actions">
              <button
                type="button"
                className="editdoc-btn-cancel"
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="editdoc-btn-save"
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

export default EditDocModal;