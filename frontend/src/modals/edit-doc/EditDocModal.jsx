import { useState } from "react";
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

  // Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setError("");
  };

  // Handle submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (
      !formData.assessment &&
      !formData.diagnosis &&
      !formData.treatment &&
      !formData.prescription
    ) {
      setError("At least one field must be filled to update the record.");
      return;
    }

    try {
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

      const res = await api.post(
        `/document/update-medical-documentation/${docData.id}`,
        payload
      );

      if (res.data.success) {
        onSuccess?.();
        onClose();
      } else {
        setError(res.data.message || "Failed to update medical document.");
      }
    } catch (err) {
      console.error("Error updating document:", err);
      setError(
        err.response?.data?.message ||
          "Unable to update document. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
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
              />
            </div>

            <div className="editdoc-form-group">
              <label>Diagnosis</label>
              <textarea
                name="diagnosis"
                placeholder="Enter diagnosis"
                value={formData.diagnosis}
                onChange={handleChange}
              />
            </div>

            <div className="editdoc-form-group">
              <label>Treatment</label>
              <textarea
                name="treatment"
                placeholder="Enter treatment details"
                value={formData.treatment}
                onChange={handleChange}
              />
            </div>

            <div className="editdoc-form-group">
              <label>Prescription</label>
              <textarea
                name="prescription"
                placeholder="Enter prescription"
                value={formData.prescription}
                onChange={handleChange}
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
  );
};

export default EditDocModal;
