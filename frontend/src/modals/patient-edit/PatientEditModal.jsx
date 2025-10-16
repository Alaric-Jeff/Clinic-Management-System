import { useState, useEffect } from "react";
import api from "../../axios/api";
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
    setFormData({ ...formData, [name]: value });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const trimmedFirstName = formData.firstName.trim();
      const trimmedLastName = formData.lastName.trim();

      if (!trimmedFirstName || !trimmedLastName) {
        setError("First name and last name are required.");
        return;
      }

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
        onSuccess?.();
      } else {
        setError(res.data.message || "Failed to update patient");
      }
    } catch (err) {
      console.error("Error updating patient:", err);
      setError(err.response?.data?.message || "Unable to update patient. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
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
                placeholder="Enter contact number"
                value={formData.mobileNumber}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Address</label>
              <textarea
                name="residentialAddress"
                placeholder="Enter residential address"
                value={formData.residentialAddress}
                onChange={handleChange}
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
  );
};

export default EditPatientModal;