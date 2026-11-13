import { labelStyle, inputStyle } from '../lib/styles.js';

export const cardStyle = {
  background: '#fff', border: '1px solid #dedddb', borderRadius: 14, padding: '20px 24px'
};

export const rowStyle = {
  background: '#fff', border: '1px solid #dedddb', borderRadius: 12, padding: '12px 16px',
  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14
};

export const mutedText = { fontSize: 12.5, color: '#636363' };

export function Campo({ label, children }) {
  return (
    <div style={{ minWidth: 0 }}>
      <div style={labelStyle}>{label}</div>
      {children}
    </div>
  );
}

export function Entrada({ label, value, onChange, placeholder, mode }) {
  return (
    <Campo label={label}>
      <input
        value={value || ''}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        inputMode={mode}
        style={inputStyle}
      />
    </Campo>
  );
}

export function Chip({ children, solid }) {
  return (
    <span style={{
      fontSize: 10.5, fontWeight: 800, borderRadius: 6, padding: '2px 7px', whiteSpace: 'nowrap',
      background: solid ? '#000' : '#fff', color: solid ? '#fff' : '#000', border: '1.5px solid #000'
    }}>{children}</span>
  );
}
