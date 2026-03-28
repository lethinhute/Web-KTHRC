import { Link } from 'react-router-dom';
import './ProductPage.css';

const products = [
  {
    id: 'cloud',
    image: '/img/index/cloud.jpg',
    title: 'Cloud Chamber',
    price: '199.99 USD',
    priceVnd: '4.999.000 VND',
    description:
      'A device using a sealed environment containing a supersaturated vapor of alcohol to detect and visualize the passage of ionizing radiation.',
    link: '/products/cloud',
  },
  {
    id: 'counter',
    image: '/img/index/geiger.jpg',
    title: 'Geiger-Müller Counter',
    price: '99.99 USD',
    priceVnd: '2.499.000 VND',
    description:
      'An electronic instrument for detecting and measuring ionizing radiation using a Geiger–Müller tube.',
    link: '/products/counter',
  },
  {
    id: 'mppc',
    image: '/img/index/mppc.jpeg',
    title: 'Multi-Pixel Photon Counter (MPPC)',
    price: 'Not available',
    priceVnd: 'Không có hàng',
    description:
      'A solid-state photodetector using multiple avalanche photodiode (APD) pixels in Geiger mode.',
    link: '/products/mppc',
  },
  {
    id: 'scintillator',
    image: '/img/index/scintillator.jpeg',
    title: 'Scintillator',
    price: '19.99 USD',
    priceVnd: '499.000 VND',
    description:
      'A detector for charged particles and gamma rays in which scintillations produced in a phosphor are detected and amplified by a photomultiplier.',
    link: '/products/scintillator',
  },
  {
    id: 'torodial',
    image: '/img/index/mppc.jpeg',
    title: 'Toroidal Plasma',
    price: 'Not available',
    priceVnd: 'Không có hàng',
    description:
      'Plasma confined in a doughnut-shaped (toroidal) configuration, used in devices like tokamaks and stellarators for nuclear fusion.',
    link: '/products/torodial',
  },
  {
    id: 'pmt',
    image: '/img/index/pmt.jpeg',
    title: 'Photomultiplier Tube',
    price: 'Not available',
    priceVnd: 'Không có hàng',
    description:
      'A vacuum tube that uses the photoelectric effect and secondary emission to detect and amplify low levels of light.',
    link: '/products/photomultiplier',
  },
];

export default function ProductPage() {
  return (
    <div className="product-page">
      <div className="product-page-header">
        <h1 className="product-page-title">Our Products</h1>
      </div>
      <div className="product-grid">
        {products.map((p) => (
          <div key={p.id} className="product-card">
            <div className="product-card-img-wrap">
              <img src={p.image} alt={p.title} className="product-card-img" />
            </div>
            <div className="product-card-content">
              <h3 className="product-card-title">{p.title}</h3>
              <p className="product-card-desc">{p.description}</p>
              <div className="product-card-footer">
                <div className="product-card-price">
                  <span className="price-usd">{p.price}</span>
                  <span className="price-vnd">{p.priceVnd}</span>
                </div>
                <Link to={p.link} className="product-detail-btn">
                  View Details
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
