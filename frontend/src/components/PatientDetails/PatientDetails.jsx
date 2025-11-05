import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../axios/api";
import './PatientDetails.css'
import EditPatientModal from '../../modals/patient-edit/PatientEditModal'
import ViewMedicalDocModal from "../../modals/view-doc/ViewDocModal";
import AddRecordModal from "../../modals/AddRecordModal/AddRecordModal";

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

  const handleSave = async () => {
    try {
      setSaveLoading(true);
      
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
        
        // Optional: Show success message
        console.log('Note saved successfully:', response.data);
      }
    } catch (err) {
      console.error("Error saving note:", err);
      // Handle error - you might want to show a toast or error message
      alert("Failed to save note. Please try again.");
    } finally {
      setSaveLoading(false);
    }
  };

  const handleCancel = () => {
    // Reset remarks to original patient notes and exit edit mode
    setRemarks(patient?.notes || "");
    setIsEditing(false);
  };

  const handleArchiveRecord = async (docId) => {
    if (!window.confirm("Are you sure you want to archive this medical record?")) {
      return;
    }

    try {
      setArchiveLoading(docId);
      
      // Call the API to archive the medical documentation
      const response = await api.post('/medical-documentation/archive', {
        id: docId
      });

      if (response.status === 200 || response.status === 201) {
        // Refresh patient data to update the medical records list
        await fetchPatient();
        
        // Optional: Show success message
        console.log('Record archived successfully:', response.data);
      }
    } catch (err) {
      console.error("Error archiving record:", err);
      // Handle error - show a toast or error message
      alert("Failed to archive record. Please try again.");
    } finally {
      setArchiveLoading(null);
    }
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
              />
              <div className="assess-buttons-container">
                <button 
                  className="assess-save-btn-unique" 
                  onClick={handleSave}
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
                        onClick={() => handleArchiveRecord(doc.id)}
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
    </div>
  );
};

export default PatientDetail;