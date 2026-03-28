import ProductDetailPage from '../../components/ProductDetailPage';

export default function PhotomultiplierPage() {
  return (
    <ProductDetailPage
      title="Photomultiplier Tube"
      description="A vacuum tube that uses the photoelectric effect and secondary emission to detect and amplify low levels of light. It works by converting incident photons into electrons and then multiplying those electrons through a cascade of dynodes to produce a measurable current."
      price="Not available"
      priceVnd="Không có hàng"
      media={<img src="/img/index/pmt.jpeg" alt="Photomultiplier Tube" style={{ width: '100%', borderRadius: 16 }} />}
      technicalDescription="The PMT consists of a photocathode that emits photoelectrons when struck by photons. These electrons are accelerated toward a series of dynodes, each maintained at progressively higher potentials. At each dynode, secondary electrons are emitted, amplifying the signal in a chain reaction until a final measurable current is collected at the anode."
      coreComponents={[
        { name: 'Photocathode', desc: 'Converts incident photons into photoelectrons via the photoelectric effect.' },
        { name: 'Dynodes', desc: 'Electrode stages that multiply electrons through secondary emission.' },
        { name: 'Anode', desc: 'Collects the multiplied electrons to produce output current.' },
        { name: 'Vacuum Envelope', desc: 'Maintains a vacuum environment for free electron movement.' },
        { name: 'Voltage Divider', desc: 'Provides the required bias voltages to dynodes.' },
      ]}
      specifications={[
        { param: 'Wavelength Sensitivity', value: '160 – 900 nm' },
        { param: 'Gain', value: '10⁶ – 10⁷' },
        { param: 'Response Time', value: '< 3 ns' },
        { param: 'Operating Voltage', value: '800 – 1500 V' },
        { param: 'Dark Current', value: '< 1 nA' },
      ]}
      detectionFeatures={[
        { name: 'Extremely high sensitivity', desc: 'Able to detect very low levels of light.' },
        { name: 'Fast response time', desc: 'Suitable for high-speed photon counting applications.' },
        { name: 'Low noise', desc: 'Excellent signal-to-noise ratio.' },
      ]}
      safetyNotes={[
        'Handle high-voltage circuits with caution.',
        'Protect PMTs from exposure to strong light, which may damage the photocathode.',
        'Ensure vacuum integrity to avoid implosion risk.',
      ]}
      applications={[
        'Scintillation detectors in nuclear and particle physics',
        'Medical imaging (e.g., PET scanners)',
        'Fluorescence spectroscopy',
        'Low-light level detection in astrophysics',
      ]}
    />
  );
}
