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
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    console.log(`[EditService] Field changed - ${name}: ${value}`);
    
    let processedValue = value;
    
    // Handle price field specifically
    if (name === "price") {
      // Remove any negative signs, multiple decimal points, or other invalid characters
      processedValue = value
        .replace(/-/g, '') // Remove all minus signs
        .replace(/^0+(\d)/, '$1') // Remove leading zeros
        .replace(/(\..*)\./g, '$1'); // Remove multiple decimal points
      
      // Ensure the value is not negative and doesn't start with invalid characters
      if (processedValue === '' || processedValue === '.') {
        processedValue = processedValue;
      } else if (parseFloat(processedValue) < 1) {
        processedValue = '1';
      }
    }
    
    setFormData({ ...formData, [name]: processedValue });
    setError(null);
  };

  const handlePriceKeyDown = (e) => {
    // Prevent minus key, 'e' (scientific notation), and multiple decimal points
    if (['-', 'e', 'E', '+'].includes(e.key)) {
      e.preventDefault();
      return;
    }
    
    // Prevent multiple decimal points
    if (e.key === '.' && formData.price.includes('.')) {
      e.preventDefault();
      return;
    }
  };

  const handlePriceBlur = (e) => {
    // Format the price on blur to ensure proper decimal format
    const value = e.target.value;
    if (value && value !== '') {
      // Ensure it has up to 2 decimal places
      const numValue = parseFloat(value);
      if (!isNaN(numValue)) {
        setFormData(prev => ({
          ...prev,
          price: numValue.toFixed(2)
        }));
      }
    }
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
    const isNameChanged = payload.name !== service.name;
    const isCategoryChanged = payload.category !== service.category;
    const isPriceChanged = payload.price !== service.price;
    
    if (!isNameChanged && !isCategoryChanged && !isPriceChanged) {
      setError("Please update at least one field");
      return;
    }

    // If price is provided, it must be >= 1 and valid
    if (payload.price !== null) {
      if (isNaN(payload.price) || payload.price < 1) {
        setError("Price must be at least ₱1.00");
        return;
      }
      
      // Additional validation for price format
      if (payload.price.toString().includes('-')) {
        setError("Price cannot be negative");
        return;
      }
    }

    // Validate name doesn't contain only special characters or numbers
    if (payload.name && payload.name.trim().length > 0) {
      const nameRegex = /^[a-zA-Z0-9\s\-_&.,()]+$/;
      if (!nameRegex.test(payload.name)) {
        setError("Service name contains invalid characters");
        return;
      }
      
      if (payload.name.trim().length < 2) {
        setError("Service name must be at least 2 characters long");
        return;
      }
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
    <div className="edit-modal-overlay" onClick={onClose}>
      <div className="edit-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="edit-modal-header">
          <h2>Edit Service</h2>
        </div>

        <form onSubmit={handleSubmit} className="edit-service-form">
          {error && <div className="edit-form-error">{error}</div>}

          <div className="edit-form-group">
            <label>Service Name :</label>
            <input
              type="text"
              name="name"
              placeholder="Enter service name"
              value={formData.name}
              onChange={handleChange}
              maxLength={100}
            />
          </div>

          <div className="edit-form-group">
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

          <div className="edit-form-group">
            <label>Default Price :</label>
            <div className="edit-price-input-wrapper">
              <span className="edit-currency">₱</span>
              <input
                type="number"
                name="price"
                placeholder="0.00"
                value={formData.price}
                onChange={handleChange}
                onKeyDown={handlePriceKeyDown}
                onBlur={handlePriceBlur}
                step="0.01"
                min="1"
                pattern="[0-9]*[.]?[0-9]*"
                inputMode="decimal"
              />
            </div>
          </div>

          <div className="edit-form-actions">
            <button
              type="button"
              className="edit-btn-save"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? "Saving..." : "SAVE"}
            </button>
            <button
              type="button"
              className="edit-btn-cancel"
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