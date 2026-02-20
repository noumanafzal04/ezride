import React, { createContext, useContext, useState } from 'react';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
    const [role, setRole] = useState(null);
    return (
        <AppContext.Provider value={{ role, setRole }}>
            {children}
        </AppContext.Provider>
    );
};

export const useApp = () => useContext(AppContext);
