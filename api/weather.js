/**
 * /api/nasa-power — NASA POWER нақты уақытты деректері
 * Каспий теңізінің торлық нүктелері үшін T2M, RH2M, WS10M, EVPTRNS
 * NASA POWER AG community, Daily API
 */

// Каспий торының барлық нүктелері
const GRID_POINTS = [
  // Оңтүстік Каспий
  { lat: 36.5, lon: 49.0 }, { lat: 36.5, lon: 49.7 }, { lat: 36.5, lon: 50.4 },
  { lat: 36.5, lon: 51.1 }, { lat: 36.5, lon: 51.8 }, { lat: 36.5, lon: 52.5 },
  { lat: 36.5, lon: 53.2 }, { lat: 36.5, lon: 53.9 }, { lat: 36.5, lon: 54.5 },
  // Орта Каспий
  { lat: 37.9, lon: 49.0 }, { lat: 37.9, lon: 49.7 }, { lat: 37.9, lon: 50.4 },
  { lat: 37.9, lon: 51.1 }, { lat: 37.9, lon: 51.8 }, { lat: 37.9, lon: 52.5 },
  { lat: 37.9, lon: 53.2 }, { lat: 37.9, lon: 53.9 }, { lat: 37.9, lon: 54.5 },
  { lat: 39.3, lon: 49.0 }, { lat: 39.3, lon: 49.7 }, { lat: 39.3, lon: 50.4 },
  { lat: 39.3, lon: 51.1 }, { lat: 39.3, lon: 51.8 }, { lat: 39.3, lon: 52.5 },
  { lat: 39.3, lon: 53.2 }, { lat: 39.3, lon: 53.9 }, { lat: 39.3, lon: 54.5 },
  { lat: 40.7, lon: 49.0 }, { lat: 40.7, lon: 49.7 }, { lat: 40.7, lon: 50.4 },
  { lat: 40.7, lon: 51.1 }, { lat: 40.7, lon: 51.8 }, { lat: 40.7, lon: 52.5 },
  { lat: 40.7, lon: 53.2 }, { lat: 40.7, lon: 53.9 }, { lat: 40.7, lon: 54.5 },
  // Солтүстік Каспий (Қазақстан секторы)
  { lat: 42.1, lon: 49.0 }, { lat: 42.1, lon: 49.7 }, { lat: 42.1, lon: 50.4 },
  { lat: 42.1, lon: 51.1 }, { lat: 42.1, lon: 51.8 }, { lat: 42.1, lon: 52.5 },
  { lat: 42.1, lon: 53.2 }, { lat: 42.1, lon: 53.9 }, { lat: 42.1, lon: 54.5 },
  { lat: 43.5, lon: 49.0 }, { lat: 43.5, lon: 49.7 }, { lat: 43.5, lon: 50.4 },
  { lat: 43.5, lon: 51.1 }, { lat: 43.5, lon: 51.8 }, { lat: 43.5, lon: 52.5 },
  { lat: 43.5, lon: 53.2 }, { lat: 43.5, lon: 53.9 }, { lat: 43.5, lon: 54.5 },
  { lat: 44.9, lon: 49.0 }, { lat: 44.9, lon: 49.7 }, { lat: 44.9, lon: 50.4 },
  { lat: 44.9, lon: 51.1 }, { lat: 44.9, lon: 51.8 }, { lat: 44.9, lon: 52.5 },
  { lat: 44.9, lon: 53.2 }, { lat: 44.9, lon: 53.9 }, { lat: 44.9, lon: 54.5 },
  { lat: 46.3, lon: 49.0 }, { lat: 46.3, lon: 49.7 }, { lat: 46.3, lon: 50.4 },
  { lat: 46.3, lon: 51.1 }, { lat: 46.3, lon: 51.8 }, { lat: 46.3, lon: 52.5 },
  { lat: 46.3, lon: 53.2 }, { lat: 46.3, lon: 53.9 }, { lat: 46.3, lon: 54.5 },
  { lat: 47.0, lon: 49.0 }, { lat: 47.0, lon: 49.7 }, { lat: 47.0, lon: 50.4 },
  { lat: 47.0, lon: 51.1 }, { lat: 47.0, lon: 51.8 }, { lat: 47.0, lon: 52.5 },
  { lat: 47.0, lon: 53.2 }, { lat: 47.0, lon: 53.9 }, { lat: 47.0, lon: 54.5 },
];

