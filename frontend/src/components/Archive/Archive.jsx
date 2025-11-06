import { useEffect, useState } from "react";
import api from "../../axios/api";
import Toast from "../Toast/Toast";
import ConfirmModal from "../ConfirmModal/ConfirmModal";
import "./Archive.css";

const Archive = () => {
  const [archivedPatients, setArchivedPatients] = useState([]);
  const [archivedDocuments, setArchivedDocuments] = useState([]);
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [filteredDocuments, setFilteredDocuments] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [restoringIds, setRestoringIds] = useState(new Set());
  const [activeView, setActiveView] = useState("patients"); // "patients" or "documents"
  const [viewDocument, setViewDocument] = useState(null); // For viewing document details

  // Modal and Toast states
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    type: 'warning',
    title: '',
    message: '',
    onConfirm: null,
    isLoading: false,
    itemId: null,
    itemType: null // "patient" or "document"
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
  const showModal = (title, message, type = 'warning', onConfirm, itemId = null, itemType = null) => {
    setModalConfig({
      isOpen: true,
      type,
      title,
      message,
      onConfirm,
      isLoading: false,
      itemId,
      itemType
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

      if (res.data && res.data.data) {
        const patients = res.data.data || [];
        setArchivedPatients(patients);
        setFilteredPatients(patients);
      } else {
        setArchivedPatients([]);
        setFilteredPatients([]);
        setError("Failed to fetch archived patients");
      }
    } catch (err) {
      console.error("Error fetching archived patients:", err);
      const errorMessage = err.response?.data?.message || "Unable to load archived patients. Please try again.";
      setError(errorMessage);
      setArchivedPatients([]);
      setFilteredPatients([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchArchivedDocuments = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get("/document/get-archived-medical-documentations");

      if (res.data && res.data.data) {
        const documents = res.data.data || [];
        setArchivedDocuments(documents);
        setFilteredDocuments(documents);
      } else {
        setArchivedDocuments([]);
        setFilteredDocuments([]);
        setError("Failed to fetch archived documents");
      }
    } catch (err) {
      console.error("Error fetching archived documents:", err);
      const errorMessage = err.response?.data?.message || "Unable to load archived documents. Please try again.";
      setError(errorMessage);
      setArchivedDocuments([]);
      setFilteredDocuments([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchDocumentDetails = async (documentId) => {
    try {
      const res = await api.get(`/document/medical-documentation/${documentId}`);
      
      if (res.data && res.data.data) {
        setViewDocument(res.data.data);
      } else {
        throw new Error("Failed to fetch document details");
      }
    } catch (err) {
      console.error("Error fetching document details:", err);
      const errorMessage = err.response?.data?.message || "Unable to load document details. Please try again.";
      showToast(errorMessage, 'error');
    }
  };

  const handleSearch = (e) => {
    const term = e.target.value.toLowerCase();
    setSearchTerm(term);

    if (!term.trim()) {
      if (activeView === "patients") {
        setFilteredPatients(archivedPatients);
      } else {
        setFilteredDocuments(archivedDocuments);
      }
      return;
    }

    if (activeView === "patients") {
      const filtered = archivedPatients.filter((p) => {
        const fullName = `${p.firstName} ${p.middleName || ""} ${p.lastName}`.toLowerCase();
        return fullName.includes(term);
      });
      setFilteredPatients(filtered);
    } else {
      const filtered = archivedDocuments.filter((doc) => {
        const patientName = `${doc.patient.firstName} ${doc.patient.middleName || ""} ${doc.patient.lastName}`.toLowerCase();
        const admittedByName = doc.admittedByName.toLowerCase();
        const lastUpdatedByName = doc.lastUpdatedByName.toLowerCase();
        
        return patientName.includes(term) || 
               admittedByName.includes(term) ||
               lastUpdatedByName.includes(term);
      });
      setFilteredDocuments(filtered);
    }
  };

  const performRestore = async (patientId) => {
    if (restoringIds.has(`patient_${patientId}`)) return;

    try {
      setModalLoading(true);
      setRestoringIds((prev) => new Set(prev).add(`patient_${patientId}`));

      const res = await api.post("/patient/unarchive-patient", { id: patientId });

      if (res.data) {
        setArchivedPatients((prev) => prev.filter((p) => p.id !== patientId));
        setFilteredPatients((prev) => prev.filter((p) => p.id !== patientId));
        showToast('Patient restored successfully', 'success');
        closeModal();
      } else {
        throw new Error("Failed to restore patient");
      }
    } catch (err) {
      console.error("Error restoring patient:", err);
      const errorMessage = err.response?.data?.message || "Unable to restore patient. Please try again.";
      showToast(errorMessage, 'error');
    } finally {
      setRestoringIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(`patient_${patientId}`);
        return newSet;
      });
      setModalLoading(false);
    }
  };

  const performRestoreDocument = async (documentId) => {
    if (restoringIds.has(`document_${documentId}`)) return;

    try {
      setModalLoading(true);
      setRestoringIds((prev) => new Set(prev).add(`document_${documentId}`));

      const res = await api.post("/document/unarchive-medical-documentation", { id: documentId });

      if (res.data) {
        setArchivedDocuments((prev) => prev.filter((doc) => doc.id !== documentId));
        setFilteredDocuments((prev) => prev.filter((doc) => doc.id !== documentId));
        showToast('Medical documentation restored successfully', 'success');
        closeModal();
      } else {
        throw new Error("Failed to restore document");
      }
    } catch (err) {
      console.error("Error restoring document:", err);
      const errorMessage = err.response?.data?.message || "Unable to restore document. Please try again.";
      showToast(errorMessage, 'error');
    } finally {
      setRestoringIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(`document_${documentId}`);
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
      patientId,
      "patient"
    );
  };

  const handleRestoreDocument = (documentId) => {
    const document = archivedDocuments.find(doc => doc.id === documentId);
    const patientName = document ? `${document.patient.firstName} ${document.patient.lastName}` : 'this document';
    
    showModal(
      "Restore Medical Documentation",
      `Are you sure you want to restore the medical documentation for ${patientName}? This will move the document back to the active records.`,
      'warning',
      () => performRestoreDocument(documentId),
      documentId,
      "document"
    );
  };

  const handleViewDocument = async (documentId) => {
    await fetchDocumentDetails(documentId);
  };

  const handleCloseViewModal = () => {
    setViewDocument(null);
  };

  const handleViewChange = (view) => {
    setActiveView(view);
    setSearchTerm("");
    setError(null);
    
    if (view === "documents" && archivedDocuments.length === 0) {
      fetchArchivedDocuments();
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "2-digit",
      day: "2-digit",
      year: "numeric",
    });
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "2-digit",
      day: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const getPatientFullName = (patient) => {
    return `${patient.lastName}, ${patient.firstName}${patient.middleName ? ` ${patient.middleName}` : ""}`;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount);
  };

  useEffect(() => {
    fetchArchivedPatients();
  }, []);

  useEffect(() => {
    setSearchTerm("");
    if (activeView === "patients") {
      setFilteredPatients(archivedPatients);
    } else {
      setFilteredDocuments(archivedDocuments);
    }
  }, [activeView, archivedPatients, archivedDocuments]);

  if (loading) {
    return (
      <div className="archive-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading archived data...</p>
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

      {/* View Document Modal */}
      {viewDocument && (
        <div className="vmdm-modal-overlay" onClick={handleCloseViewModal}>
          <div
            className="vmdm-modal-content-medical"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="vmdm-medical-doc-header">
              <div>
                <h1>LEONARDO MEDICAL SERVICES</h1>
                <p>B1 L17, F. Novaliches, Bagumbong, Caloocan City</p>
              </div>

              <button
                className="vmdm-close-modal-btn"
                onClick={handleCloseViewModal}
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <div className="vmdm-medical-doc-body">
              {/* Patient Info */}
              <div className="vmdm-patient-info-header">
                <p className="vmdm-patient-full-name">
                  <span>Name:
                    {` ${viewDocument.patient?.firstName || ""} ${viewDocument.patient?.middleName ? viewDocument.patient.middleName + " " : ""}${viewDocument.patient?.lastName || ""}`.trim()}
                  </span>
                </p>

                <div className="vmdm-patient-mini-info">
                  <span>Date: {formatDate(viewDocument.createdAt)}</span>
                </div>
              </div>

              {/* Two Column Layout */}
              <div className="vmdm-doc-two-column">
                {/* Left Column - Medical Notes */}
                <div className="vmdm-medical-notes-section">
                  <div className="vmdm-notes-card">
                    <div className="vmdm-notes-content">
                      <div className="vmdm-note-section">
                        <label>Assessment:</label>
                        <div className="vmdm-note-text">
                          {viewDocument.assessment || "No assessment provided"}
                        </div>
                      </div>

                      <div className="vmdm-note-section">
                        <label>Diagnosis:</label>
                        <div className="vmdm-note-text">
                          {viewDocument.diagnosis || "No diagnosis provided"}
                        </div>
                      </div>

                      <div className="vmdm-note-section">
                        <label>Treatment:</label>
                        <div className="vmdm-note-text">
                          {viewDocument.treatment || "No treatment provided"}
                        </div>
                      </div>

                      <div className="vmdm-note-section">
                        <label>Prescription:</label>
                        <div className="vmdm-note-text">
                          {viewDocument.prescription || "No prescription provided"}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column - Billing */}
                <div className="vmdm-billing-section">
                  <div className="vmdm-billing-card">
                    <div className="vmdm-billing-services">
                      <div className="vmdm-service-row vmdm-service-header">
                        <span>Services</span>
                        <span className="vmdm-align-right">Amount</span>
                      </div>

                      {(!viewDocument.medicalBill || (viewDocument.medicalBill?.billedServices?.length === 0)) && (
                        <div className="vmdm-no-billing">
                          <p>No billed services available</p>
                        </div>
                      )}

                      {viewDocument.medicalBill?.billedServices?.map((s) => (
                        <div key={s.id} className="vmdm-service-row vmdm-service-item">
                          <span>
                            {s.serviceName}
                            {s.quantity ? ` x${s.quantity}` : ""}
                          </span>
                          <span className="vmdm-align-right">
                            {formatCurrency(s.subtotal)}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="vmdm-billing-summary">
                      <div className="vmdm-summary-row">
                        <span>Total Amount:</span>
                        <span className="vmdm-amount-value">
                          {formatCurrency(viewDocument.medicalBill?.totalAmount || 0)}
                        </span>
                      </div>
                      <div className="vmdm-summary-row">
                        <span>Amount Paid:</span>
                        <span className="vmdm-amount-value">
                          {formatCurrency(viewDocument.medicalBill?.amountPaid || 0)}
                        </span>
                      </div>
                      <div className="vmdm-summary-row">
                        <span>Balance:</span>
                        <span className="vmdm-amount-value">
                          {formatCurrency(viewDocument.medicalBill?.balance || 0)}
                        </span>
                      </div>
                      <div className="vmdm-summary-row">
                        <span>Status:</span>
                        <span className="vmdm-status-value">
                          {viewDocument.medicalBill?.paymentStatus ?? viewDocument.status ?? "unpaid"}
                        </span>
                      </div>
                      <div className="vmdm-summary-row">
                        <span>Payment Method:</span>
                        <span className="vmdm-payment-value">{viewDocument.medicalBill?.paymentOption || "Cash"}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer Info */}
              <div className="vmdm-doc-footer-info">
                {viewDocument.admittedByName && (
                  <div className="vmdm-footer-item">
                    <label>Admitted By:</label>
                    <span>{viewDocument.admittedByName}</span>
                  </div>
                )}
                <div className="vmdm-footer-item">
                  <label>Created By:</label>
                  <span>
                    {viewDocument.createdByName ?? "N/A"}
                    {viewDocument.createdByRole ? ` (${viewDocument.createdByRole})` : ""}
                  </span>
                </div>
                <div className="vmdm-footer-item">
                  <label>Last Updated:</label>
                  <span>{formatDate(viewDocument.updatedAt)}</span>
                </div>
                {viewDocument.lastUpdatedByName && (
                  <div className="vmdm-footer-item">
                    <label>Last Updated By:</label>
                    <span>
                      {viewDocument.lastUpdatedByName}
                      {viewDocument.lastUpdatedByRole ? ` (${viewDocument.lastUpdatedByRole})` : ""}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

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

      {/* View Selector and Search */}
      <div className="archive-controls">
        <select 
          className="view-selector"
          value={activeView}
          onChange={(e) => handleViewChange(e.target.value)}
        >
          <option value="patients">Archived Patients</option>
          <option value="documents">Archived Medical Documents</option>
        </select>

        <div className="archive-search-box">
          <input
            type="text"
            placeholder={activeView === "patients" ? "Search patient by name" : "Search by patient or doctor name"}
            value={searchTerm}
            onChange={handleSearch}
            className="archive-search-input"
          />
        </div>
      </div>

      {/* Archived Patients Table */}
      {activeView === "patients" && (
        <div className="archive-table-container">
          <table className="archive-table">
            <thead>
              <tr>
                <th>Name of Patient</th>
                <th>Created at</th>
                <th>Archive Date</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredPatients.length > 0 ? (
                filteredPatients.map((patient) => (
                  <tr key={patient.id}>
                    <td>
                      {getPatientFullName(patient)}
                    </td>
                    <td>
                      {formatDate(patient.createdAt)}
                    </td>
                    <td>
                      {patient.archivedAt ? formatDate(patient.archivedAt) : 'N/A'}
                    </td>
                    <td>
                      <button
                        className="restore-btn"
                        onClick={() => handleRestore(patient.id)}
                        disabled={restoringIds.has(`patient_${patient.id}`)}
                      >
                        {restoringIds.has(`patient_${patient.id}`) ? "Restoring..." : "Restore"}
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="no-data">
                    {archivedPatients.length === 0 ? "No archived patients found" : "No patients match your search"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Archived Medical Documents Table */}
      {activeView === "documents" && (
        <div className="archive-table-container">
          <table className="archive-table">
            <thead>
              <tr>
                <th>Patient Name</th>
                <th>Admitted By</th>
                <th>Last Updated By</th>
                <th>Created Date</th>
                <th>Archive Date</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredDocuments.length > 0 ? (
                filteredDocuments.map((document) => (
                  <tr key={document.id}>
                    <td>{getPatientFullName(document.patient)}</td>
                    <td>{document.admittedByName}</td>
                    <td>{document.lastUpdatedByName || 'N/A'}</td>
                    <td>{formatDateTime(document.createdAt)}</td>
                    <td>{document.archivedAt ? formatDateTime(document.archivedAt) : 'N/A'}</td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="view-btn"
                          onClick={() => handleViewDocument(document.id)}
                        >
                          View
                        </button>
                        <button
                          className="restore-btn"
                          onClick={() => handleRestoreDocument(document.id)}
                          disabled={restoringIds.has(`document_${document.id}`)}
                        >
                          {restoringIds.has(`document_${document.id}`) ? "Restoring..." : "Restore"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="no-data">
                    {archivedDocuments.length === 0 ? "No archived medical documents found" : "No documents match your search"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Archive;
