import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../../components/Sidebar/Sidebar";
import "./AdminLayout.css";

const AdminLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <div className="admin-layout">
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      <div className={`admin-content ${isSidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
        <Outlet />
      </div>
    </div>
  );
};

export default AdminLayout;