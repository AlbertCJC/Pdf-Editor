import { FC, ReactNode } from 'react';

export const ACCENT = "#f97316";
export const BORDER = "#27272a";
export const SURFACE = "#18181b";

export const Row: FC<{ label: string; children: ReactNode }> = ({ label, children }) => {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
      <span style={{ fontSize: 12, color: "#71717a", letterSpacing: "0.06em" }}>{label}</span>
      {children}
    </div>
  );
}

export const NumInput: FC<{ value: number; min: number; max: number; onChange: (fn: (v: number) => number) => void }> = ({ value, min, max, onChange }) => {
  return (
    <div style={css.numWrap}>
      <button style={css.numBtn} onClick={() => onChange(v => Math.max(min, v - 1))}>−</button>
      <span style={{ width: 28, textAlign: "center", fontSize: 14 }}>{value}</span>
      <button style={css.numBtn} onClick={() => onChange(v => Math.min(max, v + 1))}>+</button>
    </div>
  );
}

export const Spinner: FC<{ small?: boolean }> = ({ small }) => {
  return (
    <span style={{
      display: "inline-block",
      width: small ? 14 : 28, height: small ? 14 : 28,
      border: `2px solid ${BORDER}`,
      borderTop: `2px solid ${ACCENT}`,
      borderRadius: "50%",
      animation: "spin 0.7s linear infinite",
    }} />
  );
}

const css = {
  numWrap: { display: "flex", alignItems: "center", gap: 6 },
  numBtn: {
    width: 26, height: 26, background: SURFACE, border: `1px solid ${BORDER}`,
    color: "#e4e4e7", cursor: "pointer", borderRadius: 4, fontSize: 14,
    display: "flex", alignItems: "center", justifyContent: "center",
  },
};
