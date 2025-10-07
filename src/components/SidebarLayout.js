import React from 'react';
import { useSidebar } from '../context/SidebarContext';
import Sidebar from '../pages/Sidebar';

const SidebarLayout = ({ children, onLogout }) => {
  const { sidebarWidth, isCollapsed } = useSidebar();
  const effectiveWidth = isCollapsed ? 70 : sidebarWidth;

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      <Sidebar onLogout={onLogout} />
      <div style={{ 
        flex: 1, 
        backgroundColor: "#f8f9fa", 
        padding: 16, 
        marginLeft: effectiveWidth + 20,
        transition: 'margin-left 0.3s ease',
        width: `calc(100vw - ${effectiveWidth + 20}px)`,
        overflowX: 'auto'
      }}>
        {children}
      </div>
    </div>
  );
};

export default SidebarLayout;