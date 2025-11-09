import { useEffect, useState } from "react";
import api from "../../axios/api";
import Toast from "../../components/Toast/Toast";
import ConfirmModal from "../../components/ConfirmModal/ConfirmModal";
import "./AddRecordModal.css";

/**
 * CALCULATION LOGIC (matches backend):
 * ─────────────────────────────────────────
 * Services Subtotal = Σ(service.price × quantity) [0 if no services]
 * 
 * Discount (applied to services ONLY):
 *   - Senior/PWD (20%): servicesSubtotal × 0.20
 *   - Custom Rate: servicesSubtotal × (customDiscount / 100)
 *   - Only one applies; Senior/PWD takes precedence
 *   - Ignored if no services (consultation-only)
 * 
 * Services Total = Services Subtotal - Discount Amount
 * Consultation Fee = 250 or 350 (NOT discounted)
 * ─────────────────────────────────────────
 * TOTAL BILL = Services Total + Consultation Fee
 * 
 * SUPPORTS: Consultation-only bills (empty services array)
 */

const AddRecordModal = ({ patientId, patientName, onClose, onSuccess }) => {
  
  // Medical Documentation State
  const [admittedById, setAdmittedById] = useState("");
  const [assessment, setAssessment] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [treatment, setTreatment] = useState("");
  const [prescription, setPrescription] = useState("");

  // Billing State
  const [selectedServices, setSelectedServices] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [isSeniorPwdDiscount, setIsSeniorPwdDiscount] = useState(false);
  const [customDiscountRate, setCustomDiscountRate] = useState("");
  const [initialPaymentAmount, setInitialPaymentAmount] = useState("");

  // Category & Service Selection
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedServiceId, setSelectedServiceId] = useState("");

  // Data Lists
  const [doctors, setDoctors] = useState([]);
  const [allServices, setAllServices] = useState([]);

  // UI State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Modal and Toast states
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    type: 'warning',
    title: '',
    message: '',
    onConfirm: null,
    isLoading: false,
    actionType: null
  });
  const [toastConfig, setToastConfig] = useState({
    isVisible: false,
    message: '',
    type: 'success',
    duration: 4000
  });

  // Consultation Type
  const [consultationType, setConsultationType] = useState("first");
  const consultationFee = consultationType === "first" ? 250 : 350;

  // Service categories
  const CATEGORIES = {
    hematology: "Hematology",
    bacteriology: "Bacteriology",
    clinical_microscopy: "Clinical Microscopy",
    twenty_four_hour_urine_test: "Twenty Four Hour Urine Test",
    serology_immunology: "Serology Immunology",
    clinical_chemistry: "Clinical Chemistry",
    electrolytes: "Electrolytes",
    vaccine: "Vaccine",
    histopathology: "Histopathology",
    to_be_read_by_pathologist: "To Be Read By Pathologist",
    tumor_markers: "Tumor Markers",
    thyroid_function_test: "Thyroid Function Test",
    hormones: "Hormones",
    hepatitis: "Hepatitis",
    enzymes: "Enzymes",
    others: "Others",
  };

  const showToast = (message, type = 'success', duration = 4000) => {
    setToastConfig({ isVisible: true, message, type, duration });
  };

  const closeToast = () => {
    setToastConfig(prev => ({ ...prev, isVisible: false }));
  };

  const showModal = (title, message, type = 'warning', onConfirm, actionType = null) => {
    setModalConfig({ isOpen: true, type, title, message, onConfirm, isLoading: false, actionType });
  };

  const closeModal = () => {
    setModalConfig(prev => ({ ...prev, isOpen: false }));
  };

  const setModalLoading = (isLoading) => {
    setModalConfig(prev => ({ ...prev, isLoading }));
  };

  useEffect(() => {
    fetchDoctors();
    fetchServices();
  }, [patientId]);

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

  const getServicesByCategory = (category) => {
    return allServices.filter(
      (service) => service.category.toLowerCase() === category.toLowerCase()
    );
  };

  const handleCategoryChange = (e) => {
    setSelectedCategory(e.target.value);
    setSelectedServiceId("");
  };

  const handleAddServiceClick = () => {
    if (!selectedServiceId) return;

    const service = allServices.find(
      (s) => String(s.id) === String(selectedServiceId)
    );

    if (service) {
      handleAddService(service);
      setSelectedServiceId("");
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

  // CALCULATION FUNCTIONS
  const calculateServicesSubtotal = () =>
    selectedServices.reduce((sum, s) => sum + s.price * s.quantity, 0);

  const calculateDiscountAmount = (subtotal) => {
    if (subtotal === 0) return 0;
    
    if (isSeniorPwdDiscount) {
      return subtotal * 0.2;
    } else if (customDiscountRate && parseFloat(customDiscountRate) > 0) {
      return subtotal * (parseFloat(customDiscountRate) / 100);
    }
    return 0;
  };

  const calculateServicesTotal = () => {
    const subtotal = calculateServicesSubtotal();
    const discount = calculateDiscountAmount(subtotal);
    return subtotal - discount;
  };

  const calculateTotalBill = () => {
    return calculateServicesTotal() + consultationFee;
  };

  const servicesSubtotal = calculateServicesSubtotal();
  const effectiveDiscountRate = isSeniorPwdDiscount ? 20 : (customDiscountRate ? parseFloat(customDiscountRate) : 0);
  const discountAmount = calculateDiscountAmount(servicesSubtotal);
  const servicesTotal = calculateServicesTotal();
  const totalAmount = calculateTotalBill();
  const initialPayment = parseFloat(initialPaymentAmount) || 0;
  const balance = Math.max(totalAmount - initialPayment, 0);

  const hasAtLeastOneMedicalField = assessment || diagnosis || treatment || prescription;
  const isConsultationOnly = selectedServices.length === 0;

  const validateForm = () => {
    const errors = [];

    if (!hasAtLeastOneMedicalField) {
      errors.push("Please fill at least one medical field (Assessment, Diagnosis, Treatment, or Prescription).");
    }

    if (!admittedById) {
      errors.push("Please select a doctor.");
    }

    if (customDiscountRate && parseFloat(customDiscountRate) > 100) {
      errors.push("Custom discount cannot exceed 100%.");
    }

    if (initialPayment > totalAmount) {
      errors.push("Initial payment cannot exceed the total bill amount.");
    }

    return errors;
  };

  const handleClearForm = () => {
    setAssessment("");
    setDiagnosis("");
    setTreatment("");
    setPrescription("");
    setSelectedServices([]);
    setAdmittedById("");
    setPaymentMethod("cash");
    setIsSeniorPwdDiscount(false);
    setCustomDiscountRate("");
    setInitialPaymentAmount("");
    setSelectedCategory("");
    setSelectedServiceId("");
    setError(null);
    closeModal();
  };

  const handleClearClick = () => {
    showModal(
      "Clear Form",
      "Are you sure you want to clear all form data? This action cannot be undone.",
      'warning',
      handleClearForm,
      'clearForm'
    );
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setModalLoading(true);
      setError(null);

      const validationErrors = validateForm();
      if (validationErrors.length > 0) {
        setError(validationErrors[0]);
        setLoading(false);
        setModalLoading(false);
        return;
      }

      const docPayload = {
        patientId,
        admittedById: admittedById,
        assessment: assessment || null,
        diagnosis: diagnosis || null,
        treatment: treatment || null,
        prescription: prescription || null,
      };

      const docRes = await api.post("/document/create-medical-documentation", docPayload);
      if (!docRes.data?.success) throw new Error(docRes.data?.message || "Failed to create medical documentation");

      const medicalDocumentationId = docRes.data.data.id;

      const billPayload = {
        medicalDocumentationId,
        services: selectedServices.map((s) => ({
          serviceId: s.serviceId,
          quantity: s.quantity,
        })),
        consultationFee: consultationType === "first" ? null : 350,
        isSeniorPwdDiscountApplied: isSeniorPwdDiscount,
        discountRate: effectiveDiscountRate,
        ...(initialPaymentAmount && {
          initialPaymentAmount: initialPayment,
          paymentMethod,
        }),
      };

      const billRes = await api.post("/bills/create-medical-bill", billPayload);
      if (!billRes.data?.success) throw new Error(billRes.data?.message || "Failed to create medical bill");

      const successMessage = isConsultationOnly 
        ? 'Consultation-only record added successfully' 
        : 'Medical record added successfully';
      
      showToast(successMessage, 'success');
      closeModal();
      onSuccess?.();
    } catch (err) {
      console.error("Error submitting record:", err);
      const errorMessage = err?.response?.data?.message || err?.message || "Failed to create record";
      setError(errorMessage);
      showToast(errorMessage, 'error');
    } finally {
      setLoading(false);
      setModalLoading(false);
    }
  };

  const handleAddRecordClick = () => {
    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      setError(validationErrors[0]);
      showToast(validationErrors[0], 'error');
      return;
    }

    const confirmMessage = isConsultationOnly
      ? "This is a consultation-only bill with no services. Are you sure you want to add this record?"
      : "Are you sure you want to add this medical record?";

    showModal(
      "Add New Record",
      confirmMessage,
      'warning',
      handleSubmit,
      'addRecord'
    );
  };

  const handleInitialPaymentChange = (e) => {
    const value = e.target.value;
    
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      const numValue = parseFloat(value) || 0;
      
      if (numValue > totalAmount) {
        showToast("Initial payment cannot exceed total bill amount", 'error');
        return;
      }
      
      const cleanedValue = value === '' ? '' : numValue.toString();
      setInitialPaymentAmount(cleanedValue);
    }
  };

  const handleCustomDiscountChange = (e) => {
    const value = e.target.value;
    
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      const numValue = parseFloat(value) || 0;
      
      if (numValue > 100) {
        showToast("Discount cannot exceed 100%", 'error');
        return;
      }
      
      const cleanedValue = value === '' ? '' : numValue.toString();
      setCustomDiscountRate(cleanedValue);
    }
  };

  const filteredServices = selectedCategory ? getServicesByCategory(selectedCategory) : [];

  return (
    <>
      <div className="lms-modal-overlay-addrecord" onClick={onClose}>
        <div className="lms-modal-wrapper-addrecord" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
          <div className="lms-header-addrecord">
            <h2 className="lms-title-addrecord">PATIENT'S MEDICAL RECORD</h2>
            <button className="lms-close-btn-addrecord" onClick={onClose} aria-label="Close">✕</button>
          </div>

          <div className="lms-body-addrecord">
            <div className="lms-patient-info-addrecord">
              <div className="lms-patient-left-addrecord">
                <label>PATIENT'S NAME:</label>
                <span>{patientName}</span>
              </div>
              <div className="lms-patient-right-addrecord">
                <label>DATE:</label>
                <span>{new Date().toLocaleDateString()}</span>
              </div>
            </div>

            {error && <div className="lms-error-banner-addrecord">{error}</div>}

            <div className="lms-form-section-addrecord">
              <div className="lms-form-full-addrecord">
                <div className="lms-label-centered-addrecord">Assessment</div>
                <textarea
                  className="lms-textarea-medical-addrecord"
                  value={assessment}
                  onChange={(e) => setAssessment(e.target.value)}
                  placeholder="Enter patient assessment..."
                  rows={3}
                />
              </div>

              <div className="lms-form-row-addrecord">
                <div className="lms-form-group-addrecord">
                  <div className="lms-label-centered-addrecord">Diagnosis</div>
                  <textarea
                    className="lms-textarea-medical-addrecord"
                    value={diagnosis}
                    onChange={(e) => setDiagnosis(e.target.value)}
                    placeholder="Enter diagnosis..."
                    rows={4}
                  />
                </div>
                <div className="lms-form-group-addrecord">
                  <div className="lms-label-centered-addrecord">Treatment</div>
                  <textarea
                    className="lms-textarea-medical-addrecord"
                    value={treatment}
                    onChange={(e) => setTreatment(e.target.value)}
                    placeholder="Enter treatment plan..."
                    rows={4}
                  />
                </div>
              </div>

              <div className="lms-form-full-addrecord">
                <div className="lms-label-centered-addrecord">Prescription</div>
                <textarea
                  className="lms-textarea-medical-addrecord"
                  value={prescription}
                  onChange={(e) => setPrescription(e.target.value)}
                  placeholder="Enter prescription details..."
                  rows={3}
                />
              </div>
            </div>

            <div className="lms-services-section-addrecord">
              <div className="lms-services-header-addrecord">
                <h3>CATEGORY SERVICES (Optional)</h3>
              </div>

              <div className="lms-category-row-addrecord">
                <div className="lms-category-col-addrecord">
                  <label>Category</label>
                  <select className="lms-select-addrecord" value={selectedCategory} onChange={handleCategoryChange}>
                    <option value="">-- Select Category --</option>
                    {Object.entries(CATEGORIES).map(([key, display]) => (
                      <option key={key} value={key}>
                        {display}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="lms-service-col-addrecord">
                  <label>Service</label>
                  <div className="lms-service-input-group-addrecord">
                    <select 
                      className="lms-select-addrecord" 
                      value={selectedServiceId} 
                      onChange={(e) => setSelectedServiceId(e.target.value)}
                      disabled={!selectedCategory}
                    >
                      <option value="">-- Select Service --</option>
                      {filteredServices.map((service) => (
                        <option key={service.id} value={service.id}>
                          {service.name} - ₱{Number(service.price).toFixed(2)}
                        </option>
                      ))}
                    </select>
                    <button 
                      className="lms-add-service-btn-addrecord"
                      onClick={handleAddServiceClick}
                      disabled={!selectedServiceId}
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>

              {selectedServices.length > 0 && (
                <div className="lms-services-table-wrapper-addrecord">
                  <table className="lms-services-table-addrecord">
                    <thead>
                      <tr>
                        <th>Service Name</th>
                        <th>Price</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedServices.map((service) => (
                        <tr key={service.serviceId}>
                          <td className="lms-table-service-name-addrecord">{service.serviceName}</td>
                          <td className="lms-table-price-addrecord">₱{service.price.toFixed(2)}</td>
                          <td className="lms-table-action-addrecord">
                            <div className="lms-action-controls-addrecord">
                              <div className="lms-quantity-controls-table-addrecord">
                                <button onClick={() => handleQuantityChange(service.serviceId, service.quantity - 1)}>-</button>
                                <input
                                  type="number"
                                  className="Uno"
                                  value={service.quantity}
                                  onChange={(e) => handleQuantityChange(service.serviceId, parseInt(e.target.value) || 0)}
                                  min="1"
                                />
                                <button onClick={() => handleQuantityChange(service.serviceId, service.quantity + 1)}>+</button>
                              </div>
                              <button className="lms-remove-table-btn-addrecord" onClick={() => handleRemoveService(service.serviceId)}>✕</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="lms-billing-wrapper-addrecord">
                <div className="lms-billing-title-addrecord">BILLING</div>
                <div className="lms-billing-divider-addrecord"></div>

                <div className="lms-billing-grid-addrecord">
                  <div className="lms-billing-col-addrecord">
                    <label className="lms-billing-label-addrecord">Payment Method</label>
                    <div className="lms-radio-stack-addrecord">
                      <label className="lms-radio-item-addrecord">
                        <input
                          type="radio"
                          value="cash"
                          checked={paymentMethod === "cash"}
                          onChange={(e) => setPaymentMethod(e.target.value)}
                        />
                        <span>Cash</span>
                      </label>
                      <label className="lms-radio-item-addrecord">
                        <input
                          type="radio"
                          value="card"
                          checked={paymentMethod === "card"}
                          onChange={(e) => setPaymentMethod(e.target.value)}
                        />
                        <span>Card</span>
                      </label>
                      <label className="lms-radio-item-addrecord">
                        <input
                          type="radio"
                          value="gcash"
                          checked={paymentMethod === "gcash"}
                          onChange={(e) => setPaymentMethod(e.target.value)}
                        />
                        <span>GCash</span>
                      </label>
                    </div>
                  </div>

                  <div className="lms-billing-col-addrecord">
                    <label className="lms-billing-label-addrecord">Consultation Type</label>
                    <div className="lms-radio-stack-addrecord">
                      <label className="lms-radio-item-addrecord">
                        <input
                          type="radio"
                          value="first"
                          checked={consultationType === "first"}
                          onChange={(e) => setConsultationType(e.target.value)}
                        />
                        <span>1st Consultation (₱250)</span>
                      </label>
                      <label className="lms-radio-item-addrecord">
                        <input
                          type="radio"
                          value="follow_up"
                          checked={consultationType === "follow_up"}
                          onChange={(e) => setConsultationType(e.target.value)}
                        />
                        <span>Follow Up (₱350)</span>
                      </label>
                    </div>
                  </div>

                  <div className="lms-billing-col-addrecord">
                    <label className="lms-billing-label-addrecord">
                      Discount (Services Only)
                      {isConsultationOnly && <span style={{ color: '#999', fontSize: '11px', marginLeft: '5px' }}>(N/A)</span>}
                    </label>
                    <div className="lms-discount-stack-addrecord">
                      <label className="lms-checkbox-item-addrecord">
                        <input
                          type="checkbox"
                          checked={isSeniorPwdDiscount}
                          onChange={(e) => {
                            setIsSeniorPwdDiscount(e.target.checked);
                            if (e.target.checked) setCustomDiscountRate("");
                          }}
                          disabled={isConsultationOnly}
                        />
                        <span>Senior/PWD (20%)</span>
                      </label>

                      {!isSeniorPwdDiscount && (
                        <div>
                          <label>Custom Discount %</label>
                          <input
                            className="lms-input-small-addrecord"
                            type="text"
                            placeholder="0-100"
                            value={customDiscountRate}
                            onChange={handleCustomDiscountChange}
                            max="100"
                            disabled={isConsultationOnly}
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="lms-billing-col-addrecord">
                    <label className="lms-billing-label-addrecord">Initial Payment (Optional)</label>
                    <input
                      className="lms-input-small-addrecord"
                      type="text"
                      placeholder="0.00"
                      value={initialPaymentAmount}
                      onChange={handleInitialPaymentChange}
                      max={totalAmount}
                    />
                  </div>
                </div>

                <div className="lms-receipt-box-addrecord">
                  <div className="lms-receipt-title-addrecord">RECEIPT</div>

                  {isConsultationOnly ? (
                    <>
                      <div style={{ textAlign: 'center', padding: '15px', background: '#f0f8ff', borderRadius: '5px', marginBottom: '10px' }}>
                        <p style={{ margin: 0, color: '#8b0000', fontWeight: 600, fontSize: '13px' }}>
                           Consultation Only (No Services)
                        </p>
                      </div>

                      <div className="lms-receipt-row-addrecord">
                        <span>{consultationType === "first" ? "1st" : "Follow Up"} Consultation:</span>
                        <span>₱{consultationFee.toFixed(2)}</span>
                      </div>

                      <div className="lms-receipt-separator-addrecord"></div>

                      <div className="lms-receipt-row-addrecord lms-total-row-addrecord">
                        <span><strong>TOTAL BILL:</strong></span>
                        <span><strong>₱{totalAmount.toFixed(2)}</strong></span>
                      </div>

                      {initialPayment > 0 && (
                        <>
                          <div className="lms-receipt-row-addrecord">
                            <span>Initial Payment:</span>
                            <span>- ₱{initialPayment.toFixed(2)}</span>
                          </div>
                          <div className="lms-receipt-row-addrecord lms-balance-row-addrecord">
                            <span><strong>Balance Due:</strong></span>
                            <span><strong>₱{balance.toFixed(2)}</strong></span>
                          </div>
                        </>
                      )}
                    </>
                  ) : (
                    <>
                      {selectedServices.map((service) => (
                        <div key={service.serviceId} className="lms-receipt-row-addrecord">
                          <span>{service.serviceName} (x{service.quantity})</span>
                          <span>₱{(service.price * service.quantity).toFixed(2)}</span>
                        </div>
                      ))}

                      <div className="lms-receipt-separator-addrecord"></div>

                      <div className="lms-receipt-row-addrecord">
                        <span>Services Subtotal:</span>
                        <span>₱{servicesSubtotal.toFixed(2)}</span>
                      </div>

                      {effectiveDiscountRate > 0 && (
                        <div className="lms-receipt-row-addrecord lms-discount-row-addrecord">
                          <span>Discount ({isSeniorPwdDiscount ? "Senior/PWD 20%" : `${effectiveDiscountRate}%`}):</span>
                          <span>- ₱{discountAmount.toFixed(2)}</span>
                        </div>
                      )}

                      <div className="lms-receipt-row-addrecord">
                        <span>Services Total:</span>
                        <span>₱{servicesTotal.toFixed(2)}</span>
                      </div>

                      <div className="lms-receipt-row-addrecord">
                        <span>{consultationType === "first" ? "1st" : "Follow Up"} Consultation:</span>
                        <span>₱{consultationFee.toFixed(2)}</span>
                      </div>

                      <div className="lms-receipt-separator-addrecord"></div>

                      <div className="lms-receipt-row-addrecord lms-total-row-addrecord">
                        <span><strong>TOTAL BILL:</strong></span>
                        <span><strong>₱{totalAmount.toFixed(2)}</strong></span>
                      </div>

                      {initialPayment > 0 && (
                        <>
                          <div className="lms-receipt-row-addrecord">
                            <span>Initial Payment:</span>
                            <span>- ₱{initialPayment.toFixed(2)}</span>
                          </div>
                          <div className="lms-receipt-row-addrecord lms-balance-row-addrecord">
                            <span><strong>Balance Due:</strong></span>
                            <span><strong>₱{balance.toFixed(2)}</strong></span>
                          </div>
                        </>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="lms-admitted-section-addrecord">
              <label>ADMITTED BY: *</label>
              <select 
                className="lms-select-addrecord" 
                value={admittedById} 
                onChange={(e) => setAdmittedById(e.target.value)}
                required
              >
                <option value="">-- Select Doctor --</option>
                {doctors.map((doctor) => (
                  <option key={doctor.id} value={doctor.id}>
                    Dr. {doctor.firstName} {doctor.middleInitial ? doctor.middleInitial + "." : ""} {doctor.lastName}
                  </option>
                ))}
              </select>
            </div>

            <div className="lms-actions-addrecord">
              <button
                className="lms-clear-btn-addrecord"
                onClick={handleClearClick}
                disabled={loading}
              >
                Clear Form
              </button>
              <button
                className="lms-submit-btn-addrecord"
                onClick={handleAddRecordClick}
                disabled={loading}
              >
                Add Record
              </button>
            </div>
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={modalConfig.isOpen}
        onClose={closeModal}
        onConfirm={modalConfig.onConfirm}
        title={modalConfig.title}
        message={modalConfig.message}
        type={modalConfig.type}
        isLoading={modalConfig.isLoading}
        confirmText={modalConfig.actionType === 'addRecord' ? "Yes, Add Record" : "Yes, Clear"}
        cancelText="Cancel"
      />

      <Toast
        isVisible={toastConfig.isVisible}
        onClose={closeToast}
        message={toastConfig.message}
        type={toastConfig.type}
        duration={toastConfig.duration}
        position="bottom-right"
      />
    </>
  );
};

export default AddRecordModal;