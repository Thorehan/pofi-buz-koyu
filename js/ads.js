// Reklam SDK'sı yerine simülasyon. Gerçek entegrasyonda yalnızca bu dosya değişir
// (AppLovin MAX / LevelPlay / AdMob), oyun kodu aynı Promise arayüzünü kullanır.
// Oyunda ara reklam yok: yalnızca oyuncunun kendi seçtiği ödüllü reklamlar (kullanıcı kararı).
import { ADS } from './config.js';

export function track(name, params = {}) {
  console.debug('[analytics]', name, params);
}

const layer = () => document.getElementById('adLayer');

export function showRewarded(placement) {
  return new Promise(resolve => {
    const L = layer();
    let left = ADS.rewardedSec;
    const finish = ok => {
      clearInterval(iv);
      L.classList.add('hidden');
      L.innerHTML = '';
      track(ok ? 'rv_watched' : 'rv_skipped', { placement });
      resolve(ok);
    };
    L.innerHTML = `<div class="ad-box">
      <div class="ad-tag">ÖDÜLLÜ REKLAM · SİMÜLASYON</div>
      <div class="ad-title">Video oynatılıyor…</div>
      <div class="ad-count" id="adCount">${left}</div>
      <button id="adClose" class="btn link">Kapat (ödül yok)</button>
    </div>`;
    L.classList.remove('hidden');
    track('rv_start', { placement });
    document.getElementById('adClose').onclick = () => finish(false);
    const iv = setInterval(() => {
      left--;
      if (left > 0) { document.getElementById('adCount').textContent = left; return; }
      clearInterval(iv);
      L.querySelector('.ad-box').innerHTML = `<div class="ad-tag">ÖDÜLLÜ REKLAM · SİMÜLASYON</div>
        <div class="ad-title">Ödül kazandın!</div>
        <button id="adDone" class="btn primary big">Ödülü al</button>`;
      document.getElementById('adDone').onclick = () => finish(true);
    }, 1000);
  });
}
