import React, { useState, useEffect, useCallback } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeadCell, TableRow } from "flowbite-react";
import { useNavigate } from 'react-router-dom';
import api from '../../axios/api'; // Adjust path to your axios instance
import './HistoryLog.css';

const HistoryLog = ({ patient, onBack }) => {
  const navigate = useNavigate();
  const [historyLogs, setHistoryLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Function to parse JSON data safely
  const parseAuditData = (data) => {
    if (!data) return null;
    try {
      return JSON.parse(data);
    } catch (error) {
      console.error('Error parsing audit data:', error);
      return data; // Return original string if parsing fails
    }
  };

  // Function to format date for display
  const formatDateTime = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch (error) {
      return dateString; // Return original if formatting fails
    }
  };

  // Function to extract meaningful information from audit data
  const getAuditDisplayInfo = (log) => {
    const previousData = parseAuditData(log.previousData);
    const newData = parseAuditData(log.newData);
    const fieldsChanged = log.fieldsChanged?.split(',') || [];

    // Try to determine the source type and extract relevant info
    let patientDetail = 'General Update';
    let oldValue = 'N/A';
    let newValue = 'N/A';

    if (log.sourceType) {
      patientDetail = `${log.sourceType.replace('_', ' ').toUpperCase()} ${log.action}`;
    } else {
      patientDetail = `${log.action.charAt(0).toUpperCase() + log.action.slice(1)}`;
    }

    // Extract specific field changes if available
    if (fieldsChanged.length > 0) {
      patientDetail = fieldsChanged.map(field => 
        field.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ')
      ).join(', ');
      
      // Try to get specific values from the data
      if (previousData && newData) {
        const changedField = fieldsChanged[0]; // Show first changed field
        oldValue = previousData[changedField] ?? JSON.stringify(previousData);
        newValue = newData[changedField] ?? JSON.stringify(newData);
      }
    } else if (previousData && newData) {
      // Fallback: show simplified JSON data
      oldValue = typeof previousData === 'object' ? 'Object updated' : String(previousData);
      newValue = typeof newData === 'object' ? 'Object updated' : String(newData);
    }

    // Truncate long values for display
    const truncateValue = (value, maxLength = 50) => {
      if (!value) return 'N/A';
      const str = String(value);
      return str.length > maxLength ? str.substring(0, maxLength) + '...' : str;
    };

    return {
      patientDetail,
      oldValue: truncateValue(oldValue),
      newValue: truncateValue(newValue)
    };
  };

  const fetchHistoryLogs = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);
      
      // Call your API endpoint
      const response = await api.get('/logs/get-complete-logs');
      
      if (response.data.success) {
        setHistoryLogs(response.data.data);
      } else {
        throw new Error(response.data.message || 'Failed to fetch logs');
      }
    } catch (error) {
      console.error('Error fetching history logs:', error);
      setError(error.response?.data?.message || error.message || 'Failed to load history logs. Please try again.');
      
      // Fallback to static data if API fails (optional)
      // const staticLogs = [...]; // Your static data here
      // setHistoryLogs(staticLogs);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHistoryLogs();
  }, [fetchHistoryLogs]);

  const handleClose = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  const handleRetry = () => {
    fetchHistoryLogs();
  };

  return (
    <div className="history-log-container">
      <div className="history-log-header">
        <h1 className="history-log-title">System Audit Logs</h1>
        <button 
          className="history-log-close-btn" 
          onClick={handleClose}
          aria-label="Close history log"
        >
          ✕
        </button>
      </div>

      <div className="history-log-table-wrapper">
        <Table>
          <TableHead>
            <TableRow>
              <TableHeadCell className="history-log-th">Date & Time</TableHeadCell>
              <TableHeadCell className="history-log-th">Source & Action</TableHeadCell>
              <TableHeadCell className="history-log-th">Changed Field(s)</TableHeadCell>
              <TableHeadCell className="history-log-th">Old Value</TableHeadCell>
              <TableHeadCell className="history-log-th">New Value</TableHeadCell>
              <TableHeadCell className="history-log-th">Changed By</TableHeadCell>
              <TableHeadCell className="history-log-th">Role</TableHeadCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="history-log-cell-center">
                  <div className="loading-spinner">
                    Loading audit logs...
                  </div>
                </TableCell>
              </TableRow>
            ) : error ? (
              <TableRow>
                <TableCell colSpan={7} className="history-log-cell-center">
                  <div className="error-message">
                    {error}
                    <button 
                      onClick={handleRetry}
                      className="retry-button"
                    >
                      Try Again
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            ) : historyLogs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="history-log-cell-center">
                  No audit logs found in the system
                </TableCell>
              </TableRow>
            ) : (
              historyLogs.map((log) => {
                const displayInfo = getAuditDisplayInfo(log);
                
                return (
                  <TableRow key={log.id} className="history-log-row">
                    <TableCell className="history-log-cell">
                      {formatDateTime(log.createdAt)}
                    </TableCell>
                    <TableCell className="history-log-cell">
                      <div className="source-action">
                        <strong>{log.sourceType || 'System'}</strong>
                        <br />
                        <span className="action-badge">{log.action}</span>
                      </div>
                    </TableCell>
                    <TableCell className="history-log-cell">
                      {displayInfo.patientDetail}
                    </TableCell>
                    <TableCell className="history-log-cell old-value">
                      {displayInfo.oldValue}
                    </TableCell>
                    <TableCell className="history-log-cell new-value">
                      {displayInfo.newValue}
                    </TableCell>
                    <TableCell className="history-log-cell">
                      {log.changedByName}
                    </TableCell>
                    <TableCell className="history-log-cell">
                      <span className={`role-badge role-${log.changedByRole?.toLowerCase()}`}>
                        {log.changedByRole}
                      </span>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default HistoryLog;