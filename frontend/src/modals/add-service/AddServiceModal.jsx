import { useState } from "react";
import api from "../../axios/api";
import "./AddServiceModal.css";
import ConfirmModal from "../../components/ConfirmModal/ConfirmModal";
import Toast from "../../components/Toast/Toast";

const AddServiceModal = ({ onClose, onSuccess, existingServices = [] }) => {
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    price: "",
  });
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [loading, setLoading] = useState(false);

  // Toast state
  const [toast, setToast] = useState({
    isVisible: false,
    message: '',
    type: 'success'
  });

  const showToast = (message, type = 'success') => {
    setToast({ isVisible: true, message, type });
  };

  const closeToast = () => {
    setToast({ ...toast, isVisible: false });
  };

  // Service categories enum with display names
  const CATEGORIES = {
    hematology: "Hematology",
    bacteriology: "Bacteriology",
    clinical_microscopy: "Clinical Microscopy",
    twenty_four_hour_urine_test: "24-Hour Urine Test",
    serology_immunology: "Serology & Immunology",
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
    
    // Handle price input - only allow positive numbers
    if (name === "price") {
      // Allow empty string for clearing
      if (value === "") {
        setFormData({ ...formData, [name]: "" });
        return;
      }
      
      // Only allow numbers and decimal point
      const numericValue = value.replace(/[^0-9.]/g, '');
      
      // Prevent multiple decimal points
      if ((numericValue.match(/\./g) || []).length > 1) {
        return;
      }
      
      // Prevent negative values
      const parsedValue = parseFloat(numericValue);
      if (!isNaN(parsedValue) && parsedValue < 0) {
        return;
      }
      
      setFormData({ ...formData, [name]: numericValue });
      return;
    }
    
    setFormData({ ...formData, [name]: value });
  };

  const validateForm = () => {
    // Validate service name
    const trimmedName = formData.name.trim();
    if (!trimmedName) {
      showToast("Service name is required", "error");
      return false;
    }

    // Check for duplicate service name (case-insensitive)
    const isDuplicate = existingServices.some(
      service => service.name.toLowerCase() === trimmedName.toLowerCase()
    );
    
    if (isDuplicate) {
      showToast("A service with this name already exists", "error");
      return false;
    }

    // Validate category
    if (!formData.category) {
      showToast("Please select a category", "error");
      return false;
    }

    // Validate price
    const price = parseFloat(formData.price);
    if (!formData.price || isNaN(price)) {
      showToast("Price is required", "error");
      return false;
    }
    
    if (price < 1) {
      showToast("Price must be at least ₱1.00", "error");
      return false;
    }

    return true;
  };

  const handlePrepareSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    // Show confirmation modal
    setShowConfirmModal(true);
  };

  const handleConfirmSubmit = async () => {
    setShowConfirmModal(false);
    setLoading(true);

    try {
      const payload = {
        name: formData.name.trim(),
        category: formData.category,
        price: parseFloat(formData.price),
      };

      const res = await api.post("/service/create-medical-service", payload);

      if (res.data.success) {
        showToast("Service successfully added!", "success");
        setTimeout(() => {
          onSuccess?.();
          onClose();
        }, 1500);
      } else {
        showToast(res.data.message || "Failed to create service", "error");
      }
    } catch (err) {
      console.error("Error creating service:", err);
      showToast(err.response?.data?.message || "Unable to create service. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="add-service-overlay" onClick={onClose}>
        <div className="add-service-modal" onClick={(e) => e.stopPropagation()}>
          {/* Header */}
          <div className="add-service-header">
            <h2>Add New Service</h2>
            <button className="add-service-close" onClick={onClose} type="button">✕</button>
          </div>

          {/* Form */}
          <form onSubmit={handlePrepareSubmit} className="add-service-form">
            {/* Service Name */}
            <div className="form-field">
              <label htmlFor="service-name">Service Name</label>
              <input
                id="service-name"
                type="text"
                name="name"
                placeholder="e.g., Complete Blood Count"
                value={formData.name}
                onChange={handleChange}
                maxLength={100}
                autoComplete="off"
              />
            </div>

            {/* Category */}
            <div className="form-field">
              <label htmlFor="service-category">Category</label>
              <select
                id="service-category"
                name="category"
                value={formData.category}
                onChange={handleChange}
              >
                <option value="">Select a category</option>
                {Object.entries(CATEGORIES).map(([key, display]) => (
                  <option key={key} value={key}>
                    {display}
                  </option>
                ))}
              </select>
            </div>

            {/* Price */}
            <div className="form-field">
              <label htmlFor="service-price">Price</label>
              <div className="price-field">
                <span className="price-currency">₱</span>
                <input
                  id="service-price"
                  type="text"
                  name="price"
                  placeholder="0.00"
                  value={formData.price}
                  onChange={handleChange}
                  autoComplete="off"
                />
              </div>
              <span className="field-hint">Minimum: ₱1.00</span>
            </div>

            {/* Actions */}
            <div className="form-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={loading}
              >
                {loading ? "Adding..." : "Add Service"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={showConfirmModal}
        onClose={() => !loading && setShowConfirmModal(false)}
        onConfirm={handleConfirmSubmit}
        title="Add Service"
        message={`Add "${formData.name}" at ₱${parseFloat(formData.price || 0).toFixed(2)}?`}
        confirmText="Add Service"
        cancelText="Cancel"
        type="success"
        isLoading={loading}
      />

      {/* Toast Notification */}
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={closeToast}
        duration={3000}
        position="bottom-right"
      />
    </>
  );
};

export default AddServiceModal;