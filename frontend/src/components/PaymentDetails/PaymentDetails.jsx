
import { useState } from 'react';
import './PaymentDetails.css'

export default function PaymentDetails() {
  const [records, setRecords] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [updateStatus, setUpdateStatus] = useState('');
  const [partialAmount, setPartialAmount] = useState('');

  const statusOptions = ['Partially Paid', 'Unpaid', 'Paid'];

  const handleViewClick = (record) => {
    setSelectedRecord(record);
    setShowViewModal(true);
  };

  const handleUpdateClick = (record) => {
    setSelectedRecord(record);
    setUpdateStatus(record.paymentStatus);
    setPartialAmount('');
    setShowUpdateModal(true);
  };

  const handleSaveUpdate = () => {
    if (selectedRecord && updateStatus) {
      setRecords(records.map(r => 
        r.id === selectedRecord.id 
          ? { ...r, paymentStatus: updateStatus, partialAmount: partialAmount }
          : r
      ));
      setShowUpdateModal(false);
      setSelectedRecord(null);
      setUpdateStatus('');
      setPartialAmount('');
    }
  };

  const filteredRecords = records.filter(record => {
    const matchesSearch = record.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !selectedStatus || record.paymentStatus === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-pink-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center mb-8">
          <div className="flex items-center gap-3">
            <img src="logo.png" alt="LMS Logo" className="w-16 h-16" />
            <div>
              <h1 className="text-3xl font-bold text-red-700">LEONARDO MEDICAL SERVICES</h1>
              <p className="text-red-600">B1 L17-E Neovista, Bagumbong, Caloocan City</p>
            </div>
          </div>
        </div>

        {/* Search and Filter Bar */}
        <div className="flex gap-4 mb-6">
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-red-700"
          />
          <div className="relative">
            <button
              onClick={() => setShowStatusDropdown(!showStatusDropdown)}
              className="px-6 py-2 border border-gray-300 rounded-full bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-red-700 min-w-[150px] text-left"
            >
              {selectedStatus || 'Status'}
            </button>
            {showStatusDropdown && (
              <div className="absolute top-full mt-2 w-48 bg-white border border-gray-300 rounded-lg shadow-lg z-10">
                <div
                  onClick={() => {
                    setSelectedStatus('');
                    setShowStatusDropdown(false);
                  }}
                  className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                >
                  All Status
                </div>
                {statusOptions.map((status) => (
                  <div
                    key={status}
                    onClick={() => {
                      setSelectedStatus(status);
                      setShowStatusDropdown(false);
                    }}
                    className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                  >
                    {status}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Records Table */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-red-900 text-white">
                <th className="px-6 py-4 text-left font-semibold">Name</th>
                <th className="px-6 py-4 text-left font-semibold">Date</th>
                <th className="px-6 py-4 text-left font-semibold">Payment Status</th>
                <th className="px-6 py-4 text-left font-semibold">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-8 text-center text-gray-500">
                    No payment records available.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((record, index) => (
                  <tr key={record.id} className={index % 2 === 0 ? 'bg-white' : 'bg-pink-100'}>
                    <td className="px-6 py-4">{record.name}</td>
                    <td className="px-6 py-4">{record.date}</td>
                    <td className="px-6 py-4">{record.paymentStatus}</td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleViewClick(record)}
                          className="px-4 py-1 bg-red-700 text-white rounded hover:bg-red-800"
                        >
                          View
                        </button>
                        <button
                          onClick={() => handleUpdateClick(record)}
                          className="px-4 py-1 bg-gray-500 text-white rounded hover:bg-gray-600"
                        >
                          Update
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* View Details Modal */}
        {showViewModal && selectedRecord && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
              <div className="bg-red-700 text-white text-xl font-bold py-4 px-6 rounded-t-lg">
                Details
              </div>
              
              <div className="p-8 space-y-4">
                <div className="flex justify-between items-center pb-2 border-b-2 border-gray-300">
                  <span className="font-bold">PROCEDURE</span>
                  <span className="font-bold">FEES</span>
                </div>

                <div>
                  <div className="font-semibold mb-2">Consultation</div>
                  <div className="flex justify-between items-center pl-8 text-sm italic">
                    <span>Standard Fee</span>
                    <span>₱ 350</span>
                  </div>
                </div>

                <div>
                  <div className="font-semibold mb-2">Laboratory</div>
                  <div className="flex justify-between items-center pl-8 text-sm italic">
                    <span>Urinalysis</span>
                    <span>₱ 350</span>
                  </div>
                </div>

                <div>
                  <div className="font-semibold mb-2">Injection</div>
                  <div className="flex justify-between items-center pl-8 text-sm italic">
                    <span>Anti-Rabies</span>
                    <span>₱ 350</span>
                  </div>
                  <div className="flex justify-between items-center pl-8 text-sm italic">
                    <span>Service Fee</span>
                    <span>₱ 350</span>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-2">
                  <span className="font-semibold">Payment Option:</span>
                  <span>Cash</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="font-semibold">Senior Discount: <input type="checkbox" className="ml-2" /></span>
                  <div>
                    <span className="font-semibold">Status:</span>
                    <span className="ml-2 italic">{selectedRecord.paymentStatus}</span>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-2 border-t-2 border-gray-300 font-bold">
                  <span>Total Amount</span>
                  <span>₱ 350</span>
                </div>
              </div>

              <div className="pb-6 text-center">
                <button
                  onClick={() => setShowViewModal(false)}
                  className="px-8 py-2 bg-white border-2 border-red-700 text-red-700 font-bold rounded hover:bg-red-50"
                >
                  Back
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Update Status Modal */}
        {showUpdateModal && selectedRecord && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
              <div className="space-y-6">
                <div>
                  <label className="block font-semibold mb-2">Name:</label>
                  <div className="text-lg">{selectedRecord.name}</div>
                </div>

                <div>
                  <label className="block font-semibold mb-2">Date:</label>
                  <div className="text-lg">{selectedRecord.date}</div>
                </div>

                <div className="space-y-3">
                  <label className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="status"
                      value="Unpaid"
                      checked={updateStatus === 'Unpaid'}
                      onChange={(e) => setUpdateStatus(e.target.value)}
                      className="w-5 h-5"
                    />
                    <span className="text-lg">Unpaid</span>
                  </label>

                  <label className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="status"
                      value="Paid"
                      checked={updateStatus === 'Paid'}
                      onChange={(e) => setUpdateStatus(e.target.value)}
                      className="w-5 h-5"
                    />
                    <span className="text-lg">Paid</span>
                  </label>

                  <label className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="status"
                      value="Partially Paid"
                      checked={updateStatus === 'Partially Paid'}
                      onChange={(e) => setUpdateStatus(e.target.value)}
                      className="w-5 h-5"
                    />
                    <span className="text-lg">Partially Paid</span>
                    {updateStatus === 'Partially Paid' && (
                      <input
                        type="text"
                        value={partialAmount}
                        onChange={(e) => setPartialAmount(e.target.value)}
                        className="ml-2 px-3 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-red-700"
                        placeholder="Amount"
                      />
                    )}
                  </label>
                </div>
              </div>

              <div className="flex gap-4 mt-8 justify-center">
                <button
                  onClick={() => {
                    setShowUpdateModal(false);
                    setSelectedRecord(null);
                    setUpdateStatus('');
                    setPartialAmount('');
                  }}
                  className="px-8 py-2 bg-white border border-gray-400 text-gray-700 rounded hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveUpdate}
                  className="px-8 py-2 bg-red-700 text-white rounded hover:bg-red-800"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

//magkahiwalay  paymentdetails.jsx

import { useState } from 'react';
import './paymentdetails.css';

export default function PaymentDetails() {
  const [records, setRecords] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [updateStatus, setUpdateStatus] = useState('');
  const [partialAmount, setPartialAmount] = useState('');

  const statusOptions = ['Partially Paid', 'Unpaid', 'Paid'];

  const handleViewClick = (record) => {
    setSelectedRecord(record);
    setShowViewModal(true);
  };

  const handleUpdateClick = (record) => {
    setSelectedRecord(record);
    setUpdateStatus(record.paymentStatus);
    setPartialAmount('');
    setShowUpdateModal(true);
  };

  const handleSaveUpdate = () => {
    if (selectedRecord && updateStatus) {
      setRecords(records.map(r => 
        r.id === selectedRecord.id 
          ? { ...r, paymentStatus: updateStatus, partialAmount: partialAmount }
          : r
      ));
      setShowUpdateModal(false);
      setSelectedRecord(null);
      setUpdateStatus('');
      setPartialAmount('');
    }
  };

  const filteredRecords = records.filter(record => {
    const matchesSearch = record.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !selectedStatus || record.paymentStatus === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="payment-container">
      <div className="payment-wrapper">
        {/* Header */}
        <div className="payment-header">
          <div className="header-content">
            <img src="logo.png" alt="LMS Logo" className="logo" />
            <div>
              <h1 className="header-title">LEONARDO MEDICAL SERVICES</h1>
              <p className="header-subtitle">B1 L17-E Neovista, Bagumbong, Caloocan City</p>
            </div>
          </div>
        </div>

        {/* Search and Filter Bar */}
        <div className="search-filter-bar">
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <div className="filter-dropdown-wrapper">
            <button
              onClick={() => setShowStatusDropdown(!showStatusDropdown)}
              className="filter-button"
            >
              {selectedStatus || 'Status'}
            </button>
            {showStatusDropdown && (
              <div className="dropdown-menu">
                <div
                  onClick={() => {
                    setSelectedStatus('');
                    setShowStatusDropdown(false);
                  }}
                  className="dropdown-item"
                >
                  All Status
                </div>
                {statusOptions.map((status) => (
                  <div
                    key={status}
                    onClick={() => {
                      setSelectedStatus(status);
                      setShowStatusDropdown(false);
                    }}
                    className="dropdown-item"
                  >
                    {status}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Records Table */}
        <div className="table-container">
          <table className="records-table">
            <thead>
              <tr className="table-header">
                <th className="table-header-cell">Name</th>
                <th className="table-header-cell">Date</th>
                <th className="table-header-cell">Payment Status</th>
                <th className="table-header-cell">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan="4" className="empty-state">
                    No payment records available.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((record, index) => (
                  <tr key={record.id} className={index % 2 === 0 ? 'table-row-even' : 'table-row-odd'}>
                    <td className="table-cell">{record.name}</td>
                    <td className="table-cell">{record.date}</td>
                    <td className="table-cell">{record.paymentStatus}</td>
                    <td className="table-cell">
                      <div className="action-buttons">
                        <button
                          onClick={() => handleViewClick(record)}
                          className="btn-view"
                        >
                          View
                        </button>
                        <button
                          onClick={() => handleUpdateClick(record)}
                          className="btn-update"
                        >
                          Update
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* View Details Modal */}
        {showViewModal && selectedRecord && (
          <div className="modal-overlay">
            <div className="modal-container modal-view">
              <div className="modal-header">
                Details
              </div>
              
              <div className="modal-content">
                <div className="details-header">
                  <span className="details-label">PROCEDURE</span>
                  <span className="details-label">FEES</span>
                </div>

                <div>
                  <div className="procedure-title">Consultation</div>
                  <div className="procedure-item">
                    <span>Standard Fee</span>
                    <span>₱ 350</span>
                  </div>
                </div>

                <div>
                  <div className="procedure-title">Laboratory</div>
                  <div className="procedure-item">
                    <span>Urinalysis</span>
                    <span>₱ 350</span>
                  </div>
                </div>

                <div>
                  <div className="procedure-title">Injection</div>
                  <div className="procedure-item">
                    <span>Anti-Rabies</span>
                    <span>₱ 350</span>
                  </div>
                  <div className="procedure-item">
                    <span>Service Fee</span>
                    <span>₱ 350</span>
                  </div>
                </div>

                <div className="payment-info">
                  <span className="payment-label">Payment Option:</span>
                  <span>Cash</span>
                </div>

                <div className="payment-info">
                  <span className="payment-label">
                    Senior Discount: <input type="checkbox" className="discount-checkbox" />
                  </span>
                  <div>
                    <span className="payment-label">Status:</span>
                    <span className="status-text">{selectedRecord.paymentStatus}</span>
                  </div>
                </div>

                <div className="total-section">
                  <span>Total Amount</span>
                  <span>₱ 350</span>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  onClick={() => setShowViewModal(false)}
                  className="btn-back"
                >
                  Back
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Update Status Modal */}
        {showUpdateModal && selectedRecord && (
          <div className="modal-overlay">
            <div className="modal-container modal-update">
              <div className="update-content">
                <div className="update-field">
                  <label className="update-label">Name:</label>
                  <div className="update-value">{selectedRecord.name}</div>
                </div>

                <div className="update-field">
                  <label className="update-label">Date:</label>
                  <div className="update-value">{selectedRecord.date}</div>
                </div>

                <div className="radio-group">
                  <label className="radio-label">
                    <input
                      type="radio"
                      name="status"
                      value="Unpaid"
                      checked={updateStatus === 'Unpaid'}
                      onChange={(e) => setUpdateStatus(e.target.value)}
                      className="radio-input"
                    />
                    <span className="radio-text">Unpaid</span>
                  </label>

                  <label className="radio-label">
                    <input
                      type="radio"
                      name="status"
                      value="Paid"
                      checked={updateStatus === 'Paid'}
                      onChange={(e) => setUpdateStatus(e.target.value)}
                      className="radio-input"
                    />
                    <span className="radio-text">Paid</span>
                  </label>

                  <label className="radio-label">
                    <input
                      type="radio"
                      name="status"
                      value="Partially Paid"
                      checked={updateStatus === 'Partially Paid'}
                      onChange={(e) => setUpdateStatus(e.target.value)}
                      className="radio-input"
                    />
                    <span className="radio-text">Partially Paid</span>
                    {updateStatus === 'Partially Paid' && (
                      <input
                        type="text"
                        value={partialAmount}
                        onChange={(e) => setPartialAmount(e.target.value)}
                        className="partial-amount-input"
                        placeholder="Amount"
                      />
                    )}
                  </label>
                </div>
              </div>

              <div className="update-actions">
                <button
                  onClick={() => {
                    setShowUpdateModal(false);
                    setSelectedRecord(null);
                    setUpdateStatus('');
                    setPartialAmount('');
                  }}
                  className="btn-cancel"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveUpdate}
                  className="btn-save"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


