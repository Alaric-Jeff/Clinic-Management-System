import { useEffect, useState } from "react";
import api from "../../axios/api";

import "./ViewDocModal.css";

const ViewMedicalDocModal = ({ docId, onClose }) => {
  const [docData, setDocData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!docId) return;

    let cancelled = false;

    const fetchMedicalDoc = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get(`/document/medical-documentation/${docId}`);
        if (res.data?.success && res.data?.data) {
          if (!cancelled) setDocData(res.data.data);
        } else {
          if (!cancelled) setError(res.data?.message || "Failed to fetch medical documentation");
        }
      } catch (err) {
        console.error("Error fetching medical documentation:", err);
        if (!cancelled) setError("Unable to load medical documentation. Please try again.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchMedicalDoc();
    return () => {
      cancelled = true;
    };
  }, [docId]);

  const formatDateTime = (iso) => {
    if (!iso) return "N/A";
    try {
      return new Date(iso).toLocaleString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return iso;
    }
  };

  const formatDate = (iso) => {
    if (!iso) return "N/A";
    try {
      return new Date(iso).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return iso;
    }
  };

  const formatCurrency = (amt) => {
    const n = Number(amt || 0);
    return "₱ " + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="modal-overlay">
        <div className="modal-content-medical">
          <p className="loading-text">Loading medical documentation...</p>
        </div>
      </div>
    );
  }

  if (error || !docData) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content-medical" onClick={(e) => e.stopPropagation()}>
          <button className="close-modal-btn" onClick={onClose} aria-label="Close">✕</button>
          <div className="error-state">{error || "Medical documentation not found"}</div>
        </div>
      </div>
    );
  }

  const patient = docData.patient || { firstName: "", middleName: null, lastName: "" };
  const bill = docData.medicalBill || null;
  const services = bill?.billedServices || [];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content-medical" onClick={(e) => e.stopPropagation()}>
        {/* Header (logo removed) */}
        <div className="medical-doc-header">
          <div style={{ display: "flex", flexDirection: "column" }}>
            <h1 style={{ margin: 0, color: "#7a0000", fontSize: 18, fontWeight: 700 }}>
              LEONARDO MEDICAL SERVICES
            </h1>
            <p style={{ margin: "4px 0 0 0", fontSize: 11, color: "#666" }}>
              B1 L17, F. Novaliches, Bagumbong, Caloocan City
            </p>
          </div>

          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button className="print-btn" onClick={handlePrint}>PRINT</button>
            <button className="close-modal-btn" onClick={onClose} aria-label="Close">✕</button>
          </div>
        </div>

        <div className="medical-doc-body">
          {/* Patient Info */}
          <div className="patient-info-header">
            <h3>Patient's Name:</h3>
            <p className="patient-full-name">
              {`${patient.firstName || ""} ${patient.middleName ? patient.middleName + " " : ""}${patient.lastName || ""}`.trim()}
            </p>
            <div className="patient-mini-info">
              <span>Date: {formatDate(docData.createdAt)}</span>
            </div>
          </div>

          {/* Two Column Layout */}
          <div className="doc-two-column">
            {/* Left Column - Medical Notes */}
            <div className="medical-notes-section">
              <div className="notes-card">
                {/* Removed logo block here */}

                <div className="notes-content">
                  {/* Patient name duplicate removed */}

                  <div className="note-section">
                    <label>Assessment:</label>
                    <div className="note-text">{docData.assessment || "No assessment provided"}</div>
                  </div>

                  <div className="note-section">
                    <label>Diagnosis:</label>
                    <div className="note-text">{docData.diagnosis || "No diagnosis provided"}</div>
                  </div>

                  <div className="note-section">
                    <label>Treatment:</label>
                    <div className="note-text">{docData.treatment || "No treatment provided"}</div>
                  </div>

                  <div className="note-section">
                    <label>Prescription:</label>
                    <div className="note-text">{docData.prescription || "No prescription provided"}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Billing */}
            <div className="billing-section">
              <div className="billing-card">
                {/* Removed small logo block here */}

                {bill ? (
                  <>
                    <div className="billing-services">
                      <div className="service-row service-header">
                        <span>Services</span>
                        <span className="align-right">Amount</span>
                      </div>

                      {services.length === 0 && (
                        <div className="no-billing"><p>No billed services available</p></div>
                      )}

                      {services.map((s) => (
                        <div key={s.id} className="service-row service-item">
                          <span>{s.serviceName}{s.quantity ? ` x${s.quantity}` : ""}</span>
                          <span className="align-right">{formatCurrency(s.subtotal)}</span>
                        </div>
                      ))}
                    </div>

                    <div className="billing-summary">
                      <div className="summary-row">
                        <span>Total Amount:</span>
                        <span className="amount-value">{formatCurrency(bill.totalAmount)}</span>
                      </div>
                      <div className="summary-row">
                        <span>Amount Paid:</span>
                        <span className="amount-value">{formatCurrency(bill.amountPaid)}</span>
                      </div>
                      <div className="summary-row">
                        <span>Balance:</span>
                        <span className="amount-value">{formatCurrency(bill.balance)}</span>
                      </div>
                      <div className="summary-row">
                        <span>Status:</span>
                        <span className="status-value">{bill.paymentStatus ?? docData.status ?? "unpaid"}</span>
                      </div>
                      <div className="summary-row">
                        <span>Payment Method:</span>
                        <span className="payment-value">Cash</span>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="no-billing">
                    <p>No billing information available</p>
                  </div>
                )}

                {/* Removed duplicate PRINT from here */}
              </div>
            </div>
          </div>

          {/* Footer Info */}
          <div className="doc-footer-info">
            <div className="footer-item">
              <label>Created By:</label>
              <span>{docData.createdByName ?? "N/A"} ({docData.createdByRole ?? "N/A"})</span>
            </div>
            {docData.admittedByName && (
              <div className="footer-item">
                <label>Admitted By:</label>
                <span>{docData.admittedByName}</span>
              </div>
            )}
            {docData.lastUpdatedByName && (
              <div className="footer-item">
                <label>Last Updated By:</label>
                <span>{docData.lastUpdatedByName} ({docData.lastUpdatedByRole ?? ""})</span>
              </div>
            )}
            <div className="footer-item">
              <label>Last Updated:</label>
              <span>{formatDate(docData.updatedAt)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewMedicalDocModal;
