import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home.jsx';
import DrawDetail from './pages/DrawDetail.jsx';
import Checkout from './pages/Checkout.jsx';
import Tickets from './pages/Tickets.jsx';
import Profile from './pages/Profile.jsx';
import BottomNav from './components/BottomNav.jsx';

export default function App() {
  return (
    <BrowserRouter>
      <div style={{ flex: 1, minHeight: '100vh', paddingBottom: '65px' }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/draw/:id" element={<DrawDetail />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/tickets" element={<Tickets />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </div>
      <BottomNav />
    </BrowserRouter>
  );
}
