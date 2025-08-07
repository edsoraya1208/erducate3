import { useState } from 'react'
import AuthPage from './pages/AuthPage'
import './styles/globals.css'

function App() {
  return (
    <div className="App">
      {/* 
        Main app container - currently just showing auth page
        Later you can add routing here for different pages
        Example: Dashboard, Profile, etc.
      */}
      <AuthPage />
    </div>
  )
}

export default App