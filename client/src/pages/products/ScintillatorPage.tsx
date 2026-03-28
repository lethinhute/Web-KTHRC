import ProductDetailPage from '../../components/ProductDetailPage';

export default function ScintillatorPage() {
  return (
    <ProductDetailPage
      title="Scintillator"
      description="A detector for charged particles and gamma rays in which scintillations produced in a phosphor are detected and amplified by a photomultiplier, giving an electrical output signal."
      price="19.99 USD"
      priceVnd="499.000 VND"
      media={<img src="/img/index/scintillator.jpeg" alt="Scintillator" style={{ width: '100%', borderRadius: 16 }} />}
      technicalDescription="Scintillators work by emitting small flashes of light when excited by incoming ionizing radiation. These flashes are usually too faint to detect directly, so they are amplified using photomultiplier tubes (PMTs) or silicon photomultipliers (SiPMs). The resulting electrical signal is proportional to the energy deposited by the radiation, allowing identification and quantification of the detected particles."
      coreComponents={[
        { name: 'Scintillating Material', desc: 'Converts ionizing radiation into visible light. Can be organic (plastic or liquid) or inorganic (e.g., NaI:Tl).' },
        { name: 'Photomultiplier Tube (PMT)', desc: 'Amplifies the light signal by converting photons into electrons and multiplying them through dynodes.' },
        { name: 'Optical Coupling', desc: 'Material (gel or grease) ensuring efficient light transfer from scintillator to PMT.' },
        { name: 'Shielding and Housing', desc: 'Protects against external light and mechanical damage.' },
        { name: 'Electronic Readout', desc: 'Measures and processes electrical output signals from the PMT.' },
      ]}
      specifications={[
        { param: 'Scintillation Material', value: 'Plastic (not sure)' },
        { param: 'Light Yield', value: '~4000 photons/MeV' },
      ]}
      detectionFeatures={[
        { name: 'Gamma ray sensitivity', desc: 'Excellent for medium- and high-energy gamma detection.' },
        { name: 'Fast response', desc: 'Suitable for time-resolved and coincidence measurements.' },
        { name: 'Energy discrimination', desc: 'Based on pulse height proportional to deposited energy.' },
      ]}
      safetyNotes={[
        'Handle PMTs carefully to avoid mechanical shock and exposure to light.',
        'Some scintillators (like NaI:Tl) are hygroscopic and require sealed environments.',
        'Follow radiation safety protocols when used with radioactive sources.',
      ]}
      applications={[
        'Nuclear medicine (e.g., PET, SPECT)',
        'High-energy and particle physics',
        'Environmental radiation monitoring',
        'Security and portal radiation detectors',
      ]}
      applicationsIntro="Scintillators are widely used in various scientific and industrial domains:"
    />
  );
}
