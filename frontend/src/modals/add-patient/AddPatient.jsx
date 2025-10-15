import { useState, useEffect } from "react";
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

  // ✅ Automatically calculate age
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
  };

const handleSubmit = async (e) => {
  e.preventDefault();

  try {
    const today = new Date().toISOString().split("T")[0];
    if (formData.registerDate > today) {
      alert("Register date cannot be in the future.");
      return;
    }
    const payload = {
      ...formData,
      birthDate: formData.birthDate
        ? new Date(formData.birthDate).toISOString()
        : null,
      registerDate: formData.registerDate || null, 
      csdIdOrPwdId: formData.csdIdOrPwdId || null,
      middleName: formData.middleName || null,
      mobileNumber: formData.mobileNumber || null,
      residentialAddress: formData.residentialAddress || null,
    };

    const res = await api.post("/patient/create-patient", payload);
    console.log("Submitted payload:", payload);
    console.log("Response:", res.data);

    if (res.data.success) {
      onSuccess?.();
      onClose();
    }
  } catch (err) {
    console.error("Error creating patient:", err);
  }
};

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        {/* Styled header */}
        <div className="modal-header">
          <h2>🩺 Patient Details</h2>
        </div>

        <form onSubmit={handleSubmit} className="patient-form">
          <input name="lastName" placeholder="Last Name" onChange={handleChange} required />
          <input name="firstName" placeholder="First Name" onChange={handleChange} required />
          <input name="middleName" placeholder="Middle Name" onChange={handleChange} />

          <div className="row">
            <label>
              Birth Date
              <input type="date" name="birthDate" onChange={handleChange} required />
            </label>
          </div>

          <div className="row">
            <label>
              Age
              <input
                name="age"
                value={formData.age}
                readOnly
                style={{ backgroundColor: "#f4f4f4", cursor: "not-allowed" }}
              />
            </label>
            <input
              name="csdIdOrPwdId"
              placeholder="Senior/PWD ID No."
              onChange={handleChange}
            />
          </div>

          <div className="row">
            <select name="gender" onChange={handleChange} required>
              <option value="">Sex</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
            <label>
              Register Date
              <input
                type="date"
                name="registerDate"
                onChange={handleChange}
                max={new Date().toISOString().split("T")[0]}
              />
            </label>
          </div>

          <input name="mobileNumber" placeholder="Contact No." onChange={handleChange} />
          <textarea name="residentialAddress" placeholder="Address" onChange={handleChange} />

          <div className="actions">
            <button type="button" className="cancel-btn" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="save-btn">
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddPatient;
