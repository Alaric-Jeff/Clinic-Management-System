import { useEffect, useState } from "react";
import api from "../../axios/api";
import Toast from '../../components/Toast/Toast';
import ConfirmModal from '../../components/ConfirmModal/ConfirmModal';
import "./MedicalServices.css";
import AddServiceModal from "../../modals/add-service/AddServiceModal";
import EditServiceModal from "../../modals/edit-service/EditServiceModal";

const MedicalServices = () => {
  const [services, setServices] = useState([]);
  const [filteredServices, setFilteredServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Toast state
  const [toast, setToast] = useState({
    show: false,
    message: '',
    type: 'success'
  });

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
  };

  const hideToast = () => {
    setToast({ ...toast, show: false });
  };

  const fetchServices = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get("/service/get-all-medical-services");
      
      if (res.data.success) {
        console.log(res.data.data);
        setServices(res.data.data || []);
        setFilteredServices(res.data.data || []);
      } else {
        setServices([]);
        setFilteredServices([]);
        setError(res.data.message || "Failed to fetch services");
        showToast(res.data.message || 'Failed to fetch services', 'error');
      }
    } catch (err) {
      console.error("Error fetching services:", err);
      setError("Unable to load medical services. Please try again.");
      setServices([]);
      setFilteredServices([]);
      showToast('Unable to load medical services', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Filter services based on search and category
  useEffect(() => {
    let filtered = services;

    // Filter by search query
    if (searchQuery.trim()) {
      filtered = filtered.filter((service) =>
        service.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by category
    if (selectedCategory) {
      filtered = filtered.filter(
        (service) => service.category === selectedCategory
      );
    }

    setFilteredServices(filtered);
  }, [searchQuery, selectedCategory, services]);

  const handleDeleteClick = (service) => {
    setSelectedService(service);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedService) return;

    setIsDeleting(true);
    try {
      const res = await api.delete(`/service/delete-medical-service/${selectedService.id}`);
      
      if (res.data.success) {
        // Remove service from state immediately
        setServices((prev) =>
          prev.filter((service) => service.id !== selectedService.id)
        );
        setShowDeleteModal(false);
        showToast('Service successfully deleted', 'success');
        setSelectedService(null);
      } else {
        setError(res.data.message || "Failed to delete service");
        showToast(res.data.message || 'Failed to delete service', 'error');
      }
    } catch (err) {
      console.error("Error deleting service:", err);
      const errorMsg = err.response?.data?.message || "Unable to delete service. Please try again.";
      setError(errorMsg);
      showToast(errorMsg, 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEditClick = (service) => {
    setSelectedService(service);
    setShowEditModal(true);
  };

  const handleAddSuccess = () => {
    setShowAddModal(false);
    showToast('Service successfully added', 'success');
    fetchServices();
  };

  const handleEditSuccess = () => {
    setShowEditModal(false);
    setSelectedService(null);
    showToast('Service successfully updated', 'success');
    fetchServices();
  };

  useEffect(() => {
    fetchServices();
  }, []);

  // Get unique categories for filter dropdown
  const categories = [...new Set(services.map((s) => s.category))];

  if (loading) {
    return (
      <div className="medical-services-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading medical services...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="medical-services-container">
      {/* Leonardo Medical Services Header */}
      <div className="header">
        <div className="title-section">
          <h1>LEONARDO MEDICAL SERVICES</h1>
          <p>B1 L17-E Neovista, Bagumbong, Caloocan City</p>
        </div>
      </div>

      {error && (
        <div className="error-message">
          <span className="error-icon">⚠</span>
          {error}
        </div>
      )}

      {/* Search and Filter Section */}
      <div className="services-controls">
        <div className="services-search-filters">
          <div className="search-box">
            <input
              type="text"
              placeholder="Search services..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>
          <select
            className="category-select"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        <button
          className="add-service-btn"
          onClick={() => setShowAddModal(true)}
        >
          + Add Service
        </button>
      </div>

      <div className="services-table-container">
        <table className="services-table">
          <thead>
            <tr>
              <th>Service Name</th>
              <th>Category</th>
              <th>Default Price</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredServices.length > 0 ? (
              filteredServices.map((service) => (
                <tr key={service.id}>
                  <td>{service.name}</td>
                  <td>{service.category}</td>
                  <td>₱ {service.price.toFixed(2)}</td>
                  <td>
                    <button
                      className="edit-btn"
                      onClick={() => handleEditClick(service)}
                    >
                      Edit
                    </button>
                    <button
                      className="delete-btn"
                      onClick={() => handleDeleteClick(service)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" className="no-data">
                  {searchQuery || selectedCategory
                    ? "No services match your filters"
                    : "No services found"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modals */}
      {showAddModal && (
        <AddServiceModal
          onClose={() => setShowAddModal(false)}
          onSuccess={handleAddSuccess}
          existingServices={services}
        />
      )}

      {showEditModal && selectedService && (
        <EditServiceModal
          service={selectedService}
          onClose={() => {
            setShowEditModal(false);
            setSelectedService(null);
          }}
          onSuccess={handleEditSuccess}
        />
      )}

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => !isDeleting && setShowDeleteModal(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Service?"
        message={selectedService ? `Are you sure you want to delete "${selectedService.name}"? This action cannot be undone.` : ''}
        confirmText="Yes, Delete"
        cancelText="Cancel"
        type="danger"
        isLoading={isDeleting}
      />

      {/* Toast Notification */}
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.show}
        onClose={hideToast}
        position="bottom-right"
      />
    </div>
  );
};

export default MedicalServices;