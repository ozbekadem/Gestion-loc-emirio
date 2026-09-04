import React, { createContext, useContext } from 'react'

const NavContext = createContext(() => {})

export function NavProvider({ onNavigate, children }) {
  return <NavContext.Provider value={onNavigate}>{children}</NavContext.Provider>
}

export function useNavigate() {
  return useContext(NavContext)
}
