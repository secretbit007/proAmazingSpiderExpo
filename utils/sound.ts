import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import { loadSoundEnabled } from './appearance';

export type SoundName = 'deal' | 'flip' | 'complete';

const SOURCES: Record<SoundName, number> = {
  deal: require('../assets/sounds/deal.wav'),
  flip: require('../assets/sounds/flip.wav'),
  complete: require('../assets/sounds/complete.wav'),
};

let players: Partial<Record<SoundName, AudioPlayer>> = {};
let ready = false;
let soundEnabled = true;

export async function initSounds(): Promise<void> {
  if (ready) return;
  try {
    soundEnabled = await loadSoundEnabled();
    await setAudioModeAsync({
      playsInSilentMode: true,
      interruptionMode: 'mixWithOthers',
    });
    (Object.keys(SOURCES) as SoundName[]).forEach((name) => {
      const player = createAudioPlayer(SOURCES[name]);
      player.volume = 0.7;
      players[name] = player;
    });
    ready = true;
  } catch {
    ready = false;
  }
}

export function setSoundEnabled(enabled: boolean): void {
  soundEnabled = enabled;
}

export function isSoundEnabled(): boolean {
  return soundEnabled;
}

export function playSound(name: SoundName): void {
  if (!soundEnabled || !ready) return;
  const player = players[name];
  if (!player) return;
    try {
      void player.seekTo(0).then(() => {
        player.play();
      });
    } catch {
      // Playback is best-effort.
    }
}
