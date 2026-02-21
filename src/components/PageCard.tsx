import { FC } from 'react';
import { ACCENT, BORDER, SURFACE } from './ui';
import { THUMB_PX } from '../lib/pdf';

interface PageCardProps {
  page: any;
  displayIdx: number;
  dndHandlers: any;
  isOver: boolean;
}

export const PageCard: FC<PageCardProps> = ({ page, displayIdx, dndHandlers, isOver }) => {
  return (
    <div {...dndHandlers} style={{
      ...css.card,
      outline: isOver ? `2px solid ${ACCENT}` : "2px solid transparent",
      transform: isOver ? "scale(1.04)" : "scale(1)",
      transition: "transform 0.15s, outline 0.15s",
    }}>
      <div style={css.cardImgWrap}>
        <img src={page.dataUrl} alt={`p${displayIdx+1}`} style={css.cardImg} draggable={false} />
      </div>
      <div style={css.cardFooter}>
        <span style={{ color: ACCENT, fontWeight: 700 }}>{displayIdx + 1}</span>
        <span style={{ color: "#52525b", fontSize: 10 }}>orig.{page.originalIndex + 1}</span>
      </div>
    </div>
  );
}

const css = {
  card: {
    width: THUMB_PX + 16, background: SURFACE, border: `1px solid ${BORDER}`,
    borderRadius: 8, overflow: "hidden", cursor: "grab", userSelect: "none" as const,
    boxShadow: "0 2px 8px rgba(0,0,0,0.5)",
  },
  cardImgWrap: { display: "flex", justifyContent: "center", alignItems: "center", padding: 8, background: "#111" },
  cardImg: { maxWidth: "100%", maxHeight: THUMB_PX, display: "block", borderRadius: 3 },
  cardFooter: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "5px 10px", borderTop: `1px solid ${BORDER}`, fontSize: 12,
  },
};
