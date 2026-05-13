import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './context/AuthContext'
import Navbar from './components/layout/Navbar'
import Footer from './components/layout/Footer'
import ProtectedRoute from './components/layout/ProtectedRoute'

import Home from './pages/Home'
import Search from './pages/Search'
import TripDetail from './pages/TripDetail'
import CreateTrip from './pages/CreateTrip'
import MyTrips from './pages/MyTrips'
import MyBookings from './pages/MyBookings'
import Profile from './pages/Profile'
import Login from './pages/Login'
import Register from './pages/Register'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen flex flex-col">
          <Navbar />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/search" element={<Search />} />
              <Route path="/trips/:id" element={<TripDetail />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              <Route path="/trips/new" element={
                <ProtectedRoute><CreateTrip /></ProtectedRoute>
              } />
              <Route path="/trips/:id/edit" element={
                <ProtectedRoute><CreateTrip /></ProtectedRoute>
              } />
              <Route path="/my-trips" element={
                <ProtectedRoute><MyTrips /></ProtectedRoute>
              } />
              <Route path="/my-bookings" element={
                <ProtectedRoute><MyBookings /></ProtectedRoute>
              } />
              <Route path="/profile" element={
                <ProtectedRoute><Profile /></ProtectedRoute>
              } />
            </Routes>
          </main>
          <Footer />
        </div>
        <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
      </BrowserRouter>
    </AuthProvider>
  )
}
