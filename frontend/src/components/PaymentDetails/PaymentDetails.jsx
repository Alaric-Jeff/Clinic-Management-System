import { useState, useEffect } from "react";
import "./PaymentDetails.css";
import Toast from "../Toast/Toast";
import ConfirmModal from "../ConfirmModal/ConfirmModal";
import api from '../../axios/api';

export default function PaymentDetails() {
  const [records, setRecords] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [dateFilter, setDateFilter] = useState("all");
  const [showViewModal, setShowViewModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [updateStatus, setUpdateStatus] = useState("");
  const [partialAmount, setPartialAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processingPayment, setProcessingPayment] = useState(false);
  
  // Toast state
  const [toast, setToast] = useState({
    isVisible: false,
    message: '',
    type: 'success'
  });

  const statusOptions = ["Partially Paid"];
  const paymentMethods = [
    { value: "cash", label: "Cash" },
    { value: "card", label: "Card" },
    { value: "gcash", label: "GCash" },
    { value: "insurance", label: "Insurance" },
    { value: "bank_transfer", label: "Bank Transfer" }
  ];

  const MAX_NOTES_LENGTH = 150;

  // Fetch unsettled bills from API
  useEffect(() => {
    fetchUnsettledBills();
  }, []);

  const fetchUnsettledBills = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get('/bills/get-unsettled-bills');
      const billsData = response.data.data;
      
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

  const showToast = (message, type = 'success') => {
    setToast({ isVisible: true, message, type });
  };

  const closeToast = () => {
    setToast({ ...toast, isVisible: false });
  };

  const handleViewClick = (record) => {
    setSelectedRecord(record);
    setShowViewModal(true);
  };

  const handleUpdateClick = (record) => {
    setSelectedRecord(record);
    setUpdateStatus("");
    setPartialAmount("");
    setPaymentMethod("cash");
    setNotes("");
    setShowUpdateModal(true);
  };

  const handlePartialAmountChange = (e) => {
    const value = e.target.value;
    
    // Allow empty string
    if (value === "") {
      setPartialAmount("");
      return;
    }

    // Parse as number
    const numValue = parseFloat(value);
    
    // Validate: must be positive and not exceed balance
    if (!isNaN(numValue) && numValue >= 0) {
      if (numValue <= (selectedRecord?.balance || 0)) {
        setPartialAmount(value);
      } else {
        showToast("Amount cannot exceed balance", "error");
      }
    }
  };

  const handleNotesChange = (e) => {
    const value = e.target.value;
    if (value.length <= MAX_NOTES_LENGTH) {
      setNotes(value);
    }
  };

  const handlePreparePayment = () => {
    // Validation
    if (!updateStatus) {
      showToast("Please select a payment type", "error");
      return;
    }

    if (updateStatus === "Partially Paid") {
      const amount = parseFloat(partialAmount);
      
      if (!partialAmount || isNaN(amount)) {
        showToast("Please enter a valid payment amount", "error");
        return;
      }
      
      if (amount <= 0) {
        showToast("Payment amount must be greater than 0", "error");
        return;
      }
      
      if (amount > (selectedRecord.balance || 0)) {
        showToast("Payment amount cannot exceed remaining balance", "error");
        return;
      }

      // Check if partial payment equals full balance
      if (amount === selectedRecord.balance) {
        showToast("This amount equals the full balance. Please select 'Full Payment' instead.", "error");
        return;
      }
    }

    // Show confirmation modal
    setShowConfirmModal(true);
  };

  const handleConfirmPayment = async () => {
    setProcessingPayment(true);
    setShowConfirmModal(false);
    
    try {
      // Calculate payment amount
      let paymentAmount;
      if (updateStatus === "Paid") {
        paymentAmount = selectedRecord.balance;
      } else if (updateStatus === "Partially Paid") {
        paymentAmount = parseFloat(partialAmount);
      }

      const paymentData = {
        medicalBillId: selectedRecord.id,
        paymentAmount: paymentAmount,
        paymentMethod: paymentMethod,
        notes: notes.trim() || undefined
      };

      const response = await api.post('/bills/update-payment', paymentData);

      if (response.data.success) {
        showToast("Payment processed successfully!", "success");
        await fetchUnsettledBills();
        setShowUpdateModal(false);
        setSelectedRecord(null);
        setUpdateStatus("");
        setPartialAmount("");
        setPaymentMethod("cash");
        setNotes("");
      }
    } catch (err) {
      console.error('Payment error:', err);
      const errorMessage = err.response?.data?.message || 
                          err.response?.data?.error || 
                          err.message || 
                          'Failed to update payment';
      showToast(errorMessage, "error");
    } finally {
      setProcessingPayment(false);
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

  // Check if record is within date range
  const isWithinDateRange = (dateString) => {
    const recordDate = new Date(dateString);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const recordDay = new Date(recordDate.getFullYear(), recordDate.getMonth(), recordDate.getDate());

    switch (dateFilter) {
      case 'today':
        return recordDay.getTime() === today.getTime();
      case 'week':
        const weekAgo = new Date(today);
        weekAgo.setDate(today.getDate() - 7);
        return recordDay >= weekAgo;
      case 'month':
        const monthAgo = new Date(today);
        monthAgo.setMonth(today.getMonth() - 1);
        return recordDay >= monthAgo;
      default:
        return true;
    }
  };

  // Filter records
  const filteredRecords = Array.isArray(records) ? records.filter(record => {
    if (!record || !record.medicalDocumentation || !record.medicalDocumentation.patient) {
      return false;
    }
    
    const patientName = formatPatientName(record.medicalDocumentation.patient).toLowerCase();
    const matchesSearch = patientName.includes(searchTerm.toLowerCase());
    const formattedStatus = formatPaymentStatus(record.paymentStatus);
    const matchesStatus = !selectedStatus || formattedStatus === selectedStatus;
    const matchesDate = isWithinDateRange(record.createdAt);
    
    return matchesSearch && matchesStatus && matchesDate;
  }) : [];

  if (loading) {
    return (
      <div className="payment-details-container">
        <div className="loading-state">Loading payment records...</div>
      </div>
    );
  }

  return (
    <div className="payment-details-container">
      {/* Header */}
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

        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="filter-select"
        >
          <option value="">All Status</option>
          {statusOptions.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>

        <select
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="filter-select"
        >
          <option value="all">All Dates</option>
          <option value="today">Today</option>
          <option value="week">This Week</option>
          <option value="month">This Month</option>
        </select>
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
                  {records.length === 0 ? 'No payment records available.' : 'No records match your filters.'}
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
        <div className="modal-overlay" onClick={() => setShowViewModal(false)}>
          <div className="modal view-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Payment Details</h3>
              <button className="modal-close-btn" onClick={() => setShowViewModal(false)}>✕</button>
            </div>
            
            <div className="modal-body">
              <div className="patient-info-card">
                <h4 className="card-header">Patient Information</h4>
                <div className="info-content">
                  <div className="info-item">
                    <span className="label">Name</span>
                    <span className="value">
                      {formatPatientName(selectedRecord.medicalDocumentation.patient)}
                    </span>
                  </div>
                  <div className="info-item">
                    <span className="label">Date</span>
                    <span className="value">{formatDate(selectedRecord.createdAt)}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">Senior/PWD ID</span>
                    <span className="value">
                      {selectedRecord.medicalDocumentation.patient.csdIdOrPwdId || 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="billing-card">
                <h4 className="card-header">Billing Summary</h4>
                <div className="billing-content">
                  <div className="billing-item">
                    <span>Consultation Fee</span>
                    <span className="price">₱ {selectedRecord.consultationFee?.toFixed(2) || '0.00'}</span>
                  </div>
                  <div className="billing-item">
                    <span>Additional Services</span>
                    <span className="price">₱ {((selectedRecord.totalAmount || 0) - (selectedRecord.consultationFee || 0)).toFixed(2)}</span>
                  </div>
                  {selectedRecord.isSeniorPwdDiscountApplied && (
                    <div className="billing-item discount-item">
                      <span>Discount ({selectedRecord.discountRate}%)</span>
                      <span className="price discount">- ₱ {(((selectedRecord.consultationFee || 0) + ((selectedRecord.totalAmount || 0) - (selectedRecord.consultationFee || 0))) * (selectedRecord.discountRate / 100)).toFixed(2)}</span>
                    </div>
                  )}
                  <div className="billing-item total-item">
                    <span>Total Amount</span>
                    <span className="price total">₱ {selectedRecord.totalAmount?.toFixed(2) || '0.00'}</span>
                  </div>
                </div>
              </div>

              <div className="payment-info-card">
                <h4 className="card-header">Payment Information</h4>
                <div className="payment-content">
                  <div className="payment-detail">
                    <span className="detail-label">Status</span>
                    <span className={`status-badge status-${selectedRecord.paymentStatus?.toLowerCase().replace('_', '-')}`}>
                      {formatPaymentStatus(selectedRecord.paymentStatus)}
                    </span>
                  </div>
                  <div className="payment-detail">
                    <span className="detail-label">Amount Paid</span>
                    <span className="detail-value paid">₱ {selectedRecord.amountPaid?.toFixed(2) || '0.00'}</span>
                  </div>
                  <div className="payment-detail balance-detail">
                    <span className="detail-label">Remaining Balance</span>
                    <span className="detail-value balance">₱ {selectedRecord.balance?.toFixed(2) || '0.00'}</span>
                  </div>
                </div>

                {selectedRecord.notes && (
                  <div className="notes-box">
                    <strong>Notes:</strong> {selectedRecord.notes}
                  </div>
                )}
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-close-only" onClick={() => setShowViewModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Update Modal */}
      {showUpdateModal && selectedRecord && (
        <div className="modal-overlay" onClick={() => setShowUpdateModal(false)}>
          <div className="modal update-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Update Payment</h3>
              <button className="modal-close-btn" onClick={() => setShowUpdateModal(false)}>✕</button>
            </div>
            
            <div className="modal-body">
              <div className="patient-summary-card">
                <div className="summary-row">
                  <span className="summary-label">Patient:</span>
                  <span className="summary-value">
                    {formatPatientName(selectedRecord.medicalDocumentation.patient)}
                  </span>
                </div>
                <div className="summary-row">
                  <span className="summary-label">Date:</span>
                  <span className="summary-value">{formatDate(selectedRecord.createdAt)}</span>
                </div>
                <div className="summary-row balance-row">
                  <span className="summary-label">Current Balance:</span>
                  <span className="summary-value balance">₱ {selectedRecord.balance?.toFixed(2) || '0.00'}</span>
                </div>
              </div>

              <div className="form-section">
                <label className="form-label">Payment Method</label>
                <div className="payment-method-grid">
                  {paymentMethods.map((method) => (
                    <button
                      key={method.value}
                      className={`payment-method-btn ${paymentMethod === method.value ? 'active' : ''}`}
                      onClick={() => setPaymentMethod(method.value)}
                    >
                      {method.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-section">
                <label className="form-label">Payment Type</label>
                <div className="payment-type-options">
                  <label className={`payment-type-card ${updateStatus === "Paid" ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name="paymentType"
                      value="Paid"
                      checked={updateStatus === "Paid"}
                      onChange={(e) => {
                        setUpdateStatus(e.target.value);
                        setPartialAmount("");
                      }}
                    />
                    <div className="card-content">
                      <span className="card-title">Full Payment</span>
                      <span className="card-amount">₱ {selectedRecord.balance?.toFixed(2) || '0.00'}</span>
                    </div>
                  </label>

                  <label className={`payment-type-card ${updateStatus === "Partially Paid" ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name="paymentType"
                      value="Partially Paid"
                      checked={updateStatus === "Partially Paid"}
                      onChange={(e) => setUpdateStatus(e.target.value)}
                    />
                    <div className="card-content">
                      <span className="card-title">Partial Payment</span>
                      <span className="card-subtitle">Enter custom amount</span>
                    </div>
                  </label>
                </div>

                {updateStatus === "Partially Paid" && (
                  <div className="partial-input-wrapper">
                    <label className="input-label">Amount to Pay</label>
                    <div className="currency-input">
                      <span className="currency-symbol">₱</span>
                      <input
                        type="number"
                        placeholder="0.00"
                        value={partialAmount}
                        onChange={handlePartialAmountChange}
                        className="amount-input"
                        min="0.01"
                        max={selectedRecord.balance || 0}
                        step="0.01"
                      />
                    </div>
                    <div className="input-helper">
                      Maximum: ₱ {selectedRecord.balance?.toFixed(2) || '0.00'}
                    </div>
                  </div>
                )}
              </div>

              {updateStatus === 'Partially Paid' && partialAmount && parseFloat(partialAmount) > 0 && (
                <div className="payment-preview-card">
                  <div className="preview-row">
                    <span>Payment Amount:</span>
                    <span className="preview-amount">₱ {parseFloat(partialAmount || 0).toFixed(2)}</span>
                  </div>
                  <div className="preview-row">
                    <span>Remaining Balance:</span>
                    <span className="preview-amount">₱ {Math.max(0, (selectedRecord.balance || 0) - parseFloat(partialAmount || 0)).toFixed(2)}</span>
                  </div>
                </div>
              )}

              <div className="form-section">
                <label className="form-label">
                  Notes (Optional)
                  <span className="char-count">{notes.length}/{MAX_NOTES_LENGTH}</span>
                </label>
                <textarea
                  value={notes}
                  onChange={handleNotesChange}
                  className="notes-textarea"
                  placeholder="Add any notes about this payment..."
                  rows="3"
                  maxLength={MAX_NOTES_LENGTH}
                />
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="btn-secondary"
                onClick={() => setShowUpdateModal(false)}
                disabled={processingPayment}
              >
                Cancel
              </button>
              <button 
                className="btn-primary" 
                onClick={handlePreparePayment}
                disabled={
                  processingPayment ||
                  !updateStatus ||
                  (updateStatus === 'Partially Paid' && (!partialAmount || parseFloat(partialAmount) <= 0))
                }
              >
                Process Payment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleConfirmPayment}
        title="Confirm Payment"
        message={`Are you sure you want to process this ${updateStatus === 'Paid' ? 'full' : 'partial'} payment of ₱${updateStatus === 'Paid' ? selectedRecord?.balance?.toFixed(2) : parseFloat(partialAmount || 0).toFixed(2)}?`}
        confirmText="Process Payment"
        cancelText="Cancel"
        type="warning"
        isLoading={processingPayment}
      />

      {/* Toast Notification */}
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={closeToast}
        duration={4000}
        position="bottom-right"
      />
    </div>
  );
}