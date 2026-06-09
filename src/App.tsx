import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { BookingProvider } from './context/BookingContext';
import { ClientPage } from './pages/ClientPage';
import { AdminPage } from './pages/AdminPage';
import { ClientAuth } from './pages/ClientAuth';
import { ClientDashboard } from './pages/ClientDashboard';

function App() {
  // Theme logic (if any) could stay here, but Lalbicut uses document.documentElement
  // We'll keep the dark theme forced or just remove it if it was simple.
  document.documentElement.classList.remove('dark'); // Force light as default or follow original logic

  return (
    <BookingProvider>
      <Router>
        <Routes>
          <Route path="/" element={<ClientPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/connexion" element={<ClientAuth />} />
          <Route path="/profil" element={<ClientDashboard />} />
        </Routes>
      </Router>
    </BookingProvider>
  );
}

export default App;