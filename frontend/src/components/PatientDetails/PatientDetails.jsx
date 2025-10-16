import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../axios/api";
import "./PatientDetails.css";
import EditPatientModal from "../../modals/patient-edit/PatientEditModal";

const PatientDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchPatient = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get(`/patient/get-one-patient/${id}`);
      console.log(res.data);
      console.log(res.status)
      if (res.data.success) {
        console.log("Patient data:", res.data.data);
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
    };
    return statusMap[status] || "status-pending";
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
    return <div className="patient-detail-container"><p className="loading-state">Loading patient details...</p></div>;
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

  return (
    <div className="patient-detail-container">
      {/* Header */}
      <div className="detail-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          ← Back
        </button>
        <h1 className="detail-title">Patient Details</h1>
        <div></div>
      </div>

      {/* Patient Info Card */}
      <div className="patient-info-section">
        <div className="patient-card">
          <div className="patient-name">
            {`${patient.lastName}, ${patient.firstName}${
              patient.middleName ? ` ${patient.middleName}` : ""
            }`}
          </div>

          <div className="info-grid">
            <div className="info-item">
              <label>Gender</label>
              <span>{patient.gender || "N/A"}</span>
            </div>
            <div className="info-item">
              <label>Age</label>
              <span>{patient.age}</span>
            </div>
            <div className="info-item">
              <label>Birth Date</label>
              <span>{formatDate(patient.birthDate)}</span>
            </div>
            <div className="info-item">
              <label>Mobile Number</label>
              <span>{patient.mobileNumber || "N/A"}</span>
            </div>

            <div className="info-item">
              <label>Senior/PWD ID</label>
              <span>{patient.csdIdOrPwdId || "N/A"}</span>
            </div>
            <div className="info-item">
              <label>Status</label>
              <span>{patient.isArchived ? "Archived" : "Active"}</span>
            </div>

            <div className="info-item full-width">
              <label>Address</label>
              <span>{patient.residentialAddress || "N/A"}</span>
            </div>

            <div className="info-item">
              <label>Created By</label>
              <span>{patient.createdByName}</span>
            </div>
            <div className="info-item">
              <label>Created At</label>
              <span>{formatDate(patient.createdAt)}</span>
            </div>

            {patient.updatedByName && (
              <>
                <div className="info-item">
                  <label>Updated By</label>
                  <span>{patient.updatedByName}</span>
                </div>
                <div className="info-item">
                  <label>Updated At</label>
                  <span>{formatDate(patient.updatedAt)}</span>
                </div>
              </>
            )}
          </div>
        </div>

        <button
          className="edit-patient-btn"
          onClick={() => setShowEditModal(true)}
        >
          Edit Patient
        </button>
      </div>

      {/* Medical History Section */}
      <div className="medical-history-section">
        <div className="section-header">
          <h2 className="section-title">Patient Medical History</h2>
          <input
            type="text"
            className="search-medical"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="medical-table-container">
          <table className="medical-table">
            <thead>
              <tr>
                <th>Date Created</th>
                <th>Status</th>
                <th>Created By</th>
                <th>Admitted By</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredDocs.length > 0 ? (
                filteredDocs.map((doc) => (
                  <tr key={doc.id}>
                    <td>{formatDate(doc.createdAt)}</td>
                    <td>
                      <span className={`status-badge ${getStatusBadgeClass(doc.status)}`}>
                        {doc.status}
                      </span>
                    </td>
                    <td>{doc.createdByName}</td>
                    <td>{doc.admittedByName || "N/A"}</td>
                    <td>
                      <button className="action-btn">View</button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="no-data">
                    {searchQuery
                      ? "No medical records match your search"
                      : "No medical records found"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
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
    </div>
  );
};

export default PatientDetail;