'use client';

import { useEffect, useState, useCallback } from 'react';
import { foodCatalog } from '@/lib/nutrition/catalog';

const ALL_NAMES = [...new Set(foodCatalog.map((f) => f.name))].sort();

type State = 'idle' | 'loading' | 'saving' | 'saved' | 'error';

export default function FoodPreferencesForm() {
  const [liked, setLiked] = useState<Set<string>>(new Set());
  const [disliked, setDisliked] = useState<Set<string>>(new Set());
  const [status, setStatus] = useState<State>('loading');

  useEffect(() => {
    fetch('/api/user/preferences')
      .then((r) => r.json())
      .then((data) => {
        setLiked(new Set(data.likedFoods ?? []));
        setDisliked(new Set(data.dislikedFoods ?? []));
        setStatus('idle');
      })
      .catch(() => setStatus('error'));
  }, []);

  const save = useCallback(async (nextLiked: Set<string>, nextDisliked: Set<string>) => {
    setStatus('saving');
    try {
      await fetch('/api/user/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          likedFoods: [...nextLiked],
          dislikedFoods: [...nextDisliked],
        }),
      });
      setStatus('saved');
      setTimeout(() => setStatus('idle'), 1500);
    } catch {
      setStatus('error');
    }
  }, []);

  const toggleLiked = (name: string) => {
    const next = new Set(liked);
    const nextDisliked = new Set(disliked);
    if (next.has(name)) {
      next.delete(name);
    } else {
      next.add(name);
      nextDisliked.delete(name); // can't be both
    }
    setLiked(next);
    setDisliked(nextDisliked);
    save(next, nextDisliked);
  };

  const toggleDisliked = (name: string) => {
    const next = new Set(disliked);
    const nextLiked = new Set(liked);
    if (next.has(name)) {
      next.delete(name);
    } else {
      next.add(name);
      nextLiked.delete(name); // can't be both
    }
    setDisliked(next);
    setLiked(nextLiked);
    save(nextLiked, next);
  };

  if (status === 'loading') {
    return <p className="text-sm text-gray-400 py-2">Cargando preferencias...</p>;
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-500">
          Tocá cada alimento para marcarlo como favorito o como uno que evitás.
        </p>
        {status === 'saving' && <span className="text-xs text-gray-400">Guardando...</span>}
        {status === 'saved' && <span className="text-xs text-green-600">Guardado ✓</span>}
        {status === 'error' && <span className="text-xs text-red-500">Error al guardar</span>}
      </div>

      <div className="flex flex-wrap gap-2">
        {ALL_NAMES.map((name) => {
          const isLiked = liked.has(name);
          const isDisliked = disliked.has(name);
          return (
            <div key={name} className="flex items-center gap-1">
              <button
                onClick={() => toggleLiked(name)}
                title="Me gusta"
                className={`text-xs px-2.5 py-1 rounded-l-full border transition-colors ${
                  isLiked
                    ? 'bg-green-100 border-green-300 text-green-800 font-medium'
                    : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                {isLiked ? '★' : '☆'} {name}
              </button>
              <button
                onClick={() => toggleDisliked(name)}
                title="No como esto"
                className={`text-xs px-2 py-1 rounded-r-full border-y border-r transition-colors ${
                  isDisliked
                    ? 'bg-red-100 border-red-300 text-red-700 font-medium'
                    : 'bg-white border-gray-200 text-gray-400 hover:bg-gray-50'
                }`}
              >
                ✕
              </button>
            </div>
          );
        })}
      </div>

      {(liked.size > 0 || disliked.size > 0) && (
        <div className="text-xs text-gray-400 space-y-0.5">
          {liked.size > 0 && <p>Favoritos: {liked.size} alimento{liked.size > 1 ? 's' : ''}</p>}
          {disliked.size > 0 && <p>Evitados: {disliked.size} alimento{disliked.size > 1 ? 's' : ''}</p>}
        </div>
      )}
    </div>
  );
}
