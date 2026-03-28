import { type ReactNode } from 'react';
import './ProductDetailPage.css';

interface SpecRow {
  param: string;
  value: string;
}

export interface ProductDetailProps {
  title: string;
  description: string;
  price: string;
  priceVnd: string;
  media: ReactNode;
  technicalDescription: string;
  coreComponents: { name: string; desc: string }[];
  specifications: SpecRow[];
  detectionFeatures?: { name: string; desc: string }[];
  safetyNotes: string[];
  applications: string[];
  applicationsIntro?: string;
  extraSections?: { heading: string; items: { name?: string; desc?: string; text?: string }[] }[];
}

export default function ProductDetailPage({
  title,
  description,
  price,
  priceVnd,
  media,
  technicalDescription,
  coreComponents,
  specifications,
  detectionFeatures,
  safetyNotes,
  applications,
  applicationsIntro,
  extraSections,
}: ProductDetailProps) {
  return (
    <div className="product-detail-page">
      {/* Hero row */}
      <div className="pd-hero">
        <div className="pd-media">{media}</div>
        <div className="pd-summary">
          <h1 className="pd-title">{title}</h1>
          <p className="pd-desc">{description}</p>
          <div className="pd-pricing">
            <span className="pd-price-usd">{price}</span>
            <span className="pd-price-vnd">{priceVnd}</span>
          </div>
          <a href="#" className="pd-buy-btn" onClick={(e) => e.preventDefault()}>
            Don't buy
          </a>
        </div>
      </div>

      <hr className="pd-divider" />

      {/* Technical content */}
      <div className="pd-content">
        <h2 className="pd-section-head">Technical Description</h2>
        <p className="pd-paragraph">{technicalDescription}</p>

        <h3 className="pd-sub-head">Core Components</h3>
        <ul className="pd-list">
          {coreComponents.map((c, i) => (
            <li key={i}>
              <strong>{c.name}:</strong> {c.desc}
            </li>
          ))}
        </ul>

        <h3 className="pd-sub-head">Specifications</h3>
        <div className="pd-table-wrap">
          <table className="pd-table">
            <thead>
              <tr>
                <th>Parameter</th>
                <th>Typical Value</th>
              </tr>
            </thead>
            <tbody>
              {specifications.map((s, i) => (
                <tr key={i}>
                  <td>{s.param}</td>
                  <td>{s.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {detectionFeatures && (
          <>
            <h3 className="pd-sub-head">Detection Features</h3>
            <ul className="pd-list">
              {detectionFeatures.map((f, i) => (
                <li key={i}>
                  <strong>{f.name}:</strong> {f.desc}
                </li>
              ))}
            </ul>
          </>
        )}

        {extraSections &&
          extraSections.map((s, i) => (
            <div key={i}>
              <h3 className="pd-sub-head">{s.heading}</h3>
              <ul className="pd-list">
                {s.items.map((item, j) => (
                  <li key={j}>
                    {item.name && <strong>{item.name}:</strong>}
                    {item.name ? ' ' : ''}
                    {item.desc ?? item.text}
                  </li>
                ))}
              </ul>
            </div>
          ))}

        <h3 className="pd-sub-head">Safety Notes</h3>
        <ul className="pd-list">
          {safetyNotes.map((n, i) => (
            <li key={i}>{n}</li>
          ))}
        </ul>

        <h3 className="pd-sub-head">Applications</h3>
        {applicationsIntro && <p className="pd-paragraph">{applicationsIntro}</p>}
        <ul className="pd-list">
          {applications.map((a, i) => (
            <li key={i}>{a}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
