import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../axios/api";
import './PatientDetails.css'
import EditPatientModal from '../../modals/patient-edit/PatientEditModal'
import ViewMedicalDocModal from "../../modals/view-doc/ViewDocModal";
import AddRecordModal from "../../modals/AddRecordModal/AddRecordModal";
import Toast from "../Toast/Toast";
import ConfirmModal from "../ConfirmModal/ConfirmModal";

const PatientDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showAddRecordModal, setShowAddRecordModal] = useState(false);
  const [selectedDocId, setSelectedDocId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [remarks, setRemarks] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [archiveLoading, setArchiveLoading] = useState(null); // Track which record is being archived

  // Modal and Toast states
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    type: 'warning',
    title: '',
    message: '',
    onConfirm: null,
    isLoading: false,
    actionType: null // 'saveNote' or 'archiveRecord'
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
  const showModal = (title, message, type = 'warning', onConfirm, actionType = null) => {
    setModalConfig({
      isOpen: true,
      type,
      title,
      message,
      onConfirm,
      isLoading: false,
      actionType
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

  const fetchPatient = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get(`/patient/get-one-patient/${id}`);
      if (res.data.success) {
        setPatient(res.data.data);
        // Initialize remarks with existing patient notes
        setRemarks(res.data.data.notes || "");
      } else {
        setError(res.data.message || "Failed to fetch patient");
      }
    } catch (err) {
      console.error("Error fetching patient:", err);
      setError("Unable to load patient details. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatient();
  }, [id]);

  const handleSaveNote = async () => {
    try {
      setSaveLoading(true);
      setModalLoading(true);
      
      // Call the API to save the note
      const response = await api.post('/patient/add-note', {
        id: patient.id,
        note: remarks
      });

      if (response.status === 201) {
        // Update local state with the new notes
        setPatient(prevPatient => ({
          ...prevPatient,
          notes: remarks
        }));
        setIsEditing(false);
        
        // Show success toast
        showToast('Note saved successfully', 'success');
        closeModal();
      } else {
        throw new Error("Failed to save note");
      }
    } catch (err) {
      console.error("Error saving note:", err);
      const errorMessage = err.response?.data?.message || "Failed to save note. Please try again.";
      showToast(errorMessage, 'error');
    } finally {
      setSaveLoading(false);
      setModalLoading(false);
    }
  };

  const handleSaveClick = () => {
    if (!remarks.trim()) {
      showToast("Please enter a note before saving", 'error');
      return;
    }

    showModal(
      "Save Note",
      "Are you sure you want to save this note?",
      'warning',
      handleSaveNote,
      'saveNote'
    );
  };

  const handleCancel = () => {
    // Reset remarks to original patient notes and exit edit mode
    setRemarks(patient?.notes || "");
    setIsEditing(false);
  };

  const handleArchiveRecord = async (docId) => {
    try {
      setArchiveLoading(docId);
      setModalLoading(true);
      
      // Call the API to archive the medical documentation
      const response = await api.post('/document/archive-medical-documentation', {
        id: docId
      });

      if (response.status === 200 || response.status === 201) {
        // Refresh patient data to update the medical records list
        await fetchPatient();
        
        // Show success toast
        showToast('Record archived successfully', 'success');
        closeModal();
      } else {
        throw new Error("Failed to archive record");
      }
    } catch (err) {
      console.error("Error archiving record:", err);
      const errorMessage = err.response?.data?.message || "Failed to archive record. Please try again.";
      showToast(errorMessage, 'error');
    } finally {
      setArchiveLoading(null);
      setModalLoading(false);
    }
  };

  const handleArchiveClick = (docId) => {
    const doc = patient?.medicalDocumentations?.find(d => d.id === docId);
    const admittedBy = doc?.admittedByName || doc?.createdByName || 'this record';
    
    showModal(
      "Archive Medical Record",
      `Are you sure you want to archive the medical record from ${admittedBy}? This action will move the record to the archive.`,
      'warning',
      () => handleArchiveRecord(docId),
      'archiveRecord'
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getStatusBadgeClass = (status) => {
    const statusMap = {
      PENDING: "status-pending",
      ADMITTED: "status-admitted",
      COMPLETED: "status-completed",
      CANCELLED: "status-cancelled",
      complete: "status-completed",
      incomplete: "status-pending",
      draft: "status-pending",
    };
    return statusMap[status] || "status-pending";
  };

  const handleViewDoc = (docId) => {
    setSelectedDocId(docId);
    setShowViewModal(true);
  };

  // Filter medical documentations based on search
  const filteredDocs = patient?.medicalDocumentations?.filter((doc) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      doc.status.toLowerCase().includes(searchLower) ||
      doc.createdByName.toLowerCase().includes(searchLower) ||
      (doc.admittedByName &&
        doc.admittedByName.toLowerCase().includes(searchLower))
    );
  }) || [];

  if (loading) {
    return (
      <div className="patient-detail-container">
        <p className="loading-state">Loading patient details...</p>
      </div>
    );
  }

  if (error || !patient) {
    return (
      <div className="patient-detail-container">
        <button className="back-btn" onClick={() => navigate(-1)}>
          ← Back
        </button>
        <div className="error-message">{error || "Patient not found"}</div>
      </div>
    );
  }

  const patientFullName = `${patient.firstName} ${patient.middleName || ""} ${patient.lastName}`.trim();

  return (
    <div className="patient-detail-container">
      {/* Header with Logo */}
      <div className="detail-header-top">
        <div className="header-logo">
          <div className="logo-text">
            <h1>LEONARDO MEDICAL SERVICES</h1>
            <p>B1 L17, F. Novaliches, Bagumbong, Caloocan City</p>
          </div>
        </div>
        <button className="close-btn" onClick={() => navigate(-1)}>
          ✕
        </button>
      </div>

      {/* Patient Details Section */}
      <div className="section-divider">
        <h2>PATIENT DETAILS</h2>
      </div>

      <div className="patient-info-layout-flexwrap">
        {/* Patient Info Card */}
        <div className="patient-info-card">
          <div className="patient-name-header">
            <span>{patientFullName}</span>
            <button
              className="edit-btn-modern"
              onClick={() => setShowEditModal(true)}
            >
              Edit
            </button>
          </div>

          <div className="info-grid-modern">
            <div className="info-row">
              <div className="info-col">
                <label>Gender</label>
                <span>{patient.gender || "N/A"}</span>
              </div>
              <div className="info-col">
                <label>Birthday</label>
                <span>{formatDate(patient.birthDate)}</span>
              </div>
              <div className="info-col">
                <label>Age</label>
                <span>{patient.age}</span>
              </div>
              <div className="info-col">
                <label>Phone Number</label>
                <span>{patient.mobileNumber || "N/A"}</span>
              </div>
            </div>

            <div className="info-row">
              <div className="info-col">
                <label>Senior Citizen ID No./PWD</label>
                <span>{patient.csdIdOrPwdId || "N/A"}</span>
              </div>
              <div className="info-col">
                <label>Street Address</label>
                <span>{patient.residentialAddress || "N/A"}</span>
              </div>
              <div className="info-col">
                <label>Register Date</label>
                <span>{formatDate(patient.createdAt)}</span>
              </div>
              <div className="info-col">
                <label>Member Status</label>
                <span className="status-active">
                  {patient.isArchived ? "Archived" : "Active"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Assessment / Remarks Container */}
        <div className="assess-remark-card-unique">
          <h3 className="assess-title-unique">Assessment / Remarks</h3>
          {isEditing ? (
            <>
              <textarea
                className="assess-textarea-unique"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Enter assessment or remarks..."
                rows="4"
              />
              <div className="assess-buttons-container">
                <button 
                  className="assess-save-btn-unique" 
                  onClick={handleSaveClick}
                  disabled={saveLoading}
                >
                  {saveLoading ? "SAVING..." : "SAVE"}
                </button>
                <button 
                  className="assess-cancel-btn-unique" 
                  onClick={handleCancel}
                  disabled={saveLoading}
                >
                  CANCEL
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="assess-display-box-unique">
                {patient.notes ? patient.notes : "No remarks available."}
              </div>
              <button 
                className="assess-edit-btn-unique" 
                onClick={() => setIsEditing(true)}
              >
                EDIT
              </button>
            </>
          )}
        </div>
      </div>

      {/* Medical History Section */}
      <div className="pmh-section-divider">
        <div className="pmh-left">
          <div className="pmh-search-box">
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="pmh-center">
          <h2>PATIENT MEDICAL HISTORY</h2>
        </div>

        <div className="pmh-right">
          <button 
            className="pmh-add-record-btn"
            onClick={() => setShowAddRecordModal(true)}
          >
            + Add Record
          </button>
        </div>
      </div>

      <div className="medical-history-table">
        <table>
          <thead>
            <tr>
              <th>Date of Visit</th>
              <th>Admitted By</th>
              <th>Status of Record</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredDocs.length > 0 ? (
              filteredDocs.map((doc) => (
                <tr key={doc.id}>
                  <td>{formatDate(doc.createdAt)}</td>
                  <td>{doc.admittedByName || doc.createdByName}</td>
                  <td>
                    <span className={`status-badge-modern ${getStatusBadgeClass(doc.status)}`}>
                      {doc.status}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons-container">
                      <button
                        className="view-btn-modern"
                        onClick={() => handleViewDoc(doc.id)}
                      >
                        View
                      </button>
                      <button
                        className="archive-btn-modern"
                        onClick={() => handleArchiveClick(doc.id)}
                        disabled={archiveLoading === doc.id}
                      >
                        {archiveLoading === doc.id ? "Archiving..." : "Archive"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" className="no-data-modern">
                  {searchQuery
                    ? "No medical records match your search"
                    : "No medical records found"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Edit Patient Modal */}
      {showEditModal && (
        <EditPatientModal
          patient={patient}
          onClose={() => setShowEditModal(false)}
          onSuccess={() => {
            setShowEditModal(false);
            fetchPatient();
          }}
        />
      )}

      {/* View Medical Documentation Modal */}
      {showViewModal && selectedDocId && (
        <ViewMedicalDocModal
          docId={selectedDocId}
          onClose={() => {
            setShowViewModal(false);
            setSelectedDocId(null);
          }}
        />
      )}

      {/* Add Record Modal */}
      {showAddRecordModal && (
        <AddRecordModal
          patientId={patient.id}
          patientName={patientFullName}
          onClose={() => setShowAddRecordModal(false)}
          onSuccess={() => {
            setShowAddRecordModal(false);
            fetchPatient();
          }}
        />
      )}

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={modalConfig.isOpen}
        onClose={closeModal}
        onConfirm={modalConfig.onConfirm}
        title={modalConfig.title}
        message={modalConfig.message}
        type={modalConfig.type}
        isLoading={modalConfig.isLoading}
        confirmText={modalConfig.actionType === 'saveNote' ? "Yes, Save" : "Yes, Archive"}
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
    </div>
  );
};

export default PatientDetail;