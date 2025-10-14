import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import Dashboard from './Dashboard'
import PatientList from './Patient_Record-List.jsx'
import PatientDetailsView from './Patient_Record-View.jsx'


createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Dashboard />
    <PatientList />
    <PatientDetailsView />
  </StrictMode>,
)
