import { Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import Layout from './layout';
import Register from './pages/Register.tsx';
import LogIn from './pages/LogIn.tsx';
import ForgotPassword from './pages/ForgotPassword.tsx';
import UploadPage from './pages/UploadPage.tsx';
import ProductDetail from './pages/ProductPage.tsx';
import BidderProfile from './pages/BidderProfile.tsx';

function Router() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route path="/" element={<HomePage />}></Route>
        <Route path="/upload" element={<UploadPage />}></Route>
        <Route path="/product" element={<ProductDetail />}></Route>
        <Route path="/bidder/:id" element={<BidderProfile/>}></Route>
      </Route>

      <Route path="/register" element={<Register />}></Route>
      <Route path="/signin" element={<LogIn />}></Route>
      <Route path="/forgotpassword" element={<ForgotPassword />}></Route>
    </Routes>
  );
}

export default Router;
