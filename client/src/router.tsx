import { Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import Layout from './layout';
import Register from './pages/Register.tsx';
import LogIn from './pages/LogIn.tsx';
import ForgotPassword from './pages/ForgotPassword.tsx';
import UploadPage from './pages/UploadPage.tsx';

function Router() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route path="/" element={<HomePage />}></Route>
        <Route path="/upload" element={<UploadPage />}></Route>
      </Route>

      <Route path="/register" element={<Register />}></Route>
      <Route path="/signin" element={<LogIn />}></Route>
      <Route path="/forgotpassword" element={<ForgotPassword />}></Route>
    </Routes>
  );
}

export default Router;