const NASA_BASE = 'https://power.larc.nasa.gov/api/temporal/daily/point';
const PARAMS = 'T2M,RH2M,WS10M,EVPTRNS,TS'; // Ауа темп, Ылғал, Жел, Булану, Жер беті темп

function getDateStr(daysBack = 3) {
  const d = new Date();
  d.setDate(d.getDate() - daysBack); // NASA POWER ~3 күн кешіктіреді
  return d.toISOString().slice(0, 10).replace(/-/g, '');
}

// Magnus-Tetens формуласымен булануды есептеу (ET₀ жуықтамасы)
function estimateEvaporation(tempC, humidity, windMs) {
  const svp = 0.6108 * Math.exp((17.27 * tempC) / (tempC + 237.3));
  const avp = (humidity / 100) * svp;
  const vpd = svp - avp;
  const et0 = (0.0023 * (tempC + 17.8) * Math.sqrt(Math.max(0, tempC - (tempC * humidity / 100 * 0.1))) * 0.408 + 0.1 * windMs * vpd);
  return Math.max(0, +et0.toFixed(2));
}

// SST жуықтамасы (ауа темп + корреляция)
function estimateSST(tempC, lat) {
  const latFactor = (47 - lat) / 10 * 1.5; // оңтүстікте жылырақ
  return +(tempC + latFactor + 0.8).toFixed(2);
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate'); // 1 сағат кэш

  const dateStr = getDateStr(3);

  try {
    // NASA POWER-ді параллельді шақыру (батч: 10 нүктеден)
    const BATCH = 10;
    const results = [];

    for (let i = 0; i < GRID_POINTS.length; i += BATCH) {
      const batch = GRID_POINTS.slice(i, i + BATCH);
      const batchResults = await Promise.all(
        batch.map(async (pt) => {
          try {
            const url = `${NASA_BASE}?parameters=${PARAMS}&community=AG&longitude=${pt.lon}&latitude=${pt.lat}&start=${dateStr}&end=${dateStr}&format=JSON&time-standard=UTC`;
            const r = await fetch(url, { signal: AbortSignal.timeout(12000) });
            if (!r.ok) throw new Error(`HTTP ${r.status}`);
            const data = await r.json();
            const props = data?.properties?.parameter;
            if (!props) throw new Error('No data');

            const temp    = +(props.T2M?.[dateStr] ?? -999).toFixed(2);
            const humidity = +(props.RH2M?.[dateStr] ?? -999).toFixed(1);
            const wind    = +(props.WS10M?.[dateStr] ?? -999).toFixed(2);
            const evpRaw  = props.EVPTRNS?.[dateStr];
            const tsSurf  = props.TS?.[dateStr];

            // EVPTRNS — NASA бетінен булану (кг/м²/күн = мм/күн)
            // Егер -999 болса, Magnus-Tetens есептейміз
            const evaporation = (evpRaw && evpRaw > 0)
              ? +Math.abs(evpRaw).toFixed(2)
              : estimateEvaporation(temp, humidity, wind);

            const sst = (tsSurf && tsSurf > -900)
              ? +(tsSurf).toFixed(2)
              : estimateSST(temp, pt.lat);

            return {
              lat: pt.lat,
              lon: pt.lon,
              temp: temp > -900 ? temp : null,
              humidity: humidity > -900 ? humidity : null,
              wind: wind > -900 ? wind : null,
              sst,
              evaporation,
              source: 'NASA_POWER',
              date: dateStr,
            };
          } catch (e) {
            // NASA сәтсіз болса — null қайтарамыз, fallback JSON-нан алады
            return { lat: pt.lat, lon: pt.lon, error: e.message, source: 'fallback' };
          }
        })
      );
      results.push(...batchResults);
      // Rate limit: батчтар арасында 200мс үзіліс
      if (i + BATCH < GRID_POINTS.length) {
        await new Promise(r => setTimeout(r, 200));
      }
    }

    const valid = results.filter(p => !p.error && p.temp !== null);
    const failed = results.filter(p => p.error);

    res.status(200).json({
      ok: true,
      source: 'NASA POWER MERRA-2',
      date: dateStr,
      total: results.length,
      valid: valid.length,
      failed: failed.length,
      data: results,
      meta: {
        parameters: { T2M: 'Ауа темп (°C)', RH2M: 'Ылғал (%)', WS10M: 'Жел 10м (м/с)', EVPTRNS: 'Булану (мм/күн)', TS: 'Жер беті темп (°C)' },
        community: 'AG',
        resolution: '0.5°×0.625°',
      }
    });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
  }
  
