import React from 'react';
import './seatHandCount.css';

export function SeatHandCount({
  count,
  unit,
  label,
}: {
  count: number;
  unit: string;
  label: string;
}) {
  const description = `${label} ${count}`;
  return (
    <span className="table-hand-count" title={description} aria-label={description}>
      {count}{unit}
    </span>
  );
}
