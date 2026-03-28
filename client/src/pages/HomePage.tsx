import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import './HomePage.css';

const bgImages = [
  '/img/reponsive/1.jpg',
  '/img/reponsive/2.jpg',
  '/img/reponsive/3.jpg',
  '/img/reponsive/4.jpg',
  '/img/reponsive/5.jpg',
  '/img/reponsive/6.jpg',
  '/img/reponsive/7.jpg',
  '/img/reponsive/8.jpg',
];

const products = [
  {
    id: 'cloud',
    image: '/img/index/cloud.jpg',
    title: 'Cloud Chamber',
    description:
      'A device using a sealed environment containing a supersaturated vapor of alcohol to detect and visualize the passage of ionizing radiation.',
    link: '/products/cloud',
  },
  {
    id: 'counter',
    image: '/img/index/geiger.jpg',
    title: 'Geiger-Müller Counter',
    description:
      'An electronic instrument for detecting and measuring ionizing radiation using a Geiger–Müller tube. Detects ionizing radiation.',
    link: '/products/counter',
  },
  {
    id: 'mppc',
    image: '/img/index/mppc.jpeg',
    title: 'Multi-Pixel Photon Counter (MPPC)',
    description:
      'A solid-state photodetector using multiple avalanche photodiode (APD) pixels in Geiger mode. Each pixel outputs a pulse at the same amplitude when detecting a photon.',
    link: '/products/mppc',
  },
  {
    id: 'scintillator',
    image: '/img/index/scintillator.jpeg',
    title: 'Scintillator',
    description:
      'A detector for charged particles and gamma rays in which scintillations produced in a phosphor are detected and amplified by a photomultiplier, giving an electrical output signal.',
    link: '/products/scintillator',
  },
  {
    id: 'torodial',
    image: '/img/index/mppc.jpeg',
    title: 'Toroidal Plasma',
    description:
      'Refers to a plasma (a hot, ionized gas consisting of free-moving electrons and ions) that is confined in a doughnut-shaped (toroidal) configuration. This shape is used in devices like tokamaks and stellarators to maintain stable conditions for nuclear fusion.',
    link: '/products/torodial',
  },
  {
    id: 'pmt',
    image: '/img/index/pmt.jpeg',
    title: 'Photomultiplier Tube',
    description:
      'A vacuum tube that uses the photoelectric effect and secondary emission to detect and amplify low levels of light. It works by converting incident photons into electrons and then multiplying those electrons through a cascade of dynodes to produce a measurable current.',
    link: '/products/photomultiplier',
  },
];

export default function HomePage() {
  const [bgIndex, setBgIndex] = useState(0);
  const [fade, setFade] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setBgIndex((prev) => (prev + 1) % bgImages.length);
        setFade(true);
      }, 500);
    }, 3000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero">
        <div
          className={`hero-bg ${fade ? 'visible' : ''}`}
          style={{ backgroundImage: `url(${bgImages[bgIndex]})` }}
        />
        <div className="hero-overlay" />
        <div className="hero-content">
          <h1 className="hero-title">Rabbit Cave</h1>
          <p className="hero-subtitle">Falling down the rabbit hole</p>
        </div>
        <div className="hero-marquee">
          <div className="marquee-track">
            <span>Falling down the rabbit hole &nbsp;&nbsp;&bull;&nbsp;&nbsp; Falling down the rabbit hole &nbsp;&nbsp;&bull;&nbsp;&nbsp; Falling down the rabbit hole &nbsp;&nbsp;&bull;&nbsp;&nbsp; Falling down the rabbit hole &nbsp;&nbsp;&bull;&nbsp;&nbsp;</span>
            <span>Falling down the rabbit hole &nbsp;&nbsp;&bull;&nbsp;&nbsp; Falling down the rabbit hole &nbsp;&nbsp;&bull;&nbsp;&nbsp; Falling down the rabbit hole &nbsp;&nbsp;&bull;&nbsp;&nbsp; Falling down the rabbit hole &nbsp;&nbsp;&bull;&nbsp;&nbsp;</span>
          </div>
        </div>
      </section>

      {/* What We Do */}
      <section className="what-we-do section-container">
        <h2 className="section-title">WHAT WE DO</h2>
        <div className="products-list">
          {products.map((product, i) => (
            <div key={product.id} className={`product-row ${i % 2 !== 0 ? 'reverse' : ''}`}>
              <div className="product-image-wrap">
                <img src={product.image} alt={product.title} className="product-image" />
              </div>
              <div className="product-info">
                <h3 className="product-title">{product.title}</h3>
                <p className="product-desc">{product.description}</p>
                <Link to={product.link} className="see-more-btn">
                  See more
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Who Are We */}
      <section className="who-we-are section-container">
        <h2 className="section-title">WHO ARE WE</h2>
        <p className="who-desc">
          Rabbit Cave is a small experimental physics lab born out of a deep passion for hands-on science.
        </p>
      </section>
    </div>
  );
}
