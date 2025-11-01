import React, { useState, useEffect, useCallback } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeadCell, TableRow } from "flowbite-react";
import { useNavigate } from 'react-router-dom';
import ConfirmModal from '../ConfirmModal/ConfirmModal';
import Toast from '../Toast/Toast';
import { 
  ChevronDown, 
  ChevronUp, 
  Trash2, 
  CheckSquare, 
  Square,
  FileText,
  User,
  DollarSign,
  Receipt,
  Calendar,
  Clock,
  Edit3,
  Plus,
  Trash,
  Eye,
  AlertCircle,
  CreditCard
} from 'lucide-react';
import api from '../../axios/api';
import './HistoryLog.css';

const HistoryLog = ({ patient, onBack }) => {
  const navigate = useNavigate();
  const [historyLogs, setHistoryLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedLogs, setSelectedLogs] = useState(new Set());
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [deleting, setDeleting] = useState(false);
  const [collapsedDates, setCollapsedDates] = useState(new Set());

  // Modal and Toast states
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    type: 'warning',
    title: '',
    message: '',
    onConfirm: null,
    isLoading: false
  });
  const [toastConfig, setToastConfig] = useState({
    isVisible: false,
    message: '',
    type: 'success',
    duration: 4000
  });

  // Show toast function
  const showToast = (message, type = 'success', duration = 4000) => {
    setToastConfig({
      isVisible: true,
      message,
      type,
      duration
    });
  };

  // Close toast function
  const closeToast = () => {
    setToastConfig(prev => ({ ...prev, isVisible: false }));
  };

  // Show modal function
  const showModal = (title, message, type = 'warning', onConfirm) => {
    setModalConfig({
      isOpen: true,
      type,
      title,
      message,
      onConfirm,
      isLoading: false
    });
  };

  // Close modal function
  const closeModal = () => {
    setModalConfig(prev => ({ ...prev, isOpen: false }));
  };

  // Set modal loading state
  const setModalLoading = (isLoading) => {
    setModalConfig(prev => ({ ...prev, isLoading }));
  };

  // Get icon for source type
  const getSourceIcon = (sourceType) => {
    const icons = {
      'bill': DollarSign,
      'billed_service': Receipt,
      'document': FileText,
      'patient': User
    };
    return icons[sourceType] || FileText;
  };

  // Get icon for action type
  const getActionIcon = (action) => {
    const icons = {
      'created': Plus,
      'initial_creation': Plus,
      'updated': Edit3,
      'deleted': Trash,
      'viewed': Eye,
      'payment_recorded': CreditCard,
      'status_changed': Edit3,
      'status_updated': Edit3,
      'added': Plus,
      'removed': Trash,
      'quantity_updated': Edit3,
      'archived': Trash
    };
    return icons[action] || Edit3;
  };

  // Group logs by date
  const groupLogsByDate = (logs) => {
    const grouped = {};
    logs.forEach(log => {
      const date = new Date(log.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(log);
    });
    return grouped;
  };

  // Parse JSON safely
  const parseAuditData = (data) => {
    if (!data) return null;
    if (typeof data === 'object') return data;
    try {
      return JSON.parse(data);
    } catch (error) {
      console.error('Failed to parse audit data:', error);
      return null;
    }
  };

  // Format date for display
  const formatDateTime = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch (error) {
      return dateString;
    }
  };

  // Format field name to readable format
  const formatFieldName = (field) => {
    // Handle special cases
    const specialCases = {
      'id': 'ID',
      'firstName': 'First Name',
      'lastName': 'Last Name',
      'middleName': 'Middle Name',
      'phoneNumber': 'Phone Number',
      'emailAddress': 'Email Address',
      'dateOfBirth': 'Date of Birth',
      'createdAt': 'Created At',
      'updatedAt': 'Updated At',
      'medicalBillId': 'Medical Bill ID',
      'billedServiceId': 'Billed Service ID',
      'patientId': 'Patient ID',
      'documentId': 'Document ID',
      'amountPaid': 'Amount Paid',
      'paymentStatus': 'Payment Status',
      'totalAmount': 'Total Amount',
      'consultationFee': 'Consultation Fee',
      'discountRate': 'Discount Rate',
      'isSeniorPwdDiscountApplied': 'Senior/PWD Discount'
    };

    if (specialCases[field]) {
      return specialCases[field];
    }

    return field
      .replace(/([A-Z])/g, ' $1')
      .replace(/_/g, ' ')
      .trim()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  // Determine field type for better formatting
  const getFieldType = (value, fieldName = '') => {
    if (value === null || value === undefined) return 'null';
    if (typeof value === 'boolean') return 'boolean';
    if (typeof value === 'number') return 'number';
    
    // Check field name patterns for better type detection
    const lowerFieldName = fieldName.toLowerCase();
    if (lowerFieldName.includes('amount') || lowerFieldName.includes('price') || 
        lowerFieldName.includes('balance') || lowerFieldName.includes('fee') ||
        lowerFieldName.includes('subtotal')) {
      return 'currency';
    }
    
    if (lowerFieldName.includes('status')) {
      return 'status';
    }

    if (typeof value === 'string') {
      // Check if it's a date
      const dateRegex = /^\d{4}-\d{2}-\d{2}/;
      if (dateRegex.test(value)) return 'date';
      // Check if it's an email
      if (value.includes('@')) return 'email';
      // Check if it looks like money
      if (!isNaN(parseFloat(value)) && value.includes('.')) return 'currency';
    }
    if (typeof value === 'object') return 'object';
    return 'string';
  };

  // Format value for display based on type
  const formatValue = (value, fieldName = '') => {
    if (value === null || value === undefined) {
      return { display: 'Not Set', type: 'null' };
    }
    
    if (value === '') {
      return { display: 'Empty', type: 'empty' };
    }

    const type = getFieldType(value, fieldName);

    switch (type) {
      case 'boolean':
        return { display: value ? 'Yes' : 'No', type: 'boolean' };
      
      case 'status':
        // Format status values nicely
        const statusStr = String(value).replace(/_/g, ' ').toUpperCase();
        return { display: statusStr, type: 'status' };
      
      case 'date':
        try {
          const date = new Date(value);
          return {
            display: date.toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            }),
            type: 'date'
          };
        } catch {
          return { display: String(value), type: 'string' };
        }
      
      case 'currency':
        const numValue = typeof value === 'number' ? value : parseFloat(value);
        if (isNaN(numValue)) {
          return { display: String(value), type: 'string' };
        }
        return {
          display: `₱${numValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
          type: 'currency'
        };
      
      case 'number':
        return {
          display: Number(value).toLocaleString('en-US'),
          type: 'number'
        };
      
      case 'email':
        return { display: value, type: 'email' };
      
      case 'object':
        if (Array.isArray(value)) {
          return {
            display: `Array with ${value.length} item${value.length !== 1 ? 's' : ''}`,
            type: 'array',
            raw: value
          };
        }
        return {
          display: `Object with ${Object.keys(value).length} field${Object.keys(value).length !== 1 ? 's' : ''}`,
          type: 'object',
          raw: value
        };
      
      default:
        const str = String(value);
        const maxLength = 100;
        return {
          display: str.length > maxLength ? str.substring(0, maxLength) + '...' : str,
          type: 'string',
          full: str
        };
    }
  };

  // Get comprehensive audit display information
  const getAuditDisplayInfo = (log) => {
    const previousData = parseAuditData(log.previousData);
    const newData = parseAuditData(log.newData);
    const fieldsChanged = log.fieldsChanged?.split(',').map(f => f.trim()).filter(Boolean) || [];

    let sourceDisplay = log.sourceType 
      ? log.sourceType.replace(/_/g, ' ').toUpperCase()
      : 'SYSTEM';
    
    let actionDisplay = log.action.replace(/_/g, ' ').toUpperCase();

    const allChanges = [];

    // Handle different action types
    const isCreation = log.action === 'created' || log.action === 'initial_creation';
    const isDeletion = log.action === 'deleted' || log.action === 'removed' || log.action === 'archived';
    const isUpdate = log.action === 'updated' || log.action === 'payment_recorded' || 
                     log.action === 'status_changed' || log.action === 'status_updated' ||
                     log.action === 'quantity_updated' || log.action === 'added';

    if (isCreation) {
      // For creation, show all new values
      if (newData && typeof newData === 'object') {
        Object.entries(newData).forEach(([key, value]) => {
          // Skip internal fields
          if (['createdAt', 'updatedAt', 'id'].includes(key)) return;
          
          const formatted = formatValue(value, key);
          allChanges.push({
            field: formatFieldName(key),
            oldValue: null,
            newValue: value,
            formattedOld: null,
            formattedNew: formatted,
            isCreation: true,
            fieldKey: key
          });
        });
      }
    } else if (isDeletion) {
      // For deletion, show what was deleted
      if (previousData && typeof previousData === 'object') {
        Object.entries(previousData).forEach(([key, value]) => {
          if (['createdAt', 'updatedAt', 'id'].includes(key)) return;
          
          const formatted = formatValue(value, key);
          allChanges.push({
            field: formatFieldName(key),
            oldValue: value,
            newValue: null,
            formattedOld: formatted,
            formattedNew: null,
            isCreation: false,
            isDeletion: true,
            fieldKey: key
          });
        });
      }
    } else if (isUpdate) {
      // For updates (including payment_recorded), show what changed
      if (previousData && newData && typeof previousData === 'object' && typeof newData === 'object') {
        // Use fieldsChanged if available, otherwise compare all fields
        const fields = fieldsChanged.length > 0 ? fieldsChanged : Object.keys(newData);
        
        fields.forEach(field => {
          const oldVal = previousData[field];
          const newVal = newData[field];
          
          // Skip if values are the same
          if (JSON.stringify(oldVal) === JSON.stringify(newVal)) return;
          
          const formattedOld = formatValue(oldVal, field);
          const formattedNew = formatValue(newVal, field);
          
          allChanges.push({
            field: formatFieldName(field),
            oldValue: oldVal,
            newValue: newVal,
            formattedOld,
            formattedNew,
            isCreation: false,
            fieldKey: field
          });
        });
      } else if (fieldsChanged.length > 0) {
        // Fallback: if we have fieldsChanged but data structure is unexpected
        fieldsChanged.forEach(field => {
          const oldVal = previousData?.[field] || previousData;
          const newVal = newData?.[field] || newData;
          
          allChanges.push({
            field: formatFieldName(field),
            oldValue: oldVal,
            newValue: newVal,
            formattedOld: formatValue(oldVal, field),
            formattedNew: formatValue(newVal, field),
            isCreation: false,
            fieldKey: field
          });
        });
      }
    }

    // If no changes detected but we have data, try to show something meaningful
    if (allChanges.length === 0 && (previousData || newData)) {
      console.warn('No changes detected for log:', log);
      
      // Last resort: show raw data comparison
      if (previousData && newData) {
        allChanges.push({
          field: 'Record State',
          oldValue: previousData,
          newValue: newData,
          formattedOld: formatValue(previousData),
          formattedNew: formatValue(newData),
          isCreation: false,
          fieldKey: 'state'
        });
      }
    }

    return {
      sourceDisplay,
      actionDisplay,
      allChanges,
      totalChanges: allChanges.length,
      sourceType: log.sourceType,
      action: log.action
    };
  };

  const toggleRowExpansion = (logId, e) => {
    if (e) {
      e.stopPropagation();
    }
    
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(logId)) {
        newSet.delete(logId);
      } else {
        newSet.add(logId);
      }
      return newSet;
    });
  };

  const toggleDateCollapse = (date) => {
    setCollapsedDates(prev => {
      const newSet = new Set(prev);
      if (newSet.has(date)) {
        newSet.delete(date);
      } else {
        newSet.add(date);
      }
      return newSet;
    });
  };

  const toggleSelectLog = (logId, e) => {
    if (e) {
      e.stopPropagation();
    }
    
    setSelectedLogs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(logId)) {
        newSet.delete(logId);
      } else {
        newSet.add(logId);
      }
      return newSet;
    });
  };

  const toggleSelectAllForDate = (logs) => {
    const logIds = logs.map(l => l.id);
    const allSelected = logIds.every(id => selectedLogs.has(id));

    setSelectedLogs(prev => {
      const newSet = new Set(prev);
      if (allSelected) {
        logIds.forEach(id => newSet.delete(id));
      } else {
        logIds.forEach(id => newSet.add(id));
      }
      return newSet;
    });
  };

  const performDelete = async () => {
    if (selectedLogs.size === 0) return;

    try {
      setModalLoading(true);
      const logIds = Array.from(selectedLogs);

      const response = await api.post('/logs/delete-audit-logs', {
        logIds
      });

      if (response.data.success) {
        setHistoryLogs(prev => prev.filter(log => !selectedLogs.has(log.id)));
        setSelectedLogs(new Set());
        showToast(`Successfully deleted ${response.data.deletedCount} audit log(s)`, 'success');
        closeModal();
      } else {
        throw new Error(response.data.message || 'Failed to delete logs');
      }
    } catch (error) {
      console.error('Error deleting logs:', error);
      showToast(error.response?.data?.message || error.message || 'Failed to delete audit logs', 'error');
    } finally {
      setModalLoading(false);
    }
  };

  const handleDeleteSelected = () => {
    if (selectedLogs.size === 0) {
      showToast('Please select logs to delete', 'warning');
      return;
    }

    showModal(
      `Delete ${selectedLogs.size} Audit Log(s)`,
      `Are you sure you want to delete ${selectedLogs.size} audit log(s)? This action cannot be undone.`,
      'danger',
      performDelete
    );
  };

  const fetchHistoryLogs = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);
      
      const response = await api.get('/logs/get-complete-logs');
      
      if (response.data.success) {
        setHistoryLogs(response.data.data);
      } else {
        throw new Error(response.data.message || 'Failed to fetch logs');
      }
    } catch (error) {
      console.error('Error fetching history logs:', error);
      setError(error.response?.data?.message || error.message || 'Failed to load history logs. Please try again.');
      showToast('Failed to load history logs', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHistoryLogs();
  }, [fetchHistoryLogs]);

  const groupedLogs = groupLogsByDate(historyLogs);

  if (loading) {
    return (
      <div className="history-log-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading audit logs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="history-log-container">
      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={modalConfig.isOpen}
        onClose={closeModal}
        onConfirm={modalConfig.onConfirm}
        title={modalConfig.title}
        message={modalConfig.message}
        type={modalConfig.type}
        isLoading={modalConfig.isLoading}
        confirmText="Delete"
        cancelText="Cancel"
      />

      {/* Toast Notification */}
      <Toast
        isVisible={toastConfig.isVisible}
        onClose={closeToast}
        message={toastConfig.message}
        type={toastConfig.type}
        duration={toastConfig.duration}
        position="bottom-right"
      />

      {/* Leonardo Medical Services Header */}
      <div className="header">
        <div className="title-section">
          <h1>LEONARDO MEDICAL SERVICES</h1>
          <p>B1 L17-E Neovista, Bagumbong, Caloocan City</p>
        </div>
      </div>

      {error && (
        <div className="error-message">
          <span className="error-icon">⚠</span>
          {error}
        </div>
      )}

      {/* Delete Selected Button - Moved to top right */}
      {selectedLogs.size > 0 && (
        <div className="delete-toolbar">
          <button 
            className="delete-selected-btn"
            onClick={handleDeleteSelected}
            disabled={deleting}
          >
            <Trash2 size={18} />
            {deleting ? 'Deleting...' : `Delete ${selectedLogs.size} Selected`}
          </button>
        </div>
      )}

      {Object.keys(groupedLogs).length === 0 ? (
        <div className="empty-state">
          <FileText size={64} className="empty-icon" />
          <p>No audit logs found in the system</p>
        </div>
      ) : (
        <div className="logs-by-date">
          {Object.entries(groupedLogs).map(([date, logs]) => {
            const isCollapsed = collapsedDates.has(date);
            const allSelected = logs.every(log => selectedLogs.has(log.id));
            const someSelected = logs.some(log => selectedLogs.has(log.id)) && !allSelected;

            return (
              <div key={date} className="date-section">
                <div className="date-header">
                  <button 
                    className="date-collapse-btn"
                    onClick={() => toggleDateCollapse(date)}
                  >
                    {isCollapsed ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
                  </button>
                  <Calendar size={20} className="date-icon" />
                  <h2 className="date-title">{date}</h2>
                  <span className="log-count">{logs.length} log{logs.length !== 1 ? 's' : ''}</span>
                  <button
                    className={`select-all-btn ${someSelected ? 'partial' : ''}`}
                    onClick={() => toggleSelectAllForDate(logs)}
                  >
                    {allSelected ? <CheckSquare size={18} /> : <Square size={18} />}
                    {allSelected ? 'Deselect All' : 'Select All'}
                  </button>
                </div>

                {!isCollapsed && (
                  <div className="history-log-table-wrapper">
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableHeadCell className="history-log-th select-col">Select</TableHeadCell>
                          <TableHeadCell className="history-log-th">Time</TableHeadCell>
                          <TableHeadCell className="history-log-th">Source</TableHeadCell>
                          <TableHeadCell className="history-log-th">Action</TableHeadCell>
                          <TableHeadCell className="history-log-th">Summary</TableHeadCell>
                          <TableHeadCell className="history-log-th">Changed By</TableHeadCell>
                          <TableHeadCell className="history-log-th">Role</TableHeadCell>
                          <TableHeadCell className="history-log-th expand-col">Details</TableHeadCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {logs.map((log) => {
                          const displayInfo = getAuditDisplayInfo(log);
                          const isExpanded = expandedRows.has(log.id);
                          const isSelected = selectedLogs.has(log.id);
                          const SourceIcon = getSourceIcon(log.sourceType);
                          const ActionIcon = getActionIcon(log.action);

                          return (
                            <React.Fragment key={log.id}>
                              <TableRow className={`history-log-row ${isSelected ? 'selected' : ''}`}>
                                <TableCell className="history-log-cell select-col">
                                  <button
                                    className="checkbox-btn"
                                    onClick={(e) => toggleSelectLog(log.id, e)}
                                  >
                                    {isSelected ? <CheckSquare size={18} /> : <Square size={18} />}
                                  </button>
                                </TableCell>
                                <TableCell className="history-log-cell time-cell">
                                  <Clock size={14} className="inline-icon" />
                                  {formatDateTime(log.createdAt)}
                                </TableCell>
                                <TableCell className="history-log-cell">
                                  <span className="source-badge">
                                    <SourceIcon size={14} className="badge-icon" />
                                    {displayInfo.sourceDisplay}
                                  </span>
                                </TableCell>
                                <TableCell className="history-log-cell">
                                  <span className={`action-badge action-${log.action}`}>
                                    <ActionIcon size={14} className="badge-icon" />
                                    {displayInfo.actionDisplay}
                                  </span>
                                </TableCell>
                                <TableCell className="history-log-cell summary-cell">
                                  {displayInfo.allChanges.length > 0 ? (
                                    <>
                                      <div className="summary-text">
                                        {displayInfo.allChanges.length} field{displayInfo.allChanges.length !== 1 ? 's' : ''} {
                                          log.action === 'created' || log.action === 'initial_creation' ? 'set' : 
                                          log.action === 'deleted' || log.action === 'archived' ? 'removed' : 
                                          log.action === 'payment_recorded' ? 'updated (payment)' :
                                          'modified'
                                        }
                                      </div>
                                      <div className="summary-preview">
                                        {displayInfo.allChanges.slice(0, 3).map((change, idx) => (
                                          <span key={idx} className="field-tag">
                                            {change.field}
                                          </span>
                                        ))}
                                        {displayInfo.allChanges.length > 3 && (
                                          <span className="more-tag">
                                            +{displayInfo.allChanges.length - 3} more
                                          </span>
                                        )}
                                      </div>
                                    </>
                                  ) : (
                                    <div className="summary-text">No changes detected</div>
                                  )}
                                </TableCell>
                                <TableCell className="history-log-cell">
                                  <User size={14} className="inline-icon" />
                                  {log.changedByName}
                                </TableCell>
                                <TableCell className="history-log-cell">
                                  <span className={`role-badge role-${log.changedByRole?.toLowerCase()}`}>
                                    {log.changedByRole}
                                  </span>
                                </TableCell>
                                <TableCell className="history-log-cell expand-col">
                                  {displayInfo.allChanges.length > 0 && (
                                    <button
                                      className="expand-btn"
                                      onClick={(e) => toggleRowExpansion(log.id, e)}
                                    >
                                      {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                    </button>
                                  )}
                                </TableCell>
                              </TableRow>

                              {isExpanded && (
                                <TableRow className="expanded-row">
                                  <TableCell colSpan={8} className="expanded-cell">
                                    <div className="expanded-content">
                                      <div className="expanded-header">
                                        <h4 className="expanded-title">
                                          <Edit3 size={20} />
                                          Detailed Change Log
                                        </h4>
                                        <div className="expanded-meta">
                                          <span className="meta-item">
                                            <Calendar size={14} />
                                            {new Date(log.createdAt).toLocaleString()}
                                          </span>
                                          <span className="meta-item">
                                            <User size={14} />
                                            {log.changedByName} ({log.changedByRole})
                                          </span>
                                        </div>
                                      </div>
                                      
                                      <div className="changes-grid">
                                        {displayInfo.allChanges.map((change, idx) => (
                                          <div key={idx} className={`change-detail-card ${change.isCreation ? 'creation' : change.isDeletion ? 'deletion' : 'update'}`}>
                                            <div className="field-header">
                                              <span className="field-name-large">{change.field}</span>
                                              {change.formattedNew && (
                                                <span className={`type-badge type-${change.formattedNew.type}`}>
                                                  {change.formattedNew.type}
                                                </span>
                                              )}
                                            </div>
                                            
                                            {change.isCreation ? (
                                              <div className="creation-value">
                                                <div className="value-label">
                                                  <Plus size={12} />
                                                  Initial Value
                                                </div>
                                                <div className="value-content new">
                                                  {change.formattedNew?.display || 'N/A'}
                                                </div>
                                                {change.formattedNew?.full && change.formattedNew.display.includes('...') && (
                                                  <details className="value-details">
                                                    <summary>Show full value</summary>
                                                    <div className="full-value">{change.formattedNew.full}</div>
                                                  </details>
                                                )}
                                              </div>
                                            ) : change.isDeletion ? (
                                              <div className="deletion-value">
                                                <div className="value-label">
                                                  <Trash size={12} />
                                                  Deleted Value
                                                </div>
                                                <div className="value-content deleted">
                                                  {change.formattedOld?.display || 'N/A'}
                                                </div>
                                              </div>
                                            ) : (
                                              <div className="comparison-container">
                                                <div className="value-section">
                                                  <div className="value-label">
                                                    <AlertCircle size={12} />
                                                    Previous Value
                                                  </div>
                                                  <div className="value-content old">
                                                    {change.formattedOld?.display || 'Not Set'}
                                                  </div>
                                                </div>
                                                
                                                <div className="arrow-separator">→</div>
                                                
                                                <div className="value-section">
                                                  <div className="value-label">
                                                    <CheckSquare size={12} />
                                                    New Value
                                                  </div>
                                                  <div className="value-content new">
                                                    {change.formattedNew?.display || 'Not Set'}
                                                  </div>
                                                </div>
                                              </div>
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              )}
                            </React.Fragment>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default HistoryLog;