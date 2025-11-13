import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { X } from "lucide-react";
import api from "../../axios/api";
import { useAuth } from "../../context/AuthContext";
import "./PatientList.css";
import AddPatient from "../../modals/add-patient/AddPatient";
import Toast from "../Toast/Toast";
import ConfirmModal from "../ConfirmModal/ConfirmModal";

const PatientList = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddPatient, setShowAddPatient] = useState(false);
  const [archivingIds, setArchivingIds] = useState(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState("asc");
  const [dateFilter, setDateFilter] = useState("all");

  // Custom range states
  const [showCustomRange, setShowCustomRange] = useState(false);
  const [customDay, setCustomDay] = useState("");
  const [customMonth, setCustomMonth] = useState("");
  const [customYear, setCustomYear] = useState("");

  // Modal and Toast states
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    type: 'warning',
    title: '',
    message: '',
    onConfirm: null,
    isLoading: false
  });
  const [toastConfig, setToastConfig] = useState({
    isVisible: false,
    message: '',
    type: 'success',
    duration: 4000
  });

  // Pagination
  const [hasNextPage, setHasNextPage] = useState(false);
  const [hasPreviousPage, setHasPreviousPage] = useState(false);
  const [currentCursor, setCurrentCursor] = useState(null);
  const [cursorHistory, setCursorHistory] = useState([]);
  const [pageDirection, setPageDirection] = useState(null);

  const LIMIT = 10;
  const searchTimeoutRef = useRef(null);

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
  const showModal = (title, message, type = 'warning', onConfirm) => {
    setModalConfig({
      isOpen: true,
      type,
      title,
      message,
      onConfirm,
      isLoading: false
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

  const performArchive = async (patientId) => {
    if (archivingIds.has(patientId)) return;
    try {
      setModalLoading(true);
      setArchivingIds((prev) => new Set(prev).add(patientId));
      const res = await api.post("/patient/archive-patient", { id: patientId });
      if (res.data.success) {
        fetchPatients(currentCursor, pageDirection || "next", dateFilter);
        showToast('Patient archived successfully', 'success');
        closeModal();
      } else {
        throw new Error(res.data.message || "Failed to archive patient");
      }
    } catch (err) {
      console.error(err);
      showToast("Unable to archive patient.", 'error');
    } finally {
      setArchivingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(patientId);
        return newSet;
      });
      setModalLoading(false);
    }
  };

  const handleArchive = (patientId) => {
    showModal(
      "Archive Patient",
      "Are you sure you want to archive this patient? This will move this patient to the archive page.",
      'warning',
      () => performArchive(patientId)
    );
  };

  const handleViewPatient = (id) => {
    const prefix = user?.role === "admin" ? "/admin" : "/encoder";
    navigate(`${prefix}/patient-details/${id}`);
  };

  const fetchPatients = useCallback(async (cursor = null, dir = "next", filter = "all") => {
    try {
      setLoading(true);

      let endpoint = "/patient/get-total-patients";
      if (filter === "today") {
        endpoint = "/search/search-today-patients";
      } else if (filter === "week") {
        endpoint = "/search/search-week-patients";
      } else if (filter === "month") {
        endpoint = "/search/search-month-patients";
      }

      const params = {
        limit: LIMIT,
        ...(cursor && { cursor, direction: dir }),
      };

      const res = await api.get(endpoint, { params });

      if (res.data.success) {
        const fetchedPatients = res.data.data || [];
        setPatients(fetchedPatients);
        setHasNextPage(res.data.meta.hasNextPage);
        setHasPreviousPage(res.data.meta.hasPreviousPage);
        setCurrentCursor(cursor);
        setPageDirection(dir);
      } else {
        setPatients([]);
        showToast(res.data.message || "Failed to fetch patients", 'error');
      }
    } catch (err) {
      console.error("Error fetching patients:", err);
      setPatients([]);
      showToast("Unable to fetch patients. Please try again.", 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCustomRangePatients = async (offset = 0) => {
    try {
      setLoading(true);

      // Build the request body based on what's filled
      const body = {
        limit: LIMIT,
        offset: offset
      };

      // If all fields are filled, send as exact date
      if (customDay && customMonth && customYear) {
        const paddedDay = customDay.padStart(2, '0');
        const paddedMonth = customMonth.padStart(2, '0');
        body.date = `${paddedDay}/${paddedMonth}/${customYear}`;
      } 
      // Otherwise send year, month individually
      else {
        if (customYear) body.year = parseInt(customYear);
        if (customMonth) body.month = parseInt(customMonth);
      }

      const res = await api.post("/patient/get-patient-based-on-date", body);

      if (res.data.message && res.data.data) {
        const fetchedPatients = res.data.data.data || [];
        const pagination = res.data.data.pagination;
        
        setPatients(fetchedPatients);
        setHasNextPage(pagination.hasMore);
        setHasPreviousPage(pagination.offset > 0);
        
        // For custom range, we'll use offset-based pagination
        setCurrentCursor(null);
        setPageDirection(null);
        setCursorHistory([]);
      } else {
        setPatients([]);
        showToast("No patients found for the selected range", 'warning');
      }
    } catch (err) {
      console.error("Error fetching custom range patients:", err);
      setPatients([]);
      showToast("Unable to fetch patients for custom range.", 'error');
    } finally {
      setLoading(false);
    }
  };

  const searchPatients = useCallback(async (query) => {
    if (!query.trim()) {
      setCursorHistory([]);
      setCurrentCursor(null);
      setPageDirection(null);
      fetchPatients(null, "next", dateFilter);
      return;
    }

    try {
      setLoading(true);
      const res = await api.post("/search/search-patient", {
        searchBody: query.trim(),
      });

      if (res.data.result && res.data.result.length > 0) {
        const searchResults = res.data.result.map((p) => ({
          ...p,
          createdAt: new Date().toISOString(),
        }));
        setPatients(searchResults);
        setHasNextPage(false);
        setHasPreviousPage(false);
      } else {
        setPatients([]);
        showToast("No patients found matching your search.", 'warning');
      }
    } catch (err) {
      console.error("Error searching patients:", err);
      setPatients([]);
      showToast("No patients found matching your search.", 'error');
    } finally {
      setLoading(false);
    }
  }, [dateFilter, fetchPatients]);

  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      searchPatients(query);
    }, 300);
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    setCursorHistory([]);
    setCurrentCursor(null);
    setPageDirection(null);
    fetchPatients(null, "next", dateFilter);
  };

  const handleDateFilterChange = (filter) => {
    setDateFilter(filter);
    setCursorHistory([]);
    setCurrentCursor(null);
    setPageDirection(null);
    setSearchQuery("");
    
    if (filter === "custom") {
      setShowCustomRange(true);
      setPatients([]);
    } else {
      setShowCustomRange(false);
      setCustomDay("");
      setCustomMonth("");
      setCustomYear("");
      fetchPatients(null, "next", filter);
    }
  };

  const handleApplyCustomRange = () => {
    if (!customYear) {
      showToast("Please select at least a year", 'warning');
      return;
    }

    if (customMonth && !customYear) {
      showToast("Please select a year when selecting a month", 'warning');
      return;
    }

    if (customDay && !customMonth) {
      showToast("Please select a month when selecting a day", 'warning');
      return;
    }

    fetchCustomRangePatients(0);
  };

  const handleClearCustomRange = () => {
    setCustomDay("");
    setCustomMonth("");
    setCustomYear("");
    setShowCustomRange(false);
    setDateFilter("all");
    setPatients([]);
    fetchPatients(null, "next", "all");
  };

  const handleNextPage = () => {
    if (hasNextPage && patients.length > 0) {
      if (dateFilter === "custom") {
        // For custom range, use offset-based pagination
        const currentOffset = (cursorHistory.length) * LIMIT;
        fetchCustomRangePatients(currentOffset + LIMIT);
        setCursorHistory(prev => [...prev, currentOffset]);
      } else {
        // For regular pagination, use cursor-based
        const lastPatient = patients[patients.length - 1];
        const nextCursor = `${lastPatient.createdAt}|${lastPatient.id}`;
        setCursorHistory((prev) => [...prev, currentCursor]);
        fetchPatients(nextCursor, "next", dateFilter);
      }
    }
  };

  const handlePreviousPage = () => {
    if (hasPreviousPage) {
      if (dateFilter === "custom") {
        // For custom range, use offset-based pagination
        if (cursorHistory.length > 0) {
          const newHistory = [...cursorHistory];
          const prevOffset = newHistory.pop();
          setCursorHistory(newHistory);
          fetchCustomRangePatients(prevOffset);
        }
      } else {
        // For regular pagination, use cursor-based
        if (cursorHistory.length > 0) {
          const newHistory = [...cursorHistory];
          const prevCursor = newHistory.pop();
          setCursorHistory(newHistory);
          if (prevCursor === null) {
            fetchPatients(null, "next", dateFilter);
          } else {
            fetchPatients(prevCursor, "next", dateFilter);
          }
        } else {
          const firstPatient = patients[0];
          const prevCursor = `${firstPatient.createdAt}|${firstPatient.id}`;
          fetchPatients(prevCursor, "prev", dateFilter);
        }
      }
    }
  };

  const formatName = (patient) => {
    const firstInitial = patient.firstName ? patient.firstName[0] + "." : "";
    return `${patient.lastName}, ${firstInitial}`;
  };

  const formatDateTime = (dateStr) => {
    const d = new Date(dateStr);
    const time = d
      .toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      .toLowerCase();
    const day = d.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
    return `${time} ${day.replace(/\s/g, " ")}`;
  };

  const sortedPatients = [...patients].sort((a, b) => {
    const nameA = `${a.lastName}, ${a.firstName}`.toLowerCase();
    const nameB = `${b.lastName}, ${b.firstName}`.toLowerCase();
    return sortOrder === "asc"
      ? nameA.localeCompare(nameB)
      : nameB.localeCompare(nameA);
  });

  // Generate year options (current year and 10 years back)
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 11 }, (_, i) => currentYear - i);

  // Generate month options
  const monthOptions = [
    { value: 1, label: "January" },
    { value: 2, label: "February" },
    { value: 3, label: "March" },
    { value: 4, label: "April" },
    { value: 5, label: "May" },
    { value: 6, label: "June" },
    { value: 7, label: "July" },
    { value: 8, label: "August" },
    { value: 9, label: "September" },
    { value: 10, label: "October" },
    { value: 11, label: "November" },
    { value: 12, label: "December" },
  ];

  // Generate day options based on selected month and year
  const getDaysInMonth = () => {
    if (!customMonth || !customYear) return 31;
    return new Date(parseInt(customYear), parseInt(customMonth), 0).getDate();
  };

  const dayOptions = Array.from({ length: getDaysInMonth() }, (_, i) => i + 1);

  useEffect(() => {
    fetchPatients(null, "next", dateFilter);
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, []);

  if (loading && patients.length === 0) {
    return (
      <div className="patient-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading patients...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="patient-container">
      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={modalConfig.isOpen}
        onClose={closeModal}
        onConfirm={modalConfig.onConfirm}
        title={modalConfig.title}
        message={modalConfig.message}
        type={modalConfig.type}
        isLoading={modalConfig.isLoading}
        confirmText="Archive"
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

      <div className="header">
        <div className="title-section">
          <h1>LEONARDO MEDICAL SERVICES</h1>
          <p>B1 L17-E Neovista, Bagumbong, Caloocan City</p>
        </div>
      </div>

      <div className="filter-bar">
        <div className="search-wrapper">
          <input
            type="text"
            placeholder="Search by name..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="search-input"
          />
          {searchQuery && (
            <button
              className="clear-search"
              onClick={handleClearSearch}
              aria-label="Clear search"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <select
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value)}
          className="filter-select"
        >
          <option value="asc">Ascending ↑</option>
          <option value="desc">Descending ↓</option>
        </select>

        <select
          value={dateFilter}
          onChange={(e) => handleDateFilterChange(e.target.value)}
          className="filter-select"
          disabled={!!searchQuery}
        >
          <option value="all">All Patients</option>
          <option value="today">Today</option>
          <option value="week">This Week</option>
          <option value="month">This Month</option>
          <option value="custom">Custom Range</option>
        </select>

        <button className="adds" onClick={() => setShowAddPatient(true)}>
          + Add Patient
        </button>
      </div>

      {/* Custom Range Controls */}
      {showCustomRange && (
        <div className="custom-range-container">
          <div className="custom-range-controls">
            <select
              value={customYear}
              onChange={(e) => setCustomYear(e.target.value)}
              className="custom-select"
            >
              <option value="">Select Year</option>
              {yearOptions.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>

            <select
              value={customMonth}
              onChange={(e) => setCustomMonth(e.target.value)}
              className="custom-select"
              disabled={!customYear}
            >
              <option value="">Select Month (Optional)</option>
              {monthOptions.map((month) => (
                <option key={month.value} value={month.value}>
                  {month.label}
                </option>
              ))}
            </select>

            <select
              value={customDay}
              onChange={(e) => setCustomDay(e.target.value)}
              className="custom-select"
              disabled={!customMonth || !customYear}
            >
              <option value="">Select Day (Optional)</option>
              {dayOptions.map((day) => (
                <option key={day} value={day}>
                  {day}
                </option>
              ))}
            </select>

            <button 
              className="apply-custom-btn" 
              onClick={handleApplyCustomRange}
              disabled={!customYear}
            >
              Apply
            </button>
            <button className="clear-custom-btn" onClick={handleClearCustomRange}>
              Clear
            </button>
          </div>
        </div>
      )}

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>NAME</th>
              <th>TIME AND DATE</th>
              <th>ACTION</th>
            </tr>
          </thead>
          <tbody>
            {sortedPatients.length > 0 ? (
              sortedPatients.map((p) => (
                <tr key={p.id}>
                  <td>{formatName(p)}</td>
                  <td>{formatDateTime(p.createdAt)}</td>
                  <td>
                    <button
                      onClick={() => handleViewPatient(p.id)}
                      className="view-btnxx"
                    >
                      View
                    </button>
                    <button
                      onClick={() => handleArchive(p.id)}
                      className="archive-btnxx"
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
                  {searchQuery
                    ? "No patients found matching your search"
                    : showCustomRange
                    ? "Select a date range and click Apply"
                    : "No records found"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {!searchQuery && (hasPreviousPage || hasNextPage) && (
        <div className="pagination">
          <button
            onClick={handlePreviousPage}
            disabled={!hasPreviousPage}
            className="pagination-btn"
          >
            ← Previous
          </button>
          <span className="pagination-info">
            {patients.length}{" "}
            {patients.length === 1 ? "patient" : "patients"} displayed
          </span>
          <button
            onClick={handleNextPage}
            disabled={!hasNextPage}
            className="pagination-btn"
          >
            Next →
          </button>
        </div>
      )}

      {showAddPatient && (
        <AddPatient
          onClose={() => setShowAddPatient(false)}
          onSuccess={() => {
            setShowAddPatient(false);
            setSearchQuery("");
            setCursorHistory([]);
            setCurrentCursor(null);
            setPageDirection(null);
            fetchPatients(null, "next", dateFilter);
            showToast('Patient added successfully', 'success');
          }}
        />
      )}
    </div>
  );
};

export default PatientList;