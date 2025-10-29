import { useEffect, useState } from "react";
import api from "../../axios/api";
import "./MedicalServices.css";
import AddServiceModal from "../../modals/add-service/AddServiceModal";
import DeleteServiceModal from "../../modals/delete-service/DeleteServiceModal";
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

  const fetchServices = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get("/service/get-all-medical-services");
      
      if (res.data.success) {
        setServices(res.data.data || []);
        setFilteredServices(res.data.data || []);
      } else {
        setServices([]);
        setFilteredServices([]);
        setError(res.data.message || "Failed to fetch services");
      }
    } catch (err) {
      console.error("Error fetching services:", err);
      setError("Unable to load medical services. Please try again.");
      setServices([]);
      setFilteredServices([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let filtered = services;

    if (searchQuery.trim()) {
      filtered = filtered.filter((service) =>
        service.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedCategory) {
      filtered = filtered.filter(
        (service) => service.category === selectedCategory
      );
    }

    setFilteredServices(filtered);
  }, [searchQuery, selectedCategory, services]);

  const handleDeleteConfirm = async () => {
    if (!selectedService) return;

    try {
      const res = await api.delete(`/service/delete-medical-service/${selectedService.id}`);
      
      if (res.data.success) {
        setServices((prev) =>
          prev.filter((service) => service.id !== selectedService.id)
        );
        setShowDeleteModal(false);
        setSelectedService(null);
      } else {
        setError(res.data.message || "Failed to delete service");
      }
    } catch (err) {
      console.error("Error deleting service:", err);
      setError("Unable to delete service. Please try again.");
    }
  };

  const handleEditClick = (service) => {
    setSelectedService(service);
    setShowEditModal(true);
  };

  const handleDeleteClick = (service) => {
    setSelectedService(service);
    setShowDeleteModal(true);
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const categories = [...new Set(services.map((s) => s.category))];

  if (loading) {
    return (
      <div className="medical-services-container">
        <p className="loading-state">Loading medical services...</p>
      </div>
    );
  }

  return (
    <div className="medical-services-container">
      {/* ✅ Added header (copied and styled from PatientList) */}
      <div className="header">
        <div className="title-section">
          <h1>LEONARDO MEDICAL SERVICES</h1>
          <p>B1 L17-E Neovista, Bagumbong, Caloocan City</p>
        </div>
      </div>

      <div className="services-header">
        <h1 className="services-title">Medical Services</h1>
        <button
          className="add-service-btn"
          onClick={() => setShowAddModal(true)}
        >
          + Add Services
        </button>
      </div>

      <div className="services-filters">
        <input
          type="text"
          className="search-input"
          placeholder="Search..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <select
          className="category-select"
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
        >
          <option value="">Category ▾</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      {error && <div className="error-message">{error}</div>}

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
                  <td>{service.price.toFixed(2)}php</td>
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

      {showAddModal && (
        <AddServiceModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            fetchServices();
          }}
        />
      )}

      {showEditModal && selectedService && (
        <EditServiceModal
          service={selectedService}
          onClose={() => {
            setShowEditModal(false);
            setSelectedService(null);
          }}
          onSuccess={() => {
            setShowEditModal(false);
            setSelectedService(null);
            fetchServices();
          }}
        />
      )}

      {showDeleteModal && selectedService && (
        <DeleteServiceModal
          serviceName={selectedService.name}
          onConfirm={handleDeleteConfirm}
          onCancel={() => {
            setShowDeleteModal(false);
            setSelectedService(null);
          }}
        />
      )}
    </div>
  );
};

export default MedicalServices;
