import AMapLoader from '@amap/amap-jsapi-loader';

const AMAP_KEY = import.meta.env.VITE_AMAP_KEY?.trim();

export function normalizeCityName(city) {
  if (!city) return '';
  return String(city).trim().replace(/(市|地区|盟|自治州)$/u, '');
}

function parseRectangleCenter(rectangle) {
  if (!rectangle || typeof rectangle !== 'string') return null;
  const [p1, p2] = rectangle.split(';');
  if (!p1 || !p2) return null;
  const [lng1, lat1] = p1.split(',').map(Number);
  const [lng2, lat2] = p2.split(',').map(Number);
  if (![lng1, lat1, lng2, lat2].every(Number.isFinite)) return null;
  return {
    lng: (lng1 + lng2) / 2,
    lat: (lat1 + lat2) / 2
  };
}

export async function detectCityByIP() {
  if (typeof window === 'undefined') return { city: '', center: null };
  if (!AMAP_KEY) return { city: '', center: null };
  try {
    const AMap = await AMapLoader.load({
      key: AMAP_KEY,
      version: '2.0',
      plugins: ['AMap.CitySearch']
    });
    return await new Promise((resolve) => {
      const citySearch = new AMap.CitySearch();
      citySearch.getLocalCity((status, result) => {
        if (status === 'complete' && result?.city) {
          resolve({
            city: result.city,
            center: parseRectangleCenter(result.rectangle)
          });
          return;
        }
        resolve({ city: '', center: null });
      });
    });
  } catch (err) {
    console.error('IP定位失败:', err);
    return { city: '', center: null };
  }
}

function getBrowserPosition() {
  if (typeof navigator === 'undefined' || !navigator.geolocation) {
    return Promise.resolve(null);
  }
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve(pos),
      () => resolve(null),
      { enableHighAccuracy: false, timeout: 6000, maximumAge: 5 * 60 * 1000 }
    );
  });
}

async function reverseGeocodeCity(lng, lat) {
  if (!AMAP_KEY) return '';
  try {
    const AMap = await AMapLoader.load({
      key: AMAP_KEY,
      version: '2.0',
      plugins: ['AMap.Geocoder']
    });
    return await new Promise((resolve) => {
      const geocoder = new AMap.Geocoder();
      geocoder.getAddress([lng, lat], (status, result) => {
        if (status !== 'complete' || !result?.regeocode?.addressComponent) {
          resolve('');
          return;
        }
        const ac = result.regeocode.addressComponent;
        resolve(ac.city || ac.province || '');
      });
    });
  } catch (_) {
    return '';
  }
}

export async function detectBestCity() {
  const pos = await getBrowserPosition();
  if (pos?.coords) {
    const city = await reverseGeocodeCity(pos.coords.longitude, pos.coords.latitude);
    if (city) return city;
  }
  const ipResult = await detectCityByIP();
  return ipResult?.city || '';
}
