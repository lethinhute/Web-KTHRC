import ProductDetailPage from '../../components/ProductDetailPage';

export default function CounterPage() {
  return (
    <ProductDetailPage
      title="Geiger-Müller Counter"
      description="An electronic instrument for detecting and measuring ionizing radiation using a Geiger–Müller tube."
      price="99.99 USD"
      priceVnd="2.499.000 VND"
      media={<img src="/img/index/geiger.jpg" alt="Geiger-Müller Counter" style={{ width: '100%', borderRadius: 16 }} />}
      technicalDescription="The Geiger-Müller counter operates by detecting ionizing particles that enter a gas-filled tube and cause ionization. When a high-voltage potential is applied across the tube electrodes, ionizing radiation causes gas atoms to ionize, triggering a cascade that generates an electrical pulse. These pulses are counted and converted to a readable radiation level."
      coreComponents={[
        { name: 'Geiger-Müller Tube', desc: 'Central detection component containing low-pressure gas and electrodes.' },
        { name: 'High Voltage Supply', desc: 'Provides necessary potential (typically 400–900V) across the tube.' },
        { name: 'Pulse Counter', desc: 'Electronic circuit to register each detected event.' },
        { name: 'Display Unit', desc: 'Shows counts per second (CPS), counts per minute (CPM), or dose rate.' },
        { name: 'Audio Output', desc: "Optional speaker or buzzer to emit a 'click' sound with each detection." },
        { name: 'Shielding', desc: 'May include filters or casings to limit the type of detected radiation.' },
      ]}
      specifications={[
        { param: 'Detection Type', value: 'Alpha, Beta, Gamma' },
        { param: 'Operating Voltage', value: '400–900V DC' },
        { param: 'Tube Fill Gas', value: 'Argon, Helium, Neon with halogen or organic quench gas' },
        { param: 'Display Output', value: 'CPM / µSv/h / mR/h' },
        { param: 'Response Time', value: '0.1–1 sec' },
        { param: 'Power Supply', value: 'Battery (3–9V) or external power adapter' },
      ]}
      extraSections={[
        {
          heading: 'Types of Detected Radiation',
          items: [
            { name: 'Alpha particles (α)', desc: 'Detectable only with special thin-window tubes.' },
            { name: 'Beta particles (β)', desc: 'Easily detected depending on shielding and energy.' },
            { name: 'Gamma rays (γ)', desc: 'Detected indirectly via ionization events in gas.' },
          ],
        },
      ]}
      safetyNotes={[
        'Do not disassemble the high voltage section while powered on.',
        'Use certified sources or natural radiation for safe measurement.',
        'Be cautious of long-term exposure to high radiation levels during experiments.',
      ]}
      applications={[
        'Environmental radiation monitoring',
        'Nuclear industry and laboratory safety',
        'Educational demonstrations and teaching tools',
        'Radiological emergency response',
      ]}
      applicationsIntro="Geiger-Müller counters are commonly used in:"
    />
  );
}
