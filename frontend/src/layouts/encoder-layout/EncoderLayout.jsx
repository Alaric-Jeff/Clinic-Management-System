import { useState } from "react";
import { Outlet } from "react-router-dom";
import EncoderSidebar from "../../components/Encoder-Sidebar/EncoderSidebar";
import './EncoderLayout.css';

const EncoderLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <div className="layout">
      <EncoderSidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      <main className={`content ${isSidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
        <Outlet />
      </main>
    </div>
  );
};

export default EncoderLayout;