import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import LandingPage from './pages/landing';
import Authentication from './pages/authentication';
import { AuthProvider } from './contexts/AuthContext';
import HomeComponent from './pages/home';
import History from './pages/history';
import VideoMeet from './pages/VideoMeet';

function App() {
  return (
    <>
        <Router>
          <AuthProvider>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path='/auth' element={<Authentication />} />
              <Route path='/home' element={<HomeComponent />} />
              <Route path='/history' element={<History />} />
              <Route path='/meeting/:meetingId' element={<VideoMeet />} />
            </Routes>
          </AuthProvider>
        </Router>
    </>
  );
}

export default App;
