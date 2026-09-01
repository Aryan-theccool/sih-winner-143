import React from 'react'
import { Routes, Route } from 'react-router-dom'
import LandingPage from './landing/LandingPage'
import Dashboard from './Dashboard'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/dashboard" element={<Dashboard />} />
    </Routes>
  )
}
