import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { chromium, webkit } from 'playwright';
import { createServer } from 'vite';

const cacheDir = await mkdtemp(join(tmpdir(), 'learning-audio-volume-'));
const browserType = process.env.AUDIO_TEST_BROWSER === 'webkit' ? webkit : chromium;
let browser;
try {
  const executablePath = process.env.CHROMIUM_PATH ?? (existsSync('/usr/bin/chromium') ? '/usr/bin/chromium' : undefined);
  browser = await browserType.launch(browserType === chromium ? { executablePath, args: ['--autoplay-policy=no-user-gesture-required'] } : {});
  for (const platform of ['web', 'ios', 'android']) {
    await checkPlatform(platform);
  }
} finally {
  await browser?.close();
  await rm(cacheDir, { recursive: true, force: true });
}

async function checkPlatform(platform) {
  const server = await createServer({
    configFile: false,
    cacheDir: join(cacheDir, platform),
    logLevel: 'error',
    optimizeDeps: { noDiscovery: true, entries: [] },
    define: {
      'import.meta.env.VITE_APP_PLATFORM': JSON.stringify(platform),
      'import.meta.env.VITE_WEB_PERFORMANCE_MODE': JSON.stringify(String(platform === 'web')),
    },
    server: { host: '127.0.0.1', port: 0, hmr: false, watch: null },
  });
  await server.listen();
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  try {
    await page.route('**/__volume-test', route => route.fulfill({ contentType: 'text/html', body: '<button id="wake">Enable audio</button>' }));
    await page.route(/\.(mp3|ogg)(\?|$)/, route => route.abort());
    await page.goto(`http://127.0.0.1:${server.httpServer.address().port}/__volume-test`);
    await page.evaluate(async () => {
      const { audioService: audio } = await import('/src/services/audioService.ts');
      const media = HTMLMediaElement.prototype;
      const volume = Object.getOwnPropertyDescriptor(media, 'volume');
      const audios = { active: new Set(), requests: [], delayNext: false, readonlyVolume: false };
      Object.defineProperty(media, 'volume', {
        configurable: true,
        get() { return audios.readonlyVolume ? 1 : volume.get.call(this); },
        set(value) { if (!audios.readonlyVolume) volume.set.call(this, value); },
      });
      media.play = function () {
        audios.active.add(this);
        const request = { element: this, volume: this.volume, muted: this.muted };
        audios.requests.push(request);
        if (!audios.delayNext) return Promise.resolve();
        audios.delayNext = false;
        return new Promise(resolve => { request.acknowledge = resolve; });
      };
      media.pause = function () { audios.active.delete(this); };
      media.load = () => {};
      Object.defineProperty(media, 'paused', { configurable: true, get() { return !audios.active.has(this); } });
      window.volumeTest = { audio, audios };
      document.querySelector('#wake').onclick = () => void audio.unlockAudio();
    });
    await page.click('#wake');
    const checks = await page.evaluate(async platform => {
      const { audio, audios } = window.volumeTest;
      const context = audio.ctx;
      const check = (condition, message) => { if (!condition) throw new Error(message); };
      const close = (value, expected, message) => check(Math.abs(value - expected) < .001, `${message} (${value} instead of ${expected})`);
      const output = element => audio.bgmMediaSources.has(element)
        ? audio.bgmGain.gain.value * audio.masterGain.gain.value * element.volume : element.volume;
      const resume = context.resume.bind(context);
      for (const track of ['menu', 'map']) audio.audioBuffers['NEW:elementary:' + track] = context.createBuffer(1, 4800, context.sampleRate);
      audio.setBgmVolume(.3);
      audio.setBgmDuckMultiplier(.5);
      audio.setSfxVolume(.2);
      audio.setVoiceVolume(.35);
      await audio.handleAppForeground();
      await audio.playBGM('menu');
      const before = audio.currentHtmlAudio;
      let checks = 0;
      if (platform === 'android') check(audio.currentSource?.buffer, 'Android starts task with decoded BGM');
      else {
        check(before && !before.muted, 'BGM is playable before interruption');
        close(output(before), .06, 'BGM output before interruption');
      }
      checks++;

      audio.handleAppBackground();
      await audio.backgroundSuspendPromise;
      check(!before || (before.paused && before.muted), 'Inactive music is paused and muted');
      for (const bus of [audio.masterGain, audio.bgmGain, audio.sfxGain]) bus.gain.setValueAtTime(1, context.currentTime);
      let restoredBeforeResume = false;
      context.resume = () => {
        close(audio.masterGain.gain.value, .4, 'Master volume before resume');
        close(audio.bgmGain.gain.value, .15, 'BGM volume and ducking before resume');
        close(audio.sfxGain.gain.value, .2, 'SFX volume before resume');
        restoredBeforeResume = true;
        return resume();
      };
      const connect = context.createMediaElementSource.bind(context);
      if (platform === 'web') context.createMediaElementSource = () => { throw new Error('Route changed'); };
      await audio.handleAppForeground();
      context.resume = resume;
      context.createMediaElementSource = connect;
      check(restoredBeforeResume, 'Resume restores all gain values before unlocking the device');
      checks++;

      if (platform === 'android') check(audio.currentSource?.buffer, 'Android resumes decoded BGM');
      else {
        const music = audio.currentHtmlAudio;
        check(music && !music.muted && audios.active.size === 1, 'One BGM stream remains');
        check(!audio.bgmMediaSources.has(music), 'Restored direct media route is exercised');
        close(audios.requests.at(-1).volume, .06, 'Direct media output on first play after resume');
        music.volume = 1;
        music.dispatchEvent(new Event('volumechange'));
        close(music.volume, .06, 'An unexpected media volume reset is reapplied');
      }
      checks++;

      await audio.pauseBGM();
      audio.handleAppBackground();
      await audio.handleAppForeground();
      check(audio.isBgmPaused && (!audio.currentHtmlAudio || audio.currentHtmlAudio.paused), 'Manually paused music stays paused during recovery');
      close(audio.bgmGain.gain.value, 0, 'The decoded BGM bus stays quiet during a manual pause');
      await audio.resumeBGM();
      close(audio.bgmGain.gain.value, .15, 'Manual resume restores the requested BGM level');
      checks++;

      const attempts = audios.requests.length;
      audio.setBgmVolume(0);
      audio.handleAppBackground();
      await audio.handleAppForeground();
      check(audios.requests.slice(attempts).every(request => request.muted), 'Zero volume stays silent through first play');
      close(audio.bgmGain.gain.value, 0, 'Zero BGM is restored');
      audio.setBgmVolume(.3);
      audio.toggleMute();
      const attemptsWhileMuted = audios.requests.length;
      audio.handleAppBackground();
      await audio.handleAppForeground();
      check(audios.requests.slice(attemptsWhileMuted).every(request => request.muted), 'Muted BGM stays silent through first play');
      close(audio.masterGain.gain.value, 0, 'Master remains muted');
      audio.stopBGM();
      audio.toggleMute();
      checks++;

      const voice = 'high-school-voice-volume-test';
      audio.sfxPlaybackGenerations.set('volume-test-cue', 1);
      audio.sfxPlaybackGenerations.set(voice, 1);
      const cuePromise = audio.playHtmlSfx('volume-test-cue', ['/sfx/correct.mp3'], 3000, false, 1, Infinity, .5);
      const cue = audios.requests.at(-1);
      close(cue.volume, .04, 'Native effect uses both the mixer level and its per-cue gain');
      audios.delayNext = true;
      const voicePromise = audio.playHtmlSfx(voice, ['/sfx/high-school-voices/HS_MALE/attack-1.ogg'], 3000, false, 1);
      const speech = audios.requests.at(-1);
      close(speech.volume, .35, 'Native voice volume before play acknowledgement');
      audio.setVoiceVolume(.15);
      close(speech.element.volume, .15, 'Pending speech also receives live volume changes');
      audio.handleAppBackground();
      check(cue.element.paused && cue.element.muted && speech.element.paused && speech.element.muted, 'Interruption cancels active and pending effects');
      await audio.handleAppForeground();
      speech.acknowledge();
      await Promise.all([cuePromise, voicePromise]);
      check(audios.active.size === 0, 'Old pending effects cannot restart after return');
      checks++;

      if (platform !== 'android') {
        audio.setBgmVolume(.3);
        await audio.handleAppForeground();
        audios.readonlyVolume = true;
        await audio.playBGM('map');
        const music = audio.currentHtmlAudio;
        check(music && audio.bgmMediaSources.has(music) && !music.muted, 'Read-only media volume uses the controlled Web Audio route');
        close(output(music), .06, 'Read-only media uses the same output level');
        const count = audios.requests.length;
        audio.voiceBuffers[voice] = context.createBuffer(1, 4800, context.sampleRate);
        check(await audio.playVoiceFile(voice, ['/sfx/high-school-voices/HS_MALE/attack-1.ogg'], 3000, false, 1), 'A read-only voice element falls back to decoded playback');
        const [voiceGain] = audio.activeSfxSourceGains.get(voice) ?? [];
        check(voiceGain, 'Decoded voice has its own volume control');
        close(voiceGain.gain.value, .15, 'Decoded voice uses the latest setting');
        check(audios.requests.length === count, 'Read-only media never starts a voice at full volume');
        checks++;

        audio.stopBGM();
        context.createMediaElementSource = () => { throw new Error('No media graph'); };
        await audio.playBGM('menu');
        check(!audio.currentHtmlAudio && audio.currentSource?.buffer, 'A read-only BGM element falls back to the decoded audio bus');
        check(audios.requests.length === count, 'Uncontrolled BGM never starts');
        checks++;
      }
      audio.stopAllAudio();
      return checks;
    }, platform);
    assert.deepEqual(errors, []);
    console.log(`PASS ${platform} ${checks} interruption and output-volume checks (${browserType.name()})`);
  } finally {
    await page.close();
    await server.close();
  }
}
