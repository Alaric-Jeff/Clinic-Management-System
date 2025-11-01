import { useEffect, useState } from "react";
import api from "../../axios/api";
import Toast from "../Toast/Toast";
import ConfirmModal from "../ConfirmModal/ConfirmModal";
import "./Archive.css";

const Archive = () => {
  const [archivedPatients, setArchivedPatients] = useState([]);
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [restoringIds, setRestoringIds] = useState(new Set());

  // Modal and Toast states
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    type: 'warning',
    title: '',
    message: '',
    onConfirm: null,
    isLoading: false,
    patientId: null
  });
  const [toastConfig, setToastConfig] = useState({
    isVisible: false,
    message: '',
    type: 'success',
    duration: 4000
  });

  // Show toast function
  const showToast = (message, type = 'success', duration = 4000) => {
    setToastConfig({
      isVisible: true,
      message,
      type,
      duration
    });
  };

  // Close toast function
  const closeToast = () => {
    setToastConfig(prev => ({ ...prev, isVisible: false }));
  };

  // Show modal function
  const showModal = (title, message, type = 'warning', onConfirm, patientId = null) => {
    setModalConfig({
      isOpen: true,
      type,
      title,
      message,
      onConfirm,
      isLoading: false,
      patientId
    });
  };

  // Close modal function
  const closeModal = () => {
    setModalConfig(prev => ({ ...prev, isOpen: false }));
  };

  // Set modal loading state
  const setModalLoading = (isLoading) => {
    setModalConfig(prev => ({ ...prev, isLoading }));
  };

  const fetchArchivedPatients = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get("/patient/get-archived-patients");

      if (res.data.success) {
        const patients = res.data.data || [];
        setArchivedPatients(patients);
        setFilteredPatients(patients);
      } else {
        setArchivedPatients([]);
        setFilteredPatients([]);
        setError(res.data.message || "Failed to fetch archived patients");
        showToast(res.data.message || "Failed to fetch archived patients", 'error');
      }
    } catch (err) {
      console.error("Error fetching archived patients:", err);
      setError("Unable to load archived patients. Please try again.");
      showToast("Unable to load archived patients. Please try again.", 'error');
      setArchivedPatients([]);
      setFilteredPatients([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    const term = e.target.value.toLowerCase();
    setSearchTerm(term);

    if (!term.trim()) {
      setFilteredPatients(archivedPatients);
      return;
    }

    const filtered = archivedPatients.filter((p) => {
      const fullName = `${p.firstName} ${p.middleName || ""} ${p.lastName}`.toLowerCase();
      return fullName.includes(term);
    });

    setFilteredPatients(filtered);
  };

  const performRestore = async (patientId) => {
    if (restoringIds.has(patientId)) return;

    try {
      setModalLoading(true);
      setRestoringIds((prev) => new Set(prev).add(patientId));

      const res = await api.post("/patient/unarchive-patient", { id: patientId });

      if (res.data.success) {
        setArchivedPatients((prev) => prev.filter((p) => p.id !== patientId));
        setFilteredPatients((prev) => prev.filter((p) => p.id !== patientId));
        showToast('Patient restored successfully', 'success');
        closeModal();
      } else {
        throw new Error(res.data.message || "Failed to restore patient");
      }
    } catch (err) {
      console.error("Error restoring patient:", err);
      showToast("Unable to restore patient. Please try again.", 'error');
    } finally {
      setRestoringIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(patientId);
        return newSet;
      });
      setModalLoading(false);
    }
  };

  const handleRestore = (patientId) => {
    const patient = archivedPatients.find(p => p.id === patientId);
    const patientName = patient ? `${patient.firstName} ${patient.lastName}` : 'this patient';
    
    showModal(
      "Restore Patient",
      `Are you sure you want to restore ${patientName}? This will move the patient back to the active patients list.`,
      'warning',
      () => performRestore(patientId),
      patientId
    );
  };

  useEffect(() => {
    fetchArchivedPatients();
  }, []);

  if (loading) {
    return (
      <div className="archive-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading archived patients...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="archive-container">
      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={modalConfig.isOpen}
        onClose={closeModal}
        onConfirm={modalConfig.onConfirm}
        title={modalConfig.title}
        message={modalConfig.message}
        type={modalConfig.type}
        isLoading={modalConfig.isLoading}
        confirmText="Restore"
        cancelText="Cancel"
      />

      {/* Toast Notification */}
      <Toast
        isVisible={toastConfig.isVisible}
        onClose={closeToast}
        message={toastConfig.message}
        type={toastConfig.type}
        duration={toastConfig.duration}
        position="bottom-right"
      />

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

      {/* Search box positioned on the left */}
      <div className="archive-search-container">
        <div className="archive-search-box">
          <input
            type="text"
            placeholder="Search patient by name"
            value={searchTerm}
            onChange={handleSearch}
            className="archive-search-input"
          />
        </div>
      </div>

      <div className="archive-table-container">
        <table className="archive-table">
          <thead>
            <tr>
              <th>Name of Patient</th>
              <th>Created at</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredPatients.length > 0 ? (
              filteredPatients.map((patient) => (
                <tr key={patient.id}>
                  <td>
                    {`${patient.lastName}, ${patient.firstName}${
                      patient.middleName ? ` ${patient.middleName}` : ""
                    }`}
                  </td>
                  <td>
                    {new Date(patient.createdAt).toLocaleDateString("en-US", {
                      month: "2-digit",
                      day: "2-digit",
                      year: "2-digit",
                    })}
                  </td>
                  <td>
                    <button
                      className="restore-btn"
                      onClick={() => handleRestore(patient.id)}
                      disabled={restoringIds.has(patient.id)}
                    >
                      {restoringIds.has(patient.id) ? "Restoring..." : "Restore"}
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="3" className="no-data">
                  No archived patients found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Archive;