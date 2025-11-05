import { useEffect, useState } from "react";
import api from "../../axios/api";
import EditDocModal from "../edit-doc/EditDocModal";
import "./ViewDocModal.css";
import jsPDF from "jspdf";

const ViewMedicalDocModal = ({ docId, onClose }) => {
  const [docData, setDocData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);

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
          if (!cancelled)
            setError(res.data?.message || "Failed to fetch medical documentation");
        }
      } catch (err) {
        console.error("Error fetching medical documentation:", err);
        if (!cancelled)
          setError("Unable to load medical documentation. Please try again.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchMedicalDoc();
    return () => {
      cancelled = true;
    };
  }, [docId]);

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
    return (
      "₱ " +
      n.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    );
  };

  const handlePrint = () => {
  if (!docData) return;

  const bill = docData.medicalBill;
  const services = bill?.billedServices || [];

  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "letter", // 215.9 × 279.4 mm
  });

  // Quarter page (1/4)
  const maxWidth = 105;
  const maxHeight = 70;
  const marginLeft = 10;
  let y = 12;

  // === HEADER ===
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(10);
  pdf.text("Leonardo Medical Services", marginLeft + maxWidth / 2, y, { align: "center" });

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(7);
  y += 4;
  pdf.text("B1 L17, F. Novaliches, Bagumbong, Caloocan City", marginLeft + maxWidth / 2, y, {
    align: "center",
  });

  // Divider line
  y += 3;
  pdf.setLineWidth(0.3);
  pdf.line(marginLeft, y, marginLeft + maxWidth - 10, y);
  y += 5;

  // === PATIENT INFO ===
  const patientFullName = `${docData.patient?.firstName || ""} ${
    docData.patient?.middleName ? docData.patient.middleName + " " : ""
  }${docData.patient?.lastName || ""}`.trim();

  pdf.setFontSize(8);
  pdf.setFont("helvetica", "normal");
  pdf.text("Patient's Name:", marginLeft, y);
  pdf.setFont("helvetica", "bold");
  pdf.text(patientFullName || "N/A", marginLeft + 28, y);

  pdf.setFont("helvetica", "normal");
  pdf.text("Date:", marginLeft + maxWidth - 55, y);
  pdf.setFont("helvetica", "bold");
  pdf.text(
    new Date(docData.createdAt).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }),
    marginLeft + maxWidth - 30,
    y
  );

  y += 5;
  pdf.setLineWidth(0.3);
  pdf.line(marginLeft, y, marginLeft + maxWidth - 10, y);
  y += 8;

  // === BILLING SECTION ===
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(11);
  pdf.text("Billing Summary", marginLeft + maxWidth / 2, y, { align: "center" });
  y += 5;

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8);

  if (bill && services.length > 0) {
    services.forEach((s) => {
      pdf.text(
        `${s.serviceName}${s.quantity > 1 ? ` (x${s.quantity})` : ""}`,
        marginLeft + 2,
        y
      );
      pdf.text(
        `₱ ${Number(s.subtotal).toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
        marginLeft + maxWidth - 10,
        y,
        { align: "right" }
      );
      y += 5;
    });

    pdf.setLineWidth(0.3);
    pdf.line(marginLeft, y, marginLeft + maxWidth - 10, y);
    y += 6;

    // === RIGHT-ALIGNED SUMMARY VALUES ===
    const rightAlign = marginLeft + maxWidth - 10;

    pdf.text("Subtotal:", marginLeft + 2, y);
    pdf.text(
      `₱ ${bill.subtotal?.toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
      rightAlign,
      y,
      { align: "right" }
    );
    y += 5;

    if (bill.discountAmount > 0) {
      pdf.text("Discount:", marginLeft + 2, y);
      pdf.text(
        `-₱ ${bill.discountAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
        rightAlign,
        y,
        { align: "right" }
      );
      y += 5;
    }

    pdf.setFont("helvetica", "bold");
    pdf.text("Total Amount:", marginLeft + 2, y);
    pdf.text(
      `₱ ${bill.totalAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
      rightAlign,
      y,
      { align: "right" }
    );
    pdf.setFont("helvetica", "normal");
    y += 6;

    pdf.text("Amount Paid:", marginLeft + 2, y);
    pdf.text(
      `₱ ${bill.amountPaid.toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
      rightAlign,
      y,
      { align: "right" }
    );
    y += 5;

    pdf.text("Balance:", marginLeft + 2, y);
    pdf.text(
      `₱ ${bill.balance.toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
      rightAlign,
      y,
      { align: "right" }
    );
    y += 5;

    pdf.text("Payment Method:", marginLeft + 2, y);
    pdf.text(bill.paymentOption || "Cash", rightAlign, y, { align: "right" });
    y += 5;

    pdf.text("Status:", marginLeft + 2, y);
    pdf.text((bill.paymentStatus || "Unpaid").toUpperCase(), rightAlign, y, { align: "right" });
  } else {
    pdf.text("No billing information available.", marginLeft + 5, y);
  }

  // === SIGNATURE ===
  y += 16;
  const sigLineWidth = 60;
  const sigX = marginLeft;
  pdf.setLineWidth(0.3);
  pdf.line(sigX, y, sigX + sigLineWidth, y);
  y += 5;
  pdf.setFont("helvetica", "bold");
  pdf.text("Authorized Signature", sigX + sigLineWidth / 2, y, { align: "center" });

  pdf.save(`${patientFullName || "Medical_Receipt"}.pdf`);
};



  const handleEditSuccess = async () => {
    try {
      const res = await api.get(`/document/medical-documentation/${docId}`);
      if (res.data?.success) {
        setDocData(res.data.data);
      }
    } catch (err) {
      console.error("Error refreshing document after edit:", err);
    } finally {
      setShowEditModal(false);
    }
  };

  if (loading) {
    return (
      <div className="vmdm-modal-overlay">
        <div className="vmdm-modal-content-medical">
          <p className="vmdm-loading-text">Loading medical documentation...</p>
        </div>
      </div>
    );
  }

  if (error || !docData) {
    return (
      <div className="vmdm-modal-overlay" onClick={onClose}>
        <div
          className="vmdm-modal-content-medical"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            className="vmdm-close-modal-btn"
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>
          <div className="vmdm-error-state">
            {error || "Medical documentation not found"}
          </div>
        </div>
      </div>
    );
  }

  const patient = docData.patient || {
    firstName: "",
    middleName: null,
    lastName: "",
  };
  const bill = docData.medicalBill || null;
  const services = bill?.billedServices || [];

  return (
    <>
      <div className="vmdm-modal-overlay" onClick={onClose}>
        <div
          className="vmdm-modal-content-medical"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="vmdm-medical-doc-header">
            <div>
              <h1>LEONARDO MEDICAL SERVICES</h1>
              <p>B1 L17, F. Novaliches, Bagumbong, Caloocan City</p>
            </div>

            <button
              className="vmdm-close-modal-btn"
              onClick={onClose}
              aria-label="Close"
            >
              ✕
            </button>
          </div>

          <div className="vmdm-medical-doc-body">
            {/* Patient Info */}
            <div className="vmdm-patient-info-header">
              <p className="vmdm-patient-full-name">
                <span>Name:
                {`${patient.firstName || ""} ${
                  patient.middleName ? patient.middleName + " " : ""
                }${patient.lastName || ""}`.trim()}
                </span>
              </p>

              <div className="vmdm-patient-mini-info">
                <span>Date: {formatDate(docData.createdAt)}</span>
              </div>
            </div>

            {/* Two Column Layout */}
            <div className="vmdm-doc-two-column">
              {/* Left Column - Medical Notes */}
              <div className="vmdm-medical-notes-section">
                <div className="vmdm-notes-card">
                  <div className="vmdm-notes-content">
                    {/* Assessment Section */}
                    <div className="vmdm-note-section">
                      <label>Assessment:</label>
                      <div className="vmdm-note-text">
                        {docData.assessment || "No assessment provided"}
                      </div>
                    </div>

                    <div className="vmdm-note-section">
                      <label>Diagnosis:</label>
                      <div className="vmdm-note-text">
                        {docData.diagnosis || "No diagnosis provided"}
                      </div>
                    </div>

                    <div className="vmdm-note-section">
                      <label>Treatment:</label>
                      <div className="vmdm-note-text">
                        {docData.treatment || "No treatment provided"}
                      </div>
                    </div>

                    <div className="vmdm-note-section">
                      <label>Prescription:</label>
                      <div className="vmdm-note-text">
                        {docData.prescription || "No prescription provided"}
                      </div>
                    </div>
                  </div>

                  {/* Edit Button Below Assessment Container */}
                  <button
                    className="vmdm-edit-btn"
                    onClick={() => setShowEditModal(true)}
                  >
                    Edit Document
                  </button>
                </div>
              </div>

              {/* Right Column - Billing */}
              <div className="vmdm-billing-section">
                <div className="vmdm-billing-card">
                  {/* Print Button for Billing */}
                  <button className="vmdm-billing-print-btn" onClick={handlePrint}>
                    Print
                  </button>

                  {bill ? (
                    <>
                      <div className="vmdm-billing-services">
                        <div className="vmdm-service-row vmdm-service-header">
                          <span>Services</span>
                          <span className="vmdm-align-right">Amount</span>
                        </div>

                        {services.length === 0 && (
                          <div className="vmdm-no-billing">
                            <p>No billed services available</p>
                          </div>
                        )}

                        {services.map((s) => (
                          <div key={s.id} className="vmdm-service-row vmdm-service-item">
                            <span>
                              {s.serviceName}
                              {s.quantity ? ` x${s.quantity}` : ""}
                            </span>
                            <span className="vmdm-align-right">
                              {formatCurrency(s.subtotal)}
                            </span>
                          </div>
                        ))}
                      </div>

                      <div className="vmdm-billing-summary">
                        <div className="vmdm-summary-row">
                          <span>Total Amount:</span>
                          <span className="vmdm-amount-value">
                            {formatCurrency(bill.totalAmount)}
                          </span>
                        </div>
                        <div className="vmdm-summary-row">
                          <span>Amount Paid:</span>
                          <span className="vmdm-amount-value">
                            {formatCurrency(bill.amountPaid)}
                          </span>
                        </div>
                        <div className="vmdm-summary-row">
                          <span>Balance:</span>
                          <span className="vmdm-amount-value">
                            {formatCurrency(bill.balance)}
                          </span>
                        </div>
                        <div className="vmdm-summary-row">
                          <span>Status:</span>
                          <span className="vmdm-status-value">
                            {bill.paymentStatus ?? docData.status ?? "unpaid"}
                          </span>
                        </div>
                        <div className="vmdm-summary-row">
                          <span>Payment Method:</span>
                          <span className="vmdm-payment-value">Cash</span>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="vmdm-no-billing">
                      <p>No billing information available</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer Info */}
            <div className="vmdm-doc-footer-info">
              {docData.admittedByName && (
                <div className="vmdm-footer-item">
                  <label>Admitted By:</label>
                  <span>{docData.admittedByName}</span>
                </div>
              )}
              <div className="vmdm-footer-item">
                <label>Created By:</label>
                <span>
                  {docData.createdByName ?? "N/A"}
                  {docData.createdByRole ? ` (${docData.createdByRole})` : ""}
                </span>
              </div>
              <div className="vmdm-footer-item">
                <label>Last Updated:</label>
                <span>{formatDate(docData.updatedAt)}</span>
              </div>
              {docData.lastUpdatedByName && (
                <div className="vmdm-footer-item">
                  <label>Last Updated By:</label>
                  <span>
                    {docData.lastUpdatedByName}
                    {docData.lastUpdatedByRole ? ` (${docData.lastUpdatedByRole})` : ""}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <EditDocModal
          docData={docData}
          onClose={() => setShowEditModal(false)}
          onSuccess={handleEditSuccess}
        />
      )}
    </>
  );
};

export default ViewMedicalDocModal;