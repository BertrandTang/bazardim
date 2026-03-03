import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from '../components/Layout/Layout.jsx';
import Home from '../pages/Home/Home.jsx';
import Auth from '../pages/Auth/Auth.jsx';
import SignUp from '../pages/SignUp/SignUp.jsx';
import Cart from '../pages/Cart/Cart.jsx';
import Profile from '../pages/Profile/Profile.jsx';
import RequireAuth from '../components/RequireAuth.jsx';
import { AuthProvider } from '../context/AuthContext.jsx';

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/cart" element={<Cart />} />
            <Route
              path="/profile"
              element={
                <RequireAuth>
                  <Profile />
                </RequireAuth>
              }
            />
          </Routes>
        </Layout>
      </Router>
    </AuthProvider>
  );
}
