import React, { useEffect, useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeadCell, TableRow } from "flowbite-react";
import { useNavigate } from 'react-router-dom';
import './HistoryLog.css';

const HistoryLog = ({ patient, onBack }) => {
  const navigate = useNavigate();
  const [historyLogs, setHistoryLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistoryLogs();
  }, [patient]);

  const fetchHistoryLogs = async () => {
    try {
      setHistoryLogs([
        {
          id: 1,
          dateTime: '2025-01-15 10:30 AM',
          patientDetail: 'Updated contact number',
          oldValue: '09123456789',
          newValue: '09987654321',
          changedBy: 'Admin User',
          role: 'Admin'
        },
        {
          id: 2,
          dateTime: '2025-01-14 02:15 PM',
          patientDetail: 'Updated address',
          oldValue: 'Old Address St.',
          newValue: 'New Address St.',
          changedBy: 'Nurse Smith',
          role: 'Encoder'
        }
      ]);
    } catch (error) {
      console.error('Error fetching history logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (onBack) onBack();
    else navigate(-1);
  };

  return (
    <div className="history-log-container">
      {/* ✅ Universal Header — matches Archive Page */}
      <header className="universal-header">
        <h1>LEONARDO MEDICAL SERVICES</h1>
        <p>B1 L17-E Neovista, Bagumbong, Caloocan City</p>
      </header>

      <div className="history-log-header">
        <h1 className="history-log-title">History Log</h1>
        <button className="history-log-close-btn" onClick={handleClose}>✕</button>
      </div>

      <div className="history-log-table-wrapper">
        <Table striped>
          <TableHead>
            <TableHeadCell className="history-log-th">Date & Time</TableHeadCell>
            <TableHeadCell className="history-log-th">Patient Detail</TableHeadCell>
            <TableHeadCell className="history-log-th">Old Value</TableHeadCell>
            <TableHeadCell className="history-log-th">New Value</TableHeadCell>
            <TableHeadCell className="history-log-th">Changed By</TableHeadCell>
            <TableHeadCell className="history-log-th">Role</TableHeadCell>
          </TableHead>
          <TableBody className="divide-y">
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="history-log-cell-center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : historyLogs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="history-log-cell-center">
                  No history logs found
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
