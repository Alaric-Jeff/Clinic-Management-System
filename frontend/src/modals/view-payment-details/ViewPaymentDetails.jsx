import './ViewPaymentDetails.css';

// ViewPaymentDetails Component
export default function ViewPaymentDetails({ 
  selectedRecord, 
  onClose,
  formatPatientName,
  formatDate,
  formatPaymentStatus 
}) {
  if (!selectedRecord) return null;

  // Group billed services by category
  const servicesByCategory = {};
  if (selectedRecord.billedServices && Array.isArray(selectedRecord.billedServices)) {
    selectedRecord.billedServices.forEach(service => {
      const category = service.serviceCategory;
      if (!servicesByCategory[category]) {
        servicesByCategory[category] = [];
      }
      servicesByCategory[category].push(service);
    });
  }

  // Format category name for display
  const formatCategoryName = (category) => {
    return category.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  // Calculate total from billed services (excluding consultation)
  const calculateServicesTotal = () => {
    if (!selectedRecord.billedServices) return 0;
    return selectedRecord.billedServices
      .filter(service => service.serviceCategory !== 'consultation')
      .reduce((total, service) => total + service.subtotal, 0);
  };

  const servicesTotal = calculateServicesTotal();

  return (
    <div className="modal-overlay">
      <div className="modal-container modal-view">
        <div className="modal-header">
          Payment Details
        </div>
        
        <div className="modal-content">
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

          {/* Consultation Fee - Show separately */}
          <div className="procedure-section">
            <div className="procedure-title">Consultation</div>
            <div className="procedure-item">
              <span>Consultation Fee</span>
              <span>₱ {selectedRecord.consultationFee?.toFixed(2) || '0.00'}</span>
            </div>
          </div>

          {/* Display actual billed services by category */}
          {Object.keys(servicesByCategory).map(category => {
            // Skip consultation as it's shown separately
            if (category === 'consultation') return null;
            
            const categoryServices = servicesByCategory[category];
            const categoryTotal = categoryServices.reduce((sum, service) => sum + service.subtotal, 0);
            
            return (
              <div key={category} className="procedure-section">
                <div className="procedure-title">{formatCategoryName(category)}</div>
                {categoryServices.map(service => (
                  <div key={service.id} className="procedure-item">
                    <span>
                      {service.serviceName} 
                      {service.quantity > 1 && ` (x${service.quantity})`}
                    </span>
                    <span>₱ {service.subtotal.toFixed(2)}</span>
                  </div>
                ))}
                {categoryServices.length > 1 && (
                  <div className="procedure-item category-total">
                    <span>Subtotal</span>
                    <span>₱ {categoryTotal.toFixed(2)}</span>
                  </div>
                )}
              </div>
            );
          })}

          {/* Show if no additional services */}
          {servicesTotal === 0 && Object.keys(servicesByCategory).length <= 1 && (
            <div className="procedure-section">
              <div className="procedure-title">Additional Services</div>
              <div className="procedure-item no-services">
                <span>No additional services</span>
                <span>₱ 0.00</span>
              </div>
            </div>
          )}

          {/* GRAND TOTAL SECTION - ADDED THIS */}
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
        </div>

        <div className="modal-footer">
          <button
            onClick={onClose}
            className="btn-back"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}