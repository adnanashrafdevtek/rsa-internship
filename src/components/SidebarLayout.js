import React from 'react';
import { useSidebar } from '../context/SidebarContext';
import Sidebar from '../pages/Sidebar';

const SidebarLayout = ({ children, onLogout }) => {
  const { getEffectiveWidth } = useSidebar();
  const effectiveWidth = getEffectiveWidth();

  return (
    <div style={{ display: "flex", height: "100vh", minWidth: 0 }}>
      <Sidebar onLogout={onLogout} />
      <div style={{ 
        flex: 1, 
        backgroundColor: "#f8f9fa", 
        padding: 16, 
        marginLeft: effectiveWidth + 20,
        transition: 'margin-left 0.3s ease',
        width: "100%",
        minWidth: 0,
        boxSizing: "border-box",
        overflowX: 'auto'
      }}>
        {children}
      </div>
    </div>
  );
};

export default SidebarLayout;
