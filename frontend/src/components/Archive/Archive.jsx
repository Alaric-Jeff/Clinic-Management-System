import { useEffect, useState } from "react";
import api from "../../axios/api";
import "./Archive.css";

const Archive = () => {
  const [archivedPatients, setArchivedPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [restoringIds, setRestoringIds] = useState(new Set());
  const [showConfirm, setShowConfirm] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState(null);

  const fetchArchivedPatients = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get("/patient/get-archived-patients");

      if (res.data.success) {
        setArchivedPatients(res.data.data || []);
      } else {
        setArchivedPatients([]);
        setError(res.data.message || "Failed to fetch archived patients");
      }
    } catch (err) {
      console.error("Error fetching archived patients:", err);
      setError("Unable to load archived patients. Please try again.");
      setArchivedPatients([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRestoreClick = (patientId) => {
    setSelectedPatientId(patientId);
    setShowConfirm(true);
  };

  const confirmRestore = async () => {
    const patientId = selectedPatientId;
    if (!patientId || restoringIds.has(patientId)) return;

    try {
      setRestoringIds((prev) => new Set(prev).add(patientId));
      const res = await api.post("/patient/unarchive-patient", { id: patientId });

      if (res.data.success) {
        setArchivedPatients((prev) =>
          prev.filter((patient) => patient.id !== patientId)
        );
        console.log(`Patient ${patientId} restored successfully`);
      } else {
        setError(res.data.message || "Failed to restore patient");
      }
    } catch (err) {
      console.error("Error restoring patient:", err);
      setError("Unable to restore patient. Please try again.");
    } finally {
      setRestoringIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(patientId);
        return newSet;
      });
      setShowConfirm(false);
      setSelectedPatientId(null);
    }
  };

  const cancelRestore = () => {
    setShowConfirm(false);
    setSelectedPatientId(null);
  };

  useEffect(() => {
    fetchArchivedPatients();
  }, []);

  if (loading) {
    return (
      <div className="archive-container">
        <p className="loading-state">Loading archived patients...</p>
      </div>
    );
  }

  return (
    <div className="archive-container">
      {/* ✅ Universal Header */}
      <div className="header">
        <div className="title-section">
          <h1>LEONARDO MEDICAL SERVICES</h1>
          <p>B1 L17-E Neovista, Bagumbong, Caloocan City</p>
        </div>
      </div>

      <div className="archive-header">
        <h1 className="archive-title">Archived Patients</h1>
      </div>

      {error && <div className="error-message">{error}</div>}

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
            {archivedPatients.length > 0 ? (
              archivedPatients.map((patient) => (
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
                      onClick={() => handleRestoreClick(patient.id)}
                      disabled={restoringIds.has(patient.id)}
                    >
                      {restoringIds.has(patient.id)
                        ? "Restoring..."
                        : "Restore"}
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

      {/* ✅ Restore Confirmation Modal */}
      {showConfirm && (
        <div className="um-confirm-overlay">
          <div className="um-confirm-content">
            <h3>Confirm Restore</h3>
            <p>Are you sure you want to restore this patient?</p>
            <div className="um-confirm-buttons">
              <button className="um-btn-confirm-yes" onClick={confirmRestore}>
                Yes, Restore
              </button>
              <button className="um-btn-confirm-no" onClick={cancelRestore}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Archive;
