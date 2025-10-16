import { useState } from "react";
import api from "../../axios/api";
import "./EditServiceModal.css";

const EditServiceModal = ({ service, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: service.name || "",
    category: service.category || "",
    price: service.price || "",
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
    console.log(`[EditService] Field changed - ${name}: ${value}`);
    
    // Prevent negative price values
    if (name === "price" && value < 0) {
      console.warn("[EditService] Negative price attempted, blocked");
      return;
    }
    
    setFormData({ ...formData, [name]: value });
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Build payload - convert empty strings to null
    const trimmedName = formData.name.trim();
    const payload = {
      id: service.id,
      name: trimmedName.length > 0 ? trimmedName : null,
      category: formData.category.length > 0 ? formData.category : null,
      price: formData.price === "" ? null : parseFloat(formData.price),
    };

    // Validation: at least one field must be updated
    if (payload.name === null && payload.category === null && payload.price === null) {
      setError("Please update at least one field");
      return;
    }

    // If price is provided, it must be > 0
    if (payload.price !== null && payload.price <= 0) {
      setError("Price must be greater than 0");
      return;
    }

    try {
      setLoading(true);
      const res = await api.patch("/service/patch-medical-services", payload);
      console.log("Response:", res.data);

      if (res.data.success) {
        onSuccess?.();
        onClose();
      } else {
        setError(res.data.message || "Failed to update service");
      }
    } catch (err) {
      console.error("Error updating service:", err);
      setError(err.response?.data?.message || "Unable to update service. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Edit Service</h2>
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
            />
          </div>

          <div className="form-group">
            <label>Category :</label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
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
              />
            </div>
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="btn-save"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? "Saving..." : "SAVE"}
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

export default EditServiceModal;