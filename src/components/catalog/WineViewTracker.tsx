'use client';

import { useEffect } from 'react';
import { recordWineEventAction } from '@/app/actions/analytics';

interface WineViewTrackerProps {
  wineId: string;
}

export function WineViewTracker({ wineId }: WineViewTrackerProps) {
  useEffect(() => {
    // Registra a visualização (click) ao montar o componente no cliente
    recordWineEventAction(wineId, 'click');
  }, [wineId]);

  return null; // Componente não renderiza nada visualmente
}
