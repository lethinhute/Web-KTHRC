import { useState } from 'react';
import ProductDetailPage from '../../components/ProductDetailPage';

function CloudMedia() {
  const [slide, setSlide] = useState(0);
  const items = [
    <div className="pd-video-wrap" key="video">
      <video className="img-fluid" controls poster="/img/index/cloud1.jpg" style={{ width: '100%', borderRadius: 16 }}>
        <source src="/videos/cloud1.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>
      <a href="/videos/cloud1.mp4" download className="pd-download-btn">⬇ Download</a>
    </div>,
    <img key="img" src="/img/index/cloud.jpg" alt="Cloud Chamber" style={{ width: '100%', borderRadius: 16 }} />,
  ];

  return (
    <div className="pd-carousel">
      <div className="pd-carousel-track" style={{ transform: `translateX(-${slide * 100}%)` }}>
        {items.map((item, i) => (
          <div key={i} className="pd-carousel-item">{item}</div>
        ))}
      </div>
      <button className="pd-carousel-btn pd-carousel-prev" onClick={() => setSlide((s) => (s === 0 ? items.length - 1 : s - 1))}>‹</button>
      <button className="pd-carousel-btn pd-carousel-next" onClick={() => setSlide((s) => (s + 1) % items.length)}>›</button>
    </div>
  );
}

export default function CloudPage() {
  return (
    <ProductDetailPage
      title="Cloud Chamber"
      description="A cloud chamber is a particle detector that enables the visualization of ionizing radiation through a supersaturated alcohol vapor environment."
      price="199.99 USD"
      priceVnd="4.999.000 VND"
      media={<CloudMedia />}
      technicalDescription="The cloud chamber operates by allowing charged particles (such as alpha or beta radiation) to ionize vapor molecules as they pass through. A supersaturated vapor condenses around these ionization trails, forming visible tracks made of tiny droplets. The visualization is typically enhanced using side illumination."
      coreComponents={[
        { name: 'Sealed Chamber', desc: 'Transparent container preventing contamination.' },
        { name: 'Alcohol Vapor', desc: 'Supersaturated isopropyl or ethyl alcohol vapor as the detection medium.' },
        { name: 'Cold Plate', desc: 'Metal surface cooled to around -30°C to maintain supersaturation.' },
        { name: 'Radiation Source', desc: 'Optional radioactive sample to emit ionizing particles.' },
        { name: 'Light Source', desc: 'LED or laser light to illuminate the particle tracks.' },
        { name: 'Insulation', desc: 'Material to help maintain temperature stability.' },
      ]}
      specifications={[
        { param: 'Vapor Type', value: 'Isopropyl alcohol (90–99%)' },
        { param: 'Cold Plate Temperature', value: '-26°C to -40°C' },
        { param: 'Operating Pressure', value: 'Atmospheric' },
        { param: 'Chamber Volume', value: '1–5 liters' },
        { param: 'Power Requirement', value: '50–100W (Peltier or cooling system)' },
      ]}
      extraSections={[
        {
          heading: 'Types of Detected Radiation',
          items: [
            { name: 'Alpha particles (α)', desc: 'Short, thick, straight tracks (e.g., from Americium-241).' },
            { name: 'Beta particles (β)', desc: 'Long, thin, curved paths (e.g., from Strontium-90).' },
            { name: 'Gamma rays (γ)', desc: 'Indirect detection via recoil electrons.' },
            { name: 'Muons', desc: 'Long, straight tracks from cosmic sources.' },
          ],
        },
      ]}
      safetyNotes={[
        'Ensure good ventilation due to flammable alcohol vapor.',
        'Use only safe, legal radioactive sources or natural background radiation.',
        'Handle cooling agents with care to avoid burns or frostbite.',
      ]}
      applications={[
        'Physics education and radiation demonstrations',
        'Cosmic ray visualization',
        'Historical particle physics research',
      ]}
      applicationsIntro="Cloud chambers are widely used in:"
    />
  );
}
