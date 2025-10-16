import { useEffect, useState } from "react";
import api from "../../axios/api";
import "./PatientList.css";
import AddPatient from "../../modals/add-patient/AddPatient"; 

const PatientList = () => {
  const [patients, setPatients] = useState([]);
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddPatient, setShowAddPatient] = useState(false);
  const [archivingIds, setArchivingIds] = useState(new Set());
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState("asc"); // "asc" or "desc"

  const handleArchive = async (patientId) => {
    if (archivingIds.has(patientId)) return;

    try {
      setArchivingIds((prev) => new Set(prev).add(patientId));
      setError("");

      const res = await api.post("/patient/archive-patient", {
        id: patientId,
      });

      if (res.data.success) {
        setPatients((prev) =>
          prev.filter((patient) => patient.id !== patientId)
        );
        console.log(`Patient ${patientId} archived successfully`);
      } else {
        setError(res.data.message || "Failed to archive patient");
      }
    } catch (err) {
      console.error("Error archiving patient:", err);
      setError("Unable to archive patient. Please try again.");
    } finally {
      setArchivingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(patientId);
        return newSet;
      });
    }
  };

  const fetchPatients = async () => {
    try {
      const res = await api.get("/patient/get-today-patients");
      if (res.data.success) {
        console.log(res.data.data);
        setPatients(res.data.data || []);
      } else {
        setPatients([]);
      }
    } catch (err) {
      console.error("Error fetching patients:", err);
      setPatients([]);
    } finally {
      setLoading(false);
    }
  };

  // Filter and sort patients
  useEffect(() => {
    let filtered = patients;

    // Search by name
    if (searchQuery.trim()) {
      filtered = filtered.filter((patient) => {
        const fullName = `${patient.lastName}, ${patient.firstName}${
          patient.middleName ? ` ${patient.middleName}` : ""
        }`.toLowerCase();
        return fullName.includes(searchQuery.toLowerCase());
      });
    }

    // Sort by name
    filtered.sort((a, b) => {
      const nameA = `${a.lastName}, ${a.firstName}`.toLowerCase();
      const nameB = `${b.lastName}, ${b.firstName}`.toLowerCase();

      if (sortOrder === "asc") {
        return nameA.localeCompare(nameB);
      } else {
        return nameB.localeCompare(nameA);
      }
    });

    setFilteredPatients(filtered);
  }, [patients, searchQuery, sortOrder]);

  useEffect(() => {
    fetchPatients();
  }, []);

  if (loading) return <p>Loading patients...</p>;

  return (
    <div className="patient-list-container">
      <div className="patient-header">
        <h1 className="patient-title">Patient Records</h1>
        <button
          className="add-patient-btn"
          onClick={() => setShowAddPatient(true)}
        >
          + Add Patient
        </button>
      </div>

      {/* Search and Sort Controls */}
      <div className="patient-controls">
        <input
          type="text"
          className="search-input"
          placeholder="Search..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <button
          className="sort-btn"
          onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
          title={`Sort by name (${sortOrder === "asc" ? "A-Z" : "Z-A"})`}
        >
          {sortOrder === "asc" ? "↑ A-Z" : "↓ Z-A"}
        </button>
      </div>

      {/* Error display */}
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="patient-table-container">
        <table className="patient-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Time and Date</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredPatients.length > 0 ? (
              filteredPatients.map((p) => (
                <tr key={p.id}>
                  <td>{`${p.lastName}, ${p.firstName}${p.middleName ? ` ${p.middleName}` : ""}`}</td>
                  <td>
                    {new Date(p.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}{" "}
                    — {new Date(p.createdAt).toLocaleDateString()}
                  </td>
                  <td>
                    <button className="view-btn">View</button>
                    <button 
                      className="archive-btn"
                      onClick={() => handleArchive(p.id)}
                      disabled={archivingIds.has(p.id)}
                    >
                      {archivingIds.has(p.id) ? "Archiving..." : "Archive"}
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="3" className="no-data">
                  {searchQuery ? "No patients match your search" : "No records found"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add Patient Modal */}
      {showAddPatient && (
        <AddPatient
          onClose={() => setShowAddPatient(false)} 
          onSuccess={() => {
            setShowAddPatient(false);
            fetchPatients(); 
          }}
        />
      )}
    </div>
  );
};

export default PatientList;