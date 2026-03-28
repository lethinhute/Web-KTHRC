import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import MemberPage from './pages/MemberPage';
import ProductPage from './pages/ProductPage';
import DataPage from './pages/DataPage';
import CloudPage from './pages/products/CloudPage';
import CounterPage from './pages/products/CounterPage';
import MppcPage from './pages/products/MppcPage';
import ScintillatorPage from './pages/products/ScintillatorPage';
import PhotomultiplierPage from './pages/products/PhotomultiplierPage';
import TorodialPage from './pages/products/TorodialPage';

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/member" element={<MemberPage />} />
          <Route path="/product" element={<ProductPage />} />
          <Route path="/data" element={<DataPage />} />
          <Route path="/products/cloud" element={<CloudPage />} />
          <Route path="/products/counter" element={<CounterPage />} />
          <Route path="/products/mppc" element={<MppcPage />} />
          <Route path="/products/scintillator" element={<ScintillatorPage />} />
          <Route path="/products/photomultiplier" element={<PhotomultiplierPage />} />
          <Route path="/products/torodial" element={<TorodialPage />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
