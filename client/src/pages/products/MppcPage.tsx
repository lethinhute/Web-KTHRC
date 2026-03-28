import ProductDetailPage from '../../components/ProductDetailPage';

export default function MppcPage() {
  return (
    <ProductDetailPage
      title="Multi-Pixel Photon Counter (MPPC)"
      description="A solid-state photodetector using multiple avalanche photodiode (APD) pixels in Geiger mode. Each pixel outputs a pulse at the same amplitude when detecting a photon."
      price="Not available"
      priceVnd="Không có hàng"
      media={<img src="/img/index/mppc.jpeg" alt="MPPC" style={{ width: '100%', borderRadius: 16 }} />}
      technicalDescription="MPPCs consist of hundreds to thousands of APD microcells connected in parallel, each capable of detecting individual photons. When a photon strikes a pixel, the APD operates in Geiger mode, producing a standardized pulse. The sum of the triggered pixels produces an output proportional to the incident light intensity. The devices are compact, operate at low voltage, and have excellent photon detection efficiency."
      coreComponents={[
        { name: 'APD Microcells', desc: 'Thousands of avalanche photodiodes operating above breakdown voltage.' },
        { name: 'Quenching Resistors', desc: 'Integrated resistors to stop the avalanche after a detection event.' },
        { name: 'Common Output Node', desc: 'Summed signal output from all pixels.' },
        { name: 'Protective Window', desc: 'Optical interface that protects the device surface.' },
        { name: 'Bias Voltage Supply', desc: 'Provides stable high voltage for Geiger-mode operation.' },
      ]}
      specifications={[
        { param: 'Pixel Count', value: '100 – 10,000 pixels' },
        { param: 'Operation Mode', value: 'Geiger Mode (Digital Photon Detection)' },
        { param: 'Gain', value: '10⁵ – 10⁷' },
        { param: 'Photon Detection Efficiency (PDE)', value: '20% – 50% (at peak wavelength)' },
        { param: 'Bias Voltage', value: '25V – 70V' },
        { param: 'Response Time', value: '< 100 ns' },
      ]}
      detectionFeatures={[
        { name: 'Single-photon resolution', desc: 'Able to resolve individual photons from low light sources.' },
        { name: 'Fast timing', desc: 'Suitable for time-of-flight (TOF) and coincidence measurements.' },
        { name: 'Compact and durable', desc: 'No vacuum tubes or fragile parts.' },
      ]}
      safetyNotes={[
        'Ensure proper electrostatic discharge (ESD) precautions when handling.',
        'Use low-noise power supplies for stable bias voltage.',
        'Avoid overexposing to high-intensity light to prevent saturation or damage.',
      ]}
      applications={[
        'High-energy physics detectors',
        'Medical imaging (e.g., PET scanners)',
        'Biophotonics and fluorescence detection',
        'LIDAR and time-of-flight systems',
      ]}
      applicationsIntro="MPPCs are used in various precision photon detection scenarios, including:"
    />
  );
}
