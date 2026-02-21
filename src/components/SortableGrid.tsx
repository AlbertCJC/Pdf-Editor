import { FC } from 'react';
import { useDragSort } from '../hooks/useDragSort';
import { PageCard } from './PageCard';

interface SortableGridProps {
  pages: any[];
  setPages: (fn: (prev: any[]) => any[]) => void;
}

export const SortableGrid: FC<SortableGridProps> = ({ pages, setPages }) => {
  const { handlers, overIdx } = useDragSort(pages, setPages);
  return (
    <div style={css.grid}>
      {pages.map((pg, i) => (
        <PageCard
          key={pg.id}
          page={pg}
          displayIdx={i}
          dndHandlers={handlers(i)}
          isOver={overIdx === i}
        />
      ))}
    </div>
  );
}

const css = {
  grid: { display: "flex", flexWrap: "wrap" as const, gap: 12 },
};
