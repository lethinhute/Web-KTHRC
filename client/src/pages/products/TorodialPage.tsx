import ProductDetailPage from '../../components/ProductDetailPage';

export default function TorodialPage() {
  return (
    <ProductDetailPage
      title="Toroidal Plasma"
      description="Refers to a plasma (a hot, ionized gas consisting of free-moving electrons and ions) that is confined in a doughnut-shaped (toroidal) configuration. This shape is used in devices like tokamaks and stellarators to maintain stable conditions for nuclear fusion."
      price="Not available"
      priceVnd="Không có hàng"
      media={<img src="/img/index/mppc.jpeg" alt="Toroidal Plasma" style={{ width: '100%', borderRadius: 16 }} />}
      technicalDescription="Toroidal plasmas are central to modern fusion energy experiments. Magnetic confinement in a toroidal geometry minimizes particle loss and allows for longer plasma sustainment. These systems generate and maintain extreme temperatures (millions of degrees Celsius), necessary for fusion reactions to occur."
      coreComponents={[
        { name: 'Plasma', desc: 'Ionized gas made of nuclei (like deuterium and tritium) and electrons.' },
        { name: 'Vacuum Vessel', desc: 'The toroidal chamber where plasma is formed and confined.' },
        { name: 'Toroidal Magnetic Field Coils', desc: 'Create magnetic fields wrapping around the torus to confine plasma particles.' },
        { name: 'Poloidal Field Coils', desc: 'Control plasma shape and stability within the torus.' },
        { name: 'Heating Systems', desc: 'Include ohmic heating, neutral beam injection, and radiofrequency heating.' },
        { name: 'Diagnostics', desc: 'Tools to monitor plasma temperature, density, and confinement performance.' },
      ]}
      specifications={[
        { param: 'Major Radius (R)', value: '1–6 m (tokamak devices)' },
        { param: 'Minor Radius (r)', value: '0.5–2 m' },
        { param: 'Plasma Temperature', value: '~150 million °C' },
        { param: 'Magnetic Field Strength', value: '2–5 Tesla' },
        { param: 'Plasma Current', value: '0.5–15 MA (Megaamperes)' },
      ]}
      extraSections={[
        {
          heading: 'Fusion Devices Using Toroidal Plasma',
          items: [
            { name: 'Tokamak', desc: 'The most researched design; uses both toroidal and poloidal fields with a plasma current.' },
            { name: 'Stellarator', desc: 'Uses only external magnetic coils to achieve confinement, avoiding plasma current instabilities.' },
          ],
        },
        {
          heading: 'Challenges',
          items: [
            { text: 'Plasma instabilities such as disruptions and edge localized modes (ELMs).' },
            { text: 'Material endurance under high neutron flux and thermal stress.' },
            { text: 'Achieving energy gain (Q > 1) in a sustainable manner.' },
          ],
        },
      ]}
      safetyNotes={[
        'Extremely high temperatures require robust containment and safety protocols.',
        'Strong magnetic fields can affect electronic equipment and pacemakers.',
        'Proper shielding required for neutron radiation in fusion experiments.',
      ]}
      applications={[
        'Nuclear fusion energy research',
        'Plasma physics studies',
        'Space propulsion (conceptual toroidal plasma engines)',
      ]}
    />
  );
}
