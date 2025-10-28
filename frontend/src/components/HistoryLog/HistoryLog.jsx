import React, { useState, useEffect, useCallback } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeadCell, TableRow } from "flowbite-react";
import { useNavigate } from 'react-router-dom';
import './HistoryLog.css';

const HistoryLog = ({ patient, onBack }) => {
  const navigate = useNavigate();
  const [historyLogs, setHistoryLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchHistoryLogs = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);
      
      // Static data matching your CSS theme
      const staticLogs = [
        {
          id: 1,
          dateTime: '2025-01-15 10:30 AM',
          patientDetail: 'Contact Number',
          oldValue: '09123456789',
          newValue: '09987654321',
          changedBy: 'Admin User',
          role: 'Admin'
        },
        {
          id: 2,
          dateTime: '2025-01-14 02:15 PM',
          patientDetail: 'Home Address',
          oldValue: '123 Old Address St.',
          newValue: '456 New Address St.',
          changedBy: 'Nurse Smith',
          role: 'Encoder'
        },
        {
          id: 3,
          dateTime: '2025-01-13 09:45 AM',
          patientDetail: 'Email Address',
          oldValue: 'old.email@example.com',
          newValue: 'new.email@example.com',
          changedBy: 'Dr. Johnson',
          role: 'Doctor'
        },
        {
          id: 4,
          dateTime: '2025-01-12 04:20 PM',
          patientDetail: 'Medical History',
          oldValue: 'No significant history',
          newValue: 'Hypertension diagnosed',
          changedBy: 'Nurse Wilson',
          role: 'Encoder'
        },
        {
          id: 5,
          dateTime: '2025-01-11 11:15 AM',
          patientDetail: 'Emergency Contact',
          oldValue: 'John Doe - 09111111111',
          newValue: 'Jane Smith - 09222222222',
          changedBy: 'Admin User',
          role: 'Admin'
        },
        {
          id: 6,
          dateTime: '2025-01-10 03:30 PM',
          patientDetail: 'Insurance Info',
          oldValue: 'Insurance A - 12345',
          newValue: 'Insurance B - 67890',
          changedBy: 'Dr. Brown',
          role: 'Doctor'
        }
      ];
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 800));
      setHistoryLogs(staticLogs);
    } catch (error) {
      console.error('Error fetching history logs:', error);
      setError('Failed to load history logs. Please try again.');
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

  return (
    <div className="history-log-container">
      <div className="history-log-header">
        <h1 className="history-log-title">Patient History Log</h1>
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
              <TableHeadCell className="history-log-th">Patient Detail</TableHeadCell>
              <TableHeadCell className="history-log-th">Old Value</TableHeadCell>
              <TableHeadCell className="history-log-th">New Value</TableHeadCell>
              <TableHeadCell className="history-log-th">Changed By</TableHeadCell>
              <TableHeadCell className="history-log-th">Role</TableHeadCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="history-log-cell-center">
                  Loading history logs...
                </TableCell>
              </TableRow>
            ) : error ? (
              <TableRow>
                <TableCell colSpan={6} className="history-log-cell-center">
                  {error}
                </TableCell>
              </TableRow>
            ) : historyLogs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="history-log-cell-center">
                  No history logs found for this patient
                </TableCell>
              </TableRow>
            ) : (
              historyLogs.map((log) => (
                <TableRow key={log.id} className="history-log-row">
                  <TableCell className="history-log-cell">{log.dateTime}</TableCell>
                  <TableCell className="history-log-cell">{log.patientDetail}</TableCell>
                  <TableCell className="history-log-cell">{log.oldValue}</TableCell>
                  <TableCell className="history-log-cell">{log.newValue}</TableCell>
                  <TableCell className="history-log-cell">{log.changedBy}</TableCell>
                  <TableCell className="history-log-cell">{log.role}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default HistoryLog;