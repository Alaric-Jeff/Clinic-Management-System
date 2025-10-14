import React, { useState, useEffect } from 'react';
import Logo from '/src/zLogo.png';
import { data } from 'react-router-dom';

const PatientRecordView = ({ patient, onBack }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentView, setCurrentView] = useState('list'); // 'list' | 'detail' | 'addRecord'
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [isEditingRemarks, setIsEditingRemarks] = useState(false);
  const [remarks, setRemarks] = useState('');
  const [medicalHistory, setMedicalHistory] = useState([]);

  // Combined discount flag
  const [seniorOrPwdDiscount, setSeniorOrPwdDiscount] = useState(false);

  // Payment option (radio)
  const [paymentOption, setPaymentOption] = useState(''); // 'cash' | 'gcash' | ''

  // Partially paid amount
  const [partialAmount, setPartialAmount] = useState('');

  // Payment status object
  const [serviceStatus, setServiceStatus] = useState({
    paid: false,
    partiallyPaid: false,
    unpaid: false
  });

  const [labServices, setLabServices] = useState([]);
  const [selectedLabCategory, setSelectedLabCategory] = useState('');
  const [selectedLabTest, setSelectedLabTest] = useState('');

  const labCategories = {
    Hematology: ['Complete Blood Count', 'ESR'],
    Bacteriology: ['Culture Test', 'Sensitivity Test'],
    Injection: ['Anti-Rabies', 'Tetanus', 'Flu Shot']
  };

  const labPrices = {
    'Complete Blood Count': 300,
    'ESR': 200,
    'Culture Test': 400,
    'Sensitivity Test': 350,
    'Anti-Rabies': 1500,
    'Tetanus': 350,
    'Flu Shot': 500
  };

  // Helpers for date: store ISO for input, format for display
  const getCurrentDateISO = () => {
    const now = new Date();
    const iso = now.toISOString().split('T')[0]; // yyyy-mm-dd
    return iso;
  };

  const formatDateDisplay = (isoDate) => {
    try {
      const d = new Date(isoDate + 'T00:00:00');
      const day = d.getDate();
      const month = d.toLocaleDateString('en-US', { month: 'long' });
      const year = d.getFullYear();
      return `${day} ${month} ${year}`;
    } catch {
      return isoDate;
    }
  };

  // recordForm fields:
  const [recordForm, setRecordForm] = useState({
    patientName: patient ? `${patient.firstName} ${patient.lastName}` : '',
    // store date as ISO for <input type="date">
    dateISO: getCurrentDateISO(),
    assessment: '',
    diagnosis: '',
    treatment: '',
    prescription: '',
    auditedBy: '', // previously admittedBy -> now Audited by
    admittedBy: '' // previously authorizedBy -> now Admitted by
  });

  useEffect(() => {
    // keep patient name synced if patient prop changes
    setRecordForm((prev) => ({
      ...prev,
      patientName: patient ? `${patient.firstName} ${patient.lastName}` : ''
    }));
  }, [patient]);

  // Payment status text
  const getPaymentStatus = () => {
    if (serviceStatus.paid) return 'Completed';
    if (serviceStatus.partiallyPaid) return 'Partially Paid';
    if (serviceStatus.unpaid) return 'Unpaid';
    return 'Incomplete';
  };

  // Filter for search
  const getFilteredHistory = () => {
    return medicalHistory.filter((record) =>
      (record.dateDisplay || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (record.auditedBy || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (record.status || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  // Lab service functions
  const handleLabCategoryChange = (category) => {
    setSelectedLabCategory(category);
    setSelectedLabTest('');
  };

  const handleLabTestChange = (test) => {
    setSelectedLabTest(test);
  };

  const handleAddLabService = () => {
    if (selectedLabTest && !labServices.find((s) => s.name === selectedLabTest)) {
      setLabServices([
        ...labServices,
        {
          name: selectedLabTest,
          price: labPrices[selectedLabTest] || 0
        }
      ]);
    }
  };

  const handleRemoveLabService = (index) => {
    setLabServices(labServices.filter((_, i) => i !== index));
  };

  const calculateSubtotal = () => {
    return labServices.reduce((sum, s) => sum + (s.price || 0), 0);
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    let discount = 0;
    if (seniorOrPwdDiscount) discount = subtotal * 0.20;
    return subtotal - discount;
  };

  // Table view handlers
  const handleViewDocument = (record) => {
    setSelectedRecord(record);
    setCurrentView('detail');
  };

  const handleBackToList = () => {
    setCurrentView('list');
    setSelectedRecord(null);
  };

   
  // IMPORTANT: When clicking Add Record, keep top container the same (patient info + remarks).
  // Open add form in bottom container but do NOT clear remarks or patient top info.
  const handleAddRecord = () => {
    setCurrentView('addRecord');
    // Initialize form fields but do not touch remarks or patient card
    setRecordForm((prev) => ({
      ...prev,
      patientName: patient ? `${patient.firstName} ${patient.lastName}` : '',
      dateISO: getCurrentDateISO(),
      assessment: '',
      diagnosis: '',
      treatment: '',
      prescription: '',
      auditedBy: prev.auditedBy || '', // keep last auditedBy selection if you'd like, else set ''
      admittedBy: prev.admittedBy || ''
    }));
    setLabServices([]);
    setServiceStatus({ paid: false, partiallyPaid: false, unpaid: false });
    setSeniorOrPwdDiscount(false);
    setPaymentOption('');
    setPartialAmount('');
  };

  //HistoryLog POV
  const handleHistoryLog = () => {
    setCurrentView('addHistoryLog');
    
  };


  // Submit record - confirm
  const handleSubmitRecord = () => {
    // validation: assessment and auditedBy required
    if (!recordForm.assessment || !recordForm.auditedBy) {
      alert('Please fill in Assessment and Audited By fields');
      return;
    }
    setShowConfirmModal(true);
  };

  const handleConfirmAddRecord = () => {
    const newRecord = {
      id: Date.now(),
      // store both iso and display string
      dateISO: recordForm.dateISO,
      dateDisplay: formatDateDisplay(recordForm.dateISO),
      auditedBy: recordForm.auditedBy,
      status: getPaymentStatus(),
      // include fullData for detail view printing
      fullData: {
        ...recordForm,
        dateISO: recordForm.dateISO,
        dateDisplay: formatDateDisplay(recordForm.dateISO),
        labServices: [...labServices],
        subtotal: calculateSubtotal(),
        total: calculateTotal(),
        paymentStatus: getPaymentStatus(),
        seniorOrPwdDiscount,
        paymentOption,
        partialAmount: serviceStatus.partiallyPaid ? partialAmount : ''
      }
    };

    setMedicalHistory((prev) => [...prev, newRecord]);
    setShowConfirmModal(false);
    setCurrentView('list');

    // reset form bottom container but DO NOT clear top patient info or remarks
    setRecordForm((prev) => ({
      ...prev,
      dateISO: getCurrentDateISO(),
      assessment: '',
      diagnosis: '',
      treatment: '',
      prescription: '',
      // keep auditedBy/admittedBy as they were if you want, otherwise set to ''
      auditedBy: '',
      admittedBy: ''
    }));
    setLabServices([]);
    setServiceStatus({ paid: false, partiallyPaid: false, unpaid: false });
    setSeniorOrPwdDiscount(false);
    setPaymentOption('');
    setPartialAmount('');
  };

  // Remarks edit/save
  const handleEditRemarks = () => {
    setIsEditingRemarks(true);
  };

  const handleSaveRemarks = () => {
    setIsEditingRemarks(false);
    // remarks state already updated
  };

  // Clear form with confirmation - only affects bottom form (not top container)
  const handleClearForm = () => {
    setShowClearConfirm(true);
  };

  const confirmClearForm = () => {
    setShowClearConfirm(false);
    // Clear all bottom form fields (but keep patient top container & remarks)
    setRecordForm((prev) => ({
      ...prev,
      dateISO: getCurrentDateISO(),
      assessment: '',
      diagnosis: '',
      treatment: '',
      prescription: '',
      auditedBy: '',
      admittedBy: ''
    }));
    setLabServices([]);
    setServiceStatus({ paid: false, partiallyPaid: false, unpaid: false });
    setSeniorOrPwdDiscount(false);
    setPaymentOption('');
    setPartialAmount('');
  };

  const filteredHistory = getFilteredHistory();

  // Render list view (medical history table)
  if (currentView === 'list') {
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <div style={styles.titleSection}>
            <img 
                    src={Logo} 
                    alt="Preview"
                    style={{
                      position: 'absolute',
                      width: '250px',        
                      height: '180px',      
                      objectFit: 'cover',    
                      borderRadius: '10px',  
                      left: '525px',
                      top: '-30px'
                    }}
                  />
            <div style={styles.mainTitle}>LEONARDO MEDICAL SERVICES</div>
            <div style={styles.address}>B1 L17-E Neovista, Bagumbong, Caloocan City</div>
          </div>
        </div>

        <div style={styles.sectionContainer}>
          <div style={styles.sectionHeader}>
            <h1 style={styles.sectionTitle}>PATIENT DETAILS</h1>
            <button style={styles.closeBtn} onClick={onBack}>✕</button>
          </div>

          <div style={styles.detailsContent}>
            <div style={styles.patientCard}>
              <h1 style={styles.patientName}>
                {patient ? `${patient.firstName} ${patient.lastName}` : 'N/A'}
              </h1>

              <div style={styles.infoGrid}>
                <div style={styles.infoItem}>
                  <span style={styles.infoLabel}>Sex/Gender:</span>
                  <span style={styles.infoValue}>{patient?.sex || 'N/A'}</span>
                </div>
                <div style={styles.infoItem}>
                  <span style={styles.infoLabel}>Date of Birth:</span>
                  <span style={styles.infoValue}>{patient?.birthDate || 'N/A'}</span>
                </div>
                <div style={styles.infoItem}>
                  <span style={styles.infoLabel}>Age:</span>
                  <span style={styles.infoValue}>{patient?.age || 'N/A'}</span>
                </div>
                <div style={styles.infoItem}>
                  <span style={styles.infoLabel}>Phone Number:</span>
                  <span style={styles.infoValue}>{patient?.contactNo || 'N/A'}</span>
                </div>
              </div>

              <div style={styles.infoGrid}>
                <div style={styles.infoItem}>
                  <span style={styles.infoLabel}>Senior Citizen / PWD ID:</span>
                  <span style={styles.infoValue}>{patient?.seniorPwdId || 'N/A'}</span>
                </div>
                <div style={styles.infoItem}>
                  <span style={styles.infoLabel}>Address:</span>
                  <span style={styles.infoValue}>{patient?.address || 'N/A'}</span>
                </div>
                
                <div style={styles.infoItem}>
                  <span style={styles.infoLabel}>Date Registered:</span>
                  <span style={styles.infoValue}>{patient?.date || 'N/A'}</span>
                </div>
                <div style={styles.infoItem}>
                  <span style={styles.infoLabel}>Status</span>
                  <span style={styles.infoValue}>{patient?.status || 'Active'}</span>
                </div>
              </div>

              
            </div>

            <div style={styles.remarksCard}>
              <h3 style={styles.remarksTitle}>Assessment/Remarks</h3>
              {isEditingRemarks ? (
                <textarea
                  style={styles.remarksTextarea}
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  rows="6"
                />
              ) : (
                <div style={styles.remarksBox}>
                  <p style={styles.remarksText}>{remarks || 'No remarks yet'}</p>
                </div>
              )}
              <button
                style={styles.editBtn}
                onClick={isEditingRemarks ? handleSaveRemarks : handleEditRemarks}
              >
                {isEditingRemarks ? 'SAVE' : 'EDIT'}
              </button>
            </div>
          </div>
        </div>

        <div style={styles.sectionContainer}>
          <div style={styles.sectionHeader2}>
            <h2 style={styles.sectionTitle2}>PATIENT MEDICAL HISTORY</h2>
            <button style={styles.addRecordBtn} onClick={handleAddRecord}>+ Add Record</button>
          </div>

          <div style={styles.historyContent}>
            <div style={styles.searchContainer}>
              <input
                type="text"
                placeholder="Search..."
                style={styles.searchInput}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div style={styles.tableContainer}>
              <table style={styles.table}>
                <thead>
                  <tr style={styles.headerRow}>
                    <th style={styles.th}>Date of Visits</th>
                    <th style={styles.th}>Audited by</th>
                    <th style={styles.th}>Status of Record</th>
                    <th style={styles.th}>Documents</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredHistory.map((record, index) => (
                    <tr
                      key={record.id}
                      style={{
                        ...styles.tableRow,
                        backgroundColor: index % 2 === 0 ? '#ffcccb' : '#ffb3b3'
                      }}
                    >
                      <td style={styles.td}>{record.dateDisplay}</td>
                      <td style={styles.td}>{record.auditedBy || 'N/A'}</td>
                      <td style={styles.td}>{record.status}</td>
                      <td style={styles.td}>
                        <button
                          style={styles.viewDocBtn}
                          onClick={() => handleViewDocument(record)}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredHistory.length === 0 && (
                    <tr style={{ ...styles.tableRow, backgroundColor: '#ffcccb' }}>
                      <td style={styles.td} colSpan="4">No medical records yet</td>
                    </tr>
                  )}
                  {[...Array(Math.max(0, 12 - filteredHistory.length))].map((_, i) => (
                    <tr
                      key={`empty-${i}`}
                      style={{
                        ...styles.tableRow,
                        backgroundColor: (filteredHistory.length + i) % 2 === 0 ? '#ffcccb' : '#ffb3b3'
                      }}
                    >
                      <td style={styles.td}>&nbsp;</td>
                      <td style={styles.td}>&nbsp;</td>
                      <td style={styles.td}>&nbsp;</td>
                      <td style={styles.td}>&nbsp;</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Detail view for a single record
  if (currentView === 'detail' && selectedRecord) {
    const data = selectedRecord.fullData;
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <div style={styles.titleSection}>
            <img 
                    src={Logo} 
                    alt="Preview"
                    style={{
                      position: 'absolute',
                      width: '250px',        
                      height: '180px',      
                      objectFit: 'cover',    
                      borderRadius: '10px',  
                      left: '525px',
                      top: '-30px'
                    }}
                  />
            <div style={styles.mainTitle}>LEONARDO MEDICAL SERVICES</div>
            <div style={styles.address}>B1 L17-E Neovista, Bagumbong, Caloocan City</div>
          </div>
        </div>

        <div style={styles.sectionContainer}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>PATIENT DETAILS</h2>
            <button style={styles.closeBtn} onClick={onBack}>✕</button>
          </div>

          <div style={styles.detailsContent}>
            <div style={styles.patientCard}>
              <h1 style={styles.patientName}>
                {patient ? `${patient.firstName} ${patient.lastName}` : 'N/A'}
              </h1>

              <div style={styles.infoGrid}>
                <div style={styles.infoItem}>
                  <span style={styles.infoLabel}>Sex/Gender:</span>
                  <span style={styles.infoValue}>{patient?.sex || 'N/A'}</span>
                </div>
                <div style={styles.infoItem}>
                  <span style={styles.infoLabel}>Date of Birth:</span>
                  <span style={styles.infoValue}>{patient?.birthDate || 'N/A'}</span>
                </div>
                <div style={styles.infoItem}>
                  <span style={styles.infoLabel}>Age:</span>
                  <span style={styles.infoValue}>{patient?.age || 'N/A'}</span>
                </div>
                <div style={styles.infoItem}>
                  <span style={styles.infoLabel}>Phone Number:</span>
                  <span style={styles.infoValue}>{patient?.contactNo || 'N/A'}</span>
                </div>
              </div>

              <div style={styles.infoGrid}>
                <div style={styles.infoItem}>
                  <span style={styles.infoLabel}>Senior Citizen / PWD ID:</span>
                  <span style={styles.infoValue}>{patient?.seniorPwdId || 'N/A'}</span>
                </div>
                <div style={styles.infoItem}>
                  <span style={styles.infoLabel}>Address:</span>
                  <span style={styles.infoValue}>{patient?.address || 'N/A'}</span>
                </div>
                
                <div style={styles.infoItem}>
                  <span style={styles.infoLabel}>Date Registered:</span>
                  <span style={styles.infoValue}>{patient?.date || 'N/A'}</span>
                </div>
                <div style={styles.infoItem}>
                  <span style={styles.infoLabel}>Status</span>
                  <span style={styles.infoValue}>{patient?.status || 'Active'}</span>
                </div>
              </div>
            </div>

            <div style={styles.remarksCard}>
              <h3 style={styles.remarksTitle}>Assessment/Remarks</h3>
              {isEditingRemarks ? (
                <textarea
                  style={styles.remarksTextarea}
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  rows="6"
                />
              ) : (
                <div style={styles.remarksBox}>
                  <p style={styles.remarksText}>{remarks || 'No remarks yet'}</p>
                </div>
              )}
              <button
                style={styles.editBtn}
                onClick={isEditingRemarks ? handleSaveRemarks : handleEditRemarks}
              >
                {isEditingRemarks ? 'SAVE' : 'EDIT'}
              </button>
            </div>
          </div>
        </div>

        <div style={styles.sectionContainer}>
          <div style={styles.sectionHeader2}>
            <button style={styles.addHistoryLog} onClick={handleHistoryLog}>History Log</button>
            <h2 style={styles.sectionTitle2}>PATIENT MEDICAL HISTORY</h2>
             
            <button style={styles.closeBtn} onClick={handleBackToList}>✕</button>
          </div>

          <div style={styles.recordDetailContent}>
            <div style={styles.recordDetailLeft}>
              <div style={styles.recordHeader}>
                <div>
                  <img 
                    src={Logo} 
                    alt="Preview"
                    style={{
                      position: 'absolute',
                      width: '250px',        
                      height: '180px',      
                      objectFit: 'cover',    
                      borderRadius: '10px',  
                      left: '270px',
                      top: '670px'
                    }}
                  />
                  <div style={styles.recordTitleSmall}>Leonardo Medical Services</div>
                  <center> <div style={styles.address}>B1 L17-E Neovista, Bagumbong, Caloocan City</div></center>
                  <div style={styles.recordSubtitle}>Patient's Name: <strong>{data.patientName}</strong></div>
                  <div style={styles.recordSubtitle}>Date: <strong>{data.dateDisplay}</strong></div>
                </div>
              </div>

              <div style={styles.formSection}>
                <label style={styles.formLabel}>Assessment:</label>
                <textarea style={styles.textarea} rows="3" value={data.assessment} readOnly></textarea>
              </div>

              <div style={styles.formSection}>
                <label style={styles.formLabel}>Diagnosis:</label>
                <textarea style={styles.textarea} rows="3" value={data.diagnosis} readOnly></textarea>
              </div>

              <div style={styles.formSection}>
                <label style={styles.formLabel}>Treatment:</label>
                <textarea style={styles.textarea} rows="2" value={data.treatment} readOnly></textarea>
              </div>

              <div style={styles.formSection}>
                <label style={styles.formLabel}>Prescription:</label>
                <textarea style={styles.textarea} rows="3" value={data.prescription} readOnly></textarea>
              </div>

              <div style={styles.signatureSection}>
                <div style={styles.signatureItem}>
                  <span style={styles.signatureLabel}>Audited By:</span>
                  <span style={styles.signatureValue}>{data.auditedBy || 'N/A'}</span>
                </div>
                <div style={styles.signatureItem}>
                  <span style={styles.signatureLabel}>Admitted By:</span>
                  <span style={styles.signatureValue}>{data.admittedBy || 'N/A'}</span>
                </div>
              </div>
            </div>

            <div style={styles.recordDetailRight}>
              <div style={styles.header}>
          <div style={styles.titleSection}>
            <img 
                    src={Logo} 
                    alt="Preview"
                    style={{
                      position: 'absolute',
                      width: '250px',        
                      height: '180px',      
                      objectFit: 'cover',    
                      borderRadius: '10px',  
                      left: '1020px',
                      top: '700px'
                    }}
                  />
            <div style={styles.mainTitle}>Leonardo Medical Services</div>
          </div>
        </div>
              {data.labServices && data.labServices.length > 0 && (
                <>
                  <div style={styles.billingSection}>
                    <h1 style={styles.billingTitle}>Services:</h1>
                    {data.labServices.map((service, idx) => (
                      <div key={idx} style={styles.billingRow}>
                        <span>{service.name}</span>
                        <span>₱ {service.price}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {data.seniorOrPwdDiscount && (
                <div style={styles.billingSectionBorder}>
                  <h3 style={styles.billingTitle}>Discounts Applied:</h3>
                  <p>Senior Citizen / PWD Discount: 20%</p>
                </div>
              )}

              <div style={styles.billingTotal}>
                <div style={styles.totalRow}>
                  <span style={styles.totalLabel}>Total Amount:</span>
                  <span style={styles.totalValue}>₱ {Number(data.total || 0).toFixed(2)}</span>
                </div>
              </div>

              <div style={styles.billingSection}>
                <div style={styles.statusRow}>
                  <span style={styles.statusLabel}>Status:</span>
                  <span style={styles.statusValue}>{data.paymentStatus}</span>
                </div>

                {data.paymentStatus === 'Partially Paid' && (
                  <div style={{ marginTop: 10 }}>
                    <span style={{ fontSize: 13 }}>Partial Amount Paid: ₱ {data.partialAmount || '0.00'}</span>
                  </div>
                )}
              </div>

              <div style={styles.statusRow}>
              <div style={{ marginBottom: 15 }}>
                <span style={{ marginRight: 10}}>Payment Option:</span>
                <span style={styles.statusValue}>{data.paymentOption ? data.paymentOption.toUpperCase() : 'N/A'}</span>
              </div>
              </div>

              <button style={styles.printBtn}>PRINT</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Add Record view - bottom container is the form; top remains same
  if (currentView === 'addRecord') {
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <div style={styles.titleSection}>
            <img 
                    src={Logo} 
                    alt="Preview"
                    style={{
                      position: 'absolute',
                      width: '250px',        
                      height: '180px',      
                      objectFit: 'cover',    
                      borderRadius: '10px',  
                      left: '525px',
                      top: '-30px'
                    }}
                  />
            <div style={styles.mainTitle}>LEONARDO MEDICAL SERVICES</div>
            <div style={styles.address}>B1 L17-E Neovista, Bagumbong, Caloocan City</div>
          </div>
        </div>

        <div style={styles.sectionContainer}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>PATIENT DETAILS</h2>
            <button style={styles.closeBtn} onClick={onBack}>✕</button>
          </div>

          <div style={styles.detailsContent}>
            <div style={styles.patientCard}>
              <h1 style={styles.patientName}>
                {patient ? `${patient.firstName} ${patient.lastName}` : 'N/A'}
              </h1>

              <div style={styles.infoGrid}>
                <div style={styles.infoItem}>
                  <span style={styles.infoLabel}>Sex/Gender:</span>
                  <span style={styles.infoValue}>{patient?.sex || 'N/A'}</span>
                </div>
                <div style={styles.infoItem}>
                  <span style={styles.infoLabel}>Date of Birth:</span>
                  <span style={styles.infoValue}>{patient?.birthDate || 'N/A'}</span>
                </div>
                <div style={styles.infoItem}>
                  <span style={styles.infoLabel}>Age:</span>
                  <span style={styles.infoValue}>{patient?.age || 'N/A'}</span>
                </div>
                <div style={styles.infoItem}>
                  <span style={styles.infoLabel}>Phone Number:</span>
                  <span style={styles.infoValue}>{patient?.contactNo || 'N/A'}</span>
                </div>
              </div>

              <div style={styles.infoGrid}>
                <div style={styles.infoItem}>
                  <span style={styles.infoLabel}>Senior Citizen / PWD ID:</span>
                  <span style={styles.infoValue}>{patient?.seniorPwdId || 'N/A'}</span>
                </div>
                <div style={styles.infoItem}>
                  <span style={styles.infoLabel}>Address:</span>
                  <span style={styles.infoValue}>{patient?.address || 'N/A'}</span>
                </div>
                
                <div style={styles.infoItem}>
                  <span style={styles.infoLabel}>Date Registered:</span>
                  <span style={styles.infoValue}>{patient?.date || 'N/A'}</span>
                </div>
                <div style={styles.infoItem}>
                  <span style={styles.infoLabel}>Status</span>
                  <span style={styles.infoValue}>{patient?.status || 'Active'}</span>
                </div>
              </div>

            </div>

             <div style={styles.remarksCard}>
              <h3 style={styles.remarksTitle}>Assessment/Remarks</h3>
              {isEditingRemarks ? (
                <textarea
                  style={styles.remarksTextarea}
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  rows="6"
                />
              ) : (
                <div style={styles.remarksBox}>
                  <p style={styles.remarksText}>{remarks || 'No remarks yet'}</p>
                </div>
              )}
              <button
                style={styles.editBtn}
                onClick={isEditingRemarks ? handleSaveRemarks : handleEditRemarks}
              >
                {isEditingRemarks ? 'SAVE' : 'EDIT'}
              </button>
            </div>
          </div>
        </div>

        <div style={styles.sectionContainer}>
          <div style={styles.sectionHeader2}>

            <img 
                    src={Logo} 
                    alt="Preview"
                    style={{
                      position: 'absolute',
                      width: '250px',        
                      height: '180px',      
                      objectFit: 'cover',    
                      borderRadius: '10px',  
                      left: '580px',
                      top: '680px'
                    }}
                  />

            <h2 style={styles.sectionTitle2}>PATIENT MEDICAL HISTORY</h2>
            <button style={styles.closeBtn} onClick={handleBackToList}>✕</button>
          </div>

          <div style={styles.recordDetailContent}>
            <div style={styles.recordDetailLeft}>
              <div style={styles.recordHeader}>
                
                  <div style={styles.recordTitleSmall}>PATIENT'S MEDICAL RECORD</div>
                  <div style={styles.recordSubtitle}>
                    Patient's Name: <strong>{recordForm.patientName}</strong>
                    
                  </div>
                  <div style={styles.recordSubtitle}>
                    Date:
                    <input
                      type="date"
                      style={styles.dateInput}
                      value={recordForm.dateISO}
                      onChange={(e) =>
                        setRecordForm({ ...recordForm, dateISO: e.target.value })
                      }
                    />
                    
                  </div>
                
              </div>

              <div style={styles.formSection}>
                <label style={styles.formLabel}>Assessment *</label>
                <textarea
                  style={styles.textarea}
                  rows="3"
                  value={recordForm.assessment}
                  onChange={(e) => setRecordForm({ ...recordForm, assessment: e.target.value })}
                  placeholder="Enter assessment..."
                />
              </div>

              <div style={styles.formRow2}>
                <div style={styles.formSection}>
                  <label style={styles.formLabel}>Diagnosis</label>
                  <textarea
                    style={styles.textarea2}
                    rows="4"
                    value={recordForm.diagnosis}
                    onChange={(e) => setRecordForm({ ...recordForm, diagnosis: e.target.value })}
                    placeholder="Enter diagnosis..."
                  />
                </div>
                <div style={styles.formSection}>
                  <label style={styles.formLabel}>Treatment</label>
                  <textarea
                    style={styles.textarea2}
                    rows="4"
                    value={recordForm.treatment}
                    onChange={(e) => setRecordForm({ ...recordForm, treatment: e.target.value })}
                    placeholder="Enter treatment..."
                  />
                </div>
              </div>

              <div style={styles.formSection}>
                <label style={styles.formLabel}>Prescription</label>
                <textarea
                  style={styles.textarea}
                  rows="3"
                  value={recordForm.prescription}
                  onChange={(e) => setRecordForm({ ...recordForm, prescription: e.target.value })}
                  placeholder="Enter prescription..."
                />
              </div>

              {/* Laboratory / Injection */}
              <div style={styles.labSection}>
                <h3 style={styles.labTitle}>LABORATORY / INJECTION</h3>
                <div style={styles.labControls}>
                  <select
                    style={styles.labSelect}
                    value={selectedLabCategory}
                    onChange={(e) => handleLabCategoryChange(e.target.value)}
                  >
                    <option value="">Select Category</option>
                    <option value="Hematology">Hematology</option>
                    <option value="Bacteriology">Bacteriology</option>
                    <option value="Injection">Injection</option>
                  </select>

                  {selectedLabCategory && (
                    <select
                      style={styles.labSelect}
                      value={selectedLabTest}
                      onChange={(e) => handleLabTestChange(e.target.value)}
                    >
                      <option value="">Select Test</option>
                      {labCategories[selectedLabCategory].map((test) => (
                        <option key={test} value={test}>
                          {test}
                        </option>
                      ))}
                    </select>
                  )}

                  <button style={styles.addLabBtn} onClick={handleAddLabService}>Add</button>
                </div>

                {labServices.length > 0 && (
                  <table style={styles.labTable}>
                    <thead>
                      <tr style={styles.labHeaderRow}>
                        <th style={styles.labTh}>Service</th>
                        <th style={styles.labTh}>Price</th>
                        <th style={styles.labTh}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {labServices.map((service, index) => (
                        <tr key={index} style={styles.labRow}>
                          <td style={styles.labTd}>{service.name}</td>
                          <td style={styles.labTd}>₱ {service.price}</td>
                          <td style={styles.labTd}>
                            <button style={styles.removeBtn} onClick={() => handleRemoveLabService(index)}>✕</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                {/* TOTAL moved here (below Laboratory / Injection) */}
                <div style={{ marginTop: 12 }}>
                  <div style={styles.billingTitle}>Subtotal: ₱ {calculateSubtotal().toFixed(2)}</div>
                  {seniorOrPwdDiscount && (
                    <div style={{ fontSize: 15, color: '#333' }}>Senior Citizen / PWD Discount applied: 20%</div>
                  )}
                  <div style={{ marginTop: 8 }}>
                    <div style={styles.totalRow}>
                      <span style={styles.totalLabel}>Total Amount:</span>
                      <span style={styles.totalValue}>₱ {calculateTotal().toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Section */}
              <div style={styles.statusSection}>
                <div style={styles.statusGroup}>
                  <h4 style={styles.statusGroupTitle}>PAYMENT STATUS:</h4>
                  <label style={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={serviceStatus.paid}
                      onChange={(e) =>
                        setServiceStatus({ paid: e.target.checked, partiallyPaid: false, unpaid: false })
                      }
                    />
                    Paid
                  </label>
                  <label style={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={serviceStatus.partiallyPaid}
                      onChange={(e) => {
                        setServiceStatus({ paid: false, partiallyPaid: e.target.checked, unpaid: false });
                        if (!e.target.checked) setPartialAmount('');
                      }}
                    />
                    Partially Paid
                  </label>
                  {/* partial amount input */}
                  {serviceStatus.partiallyPaid && (
                    <div style={{ marginTop: 8 }}>
                      <input
                        type="number"
                        placeholder="Enter amount"
                        value={partialAmount}
                        onChange={(e) => setPartialAmount(e.target.value)}
                        style={{ padding: '8px', borderRadius: 6, border: '1px solid #ddd', width: '100%' }}
                      />
                    </div>
                  )}
                  <label style={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={serviceStatus.unpaid}
                      onChange={(e) => setServiceStatus({ paid: false, partiallyPaid: false, unpaid: e.target.checked })}
                    />
                    Unpaid
                  </label>
                </div>

                <div style={styles.statusGroup}>
                  <h4 style={styles.statusGroupTitle}>Senior Citizen / PWD Discount</h4>
                  <label style={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={seniorOrPwdDiscount}
                      onChange={(e) => setSeniorOrPwdDiscount(e.target.checked)}
                    />
                    Yes (20%)
                  </label>
                </div>

                <div style={styles.statusGroup}>
                  <h4 style={styles.statusGroupTitle}>Payment Option</h4>
                  <label style={styles.checkboxLabel}>
                    <input
                      type="radio"
                      name="paymentOption"
                      checked={paymentOption === 'cash'}
                      onChange={() => setPaymentOption('cash')}
                    />
                    Cash
                  </label>
                  <label style={styles.checkboxLabel}>
                    <input
                      type="radio"
                      name="paymentOption"
                      checked={paymentOption === 'gcash'}
                      onChange={() => setPaymentOption('gcash')}
                    />
                    GCash
                  </label>
                </div>
              </div>

              {/* Audited by (dropdown) and Admitted by */}
              <div style={styles.admittedSection}>
                <div style={styles.admittedGroup}>
                  <label style={styles.admittedLabel}>AUDITED BY: *</label>
                  <select
                    style={styles.admittedSelect}
                    value={recordForm.auditedBy}
                    onChange={(e) => setRecordForm({ ...recordForm, auditedBy: e.target.value })}
                  >
                    <option value="">Select</option>
                    <option value="Admin User">Admin User</option>
                    <option value="Nurse Smith">Nurse Smith</option>
                    <option value="Nurse Jones">Nurse Jones</option>
                  </select>
                </div>
                <div style={styles.admittedGroup}>
                  <label style={styles.admittedLabel}>ADMITTED BY:</label>
                  <select
                    style={styles.admittedSelect}
                    value={recordForm.admittedBy}
                    onChange={(e) => setRecordForm({ ...recordForm, admittedBy: e.target.value })}
                  >
                    <option value="">Select</option>
                    <option value="Dr. Leonardo">Dr. Leonardo</option>
                    <option value="Dr. Martinez">Dr. Martinez</option>
                  </select>
                </div>
              </div>
              
              <div style={styles.goleft}>
              <button style={styles.submitRecordBtn} onClick={handleSubmitRecord}>ADD RECORD</button>

              <button
                style={{ ...styles.submitRecordBtn, marginTop: 10, marginLeft: 15, backgroundColor: '#fff', color: '#8b0000', border: '2px solid #8b0000' }}
                onClick={handleClearForm}
              >
                CLEAR FORM
              </button>
              </div>
            </div>

            
          </div>
        </div>

        {/* Confirm Add Modal */}
        {showConfirmModal && (
          <div style={styles.modalOverlay}>
            <div style={styles.confirmModal}>
              <h3 style={styles.confirmTitle}>Add new record?</h3>
              <div style={styles.confirmButtons}>
                <button style={styles.confirmNoBtn} onClick={() => setShowConfirmModal(false)}>No</button>
                <button style={styles.confirmYesBtn} onClick={handleConfirmAddRecord}>Yes</button>
              </div>
            </div>
          </div>
        )}

        {/* Confirm Clear Modal */}
        {showClearConfirm && (
          <div style={styles.modalOverlay}>
            <div style={styles.confirmModal}>
              <h3 style={styles.confirmTitle}>Are you sure you want to clear the form?</h3>
              <div style={styles.confirmButtons}>
                <button style={styles.confirmNoBtn} onClick={() => setShowClearConfirm(false)}>No</button>
                <button style={styles.confirmYesBtn} onClick={confirmClearForm}>Yes</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Add Record view - bottom container is the form; top remains same
  if (currentView === 'addHistoryLog') {
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <div style={styles.titleSection}>
            <img 
                    src={Logo} 
                    alt="Preview"
                    style={{
                      position: 'absolute',
                      width: '250px',        
                      height: '180px',      
                      objectFit: 'cover',    
                      borderRadius: '10px',  
                      left: '525px',
                      top: '-30px'
                    }}
                  />
            <div style={styles.mainTitle}>LEONARDO MEDICAL SERVICES</div>
            <div style={styles.address}>B1 L17-E Neovista, Bagumbong, Caloocan City</div>
          </div>
        </div>

        <div style={styles.sectionContainer}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>PATIENT DETAILS</h2>
            <button style={styles.closeBtn} onClick={onBack}>✕</button>
          </div>

          <div style={styles.detailsContent}>
            <div style={styles.patientCard}>
              <h1 style={styles.patientName}>
                {patient ? `${patient.firstName} ${patient.lastName}` : 'N/A'}
              </h1>

              <div style={styles.infoGrid}>
                <div style={styles.infoItem}>
                  <span style={styles.infoLabel}>Sex/Gender:</span>
                  <span style={styles.infoValue}>{patient?.sex || 'N/A'}</span>
                </div>
                <div style={styles.infoItem}>
                  <span style={styles.infoLabel}>Date of Birth:</span>
                  <span style={styles.infoValue}>{patient?.birthDate || 'N/A'}</span>
                </div>
                <div style={styles.infoItem}>
                  <span style={styles.infoLabel}>Age:</span>
                  <span style={styles.infoValue}>{patient?.age || 'N/A'}</span>
                </div>
                <div style={styles.infoItem}>
                  <span style={styles.infoLabel}>Phone Number:</span>
                  <span style={styles.infoValue}>{patient?.contactNo || 'N/A'}</span>
                </div>
              </div>

              <div style={styles.infoGrid}>
                <div style={styles.infoItem}>
                  <span style={styles.infoLabel}>Senior Citizen / PWD ID:</span>
                  <span style={styles.infoValue}>{patient?.seniorPwdId || 'N/A'}</span>
                </div>
                <div style={styles.infoItem}>
                  <span style={styles.infoLabel}>Address:</span>
                  <span style={styles.infoValue}>{patient?.address || 'N/A'}</span>
                </div>
                
                <div style={styles.infoItem}>
                  <span style={styles.infoLabel}>Date Registered:</span>
                  <span style={styles.infoValue}>{patient?.date || 'N/A'}</span>
                </div>
                <div style={styles.infoItem}>
                  <span style={styles.infoLabel}>Status</span>
                  <span style={styles.infoValue}>{patient?.status || 'Active'}</span>
                </div>
              </div>

            </div>

             <div style={styles.remarksCard}>
              <h3 style={styles.remarksTitle}>Assessment/Remarks</h3>
              {isEditingRemarks ? (
                <textarea
                  style={styles.remarksTextarea}
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  rows="6"
                />
              ) : (
                <div style={styles.remarksBox}>
                  <p style={styles.remarksText}>{remarks || 'No remarks yet'}</p>
                </div>
              )}
              <button
                style={styles.editBtn}
                onClick={isEditingRemarks ? handleSaveRemarks : handleEditRemarks}
              >
                {isEditingRemarks ? 'SAVE' : 'EDIT'}
              </button>
            </div>
          </div>
        </div>

        <div style={styles.sectionContainer}>
          <div style={styles.sectionHeader2}>
            <h2 style={styles.sectionTitle2}>HISTORY LOG</h2>
            <button style={styles.closeBtn} onClick={handleBackToList}>✕</button>
          </div>

          <div style={styles.historyLog}>
            

            
          </div>
        </div>

        
      
      </div>
    );
  }

  // fallback render
  return null;
};

// (styles unchanged from your original file; kept as-is)
const styles = {
  container: {
    fontFamily: 'Arial, sans-serif',
    margin: '0 auto',
    padding: '20px',
    backgroundColor: '#fff3f3',
    minHeight: '100vh'
  },
  header: {
    padding: '20px',
    borderRadius: '8px',
    marginBottom: '20px',
  },
  titleSection: {
    textAlign: 'center',
    flex: 1,
  },
  mainTitle: {
    fontFamily: 'Arial, sans-serif',
    fontSize: '28px',
    fontWeight: '800',
    color: '#c50202',
    marginBottom: '5px',
  },
  address: {
    fontSize: '14px',
    color: '#666'
  },
  sectionContainer: {
    backgroundColor: 'fff3f3',
    borderRadius: '8px',
    padding: '20px',
    marginBottom: '20px',
    
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '6px solid #8b0000',
    borderRadius: '3px',
    paddingBottom: '10px',
    marginBottom: '20px'
  },
  sectionHeader2: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: '10px',
    marginBottom: '10px'
  },
  sectionTitle: {
    color: '#8b0000',
    fontSize: '22px',
    fontWeight: 'bold',
    margin: 0,
    letterSpacing: '0.5px'
  },
  sectionTitle2: {
    color: '#8b0000',
    fontSize: '30px',
    fontWeight: 'bold',
    margin: 0,
    letterSpacing: '0.5px',
    
  },
  closeBtn: {
    width: '30px',
    height: '30px',
    border: '2px solid #8b0000',
    backgroundColor: 'white',
    color: '#8b0000',
    fontSize: '18px',
    fontWeight: 'bold',
    cursor: 'pointer',
    borderRadius: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  addRecordBtn: {
    padding: '15px 40px',
    backgroundColor: '#8b0000',
    color: 'white',
    border: 'none',
    borderRadius: '20px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 'bold'
  },
  addHistoryLog: {
    display: 'flex',
    
    padding: '15px 40px',
    backgroundColor: '#8b0000',
    color: 'white',
    border: 'none',
    borderRadius: '20px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 'bold'
  },
  detailsContent: {
    display: 'flex',
    gap: '20px'
  },
  patientCard: {
    flex: 1,
    border: '3px solid #8b0000',
    borderRadius: '12px',
    padding: '20px',
    backgroundColor: '#fff'
  },
  patientName: {
    textAlign: 'center',
    color: '#8b0000',
    fontSize: '45px',
    fontWeight: 'bold',
    margin: '0 0 50px 0',
    
  },
  infoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '70px',
    marginBottom: '60px',
    marginLeft: '70px'
  },
  infoItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '5px'
  },
  infoLabel: {
    fontSize: '15px',
    color: '#666',
    fontWeight: '600'
  },
  infoValue: {
    fontSize: '18px',
    color: '#333',
    fontWeight: 'bold'
  },
  remarksCard: {
    width: '280px',
    border: '3px solid #8b0000',
    borderRadius: '12px',
    padding: '20px',
    backgroundColor: '#fff',
    display: 'flex',
    flexDirection: 'column',
    height: 'fit-content'
  },
  remarksTitle: {
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#333',
    margin: '0 0 15px 0'
  },
  remarksBox: {
    backgroundColor: '#fff',
    border: '1px solid #ddd',
    borderRadius: '8px',
    padding: '15px',
    marginBottom: '15px',
    minHeight: '150px'
  },
  remarksText: {
    fontSize: '13px',
    color: '#333',
    margin: '0 0 8px 0',
    lineHeight: '1.5',
    whiteSpace: 'pre-wrap'
  },
  remarksTextarea: {
    width: '100%',
    minHeight: '150px',
    padding: '15px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    fontSize: '13px',
    fontFamily: 'Arial, sans-serif',
    marginBottom: '15px',
    resize: 'vertical',
    boxSizing: 'border-box'
  },
  editBtn: {
    padding: '10px',
    backgroundColor: '#8b0000',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 'bold',
    width: '100%'
  },
  historyContent: {
    backgroundColor: '#ffcccb',
    borderRadius: '8px',
    border: '3px solid #8b0000',
    padding: '20px'
    
  },
  searchContainer: {
    marginBottom: '15px'
  },
  searchInput: {
    width: '250px',
    padding: '8px 15px',
    borderRadius: '20px',
    border: '2px solid #8d1a1c',
    fontSize: '13px',
    outline: 'none',
    backgroundColor: 'white'
  },
  tableContainer: {
    backgroundColor: 'white',
    borderRadius: '8px',
    overflow: 'hidden',
    border: '2px solid #8b0000'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse'
  },
  headerRow: {
    backgroundColor: '#8b0000'
  },
  th: {
    padding: '12px',
    textAlign: 'center',
    color: 'white',
    fontWeight: 'bold',
    fontSize: '14px',
    borderRight: '1px solid #a52a2a'
  },
  tableRow: {
    borderBottom: '1px solid white'
  },
  td: {
    padding: '12px',
    fontSize: '14px',
    borderRight: '1px solid white',
    color: '#000000ff',
    textAlign: 'center'
  },
  viewDocBtn: {
    padding: '5px 15px',
    backgroundColor: '#8b0000',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: 'bold'
  },
  recordDetailContent: {
    display: 'flex',
    gap: '20px',
    backgroundColor: '#ffcccb',
    padding: '20px',
    borderRadius: '8px',
    border: '3px solid #8b0000'
  },
  historyLog: {
    display: 'flex',
    backgroundColor: '#ffcccb',
    padding: '500px',
    borderRadius: '8px',
    border: '3px solid #8b0000'
  },
  recordDetailLeft: {
    flex: 1,
    backgroundColor: '#ffcccb',
    padding: '20px',
    borderRadius: '8px',
    
  },
  recordDetailRight: {
    width: '600px',
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '8px',
    border: '2px solid #8b0000'
  },
  recordHeader: {
    gap: '15px',
    marginBottom: '20px',
    alignItems: 'center'
  },
  recordTitleSmall: {
    textAlign: 'center',
    fontSize: '25px',
    fontWeight: 'bold',
    color: '#8b0000',
    
  },
  recordSubtitle: {
    fontSize: '17px',
    color: '#666',
    paddingBottom: '10px',
    marginTop: '30px'
  },
  
  dateInput: {
    marginLeft: '10px',
    padding: '4px 8px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '15px'
  },
  formSection: {
    marginBottom: '55px'
  },
  formLabel: {
    display: 'block',
    fontSize: '30px',
    fontWeight: 'bold',
    color: '#333',
    marginBottom: '10px',
    textAlign: 'center'
  },
  textarea: {
    width: '100%',
    padding: '40px',
    borderRadius: '6px',
    fontSize: '30px',
    fontFamily: 'Arial, sans-serif',
    resize: 'vertical',
    outline: 'none',
    boxSizing: 'border-box',
    border: '2px solid #8b0000'
  },
  textarea2: {
    width: '100%',
    padding: '50px',
    borderRadius: '6px',
    fontSize: '30px',
    fontFamily: 'Arial, sans-serif',
    outline: 'none',
    boxSizing: 'border-box',
    border: '2px solid #8b0000'
  },
  formRow2: {
    display: 'flex',
    justifyContent: 'center',
    gap: '100px'
  },
  signatureSection: {
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: '30px',
    paddingTop: '20px',
    
  },
  signatureItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '5px'
  },
  signatureLabel: {
    fontSize: '20px',
    color: '#666',
    fontWeight: 'bold'
  },
  signatureValue: {
    fontSize: '16px',
    color: '#333',
    fontWeight: '600'
  },
  billingSection: {
    marginBottom: '20px'
  },
  billingTitle: {
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#333',
    marginBottom: '10px'
  },
  billingRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '8px 0',
    fontSize: '13px',
    color: '#333'
  },
  billingSectionBorder: {
    borderTop: '2px solid #8b0000',
    paddingTop: '15px',
    marginTop: '15px',
    marginBottom: '20px'
  },
  billingTotal: {
    backgroundColor: '#f9f9f9',
    padding: '15px',
    borderRadius: '6px',
    marginBottom: '20px'
  },
  totalRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  totalLabel: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#333'
  },
  totalValue: {
    fontSize: '25px',
    fontWeight: 'bold',
    color: '#8b0000'
  },
  statusRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '10px',
    backgroundColor: '#f9f9f9',
    borderRadius: '6px'
  },
  statusLabel: {
    fontSize: '13px',
    fontWeight: 'bold',
    color: '#333'
  },
  statusValue: {
    fontSize: '13px',
    fontWeight: 'bold',
    color: '#8b0000'
  },
  printBtn: {
    width: '100%',
    padding: '12px',
    backgroundColor: '#8b0000',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold'
  },
  labSection: {
    marginTop: '10px',
    padding: '20px',
    backgroundColor: '#f9f9f9',
    borderRadius: '8px',
    border: '2px solid #8b0000'
  },
  labTitle: {
    fontSize: '25px',
    fontWeight: 'bold',
    color: '#8b0000',
    marginBottom: '15px'
  },
  labControls: {
    display: 'flex',
    gap: '10px',
    marginBottom: '15px',
    flexWrap: 'wrap'
  },
  labSelect: {
    padding: '15px 40px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontSize: '15px',
    outline: 'none',
    cursor: 'pointer',
    backgroundColor: 'white'
  },
  addLabBtn: {
    padding: '8px 20px',
    backgroundColor: '#8b0000',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 'bold'
  },
  labTable: {
    width: '100%',
    borderCollapse: 'collapse',
    marginTop: '15px'
  },
  labHeaderRow: {
    backgroundColor: '#8b0000'
  },
  labTh: {
    padding: '10px',
    textAlign: 'left',
    color: 'white',
    fontSize: '18px',
    fontWeight: 'bold'
  },
  labRow: {
    backgroundColor: 'white',
    borderBottom: '1px solid #ddd'
  },
  labTd: {
    padding: '10px',
    fontSize: '15px',
    color: '#333'
  },
  removeBtn: {
    padding: '2px 8px',
    backgroundColor: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px'
  },
  statusSection: {
    display: 'flex',
    gap: '20px',
    marginTop: '20px',
    padding: '15px',
    backgroundColor: '#ffcccb',
    borderRadius: '8px',
    flexWrap: 'wrap'
  },
  statusGroup: {
    flex: 1,
    minWidth: '150px'
  },
  statusGroupTitle: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#333',
    marginBottom: '10px'
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '18px',
    marginBottom: '8px',
    color: '#333'
  },
  admittedSection: {
    display: 'flex',
    gap: '20px',
    marginTop: '20px'
  },
  admittedGroup: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  admittedLabel: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#333'
  },
  admittedSelect: {
    padding: '8px 12px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontSize: '18px',
    outline: 'none',
    cursor: 'pointer',
    backgroundColor: 'white'
  },
  submitRecordBtn: {
    width: '200px',
    marginTop: '20px',
    padding: '15px',
    backgroundColor: '#8b0000',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold',
  },

  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2000
  },
  confirmModal: {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '30px',
    width: '90%',
    maxWidth: '400px',
    textAlign: 'center',
    boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
  },
  confirmTitle: {
    color: '#333',
    fontSize: '20px',
    marginBottom: '25px',
    fontWeight: '600'
  },
  confirmButtons: {
    display: 'flex',
    gap: '15px',
    justifyContent: 'center'
  },
  confirmNoBtn: {
    padding: '12px 40px',
    backgroundColor: 'white',
    color: '#8b0000',
    border: '2px solid #8b0000',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: 'bold'
  },
  confirmYesBtn: {
    padding: '12px 40px',
    backgroundColor: '#8b0000',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: 'bold'
  }
};

export default PatientRecordView;
