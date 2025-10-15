import React, { useState } from 'react';
import Sidebar from './Sidebar.jsx';
import Dashboard from './Dashboard.jsx';
import PatientList from './Patient_Record-List.jsx';
import PatientDetailsView from './Patient_Record-View.jsx';

const App = () => {
  const [activePage, setActivePage] = useState('dashboard');

  const renderPage = () => {
    switch (activePage) {
      case 'patient-records':
        return <PatientList />;
      case 'patient-view':
        return <PatientDetailsView />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <Sidebar activePage={activePage} onNavigate={setActivePage} />
      
      {/* Main Page */}
      <div style={{ flex: 1 }}>
        {renderPage()}
      </div>
    </div>
  );
};

export default App;
