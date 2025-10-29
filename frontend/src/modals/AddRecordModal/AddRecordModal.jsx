import { useEffect, useState } from "react";
import api from "../../axios/api";
import "./AddRecordModal.css";

/**
 * CALCULATION LOGIC (matches backend):
 * ─────────────────────────────────────────
 * Services Subtotal = Σ(service.price × quantity)
 * 
 * Discount (applied to services ONLY):
 *   - Senior/PWD (20%): servicesSubtotal × 0.20
 *   - Custom Rate: servicesSubtotal × (customDiscount / 100)
 *   - Only one applies; Senior/PWD takes precedence
 * 
 * Services Total = Services Subtotal - Discount Amount
 * Consultation Fee = 250 or 350 (NOT discounted)
 * ─────────────────────────────────────────
 * TOTAL BILL = Services Total + Consultation Fee
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
  const [customDiscountRate, setCustomDiscountRate] = useState(0);
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
  const [showAddConfirm, setShowAddConfirm] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

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
    if (isSeniorPwdDiscount) {
      return subtotal * 0.2; // 20% Senior/PWD discount
    } else if (customDiscountRate > 0) {
      return subtotal * (customDiscountRate / 100);
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

  // Calculations
  const servicesSubtotal = calculateServicesSubtotal();
  const effectiveDiscountRate = isSeniorPwdDiscount ? 20 : customDiscountRate;
  const discountAmount = calculateDiscountAmount(servicesSubtotal);
  const servicesTotal = calculateServicesTotal();
  const totalAmount = calculateTotalBill();
  const initialPayment = parseFloat(initialPaymentAmount) || 0;
  const balance = Math.max(totalAmount - initialPayment, 0);

  const hasAtLeastOneMedicalField = assessment || diagnosis || treatment || prescription;

  const handleClearForm = () => {
    setAssessment("");
    setDiagnosis("");
    setTreatment("");
    setPrescription("");
    setSelectedServices([]);
    setAdmittedById("");
    setPaymentMethod("cash");
    setIsSeniorPwdDiscount(false);
    setCustomDiscountRate(0);
    setInitialPaymentAmount("");
    setSelectedCategory("");
    setSelectedServiceId("");
    setError(null);
    setShowClearConfirm(false);
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!hasAtLeastOneMedicalField) {
        setError("Please fill at least one medical field (Assessment, Diagnosis, Treatment, or Prescription).");
        setLoading(false);
        return;
      }

      if (selectedServices.length === 0) {
        setError("Please add at least one service.");
        setLoading(false);
        return;
      }

      // 1) Create medical documentation
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

      // 2) Create bill matching backend expectations
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

      setShowAddConfirm(false);
      onSuccess?.();
    } catch (err) {
      console.error("Error submitting record:", err);
      setError(err?.response?.data?.message || err?.message || "Failed to create record");
    } finally {
      setLoading(false);
    }
  };

  const filteredServices = selectedCategory ? getServicesByCategory(selectedCategory) : [];

  return (
    <div className="lms-modal-overlay-addrecord" onClick={onClose}>
      <div className="lms-modal-wrapper-addrecord" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="lms-header-addrecord">
          <h2 className="lms-title-addrecord">PATIENT'S MEDICAL RECORD</h2>
          <button className="lms-close-btn-addrecord" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <div className="lms-body-addrecord">
          {/* Patient Info */}
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

          {/* Medical Documentation Form */}
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

          {/* Services Section */}
          <div className="lms-services-section-addrecord">
            <div className="lms-services-header-addrecord">
              <h3>CATEGORY SERVICES</h3>
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

            {/* Selected Services Table */}
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

            {/* Billing Container */}
            <div className="lms-billing-wrapper-addrecord">
              <div className="lms-billing-title-addrecord">BILLING</div>
              <div className="lms-billing-divider-addrecord"></div>

              <div className="lms-billing-grid-addrecord">
                {/* Payment Method */}
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

                {/* Consultation Type */}
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

                {/* Discount (applies to services only) */}
                <div className="lms-billing-col-addrecord">
                  <label className="lms-billing-label-addrecord">Discount (Services Only)</label>
                  <div className="lms-discount-stack-addrecord">
                    <label className="lms-checkbox-item-addrecord">
                      <input
                        type="checkbox"
                        checked={isSeniorPwdDiscount}
                        onChange={(e) => {
                          setIsSeniorPwdDiscount(e.target.checked);
                          if (e.target.checked) setCustomDiscountRate(0);
                        }}
                      />
                      <span>Senior/PWD (20%)</span>
                    </label>

                    {!isSeniorPwdDiscount && (
                      <div>
                        <label>Custom Discount %</label>
                        <input
                          className="lms-input-small-addrecord"
                          type="number"
                          placeholder="0-100"
                          value={customDiscountRate}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            setCustomDiscountRate(Math.max(0, Math.min(100, val)));
                          }}
                          min="0"
                          max="100"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Initial Payment */}
                <div className="lms-billing-col-addrecord">
                  <label className="lms-billing-label-addrecord">Initial Payment (Optional)</label>
                  <input
                    className="lms-input-small-addrecord"
                    type="number"
                    placeholder="0.00"
                    value={initialPaymentAmount}
                    onChange={(e) => setInitialPaymentAmount(e.target.value)}
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>

              {/* Receipt Summary */}
              <div className="lms-receipt-box-addrecord">
                <div className="lms-receipt-title-addrecord">RECEIPT</div>

                {selectedServices.length === 0 ? (
                  <div className="lms-receipt-empty-addrecord">
                    <p>No services added yet</p>
                  </div>
                ) : (
                  <>
                    {/* Services */}
                    {selectedServices.map((service) => (
                      <div key={service.serviceId} className="lms-receipt-row-addrecord">
                        <span>{service.serviceName} (x{service.quantity})</span>
                        <span>₱{(service.price * service.quantity).toFixed(2)}</span>
                      </div>
                    ))}

                    <div className="lms-receipt-separator-addrecord"></div>

                    {/* Services Subtotal */}
                    <div className="lms-receipt-row-addrecord">
                      <span>Services Subtotal:</span>
                      <span>₱{servicesSubtotal.toFixed(2)}</span>
                    </div>

                    {/* Discount (only on services) */}
                    {effectiveDiscountRate > 0 && (
                      <div className="lms-receipt-row-addrecord lms-discount-row-addrecord">
                        <span>Discount ({isSeniorPwdDiscount ? "Senior/PWD 20%" : `${customDiscountRate}%`}):</span>
                        <span>- ₱{discountAmount.toFixed(2)}</span>
                      </div>
                    )}

                    {/* Services Total */}
                    <div className="lms-receipt-row-addrecord">
                      <span>Services Total:</span>
                      <span>₱{servicesTotal.toFixed(2)}</span>
                    </div>

                    {/* Consultation Fee (NOT discounted) */}
                    <div className="lms-receipt-row-addrecord">
                      <span>{consultationType === "first" ? "1st" : "Follow Up"} Consultation:</span>
                      <span>₱{consultationFee.toFixed(2)}</span>
                    </div>

                    <div className="lms-receipt-separator-addrecord"></div>

                    {/* Total Amount */}
                    <div className="lms-receipt-row-addrecord lms-total-row-addrecord">
                      <span><strong>TOTAL BILL:</strong></span>
                      <span><strong>₱{totalAmount.toFixed(2)}</strong></span>
                    </div>

                    {/* Initial Payment */}
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

          {/* Admitted By */}
          <div className="lms-admitted-section-addrecord">
            <label>ADMITTED BY:</label>
            <select className="lms-select-addrecord" value={admittedById} onChange={(e) => setAdmittedById(e.target.value)}>
              <option value="">Select Doctor (Optional)</option>
              {doctors.map((doctor) => (
                <option key={doctor.id} value={doctor.id}>
                  Dr. {doctor.firstName} {doctor.middleInitial ? doctor.middleInitial + "." : ""} {doctor.lastName}
                </option>
              ))}
            </select>
          </div>

          {/* Action Buttons */}
          <div className="lms-actions-addrecord">
            <button
              className="lms-clear-btn-addrecord"
              onClick={() => setShowClearConfirm(true)}
              disabled={loading}
            >
              Clear Form
            </button>
            <button
              className="lms-submit-btn-addrecord"
              onClick={() => setShowAddConfirm(true)}
              disabled={loading || selectedServices.length === 0}
            >
              Add Record
            </button>
          </div>
        </div>

        {/* Add Confirmation Popup */}
        {showAddConfirm && (
          <div className="lms-confirm-overlay-addrecord">
            <div className="lms-confirm-box-addrecord">
              <h3>Add New Record?</h3>
              <p>Are you sure you want to add this medical record?</p>
              <div className="lms-confirm-btns-addrecord">
                <button onClick={() => setShowAddConfirm(false)} disabled={loading}>No</button>
                <button onClick={handleSubmit} disabled={loading}>
                  {loading ? "Adding..." : "Yes"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Clear Confirmation Popup */}
        {showClearConfirm && (
          <div className="lms-confirm-overlay-addrecord">
            <div className="lms-confirm-box-addrecord">
              <h3>Clear Form?</h3>
              <p>Are you sure you want to clear all form data?</p>
              <div className="lms-confirm-btns-addrecord">
                <button onClick={() => setShowClearConfirm(false)}>No</button>
                <button onClick={handleClearForm}>Yes</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AddRecordModal;