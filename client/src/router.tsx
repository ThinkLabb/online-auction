import { Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import Layout from './layout';
import Register from './pages/Register.tsx';
import LogIn from './pages/LogIn.tsx';
import ForgotPassword from './pages/ForgotPassword.tsx';
import UploadPage from './pages/UploadPage.tsx';
import ProductDetail from './pages/ProductPage.tsx';
import Products from './pages/Products.tsx';
import AdminPage from './admin/adminpage.tsx';

function Router() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route path="/" element={<HomePage />}></Route>
        <Route path="/upload" element={<UploadPage />}></Route>
        <Route path="/product/:id" element={<ProductDetail />}></Route>

        <Route path="/products/:level1/:level2" element={<Products />}></Route>
        <Route path="/products/:level1" element={<Products />}></Route>
        <Route path="/products" element={<Products />}></Route>
      </Route>

      <Route path="/register" element={<Register />}></Route>
      <Route path="/signin" element={<LogIn />}></Route>
      <Route path="/forgotpassword" element={<ForgotPassword />}></Route>
      <Route path="/admin" element={<AdminPage />}></Route>
    </Routes>
  );
}

export default Router;
