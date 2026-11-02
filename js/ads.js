// Reklam SDK'sı yerine simülasyon. Gerçek entegrasyonda yalnızca bu dosya değişir
// (AppLovin MAX / LevelPlay / AdMob), oyun kodu aynı Promise arayüzünü kullanır.
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

// GDD 6.2 kuralları: level 12'den önce yok, en az 3 levelde bir, 90 sn arayla,
// ödüllü reklam izlenen geçişten sonra bir kez atlanır.
export function maybeInterstitial(S, completedLevel) {
  S.levelsSinceInter = (S.levelsSinceInter || 0) + 1;
  if (S.skipNextInter) { S.skipNextInter = false; return Promise.resolve(false); }
  if (completedLevel < ADS.interstitialMinLevel) return Promise.resolve(false);
  if (S.levelsSinceInter < ADS.interstitialEveryLevels) return Promise.resolve(false);
  if (Date.now() - S.lastInterTs < ADS.interstitialCooldownSec * 1000) return Promise.resolve(false);
  S.levelsSinceInter = 0;
  S.lastInterTs = Date.now();
  track('interstitial_shown', { level: completedLevel });
  return new Promise(resolve => {
    const L = layer();
    L.innerHTML = `<div class="ad-box"><div class="ad-tag">ARA REKLAM · SİMÜLASYON</div><div class="ad-title">Reklam</div><div class="ad-count">…</div></div>`;
    L.classList.remove('hidden');
    setTimeout(() => {
      L.querySelector('.ad-box').insertAdjacentHTML('beforeend', '<button id="interClose" class="btn link">Kapat ✕</button>');
      document.getElementById('interClose').onclick = () => { L.classList.add('hidden'); L.innerHTML = ''; resolve(true); };
    }, ADS.interstitialSec * 1000);
  });
}
