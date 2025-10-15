import React, { useState, useEffect } from 'react';
import Logo from '/src/zLogo.png';


const PatientList = ({ onNavigateToRecord }) => {
  const [patients, setPatients] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAlphaDropdown, setShowAlphaDropdown] = useState(false);
  const [showDateDropdown, setShowDateDropdown] = useState(false);
  const [showCustomDateRange, setShowCustomDateRange] = useState(false);
  const [showAddPatientModal, setShowAddPatientModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [patientToArchive, setPatientToArchive] = useState(null);
  const [alphaSort, setAlphaSort] = useState('Alphabetized');
  const [dateFilter, setDateFilter] = useState('Today');
  const [customDay, setCustomDay] = useState('');
  const [customMonth, setCustomMonth] = useState('');
  const [customYear, setCustomYear] = useState('');
  const [formErrors, setFormErrors] = useState({});

  const rowsPerPage = 10;

  const getCurrentDateTime = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const [patientForm, setPatientForm] = useState({
    lastName: '',
    firstName: '',
    middleName: '',
    birthDate: '',
    age: '',
    sex: '',
    contactNo: '',
    address: '',
    seniorPwdId: '',
    registerDate: getCurrentDateTime()
  });

  const calculateAge = (birthDate) => {
    if (!birthDate) return '';
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age >= 0 ? age.toString() : '';
  };

  const validateName = (name, fieldName) => {
    if (!name.trim()) {
      return `${fieldName} is required`;
    }
    if (name.trim().length < 3) {
      return `${fieldName} must be at least 3 characters`;
    }
    if (!/^[a-zA-Z\s]+$/.test(name)) {
      return `${fieldName} can only contain letters`;
    }
    return '';
  };

  const validateContactNo = (contactNo) => {
    if (contactNo && !/^\d{11}$/.test(contactNo)) {
      return 'Contact number must be exactly 11 digits';
    }
    return '';
  };

  const validateForm = () => {
    const errors = {};

    const lastNameError = validateName(patientForm.lastName, 'Last name');
    if (lastNameError) errors.lastName = lastNameError;

    const firstNameError = validateName(patientForm.firstName, 'First name');
    if (firstNameError) errors.firstName = firstNameError;

    const middleNameError = validateName(patientForm.middleName, 'Middle name');
    if (middleNameError) errors.middleName = middleNameError;

    if (!patientForm.sex) {
      errors.sex = 'Sex is required';
    }

    if (!patientForm.address.trim()) {
      errors.address = 'Address is required';
    }

    const contactError = validateContactNo(patientForm.contactNo);
    if (contactError) errors.contactNo = contactError;

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (field, value) => {
    if (field === 'lastName' || field === 'firstName' || field === 'middleName') {
      value = value.replace(/[^a-zA-Z\s]/g, '');
    }
    
    if (field === 'contactNo') {
      value = value.replace(/\D/g, '').slice(0, 11);
    }

    if (field === 'birthDate') {
      const age = calculateAge(value);
      setPatientForm({
        ...patientForm,
        [field]: value,
        age: age
      });
      return;
    }

    setPatientForm({
      ...patientForm,
      [field]: value
    });

    if (formErrors[field]) {
      const newErrors = { ...formErrors };
      delete newErrors[field];
      setFormErrors(newErrors);
    }
  };

  const formatPatientName = (lastName, firstName) => {
    const firstInitial = firstName ? firstName.charAt(0).toUpperCase() : '';
    return `${lastName}, ${firstInitial}.`;
  };

  const formatDateTime = (date) => {
    const d = new Date(date);
    const hours = d.getHours();
    const minutes = d.getMinutes();
    const ampm = hours >= 12 ? 'pm' : 'am';
    const displayHours = hours % 12 || 12;
    const displayMinutes = minutes < 10 ? '0' + minutes : minutes;
    
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[d.getMonth()];
    const day = d.getDate();
    const year = d.getFullYear();
    
    return {
      time: `${displayHours}:${displayMinutes}${ampm}`,
      date: `${day} ${month}, ${year}`
    };
  };

  const filterPatientsByDate = (patientsList) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    return patientsList.filter(patient => {
      const patientDate = new Date(patient.registeredAt);
      const patientDay = new Date(patientDate.getFullYear(), patientDate.getMonth(), patientDate.getDate());
      
      if (dateFilter === 'Recent' || dateFilter === 'Today') {
        return patientDay.getTime() === today.getTime();
      } else if (dateFilter === 'Yesterday') {
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        return patientDay.getTime() === yesterday.getTime();
      } else if (dateFilter === 'Last Week') {
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        return patientDay >= weekAgo && patientDay <= today;
      } else if (dateFilter === 'Last Month') {
        const monthAgo = new Date(today);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        return patientDay >= monthAgo && patientDay <= today;
      } else if (dateFilter === 'Custom Range') {
        if (customDay && customMonth && customYear) {
          const customDate = new Date(parseInt(customYear), parseInt(customMonth) - 1, parseInt(customDay));
          return patientDay.getTime() === customDate.getTime();
        }
        return true;
      }
      return true;
    });
  };

  const sortPatients = (patientsList) => {
    let sorted = [...patientsList];
    
    if (alphaSort === 'Ascending') {
      sorted.sort((a, b) => a.lastName.localeCompare(b.lastName));
    } else if (alphaSort === 'Descending') {
      sorted.sort((a, b) => b.lastName.localeCompare(a.lastName));
    }
    
    return sorted;
  };

  const getFilteredAndSortedPatients = () => {
    let filtered = patients.filter(patient => 
      patient.displayName.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    filtered = filterPatientsByDate(filtered);
    filtered = sortPatients(filtered);
    
    return filtered;
  };

  const filteredPatients = getFilteredAndSortedPatients();
  const totalPages = Math.ceil(filteredPatients.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const currentPatients = filteredPatients.slice(startIndex, endIndex);
  const emptyRows = rowsPerPage - currentPatients.length;

  const handleView = (patient) => {
    if (onNavigateToRecord) {
      onNavigateToRecord(patient);
    } else {
      console.log('View patient:', patient);
      alert('Please provide onNavigateToRecord prop to enable navigation');
    }
  };

  const handleArchive = (patient) => {
    setPatientToArchive(patient);
    setShowArchiveModal(true);
  };

  const handleConfirmArchive = () => {
    setPatients(patients.filter(p => p.id !== patientToArchive.id));
    setShowArchiveModal(false);
    setPatientToArchive(null);
    if (currentPatients.length === 1 && currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleAlphaSelect = (option) => {
    setAlphaSort(option);
    setShowAlphaDropdown(false);
  };

  const handleDateSelect = (option) => {
    if (option === 'Custom Range') {
      setShowCustomDateRange(true);
      setDateFilter(option);
      setShowDateDropdown(false);
    } else {
      setDateFilter(option);
      setShowCustomDateRange(false);
      setShowDateDropdown(false);
    }
  };

  const handleAddPatient = () => {
    setShowAddPatientModal(true);
    setPatientForm({
      lastName: '',
      firstName: '',
      middleName: '',
      birthDate: '',
      age: '',
      sex: '',
      contactNo: '',
      address: '',
      seniorPwdId: '',
      registerDate: getCurrentDateTime()
    });
    setFormErrors({});
  };

  const handleSavePatient = () => {
    if (!validateForm()) {
      return;
    }
    setShowAddPatientModal(false);
    setShowConfirmModal(true);
  };

  const handleConfirmAdd = () => {
    const registerDateTime = new Date(patientForm.registerDate);
    const newPatient = {
      id: Date.now(),
      ...patientForm,
      displayName: formatPatientName(patientForm.lastName, patientForm.firstName),
      registeredAt: registerDateTime,
      ...formatDateTime(registerDateTime)
    };
    
    setPatients([...patients, newPatient]);
    setShowConfirmModal(false);
    setPatientForm({
      lastName: '',
      firstName: '',
      middleName: '',
      birthDate: '',
      age: '',
      sex: '',
      contactNo: '',
      address: '',
      seniorPwdId: '',
      registerDate: getCurrentDateTime()
    });
    setFormErrors({});
  };

  const handleCancelModal = () => {
    setShowAddPatientModal(false);
    setPatientForm({
      lastName: '',
      firstName: '',
      middleName: '',
      birthDate: '',
      age: '',
      sex: '',
      contactNo: '',
      address: '',
      seniorPwdId: '',
      registerDate: getCurrentDateTime()
    });
    setFormErrors({});
  };

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, alphaSort, dateFilter, customDay, customMonth, customYear]);

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

      <div style={styles.controls}>
        <div style={styles.searchContainer}>
          <input 
            type="text" 
            placeholder="Search..." 
            style={styles.searchInput}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div style={styles.dropdownContainer}>
          <button 
            style={styles.filterBtn}
            onClick={() => {
              setShowAlphaDropdown(!showAlphaDropdown);
              setShowDateDropdown(false);
            }}
          >
            {alphaSort} ↓
          </button>
          {showAlphaDropdown && (
            <div style={styles.dropdownMenu}>
              <div 
                style={styles.dropdownItem}
                onClick={() => handleAlphaSelect('Ascending')}
              >
                Ascending
              </div>
              <div 
                style={styles.dropdownItem}
                onClick={() => handleAlphaSelect('Descending')}
              >
                Descending
              </div>
            </div>
          )}
        </div>

        <div style={styles.dropdownContainer}>
          <button 
            style={styles.filterBtn}
            onClick={() => {
              setShowDateDropdown(!showDateDropdown);
              setShowAlphaDropdown(false);
            }}
          >
            {dateFilter} ↓
          </button>
          {showDateDropdown && (
            <div style={styles.dropdownMenu}>
              <div style={styles.dropdownItem} onClick={() => handleDateSelect('Recent')}>Today</div>
              <div style={styles.dropdownItem} onClick={() => handleDateSelect('Yesterday')}>Yesterday</div>
              <div style={styles.dropdownItem} onClick={() => handleDateSelect('Last Week')}>Last Week</div>
              <div style={styles.dropdownItem} onClick={() => handleDateSelect('Last Month')}>Last Month</div>
              <div style={styles.dropdownItem} onClick={() => handleDateSelect('Custom Range')}>Custom Range</div>
            </div>
          )}
        </div>

        {showCustomDateRange && (
          <div style={styles.customDateRange}>
            <select 
              style={styles.dateSelect}
              value={customDay}
              onChange={(e) => setCustomDay(e.target.value)}
            >
              <option value="">Day</option>
              {[...Array(31)].map((_, i) => (
                <option key={i} value={i + 1}>{i + 1}</option>
              ))}
            </select>
            <select 
              style={styles.dateSelect}
              value={customMonth}
              onChange={(e) => setCustomMonth(e.target.value)}
            >
              <option value="">Month</option>
              {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((m, i) => (
                <option key={i} value={i + 1}>{m}</option>
              ))}
            </select>
            <select 
              style={styles.dateSelect}
              value={customYear}
              onChange={(e) => setCustomYear(e.target.value)}
            >
              <option value="">Year</option>
              {[...Array(10)].map((_, i) => (
                <option key={i} value={2025 - i}>{2025 - i}</option>
              ))}
            </select>
          </div>
        )}

        <button style={styles.addPatientBtn} onClick={handleAddPatient}>+ Add Patient</button>
      </div>

      <div style={styles.tableContainer}>
        <table style={styles.table}>
          <thead>
            <tr style={styles.headerRow}>
              <th style={styles.th}>Name</th>
              <th style={styles.th}>Time and Date</th>
              <th style={styles.th}>Action</th>
            </tr>
          </thead>
          <tbody>
            {currentPatients.map((patient, index) => (
              <tr key={patient.id} style={{
                ...styles.tableRow,
                backgroundColor: index % 2 === 0 ? '#ffcccb' : '#ffb3b3'
              }}>
                <td style={styles.td}>{patient.displayName}</td>
                <td style={styles.td}>
                  <span style={styles.time}>{patient.time}</span>
                  <span style={styles.date}>{patient.date}</span>
                </td>
                <td style={styles.td}>
                  <button 
                    style={styles.viewBtn}
                    onClick={() => handleView(patient)}
                  >
                    View
                  </button>
                  <button 
                    style={styles.archiveBtn}
                    onClick={() => handleArchive(patient)}
                  >
                    Archive
                  </button>
                </td>
              </tr>
            ))}
            {[...Array(emptyRows)].map((_, i) => (
              <tr key={`empty-${i}`} style={{
                ...styles.tableRow,
                backgroundColor: (currentPatients.length + i) % 2 === 0 ? '#ffcccb' : '#ffb3b3'
              }}>
                <td style={styles.td}>&nbsp;</td>
                <td style={styles.td}>&nbsp;</td>
                <td style={styles.td}>&nbsp;</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div style={styles.pagination}>
          <button 
            style={styles.pageBtn}
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            &lt;
          </button>
          {[...Array(totalPages)].map((_, i) => (
            <button 
              key={i}
              style={currentPage === i + 1 ? {...styles.pageBtn, ...styles.activePageBtn} : styles.pageBtn}
              onClick={() => handlePageChange(i + 1)}
            >
              {i + 1}
            </button>
          ))}
          <button 
            style={styles.pageBtn}
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            &gt;
          </button>
        </div>
      )}

      {showAddPatientModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>PATIENT DETAILS</h2>
            </div>
            <div style={styles.modalBody}>
              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>LAST NAME *</label>
                  <input 
                    type="text" 
                    style={{...styles.input, ...(formErrors.lastName ? styles.inputError : {})}}
                    value={patientForm.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                  />
                  {formErrors.lastName && <span style={styles.errorText}>{formErrors.lastName}</span>}
                </div>
              </div>

              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>FIRST NAME *</label>
                  <input 
                    type="text" 
                    style={{...styles.input, ...(formErrors.firstName ? styles.inputError : {})}}
                    value={patientForm.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                  />
                  {formErrors.firstName && <span style={styles.errorText}>{formErrors.firstName}</span>}
                </div>
              </div>

              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>MIDDLE NAME *</label>
                  <input 
                    type="text" 
                    style={{...styles.input, ...(formErrors.middleName ? styles.inputError : {})}}
                    value={patientForm.middleName}
                    onChange={(e) => handleInputChange('middleName', e.target.value)}
                  />
                  {formErrors.middleName && <span style={styles.errorText}>{formErrors.middleName}</span>}
                </div>
              </div>

              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>BIRTH DATE</label>
                  <input 
                    type="date" 
                    style={styles.input}
                    value={patientForm.birthDate}
                    onChange={(e) => handleInputChange('birthDate', e.target.value)}
                  />
                </div>
              </div>

              <div style={styles.formRow}>
                <div style={styles.formGroupSmall}>
                  <label style={styles.label}>AGE</label>
                  <input 
                    type="text" 
                    style={{...styles.input, ...styles.readOnlyInput}}
                    value={patientForm.age}
                    readOnly
                    title="Age is calculated from birth date"
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>SENIOR/PWD ID NO</label>
                  <input 
                    type="text" 
                    style={styles.input}
                    value={patientForm.seniorPwdId}
                    onChange={(e) => handleInputChange('seniorPwdId', e.target.value)}
                  />
                </div>
              </div>

              <div style={styles.formRow}>
                <div style={styles.formGroupSmall}>
                  <label style={styles.label}>SEX *</label>
                  <select 
                    style={{...styles.selectInput, ...(formErrors.sex ? styles.inputError : {})}}
                    value={patientForm.sex}
                    onChange={(e) => handleInputChange('sex', e.target.value)}
                  >
                    <option value="">Select</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                  {formErrors.sex && <span style={styles.errorText}>{formErrors.sex}</span>}
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>REGISTER DATE</label>
                  <input 
                    type="datetime-local" 
                    style={styles.input}
                    value={patientForm.registerDate}
                    onChange={(e) => handleInputChange('registerDate', e.target.value)}
                  />
                </div>
              </div>

              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>CONTACT NO.</label>
                  <input 
                    type="text" 
                    style={{...styles.input, ...(formErrors.contactNo ? styles.inputError : {})}}
                    value={patientForm.contactNo}
                    onChange={(e) => handleInputChange('contactNo', e.target.value)}
                    placeholder="11 digits"
                    maxLength="11"
                  />
                  {formErrors.contactNo && <span style={styles.errorText}>{formErrors.contactNo}</span>}
                </div>
              </div>

              <div style={styles.formRowFull}>
                <div style={styles.formGroupFull}>
                  <label style={styles.label}>ADDRESS *</label>
                  <input 
                    type="text" 
                    style={{...styles.input, ...(formErrors.address ? styles.inputError : {})}}
                    value={patientForm.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                  />
                  {formErrors.address && <span style={styles.errorText}>{formErrors.address}</span>}
                </div>
              </div>
            </div>
            <div style={styles.modalFooter}>
              <button style={styles.cancelBtn} onClick={handleCancelModal}>Cancel</button>
              <button style={styles.saveBtn} onClick={handleSavePatient}>Save</button>
            </div>
          </div>
        </div>
      )}

      {showConfirmModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.confirmModal}>
            <h3 style={styles.confirmTitle}>Add new patient?</h3>
            <div style={styles.confirmButtons}>
              <button 
                style={styles.confirmNoBtn}
                onClick={() => setShowConfirmModal(false)}
              >
                No
              </button>
              <button 
                style={styles.confirmYesBtn}
                onClick={handleConfirmAdd}
              >
                Yes
              </button>
            </div>
          </div>
        </div>
      )}

      {showArchiveModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.confirmModal}>
            <h3 style={styles.confirmTitle}>Archive patient?</h3>
            <div style={styles.confirmButtons}>
              <button 
                style={styles.confirmNoBtn}
                onClick={() => {
                  setShowArchiveModal(false);
                  setPatientToArchive(null);
                }}
              >
                No
              </button>
              <button 
                style={styles.confirmYesBtn}
                onClick={handleConfirmArchive}
              >
                Yes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

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
  controls: {
    display: 'flex',
    gap: '45px',
    marginBottom: '20px',
    alignItems: 'center',
    flexWrap: 'wrap'
  },
  searchContainer: {
    width: '250px'
  },
  searchInput: {
    width: '100%',
    padding: '10px 15px',
    borderRadius: '25px',
    border: '2px solid #8d1a1c',
    fontSize: '14px',
  },
  dropdownContainer: {
    position: 'relative'
  },
  filterBtn: {
    padding: '10px 20px',
    backgroundColor: 'white',
    border: '2px solid #8d1a1c',
    borderRadius: '25px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    whiteSpace: 'nowrap'
  },
  dropdownMenu: {
    position: 'absolute',
    top: '100%',
    left: '0',
    marginTop: '5px',
    backgroundColor: 'white',
    border: '2px solid #ddd',
    borderRadius: '8px',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
    zIndex: 1000,
    minWidth: '150px'
  },
  dropdownItem: {
    padding: '10px 15px',
    cursor: 'pointer',
    fontSize: '14px',
    borderBottom: '1px solid #f0f0f0'
  },
  customDateRange: {
    display: 'flex',
    zIndex: 1000,
    gap: '10px'
  },
  dateSelect: {
    padding: '10px',
    borderRadius: '25px',
    border: '2px solid #ddd',
    fontSize: '14px',
    cursor: 'pointer',
    outline: 'none'
  },
  addPatientBtn: {
    padding: '10px 25px',
    backgroundColor: '#8b0000',
    color: 'white',
    border: 'none',
    borderRadius: '25px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold',
    whiteSpace: 'nowrap',
    marginLeft: 'auto',
    boxShadow: '4px 4px 10px rgba(0, 0, 0, 0.6)'
  },
  tableContainer: {
    backgroundColor: 'white',
    border: '3px solid #8d1a1c',
    borderRadius: '8px',
    overflow: 'hidden',
    marginBottom: '20px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.5)'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse'
  },
  headerRow: {
    backgroundColor: '#8b0000',
  },
  th: {
    padding: '15px',
    textAlign: 'center',
    color: 'white',
    fontWeight: 'bold',
    fontSize: '16px',
    borderRight: '1px solid #a52a2a'
  },
  tableRow: {
    borderBottom: '1px solid white'
  },
  td: {
    padding: '15px',
    textAlign: 'center',
    fontSize: '14px',
    borderRight: '1px solid white',
    color: '#333'
  },
  time: {
    marginRight: '15px',
    fontWeight: '600'
  },
  date: {
    color: '#666'
  },
  viewBtn: {
    padding: '6px 16px',
    backgroundColor: 'white',
    border: '2px solid #4a4a4a',
    borderRadius: '15px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: '600',
    marginRight: '8px',
    color: '#333'
  },
  archiveBtn: {
    padding: '6px 16px',
    backgroundColor: '#8b0000',
    border: 'none',
    borderRadius: '15px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: '600',
    color: 'white'
  },
  pagination: {
    display: 'flex',
    justifyContent: 'center',
    gap: '8px',
    backgroundColor: '#ffcccb',
    padding: '15px',
    borderRadius: '25px',
    width: 'fit-content',
    margin: '0 auto'
  },
  pageBtn: {
    width: '35px',
    height: '35px',
    borderRadius: '50%',
    border: 'none',
    backgroundColor: 'white',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    color: '#333'
  },
  activePageBtn: {
    backgroundColor: '#8b0000',
    color: 'white'
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
  modal: {
    backgroundColor: 'white',
    borderRadius: '8px',
    width: '90%',
    maxWidth: '700px',
    maxHeight: '90vh',
    overflow: 'auto',
    boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
  },
  modalHeader: {
    backgroundColor: '#8b0000',
    padding: '15px 20px',
    borderBottom: '3px solid #6b0000'
  },
  modalTitle: {
    color: 'white',
    margin: 0,
    fontSize: '20px',
    fontWeight: 'bold',
    textAlign: 'center',
    letterSpacing: '1px'
  },
  modalBody: {
    padding: '25px'
  },
  formRow: {
    display: 'flex',
    gap: '20px',
    marginBottom: '15px'
  },
  formRowFull: {
    marginBottom: '15px'
  },
  formGroup: {
    flex: 1
  },
  formGroupSmall: {
    flex: '0 0 200px'
  },
  formGroupFull: {
    width: '100%'
  },
  label: {
    display: 'block',
    fontSize: '11px',
    fontWeight: 'bold',
    color: '#8b0000',
    marginBottom: '5px',
    letterSpacing: '0.5px'
  },
  input: {
    width: '100%',
    padding: '10px 12px',
    border: '2px solid #ffcccb',
    borderRadius: '6px',
    fontSize: '14px',
    outline: 'none',
    backgroundColor: '#fff5f5',
    boxSizing: 'border-box'
  },
  inputError: {
    border: '2px solid #ff0000'
  },
  readOnlyInput: {
    backgroundColor: '#f0f0f0',
    cursor: 'not-allowed'
  },
  errorText: {
    color: '#ff0000',
    fontSize: '11px',
    marginTop: '5px',
    display: 'block'
  },
  selectInput: {
    width: '100%',
    padding: '10px 12px',
    border: '2px solid #ffcccb',
    borderRadius: '6px',
    fontSize: '14px',
    outline: 'none',
    backgroundColor: '#fff5f5',
    cursor: 'pointer',
    boxSizing: 'border-box'
  },
  modalFooter: {
    padding: '20px',
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '15px',
    borderTop: '1px solid #f0f0f0'
  },
  cancelBtn: {
    padding: '10px 30px',
    backgroundColor: 'white',
    color: '#8b0000',
    border: '2px solid #8b0000',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold'
  },
  saveBtn: {
    padding: '10px 30px',
    backgroundColor: '#8b0000',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold'
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

export default PatientList;