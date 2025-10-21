import React, { createContext, useContext, useState } from 'react';

const SidebarContext = createContext();

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
};

export const SidebarProvider = ({ children }) => {
  const [sidebarWidth, setSidebarWidth] = useState(250);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const updateSidebarWidth = (newWidth) => {
    setSidebarWidth(newWidth);
  };

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  // Helper to get effective width based on collapsed state
  const getEffectiveWidth = () => {
    return isCollapsed ? 60 : sidebarWidth;
  };

  return (
    <SidebarContext.Provider value={{ 
      sidebarWidth, 
      updateSidebarWidth, 
      isCollapsed,
      toggleCollapse, 
      getEffectiveWidth
    }}>
      {children}
    </SidebarContext.Provider>
  );
};