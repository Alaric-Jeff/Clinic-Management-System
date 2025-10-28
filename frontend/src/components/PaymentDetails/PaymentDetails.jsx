import { useState } from "react";
import "./PaymentDetails.css";

export default function PaymentDetails() {
  const [records, setRecords] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [updateStatus, setUpdateStatus] = useState("");
  const [partialAmount, setPartialAmount] = useState("");

  const statusOptions = ["Partially Paid", "Unpaid", "Paid"];

  const handleViewClick = (record) => {
    setSelectedRecord(record);
    setShowViewModal(true);
  };

  const handleUpdateClick = (record) => {
    setSelectedRecord(record);
    setUpdateStatus(record.paymentStatus);
    setPartialAmount("");
    setShowUpdateModal(true);
  };

  const handleSaveUpdate = () => {
    if (selectedRecord && updateStatus) {
      setRecords((prev) =>
        prev.map((r) =>
          r.id === selectedRecord.id
            ? { ...r, paymentStatus: updateStatus, partialAmount }
            : r
        )
      );
      setShowUpdateModal(false);
      setSelectedRecord(null);
      setUpdateStatus("");
      setPartialAmount("");
    }
  };

  const filteredRecords = records.filter((record) => {
    const matchesSearch = record.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesStatus =
      !selectedStatus || record.paymentStatus === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="payment-details-container">
      {/* Universal Header */}
      <div className="header">
        <h1>LEONARDO MEDICAL SERVICES</h1>
        <p>B1 L17-E Neovista, Bagumbong, Caloocan City</p>
      </div>

      {/* Page Title */}
      <div className="payment-header">
        <h1 className="payment-title">Payment Details</h1>
      </div>

      {/* Search and Filter Bar */}
      <div className="filter-bar">
        <input
          type="text"
          placeholder="Search..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />

        <div className="status-filter">
          <button
            onClick={() => setShowStatusDropdown(!showStatusDropdown)}
            className="status-btn"
          >
            {selectedStatus || "Status ▾"}
          </button>
          {showStatusDropdown && (
            <div className="status-dropdown">
              <div
                className="dropdown-item"
                onClick={() => {
                  setSelectedStatus("");
                  setShowStatusDropdown(false);
                }}
              >
                All Status
              </div>
              {statusOptions.map((status) => (
                <div
                  key={status}
                  className="dropdown-item"
                  onClick={() => {
                    setSelectedStatus(status);
                    setShowStatusDropdown(false);
                  }}
                >
                  {status}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Records Table */}
      <div className="table-container">
        <table className="records-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Date</th>
              <th>Payment Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredRecords.length === 0 ? (
              <tr>
                <td colSpan="4" className="no-data">
                  No payment records available.
                </td>
              </tr>
            ) : (
              filteredRecords.map((record, index) => (
                <tr key={record.id} className={index % 2 ? "odd" : "even"}>
                  <td>{record.name}</td>
                  <td>{record.date}</td>
                  <td>{record.paymentStatus}</td>
                  <td>
                    <button
                      className="view-btn"
                      onClick={() => handleViewClick(record)}
                    >
                      View
                    </button>
                    <button
                      className="update-btn"
                      onClick={() => handleUpdateClick(record)}
                    >
                      Update
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* View Modal */}
      {showViewModal && selectedRecord && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">Payment Breakdown</div>
            <div className="modal-body">
              <div className="modal-section-header">
                <span>Procedure</span>
                <span>Fees</span>
              </div>

              <div className="modal-item">
                <span>Consultation</span>
                <span>₱ 350</span>
              </div>
              <div className="modal-item">
                <span>Laboratory</span>
                <span>₱ 350</span>
              </div>
              <div className="modal-item">
                <span>Injection (Anti-Rabies)</span>
                <span>₱ 350</span>
              </div>

              <div className="modal-total">
                <span>Total:</span>
                <span>₱ 1,050</span>
              </div>

              <div className="modal-footer">
                <button
                  className="close-btn"
                  onClick={() => setShowViewModal(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Update Modal */}
      {showUpdateModal && selectedRecord && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">Update Payment Status</div>
            <div className="modal-body">
              <p>
                <strong>Name:</strong> {selectedRecord.name}
              </p>
              <p>
                <strong>Date:</strong> {selectedRecord.date}
              </p>

              {statusOptions.map((status) => (
                <label key={status} className="radio-label">
                  <input
                    type="radio"
                    name="status"
                    value={status}
                    checked={updateStatus === status}
                    onChange={(e) => setUpdateStatus(e.target.value)}
                  />
                  {status}
                  {status === "Partially Paid" &&
                    updateStatus === "Partially Paid" && (
                      <input
                        type="text"
                        placeholder="Enter amount"
                        value={partialAmount}
                        onChange={(e) => setPartialAmount(e.target.value)}
                        className="partial-input"
                      />
                    )}
                </label>
              ))}

              <div className="modal-footer">
                <button
                  className="cancel-btn"
                  onClick={() => setShowUpdateModal(false)}
                >
                  Cancel
                </button>
                <button className="save-btn" onClick={handleSaveUpdate}>
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
