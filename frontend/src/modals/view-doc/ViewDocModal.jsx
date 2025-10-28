import { useEffect, useState } from "react";
import api from "../../axios/api";
import "./ViewDocModal.css";
import { jsPDF } from "jspdf";

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
    return "₱" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

const handleDownloadPDF = () => {
  if (!docData) return;

  const pdf = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: [279.4, 215.9], // Letter size in mm
  });

  const maxWidth = 135; // Half of page width
  const marginLeft = 15;
  let y = 20;

  // --- HEADER ---
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(18);
  pdf.text("Leonardo Medical Services", marginLeft + maxWidth / 2, y, { align: "center" });

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  y += 6;
  pdf.text("B1 L17, F. Novaliches, Bagumbong, Caloocan City", marginLeft + maxWidth / 2, y, {
    align: "center",
  });

  // Divider line
  y += 4;
  pdf.setLineWidth(0.4);
  pdf.line(marginLeft, y, marginLeft + maxWidth - 5, y);

  // --- PATIENT INFO ---
  y += 8;
  pdf.setFontSize(8);
  pdf.setFont("helvetica", "normal");
  pdf.text("Name:", marginLeft, y);

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(9);
  pdf.text(`${patientFullName}`, marginLeft + 20, y); // closer to label

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8);
  pdf.text("Date:", marginLeft + maxWidth - 70, y);

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(9);
  pdf.text(`${formatDate(docData.createdAt)}`, marginLeft + maxWidth - 50, y); // closer spacing

  // Divider line
  y += 6;
  pdf.setLineWidth(0.4);
  pdf.line(marginLeft, y, marginLeft + maxWidth - 5, y);

  // --- BILLING TITLE ---
  y += 8;
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(14);
  pdf.text("Billing Summary", marginLeft + maxWidth / 2, y, { align: "center" });
  y += 6;

  // --- BILLING DETAILS ---
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(11);

  if (bill && services.length > 0) {
    services.forEach((service) => {
      pdf.text(
        `${service.serviceName} ${service.quantity > 1 ? `(x${service.quantity})` : ""}`,
        marginLeft + 5,
        y
      );
      pdf.text(`${formatCurrency(service.subtotal)}`, marginLeft + maxWidth - 15, y, {
        align: "right",
      });
      y += 6;
    });

    pdf.setLineWidth(0.4);
    pdf.line(marginLeft, y, marginLeft + maxWidth - 10, y);
    y += 6;

    pdf.text(`Subtotal: ${formatCurrency(subtotal)}`, marginLeft + 5, y);
    y += 6;

    if (discountAmount > 0) {
      pdf.text(`Discount (${discountPercent}%): -${formatCurrency(discountAmount)}`, marginLeft + 5, y);
      y += 6;
    }

    pdf.text(`TOTAL AMOUNT: ${formatCurrency(totalAmount)}`, marginLeft + 5, y);
    y += 6;

    if (paymentStatus === "partially_paid" && amountPaid > 0) {
      pdf.text(`Amount Paid: ${formatCurrency(amountPaid)}`, marginLeft + 5, y);
      y += 6;
      pdf.text(`Balance Due: ${formatCurrency(balance)}`, marginLeft + 5, y);
      y += 6;
    }

    pdf.text(`Payment Method: ${paymentOption === "gcash" ? "GCash" : "Cash"}`, marginLeft + 5, y);
    y += 6;

    pdf.text(`Status: ${paymentStatus.toUpperCase()}`, marginLeft + 5, y);
  } else {
    pdf.text("No billing information available.", marginLeft + 5, y);
  }

  // --- FOOTER / SIGNATURE ---
  y += 10;
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(10);
  pdf.text(`Admitted by: ${docData.admittedByName || "N/A"}`, marginLeft, y);

  y += 25;
  const sigLineWidth = 60;
  const sigX = marginLeft;
  pdf.setLineWidth(0.4);
  pdf.line(sigX, y, sigX + sigLineWidth, y);

  y += 6;
  pdf.setFont("helvetica", "bold");
  pdf.text("Authorized Signature", sigX + sigLineWidth / 2, y, { align: "center" });
  pdf.setFont("helvetica", "normal");

  pdf.save(`${patientFullName || "Medical_Document"}.pdf`);
};


  if (loading) {
    return (
      <div className="vmd-modal-overlay-wrapper">
        <div className="vmd-modal-content-box">
          <p className="vmd-loading-text-display">Loading medical documentation...</p>
        </div>
      </div>
    );
  }

  if (error || !docData) {
    return (
      <div className="vmd-modal-overlay-wrapper" onClick={onClose}>
        <div className="vmd-modal-content-box" onClick={(e) => e.stopPropagation()}>
          <button className="vmd-close-button-top" onClick={onClose} aria-label="Close">✕</button>
          <div className="vmd-error-state-message">{error || "Medical documentation not found"}</div>
        </div>
      </div>
    );
  }

  const patient = docData.patient || { firstName: "", middleName: null, lastName: "" };
  const bill = docData.medicalBill || null;
  const services = bill?.billedServices || [];

  const patientFullName = `${patient.firstName || ""} ${patient.middleName ? patient.middleName + " " : ""}${patient.lastName || ""}`.trim();

  // Calculate billing amounts from bill data
  const totalAmount = Number(bill?.totalAmount || 0);
  const amountPaid = Number(bill?.amountPaid || 0);
  const balance = Number(bill?.balance || 0);
  const discountAmount = Number(bill?.discountAmount || 0);
  const discountPercent = Number(bill?.discountPercent || 0);
  const paymentStatus = bill?.paymentStatus || "unpaid";
  const paymentOption = bill?.paymentOption || "cash";

  // Calculate services total and subtotal
  const servicesTotal = services.reduce((sum, s) => sum + Number(s.subtotal || 0), 0);
  const subtotal = totalAmount + discountAmount; // Subtotal before discount

  return (
    <div className="vmd-modal-overlay-wrapper" onClick={onClose}>
      <div className="vmd-modal-content-box" onClick={(e) => e.stopPropagation()}>
        {/* Top Header with Logo and Close Button */}
        <div className="vmd-top-header-container">
          <div className="vmd-logo-center-box">
            
            <div className="vmd-logo-text-block">
              <h1 className="vmd-clinic-name-title">Leonardo Medical Services</h1>
              <center><p className="vmd-clinic-address-text">B1 L17, F. Novaliches, Bagumbong, Caloocan City</p></center>
            </div>
          </div>
          <button className="vmd-close-button-top" onClick={onClose} aria-label="Close">✕</button>
        </div>

        {/* Patient Name and Date Container */}
        <div className="vmd-patient-date-container">
          <div className="vmd-patient-name-left">
            <label className="vmd-label-text-bold">Patient's Name:</label>
            <span className="vmd-patient-name-value">{patientFullName}</span>
          </div>
          <div className="vmd-date-right">
            <label className="vmd-label-text-bold">Date:</label>
            <span className="vmd-date-value">{formatDate(docData.createdAt)}</span>
          </div>
        </div>

        {/* Main Content: Assessment Left, Billing Right */}
        <div className="vmd-main-content-grid">
          {/* Left Side - Assessment Container */}
          <div className="vmd-assessment-container-left">
            <div className="vmd-medical-field-box">
              <label className="vmd-field-label-text">Assessment</label>
              <div className="vmd-field-content-readonly">
                {docData.assessment || "No assessment provided"}
              </div>
            </div>

            <div className="vmd-medical-field-box">
              <label className="vmd-field-label-text">Diagnosis</label>
              <div className="vmd-field-content-readonly">
                {docData.diagnosis || "No diagnosis provided"}
              </div>
            </div>

            <div className="vmd-medical-field-box">
              <label className="vmd-field-label-text">Treatment</label>
              <div className="vmd-field-content-readonly">
                {docData.treatment || "No treatment provided"}
              </div>
            </div>

            <div className="vmd-medical-field-box">
              <label className="vmd-field-label-text">Prescription</label>
              <div className="vmd-field-content-readonly">
                {docData.prescription || "No prescription provided"}
              </div>
            </div>
          </div>

          {/* Right Side - Billing Receipt Container */}
          <div className="vmd-billing-container-right">
            <div className="vmd-billing-header-logo">
            <h2 className="vmd-billing-clinic-title">Leonardo Medical Services</h2>
            <p className="vmd-billing-subtitle">B1 L17-E Neovista, Bagumbong, Caloocan City</p>
            </div>

            {bill ? (
              <div className="vmd-receipt-content">
                {/* Services List */}
                {services.map((service) => (
                  <div key={service.id} className="vmd-receipt-row-item">
                    <span className="vmd-receipt-label">
                      {service.serviceName} {service.quantity > 1 ? `(x${service.quantity})` : ""}:
                    </span>
                    <span className="vmd-receipt-value">{formatCurrency(service.subtotal)}</span>
                  </div>
                ))}

                {services.length > 0 && <div className="vmd-receipt-separator-line"></div>}

                {/* Subtotal */}
                <div className="vmd-receipt-row-item">
                  <span className="vmd-receipt-label">Subtotal:</span>
                  <span className="vmd-receipt-value">{formatCurrency(subtotal)}</span>
                </div>

                {/* Discount */}
                {discountAmount > 0 && (
                  <div className="vmd-receipt-row-item vmd-discount-row">
                    <span className="vmd-receipt-label">Discount ({discountPercent}%):</span>
                    <span className="vmd-receipt-value">- {formatCurrency(discountAmount)}</span>
                  </div>
                )}

                <div className="vmd-receipt-separator-line"></div>

                {/* Total Amount */}
                <div className="vmd-receipt-row-item vmd-total-row">
                  <span className="vmd-receipt-label">TOTAL AMOUNT:</span>
                  <span className="vmd-receipt-value vmd-total-value">{formatCurrency(totalAmount)}</span>
                </div>

                {/* Payment Status Details */}
                {paymentStatus === "partially_paid" && amountPaid > 0 && (
                  <>
                    <div className="vmd-receipt-row-item vmd-paid-amount-row">
                      <span className="vmd-receipt-label">Amount Paid:</span>
                      <span className="vmd-receipt-value">{formatCurrency(amountPaid)}</span>
                    </div>
                    <div className="vmd-receipt-row-item vmd-balance-row">
                      <span className="vmd-receipt-label">Balance Due:</span>
                      <span className="vmd-receipt-value">{formatCurrency(balance)}</span>
                    </div>
                  </>
                )}

                {paymentStatus === "paid" && (
                  <div className="vmd-receipt-row-item vmd-paid-status-row">
                    <span className="vmd-receipt-label">Status:</span>
                    <span className="vmd-receipt-value vmd-status-paid">✓ FULLY PAID</span>
                  </div>
                )}

                {paymentStatus === "unpaid" && (
                  <div className="vmd-receipt-row-item vmd-unpaid-status-row">
                    <span className="vmd-receipt-label">Status:</span>
                    <span className="vmd-receipt-value vmd-status-unpaid">UNPAID</span>
                  </div>
                )}

                <div className="vmd-receipt-separator-line"></div>

                {/* Payment Method */}
                <div className="vmd-receipt-row-item">
                  <span className="vmd-receipt-label">Payment Method:</span>
                  <span className="vmd-receipt-value">
                    {paymentOption === "gcash" ? "GCash" : "Cash"}
                  </span>
                </div>

               
              </div>
            ) : (
              <div className="vmd-no-billing-message">
                <p>No billing information available</p>
              </div>
            )}
          </div>

             {/* Print Button */}
          <div className="vmd-print-button-container">
          <button className="vmd-print-button-receipt" onClick={handleDownloadPDF}>
           DOWNLOAD PDF
          </button>
          </div>

        </div>

        

        {/* Bottom Footer: Admitted By, Created By, Last Updated */}
        <div className="vmd-footer-info-container">
          <div className="vmd-footer-info-item">
            <label className="vmd-footer-label-text">Admitted by:</label>
            <span className="vmd-footer-value-text">
              {docData.admittedByName || "N/A"}
            </span>
          </div>
          <div className="vmd-footer-info-item">
            <label className="vmd-footer-label-text">Created by:</label>
            <span className="vmd-footer-value-text">
              {docData.createdByName || "N/A"} ({docData.createdByRole || "N/A"})
            </span>
          </div>
          <div className="vmd-footer-info-item">
            <label className="vmd-footer-label-text">Last Updated:</label>
            <span className="vmd-footer-value-text">
              {formatDate(docData.updatedAt)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewMedicalDocModal;