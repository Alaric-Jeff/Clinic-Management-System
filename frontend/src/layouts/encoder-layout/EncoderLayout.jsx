import { Outlet } from "react-router-dom";
import EncoderSidebar from "../../components/Encoder-Sidebar/EncoderSidebar";
import './EncoderLayout.css'
const EncoderLayout = () => {
  return (
    <div className="layout">
      <EncoderSidebar />
      <main className="content">
        <Outlet />
      </main>
    </div>
  );
};

export default EncoderLayout;
