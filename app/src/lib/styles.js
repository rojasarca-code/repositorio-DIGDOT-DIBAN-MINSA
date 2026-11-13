export const labelStyle = {
  fontSize: 12, fontWeight: 700, color: 'oklch(45% 0.01 30)', marginBottom: 6
};

export const inputStyle = {
  width: '100%', border: '1px solid oklch(85% 0.006 90)', borderRadius: 8, padding: '10px 12px',
  fontSize: 14, fontFamily: 'Manrope,sans-serif', background: '#fff'
};

export const secNavButtonStyle = {
  background: '#fff', border: '1px solid oklch(85% 0.006 90)', color: 'oklch(30% 0.01 30)',
  borderRadius: 8, padding: '9px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
  fontFamily: 'Manrope,sans-serif'
};

export const actaButtonStyle = {
  background: '#000', color: '#fff', border: 'none', borderRadius: 10,
  padding: '11px 14px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'Manrope,sans-serif'
};

export const actaButtonStyleInline = {
  background: '#000', color: '#fff', border: 'none', borderRadius: 8,
  padding: '9px 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'Manrope,sans-serif'
};

export function navButtonStyle(active, disabled) {
  if (disabled) {
    return {
      width: '100%', textAlign: 'left', background: 'transparent', border: 'none', borderRadius: 10,
      padding: '10px 12px', cursor: 'not-allowed', fontFamily: 'Manrope,sans-serif', color: 'oklch(75% 0 0)',
      display: 'block'
    };
  }
  return {
    width: '100%', textAlign: 'left', background: active ? 'oklch(95% 0 0)' : 'transparent',
    border: 'none', borderRadius: 10, padding: '10px 12px', cursor: 'pointer',
    fontFamily: 'Manrope,sans-serif', color: active ? '#000' : 'oklch(30% 0.01 30)',
    display: 'block'
  };
}
