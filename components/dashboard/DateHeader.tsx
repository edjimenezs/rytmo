'use client';

import { useEffect, useState } from 'react';

export default function DateHeader({ firstName }: { firstName: string }) {
  const [dateLabel, setDateLabel] = useState('');

  useEffect(() => {
    setDateLabel(
      new Date().toLocaleDateString('es-CL', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      })
    );
  }, []);

  return (
    <div className="mb-5">
      <p className="text-xs text-[#8b949e] capitalize">{dateLabel}</p>
      <h1 className="text-2xl font-bold text-[#e6edf3] mt-0.5">Hola, {firstName}</h1>
    </div>
  );
}
