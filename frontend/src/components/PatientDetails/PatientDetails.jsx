import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../axios/api";
import './PatientDetails.css'
import EditPatientModal from '../../modals/patient-edit/PatientEditModal'
import ViewMedicalDocModal from "../../modals/view-doc/ViewDocModal";
import AddRecordModal from "../AddRecordModal/AddRecordModal";

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

  const fetchPatient = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get(`/patient/get-one-patient/${id}`);
      if (res.data.success) {
        setPatient(res.data.data);
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
          <div className="logo-icon">
            <div className="caduceus">⚕</div>
          </div>
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

      <div className="patient-info-layout">
        {/* Patient Info Card */}
        <div className="patient-info-card">
          <div className="patient-name-header">
            {patientFullName}
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

          <button
            className="edit-btn-modern"
            onClick={() => setShowEditModal(true)}
          >
            EDIT
          </button>
        </div>
      </div>

      {/* Medical History Section */}
      <div className="section-divider-with-actions">
        <div className="section-left">
          <button 
            className="add-record-btn"
            onClick={() => setShowAddRecordModal(true)}
          >
            + Add Record
          </button>
          <h2>PATIENT MEDICAL HISTORY</h2>
        </div>
        <div className="section-right">
          <div className="search-box">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="medical-history-table">
        <table>
          <thead>
            <tr>
              <th>Date of Visit</th>
              <th>Assisted By</th>
              <th>Status of Record</th>
              <th>Documents</th>
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
                    <button
                      className="view-btn-modern"
                      onClick={() => handleViewDoc(doc.id)}
                    >
                      View
                    </button>
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