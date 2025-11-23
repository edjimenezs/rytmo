'use client';

import { useEffect, useState } from 'react';

export default function MedicalDocumentsCount() {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const response = await fetch('/api/medical');
        if (response.ok) {
          const data = await response.json();
          setCount(data.total || 0);
        }
      } catch (error) {
        console.error('Error fetching medical documents count:', error);
      }
    };

    fetchCount();
  }, []);

  if (count === null) {
    return <span className="text-lg font-medium text-gray-900">-</span>;
  }

  return <span className="text-lg font-medium text-gray-900">{count}</span>;
}

