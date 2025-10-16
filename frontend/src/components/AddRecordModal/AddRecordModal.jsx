import { useEffect, useState } from "react";
import api from "../../axios/api";
import "./AddRecordModal.css";

const AddRecordModal = ({ patientId, patientName, onClose, onSuccess }) => {
  // Medical Documentation State
  const [admittedById, setAdmittedById] = useState("");
  const [assessment, setAssessment] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [treatment, setTreatment] = useState("");
  const [prescription, setPrescription] = useState("");

  // Billing State
  const [selectedServices, setSelectedServices] = useState([]);
  const [initialPayment, setInitialPayment] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");

  // Data Lists
  const [doctors, setDoctors] = useState([]);
  const [allServices, setAllServices] = useState([]);

  // UI State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDoctors();
    fetchServices();
  }, []);

  const fetchDoctors = async () => {
    try {
      const res = await api.get("/doctors/get-doctors");
      if (res.data?.success) setDoctors(res.data.data || []);
    } catch (err) {
      console.error("Error fetching doctors:", err);
      setError("Failed to load doctors");
    }
  };

  const fetchServices = async () => {
    try {
      const res = await api.get("/service/get-all-medical-services");
      if (res.data?.success) setAllServices(res.data.data || []);
    } catch (err) {
      console.error("Error fetching services:", err);
      setError("Failed to load services");
    }
  };

  const handleAddService = (service) => {
    const existing = selectedServices.find((s) => s.serviceId === service.id);
    if (existing) {
      setSelectedServices(
        selectedServices.map((s) =>
          s.serviceId === service.id ? { ...s, quantity: s.quantity + 1 } : s
        )
      );
    } else {
      setSelectedServices([
        ...selectedServices,
        {
          serviceId: service.id,
          serviceName: service.name,
          price: service.price,
          quantity: 1,
        },
      ]);
    }
  };

  const handleRemoveService = (serviceId) => {
    setSelectedServices(selectedServices.filter((s) => s.serviceId !== serviceId));
  };

  const handleQuantityChange = (serviceId, newQuantity) => {
    const q = Number(newQuantity) || 0;
    if (q < 1) {
      handleRemoveService(serviceId);
      return;
    }
    setSelectedServices(
      selectedServices.map((s) => (s.serviceId === serviceId ? { ...s, quantity: q } : s))
    );
  };

  const calculateTotal = () => selectedServices.reduce((sum, s) => sum + s.price * s.quantity, 0);

  const totalAmount = calculateTotal();
  const paymentAmount = parseFloat(initialPayment) || 0;
  const adjustedPayment = Math.min(paymentAmount, totalAmount);
  const balance = totalAmount - adjustedPayment;

  const hasAtLeastOneMedicalField = assessment || diagnosis || treatment || prescription;

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!hasAtLeastOneMedicalField) {
        setError("Please fill at least one medical field (Assessment, Diagnosis, Treatment, or Prescription).");
        setLoading(false);
        return;
      }

      // 1) create medical documentation
      const docPayload = {
        patientId,
        admittedById: admittedById || null,
        assessment: assessment || null,
        diagnosis: diagnosis || null,
        treatment: treatment || null,
        prescription: prescription || null,
      };

      const docRes = await api.post("/document/create-medical-documentation", docPayload);
      if (!docRes.data?.success) throw new Error(docRes.data?.message || "Failed to create medical documentation");

      const medicalDocumentationId = docRes.data.data.id;

      // 2) create bill (if services selected)
      if (selectedServices.length > 0) {
        const billPayload = {
          medicalDocumentationId,
          services: selectedServices.map((s) => ({
            serviceId: s.serviceId,
            quantity: s.quantity,
          })),
        };

        if (adjustedPayment > 0) {
          billPayload.initialPaymentAmount = adjustedPayment;
          billPayload.paymentMethod = paymentMethod;
        }

        const billRes = await api.post("/bills/create-medical-bill", billPayload);
        if (!billRes.data?.success) throw new Error(billRes.data?.message || "Failed to create medical bill");
      }

      onSuccess?.();
    } catch (err) {
      console.error("Error submitting record:", err);
      setError(err?.response?.data?.message || err?.message || "Failed to create record");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="add-record-overlay" onClick={onClose}>
      <div className="add-record-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        {/* Header (no logo) */}
        <div className="add-record-header">
          <h2 className="add-record-title">PATIENT'S MEDICAL RECORD</h2>
          <button className="close-add-btn" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <div className="add-record-body">
          {/* Patient Info */}
          <div className="patient-info-add">
            <div className="info-item-add">
              <label>Patient's Name:</label>
              <span>{patientName}</span>
            </div>
            <div className="info-item-add">
              <label>Date:</label>
              <span>{new Date().toLocaleDateString()}</span>
            </div>
          </div>

          {error && <div className="error-banner">{error}</div>}

          {/* Medical Documentation Form */}
          <div className="form-section">
            <div className="form-group-full">
              <label>Assessment</label>
              <textarea
                value={assessment}
                onChange={(e) => setAssessment(e.target.value)}
                placeholder="Enter patient assessment..."
                rows={3}
              />
            </div>

            <div className="form-row-two">
              <div className="form-group">
                <label>Diagnosis</label>
                <textarea
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                  placeholder="Enter diagnosis..."
                  rows={4}
                />
              </div>
              <div className="form-group">
                <label>Treatment</label>
                <textarea
                  value={treatment}
                  onChange={(e) => setTreatment(e.target.value)}
                  placeholder="Enter treatment plan..."
                  rows={4}
                />
              </div>
            </div>

            <div className="form-group-full">
              <label>Prescription</label>
              <textarea
                value={prescription}
                onChange={(e) => setPrescription(e.target.value)}
                placeholder="Enter prescription details..."
                rows={3}
              />
            </div>
          </div>

          {/* Billing Section — FLAT LIST (no categories or "Procedure" header) */}
          {allServices.length > 0 && (
            <div className="billing-section-add">
              <div className="billing-header-add">
                <h3>SERVICES</h3>
              </div>

              <div className="services-list">
                {allServices.map((service) => (
                  <div key={service.id} className="service-item-row">
                    <div className="service-name-col">{service.name}</div>
                    <div className="service-price-col">₱ {Number(service.price).toFixed(2)}</div>
                    <div className="service-action-col">
                      <button className="add-service-btn" onClick={() => handleAddService(service)}>
                        Add
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Selected Services */}
              {selectedServices.length > 0 && (
                <div className="selected-services">
                  <h4>Selected Services:</h4>
                  {selectedServices.map((service) => (
                    <div key={service.serviceId} className="selected-item">
                      <div className="selected-name">{service.serviceName}</div>

                      <div className="quantity-controls">
                        <button onClick={() => handleQuantityChange(service.serviceId, service.quantity - 1)}>-</button>
                        <input
                          type="number"
                          value={service.quantity}
                          onChange={(e) => handleQuantityChange(service.serviceId, parseInt(e.target.value) || 0)}
                          min="1"
                        />
                        <button onClick={() => handleQuantityChange(service.serviceId, service.quantity + 1)}>+</button>
                      </div>

                      <div className="selected-amount">₱ {(service.price * service.quantity).toFixed(2)}</div>
                      <button className="remove-btn" onClick={() => handleRemoveService(service.serviceId)}>✕</button>
                    </div>
                  ))}
                </div>
              )}

              {/* Payment Section */}
              {selectedServices.length > 0 && (
                <div className="payment-section">
                  <div className="total-amount">
                    <label>Total Amount:</label>
                    <span className="amount-display">₱ {totalAmount.toFixed(2)}</span>
                  </div>

                  <div className="payment-input-group">
                    <label>Initial Payment (Optional):</label>
                    <input
                      type="number"
                      value={initialPayment}
                      onChange={(e) => setInitialPayment(e.target.value)}
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                    />
                  </div>

                  {paymentAmount > 0 && (
                    <>
                      {paymentAmount > totalAmount && (
                        <div className="warning-text">
                          Payment exceeds total. Adjusted to ₱ {adjustedPayment.toFixed(2)}
                        </div>
                      )}
                      <div className="balance-display">
                        <label>Balance:</label>
                        <span>₱ {balance.toFixed(2)}</span>
                      </div>
                      <div className="payment-method-group">
                        <label>Payment Method:</label>
                        <div className="radio-group">
                          <label>
                            <input type="radio" value="cash" checked={paymentMethod === "cash"} onChange={(e) => setPaymentMethod(e.target.value)} />
                            Cash
                          </label>
                          <label>
                            <input type="radio" value="card" checked={paymentMethod === "card"} onChange={(e) => setPaymentMethod(e.target.value)} />
                            Card
                          </label>
                          <label>
                            <input type="radio" value="insurance" checked={paymentMethod === "insurance"} onChange={(e) => setPaymentMethod(e.target.value)} />
                            Insurance
                          </label>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Admitted By - ensure text is visible */}
          <div className="admitted-by-section">
            <label>ADMITTED BY:</label>
            <select value={admittedById} onChange={(e) => setAdmittedById(e.target.value)}>
              <option value="">Select Doctor (Optional)</option>
              {doctors.map((doctor) => (
                <option key={doctor.id} value={doctor.id}>
                  Dr. {doctor.firstName} {doctor.middleInitial ? doctor.middleInitial + "." : ""} {doctor.lastName}
                </option>
              ))}
            </select>
          </div>

          {/* Action Buttons */}
          <div className="action-buttons-add">
            <button className="cancel-btn-add" onClick={onClose} disabled={loading}>
              Close Form
            </button>
            <button className="submit-btn-add" onClick={handleSubmit} disabled={loading}>
              {loading ? "Submitting..." : "Add Record"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddRecordModal;
