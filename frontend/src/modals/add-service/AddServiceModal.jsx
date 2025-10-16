import { useState } from "react";
import api from "../../axios/api";
import "./AddServiceModal.css";

const AddServiceModal = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    price: "",
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // Service categories enum with display names
  const CATEGORIES = {
    hematology: "Hematology",
    bacteriology: "Bacteriology",
    clinical_microscopy: "Clinical Microscopy",
    twenty_four_hour_urine_test: "Twenty Four Hour Urine Test",
    serology_immunology: "Serology Immunology",
    clinical_chemistry: "Clinical Chemistry",
    electrolytes: "Electrolytes",
    vaccine: "Vaccine",
    histopathology: "Histopathology",
    to_be_read_by_pathologist: "To Be Read By Pathologist",
    tumor_markers: "Tumor Markers",
    thyroid_function_test: "Thyroid Function Test",
    hormones: "Hormones",
    hepatitis: "Hepatitis",
    enzymes: "Enzymes",
    others: "Others",
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Prevent negative price values
    if (name === "price" && value < 0) {
      return;
    }
    
    setFormData({ ...formData, [name]: value });
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!formData.name.trim()) {
      setError("Service name is required");
      return;
    }
    if (!formData.category) {
      setError("Category is required");
      return;
    }
    if (!formData.price || formData.price <= 0) {
      setError("Price must be greater than 0");
      return;
    }

    try {
      setLoading(true);
      const payload = {
        name: formData.name.trim(),
        category: formData.category,
        price: parseFloat(formData.price),
      };

      const res = await api.post("/service/create-medical-service", payload);
      console.log("Response:", res.data);

      if (res.data.success) {
        onSuccess?.();
        onClose();
      } else {
        setError(res.data.message || "Failed to create service");
      }
    } catch (err) {
      console.error("Error creating service:", err);
      setError(err.response?.data?.message || "Unable to create service. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Add Service</h2>
        </div>

        <form onSubmit={handleSubmit} className="service-form">
          {error && <div className="form-error">{error}</div>}

          <div className="form-group">
            <label>Service Name :</label>
            <input
              type="text"
              name="name"
              placeholder="Enter service name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Category :</label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              required
            >
              <option value="">-- select category --</option>
              {Object.entries(CATEGORIES).map(([key, display]) => (
                <option key={key} value={key}>
                  {display}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Default Price :</label>
            <div className="price-input-wrapper">
              <span className="currency">₽</span>
              <input
                type="number"
                name="price"
                placeholder="0.00"
                value={formData.price}
                onChange={handleChange}
                step="0.01"
                min="0"
                required
              />
            </div>
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="btn-add"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? "Adding..." : "ADD"}
            </button>
            <button
              type="button"
              className="btn-cancel"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddServiceModal;