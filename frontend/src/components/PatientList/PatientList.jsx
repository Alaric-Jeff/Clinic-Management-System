import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../axios/api";
import { useAuth } from "../../context/AuthContext";
import "./PatientList.css";
import AddPatient from "../../modals/add-patient/AddPatient";

const PatientList = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [patients, setPatients] = useState([]);
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddPatient, setShowAddPatient] = useState(false);
  const [archivingIds, setArchivingIds] = useState(new Set());
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState("asc");
  const [dateFilter, setDateFilter] = useState("today");
  const [customDate, setCustomDate] = useState({
    day: "",
    month: "",
    year: "",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  const handleArchive = async (patientId) => {
    if (archivingIds.has(patientId)) return;
    try {
      setArchivingIds((prev) => new Set(prev).add(patientId));
      setError("");
      const res = await api.post("/patient/archive-patient", { id: patientId });
      if (res.data.success) {
        setPatients((prev) => prev.filter((p) => p.id !== patientId));
      } else {
        setError(res.data.message || "Failed to archive patient");
      }
    } catch (err) {
      console.error(err);
      setError("Unable to archive patient.");
    } finally {
      setArchivingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(patientId);
        return newSet;
      });
    }
  };

  const handleViewPatient = (id) => {
    const prefix = user?.role === "admin" ? "/admin" : "/encoder";
    navigate(`${prefix}/patient-details/${id}`);
  };

  const fetchPatients = async () => {
    try {
      const res = await api.get("/patient/get-today-patients");
      if (res.data.success) setPatients(res.data.data || []);
      else setPatients([]);
    } catch (err) {
      console.error("Error fetching patients:", err);
      setPatients([]);
    } finally {
      setLoading(false);
    }
  };

  const formatName = (patient) => {
    const firstInitial = patient.firstName ? patient.firstName[0] + "." : "";
    return `${patient.lastName}, ${firstInitial}`;
  };

  const formatDateTime = (dateStr) => {
    const d = new Date(dateStr);
    const time = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }).toLowerCase();
    const day = d.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
    return `${time} ${day.replace(/\s/g, " ")}`;
  };

  const isWithinDateRange = (date, filter) => {
    const now = new Date();
    const d = new Date(date);
    switch (filter) {
      case "today":
        return d.toDateString() === now.toDateString();
      
      case "yesterday":
        const y = new Date();
        y.setDate(now.getDate() - 1);
        return d.toDateString() === y.toDateString();
      case "lastweek":
        return (now - d) / (1000 * 60 * 60 * 24) <= 7;
      case "lastmonth":
        return now.getMonth() === d.getMonth() + 1 || (now - d) / (1000 * 60 * 60 * 24) <= 30;
      case "custom":
        const { day, month, year } = customDate;
        return (
          (!day || d.getDate() === Number(day)) &&
          (!month || d.getMonth() + 1 === Number(month)) &&
          (!year || d.getFullYear() === Number(year))
        );
      default:
        return true;
    }
  };

  useEffect(() => {
    let filtered = [...patients];

    // Search by name
    if (searchQuery.trim()) {
      filtered = filtered.filter((p) =>
        `${p.lastName} ${p.firstName}`.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Sort
    filtered.sort((a, b) => {
      const nameA = `${a.lastName}, ${a.firstName}`.toLowerCase();
      const nameB = `${b.lastName}, ${b.firstName}`.toLowerCase();
      return sortOrder === "asc" ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
    });

    // Date Filter
    filtered = filtered.filter((p) => isWithinDateRange(p.createdAt, dateFilter));

    setFilteredPatients(filtered);
    setCurrentPage(1);
  }, [patients, searchQuery, sortOrder, dateFilter, customDate]);

  useEffect(() => {
    fetchPatients();
  }, []);

  const totalPages = Math.ceil(filteredPatients.length / rowsPerPage);
  const displayedPatients = filteredPatients.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  if (loading) return <p>Loading patients...</p>;

  return (
    <div className="patient-container">
      <div className="header">
        <div className="title-section">
          <h1>LEONARDO MEDICAL SERVICES</h1>
          <p>B1 L17-E Neovista, Bagumbong, Caloocan City</p>
        </div>
       
      </div>

      <div className="filter-bar">
        <input
          type="text"
          placeholder="Search..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}>
          <option value="asc">Ascending ↑</option>
          <option value="desc">Descending ↓</option>
        </select>
        <select value={dateFilter} onChange={(e) => setDateFilter(e.target.value)}>
          <option value="today">Today</option>
          <option value="yesterday">Yesterday</option>
          <option value="lastweek">Last Week</option>
          <option value="lastmonth">Last Month</option>
          <option value="custom">Custom Range</option>
        </select>

        {dateFilter === "custom" && (
          <div className="custom-range">
            <select value={customDate.day} onChange={(e) => setCustomDate({ ...customDate, day: e.target.value })}>
              <option value="">Day</option>
              {[...Array(31)].map((_, i) => (
                <option key={i + 1} value={i + 1}>{i + 1}</option>
              ))}
            </select>
            <select value={customDate.month} onChange={(e) => setCustomDate({ ...customDate, month: e.target.value })}>
              <option value="">Month</option>
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  {new Date(0, i).toLocaleString("en", { month: "short" })}
                </option>
              ))}
            </select>
            <select value={customDate.year} onChange={(e) => setCustomDate({ ...customDate, year: e.target.value })}>
              <option value="">Year</option>
              {Array.from({ length: 10 }, (_, i) => {
                const year = new Date().getFullYear() - i;
                return <option key={year} value={year}>{year}</option>;
              })}
            </select>
          </div>
        )}
         <button className="adds" onClick={() => setShowAddPatient(true)}>+ Add Patient</button>
      </div>

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Time and Date</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {displayedPatients.length > 0 ? (
              displayedPatients.map((p) => (
                <tr key={p.id}>
                  <td>{formatName(p)}</td>
                  <td>{formatDateTime(p.createdAt)}</td>
                  <td>
                  
                    <button onClick={() => handleViewPatient(p.id)} className="view-btn3">View</button>
                    <button
                      onClick={() => handleArchive(p.id)}
                      className="archive-btn3"
                      disabled={archivingIds.has(p.id)}
                    >
                      {archivingIds.has(p.id) ? "Archiving..." : "Archive"}
                    </button>
                   
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan="3" className="no-data">No records found</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="pagination">
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i + 1}
              onClick={() => setCurrentPage(i + 1)}
              className={currentPage === i + 1 ? "active" : ""}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}

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
