import { useState, useEffect } from "react";
import "./PaymentDetails.css";
import api from '../../axios/api';

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
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processingPayment, setProcessingPayment] = useState(false);

  const statusOptions = ["Partially Paid", "Unpaid", "Paid"];
  const paymentMethods = ["cash", "card", "gcash", "insurance", "bank_transfer"];

  // Fetch unsettled bills from API
  useEffect(() => {
    fetchUnsettledBills();
  }, []);

  const fetchUnsettledBills = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get('/bills/get-unsettled-bills');
      
      // Access the data property from the response
      const billsData = response.data.data;
      
      // Ensure we have an array
      if (Array.isArray(billsData)) {
        setRecords(billsData);
      } else {
        console.error('Expected array but got:', billsData);
        setRecords([]);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to fetch bills');
      console.error('Error fetching bills:', err);
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  const handleViewClick = (record) => {
    setSelectedRecord(record);
    setShowViewModal(true);
  };

  const handleUpdateClick = (record) => {
    setSelectedRecord(record);
    setUpdateStatus(record.paymentStatus);
    setPartialAmount("");
    setPaymentMethod("cash");
    setNotes("");
    setShowUpdateModal(true);
  };

  const handleSaveUpdate = async () => {
    if (selectedRecord && updateStatus) {
      setProcessingPayment(true);
      setError(null);
      
      try {
        // Calculate payment amount based on selection
        let paymentAmount;
        if (updateStatus === "Paid") {
          paymentAmount = selectedRecord.balance;
        } else if (updateStatus === "Partially Paid") {
          paymentAmount = parseFloat(partialAmount);
        } else {
          paymentAmount = 0.01; // API requires minimum 0.01
        }

        // Validate payment amount
        if (updateStatus === "Partially Paid") {
          if (!partialAmount || parseFloat(partialAmount) <= 0) {
            setError("Partial payment amount must be greater than 0");
            setProcessingPayment(false);
            return;
          }
          if (parseFloat(partialAmount) > (selectedRecord.balance || 0)) {
            setError("Payment amount cannot exceed remaining balance");
            setProcessingPayment(false);
            return;
          }
        }

        console.log("Payment calculation:", {
          updateStatus,
          balance: selectedRecord.balance,
          partialAmount,
          finalPaymentAmount: paymentAmount
        });

        // Prepare payment data according to the API schema
        const paymentData = {
          medicalBillId: selectedRecord.id,
          paymentAmount: paymentAmount,
          paymentMethod: paymentMethod,
          notes: notes.trim() || undefined
        };

        console.log("Sending payment data to API:", paymentData);

        // Use axios for the update call
        const response = await api.post('/bills/update-payment', paymentData);
        console.log("API Response:", response.data);

        // Refresh the data
        await fetchUnsettledBills();
        setShowUpdateModal(false);
        setSelectedRecord(null);
        setUpdateStatus("");
        setPartialAmount("");
        setPaymentMethod("cash");
        setNotes("");
        
      } catch (err) {
        console.error('Full error object:', err);
        console.error('Error response:', err.response);
        console.error('Error message:', err.message);
        console.error('Error data:', err.response?.data);
        
        const errorMessage = err.response?.data?.message || 
                           err.response?.data?.error || 
                           err.message || 
                           'Failed to update payment';
        
        setError(errorMessage);
      } finally {
        setProcessingPayment(false);
      }
    }
  };

  // Format patient name
  const formatPatientName = (patient) => {
    const { firstName, lastName, middleName } = patient;
    return middleName ? `${firstName} ${middleName} ${lastName}` : `${firstName} ${lastName}`;
  };

  // Format date for display
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Format payment status for display
  const formatPaymentStatus = (status) => {
    return status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  // Format payment method for display
  const formatPaymentMethod = (method) => {
    return method.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  // Filter records based on search and status - with safety check
  const filteredRecords = Array.isArray(records) ? records.filter(record => {
    if (!record || !record.medicalDocumentation || !record.medicalDocumentation.patient) {
      return false;
    }
    
    const patientName = formatPatientName(record.medicalDocumentation.patient).toLowerCase();
    const matchesSearch = patientName.includes(searchTerm.toLowerCase());
    const formattedStatus = formatPaymentStatus(record.paymentStatus);
    const matchesStatus = !selectedStatus || formattedStatus === selectedStatus;
    return matchesSearch && matchesStatus;
  }) : [];

  if (loading) {
    return (
      <div className="payment-details-container">
        <div className="loading-state">Loading payment records...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="payment-details-container">
        <div className="error-state">Error: {error}</div>
        <button onClick={fetchUnsettledBills} className="btn-retry">
          Try Again
        </button>
      </div>
    );
  }

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
          placeholder="Search by name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />

        <div className="status-filter">
          <button
            onClick={() => setShowStatusDropdown(!showStatusDropdown)}
            className="status-btn"
          >
            {selectedStatus || "All Status ▾"}
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
                  {records.length === 0 ? 'No payment records available.' : 'No records match your search.'}
                </td>
              </tr>
            ) : (
              filteredRecords.map((record, index) => (
                <tr key={record.id} className={index % 2 ? "odd" : "even"}>
                  <td>
                    {formatPatientName(record.medicalDocumentation.patient)}
                  </td>
                  <td>{formatDate(record.createdAt)}</td>
                  <td>
                    <span className={`status-badge status-${record.paymentStatus.toLowerCase().replace('_', '-')}`}>
                      {formatPaymentStatus(record.paymentStatus)}
                    </span>
                  </td>
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
            <div className="modal-header">Payment Details</div>
            <div className="modal-body">
              <div className="patient-info">
                <div className="info-item">
                  <span className="info-label">Patient:</span>
                  <span className="info-value">
                    {formatPatientName(selectedRecord.medicalDocumentation.patient)}
                  </span>
                </div>
                <div className="info-item">
                  <span className="info-label">Date:</span>
                  <span className="info-value">{formatDate(selectedRecord.createdAt)}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Senior/PWD ID:</span>
                  <span className="info-value">
                    {selectedRecord.medicalDocumentation.patient.csdIdOrPwdId || 'None'}
                  </span>
                </div>
              </div>

              <div className="details-header">
                <span className="details-label">PROCEDURE</span>
                <span className="details-label">FEES</span>
              </div>

              <div className="procedure-section">
                <div className="procedure-title">Consultation</div>
                <div className="procedure-item">
                  <span>Consultation Fee</span>
                  <span>₱ {selectedRecord.consultationFee?.toFixed(2) || '0.00'}</span>
                </div>
              </div>

              <div className="procedure-section">
                <div className="procedure-title">Additional Services</div>
                <div className="procedure-item">
                  <span>Other Services</span>
                  <span>₱ {((selectedRecord.totalAmount || 0) - (selectedRecord.consultationFee || 0)).toFixed(2)}</span>
                </div>
              </div>

              <div className="grand-total-section">
                <div className="grand-total-item">
                  <span className="grand-total-label">GRAND TOTAL</span>
                  <span className="grand-total-amount">₱ {selectedRecord.totalAmount?.toFixed(2) || '0.00'}</span>
                </div>
              </div>

              <div className="payment-details">
                <div className="payment-info">
                  <span className="payment-label">Current Status:</span>
                  <span className={`status-text status-${selectedRecord.paymentStatus?.toLowerCase().replace('_', '-')}`}>
                    {formatPaymentStatus(selectedRecord.paymentStatus)}
                  </span>
                </div>

                <div className="payment-info">
                  <span className="payment-label">
                    Senior/PWD Discount Applied: 
                  </span>
                  <span>{selectedRecord.isSeniorPwdDiscountApplied ? 'Yes' : 'No'}</span>
                </div>

                {selectedRecord.isSeniorPwdDiscountApplied && (
                  <div className="payment-info">
                    <span className="payment-label">Discount Rate:</span>
                    <span>{selectedRecord.discountRate}%</span>
                  </div>
                )}
              </div>

              <div className="amounts-section">
                <div className="amount-item">
                  <span className="amount-label">Amount Paid:</span>
                  <span className="amount-value">₱ {selectedRecord.amountPaid?.toFixed(2) || '0.00'}</span>
                </div>
                <div className="amount-item">
                  <span className="amount-label">Remaining Balance:</span>
                  <span className="amount-value">₱ {selectedRecord.balance?.toFixed(2) || '0.00'}</span>
                </div>
              </div>

              {selectedRecord.notes && (
                <div className="notes-section">
                  <span className="notes-label">Notes:</span>
                  <span className="notes-value">{selectedRecord.notes}</span>
                </div>
              )}

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
              <div className="patient-info">
                <div className="info-item">
                  <span className="info-label">Name:</span>
                  <span className="info-value">
                    {formatPatientName(selectedRecord.medicalDocumentation.patient)}
                  </span>
                </div>
                <div className="info-item">
                  <span className="info-label">Date:</span>
                  <span className="info-value">{formatDate(selectedRecord.createdAt)}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Current Balance:</span>
                  <span className="info-value">₱ {selectedRecord.balance?.toFixed(2) || '0.00'}</span>
                </div>
              </div>

              {/* Payment Method Selection */}
              <div className="payment-method-section">
                <label className="payment-method-label">Payment Method:</label>
                <select 
                  value={paymentMethod} 
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="payment-method-select"
                >
                  {paymentMethods.map(method => (
                    <option key={method} value={method}>
                      {formatPaymentMethod(method)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Selection */}
              <div className="radio-group">
                <label className="radio-label">
                  <input
                    type="radio"
                    name="status"
                    value="Unpaid"
                    checked={updateStatus === "Unpaid"}
                    onChange={(e) => setUpdateStatus(e.target.value)}
                  />
                  <span className="radio-text">Unpaid (₱ 0.00)</span>
                </label>

                <label className="radio-label">
                  <input
                    type="radio"
                    name="status"
                    value="Paid"
                    checked={updateStatus === "Paid"}
                    onChange={(e) => setUpdateStatus(e.target.value)}
                  />
                  <span className="radio-text">Paid (Full Amount: ₱ {selectedRecord.balance?.toFixed(2) || '0.00'})</span>
                </label>

                <label className="radio-label">
                  <input
                    type="radio"
                    name="status"
                    value="Partially Paid"
                    checked={updateStatus === "Partially Paid"}
                    onChange={(e) => setUpdateStatus(e.target.value)}
                  />
                  <span className="radio-text">Partially Paid</span>
                  {updateStatus === "Partially Paid" && (
                    <input
                      type="number"
                      placeholder="Enter amount"
                      value={partialAmount}
                      onChange={(e) => setPartialAmount(e.target.value)}
                      className="partial-input"
                      min="0.01"
                      max={selectedRecord.balance || 0}
                      step="0.01"
                    />
                  )}
                </label>
              </div>

              {/* Notes Field */}
              <div className="notes-input-section">
                <label className="notes-label">Notes (Optional):</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="notes-textarea"
                  placeholder="Add any notes about this payment..."
                  rows="3"
                />
              </div>

              {updateStatus === 'Partially Paid' && partialAmount && (
                <div className="payment-preview">
                  <div className="preview-item">
                    <span>Payment Amount:</span>
                    <span>₱ {parseFloat(partialAmount || 0).toFixed(2)}</span>
                  </div>
                  <div className="preview-item">
                    <span>Remaining Balance:</span>
                    <span>₱ {((selectedRecord.balance || 0) - parseFloat(partialAmount || 0)).toFixed(2)}</span>
                  </div>
                </div>
              )}

              {error && (
                <div className="error-message">
                  {error}
                </div>
              )}

              <div className="modal-footer">
                <button
                  className="cancel-btn"
                  onClick={() => {
                    setShowUpdateModal(false);
                    setSelectedRecord(null);
                    setUpdateStatus("");
                    setPartialAmount("");
                    setPaymentMethod("cash");
                    setNotes("");
                    setError(null);
                  }}
                  disabled={processingPayment}
                >
                  Cancel
                </button>
                <button 
                  className="save-btn" 
                  onClick={handleSaveUpdate}
                  disabled={
                    processingPayment ||
                    (updateStatus === 'Partially Paid' && (!partialAmount || parseFloat(partialAmount) <= 0)) ||
                    (updateStatus === 'Partially Paid' && parseFloat(partialAmount) > (selectedRecord.balance || 0))
                  }
                >
                  {processingPayment ? "Processing..." : "Process Payment"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}