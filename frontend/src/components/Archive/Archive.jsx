import { useEffect, useState } from "react";
import api from "../../axios/api";
import "./Archive.css";

const Archive = () => {
  const [archivedPatients, setArchivedPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [restoringIds, setRestoringIds] = useState(new Set());

  const fetchArchivedPatients = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get("/patient/get-archived-patients");
      
      if (res.data.success) {
        console.log(res.data.data);
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

  const handleRestore = async (patientId) => {
    // Prevent multiple restore clicks
    if (restoringIds.has(patientId)) return;

    try {
      setRestoringIds((prev) => new Set(prev).add(patientId));

      const res = await api.post("/patient/unarchive-patient", {
        id: patientId,
      });

      if (res.data.success) {
        // Remove the patient from the list immediately for better UX
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
    }
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
      <div className="archive-header">
        <h1 className="archive-title">Archived Patients</h1>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

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