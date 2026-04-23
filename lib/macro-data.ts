import rawData from '../mock_data.json';

// This is a build-time safe mock for the macro dashboard UI.
// It intentionally provides the fields expected by frontend/components/macro-dashboard.tsx,
// even when mock_data.json is minimal.

const data: any = rawData as any;

export const mockMacroDashboard = {
  meta: {
    mode: 'mock-first',
  },
  sourceRoadmap: {
    us: [],
    tr: [],
  },
  commentary: {
    stance: (data?.sentiment?.label ?? 'Neutral') as string,
    headline: 'Mock macro commentary',
    bullets: [] as string[],
    watchpoints: [] as string[],
    sourceNotes: [] as string[],
  },
  usMacro: [] as Array<{
    id: string;
    label: string;
    source: string;
    seriesId: string;
    direction: 'up' | 'down' | 'flat';
    value: number;
    unit: string;
  }>,
  trMacro: [] as Array<{
    id: string;
    label: string;
    source: string;
    seriesId: string;
    direction: 'up' | 'down' | 'flat';
    value: number;
    unit: string;
  }>,
  liquidity: {
    current: {
      bistTurnover: 0,
      freeFloatVelocity: 0,
      usdTry: 0,
      riskAppetite: 'neutral-to-positive',
    },
    hourlySeries: [] as Array<{
      time: string;
      price: number;
      liquidity: number;
      label: string;
    }>,
  },
};
