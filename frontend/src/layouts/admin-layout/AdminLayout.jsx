import { Outlet } from "react-router-dom";
import Sidebar from "../../components/Sidebar/Sidebar";
import "./AdminLayout.css";

const AdminLayout = () => {
  return (
    <div className="admin-layout">
      <Sidebar />
      <div className="admin-content">
        <Outlet />
      </div>
    </div>
  );
};

export default AdminLayout;
    