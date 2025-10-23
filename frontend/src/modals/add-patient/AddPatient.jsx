import { useState, useEffect, useRef } from "react";
import { Calendar } from "lucide-react";
import api from "../../axios/api";
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

  // Refs for date pickers
  const birthDateRef = useRef(null);
  const registerDateRef = useRef(null);

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

    if (!window.confirm("Add new Patient?")) return;

    try {
      const today = new Date().toISOString().split("T")[0];
      if (formData.registerDate > today) {
        setErrors({ registerDate: "Register date cannot be in the future." });
        return;
      }

      setLoading(true);
      const payload = {
        ...formData,
        birthDate: formData.birthDate
          ? new Date(formData.birthDate).toISOString()
          : null,
        registerDate: formData.registerDate || null,
      };

      const res = await api.post("/patient/create-patient", payload);
      if (res.data.success) {
        onSuccess?.();
        onClose();
      } else {
        setErrors({ general: res.data.message || "Failed to create patient" });
      }
    } catch (err) {
      console.error("Error creating patient:", err);
      setErrors({
        general:
          err.response?.data?.message ||
          "Unable to create patient. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  // ---------------- RENDER ----------------
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Patient Details</h2>
        </div>

        <form onSubmit={handleSubmit} className="patient-form">
          {errors.general && <div className="form-error">{errors.general}</div>}

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
                  />
                  <Calendar
                    className="calendar-icon"
                    onClick={() => birthDateRef.current.showPicker()}
                  />
                </div>
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
  );
};

export default AddPatient;
