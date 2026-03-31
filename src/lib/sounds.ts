import { Howl } from 'howler';

/**
 * Tactical audio assets for the Strategic Command interface.
 */
const sounds: Record<string, Howl> = {
  move: new Howl({ 
    src: ['https://raw.githubusercontent.com/lichess-org/lila/master/public/sound/standard/Move.mp3'],
    volume: 0.4,
    html5: true,
    onloaderror: () => {},
    onplayerror: () => {}
  }),
  capture: new Howl({ 
    src: ['https://raw.githubusercontent.com/lichess-org/lila/master/public/sound/standard/Capture.mp3'],
    volume: 0.6,
    html5: true,
    onloaderror: () => {},
    onplayerror: () => {}
  }),
  check: new Howl({ 
    src: ['https://raw.githubusercontent.com/lichess-org/lila/master/public/sound/standard/Check.mp3'],
    volume: 0.8,
    html5: true,
    onloaderror: () => {},
    onplayerror: () => {}
  }),
};

/**
 * Plays a tactical sound effect.
 */
export function playSound(name: string, isMuted: boolean) {
  if (isMuted) return;
  const sound = sounds[name];
  if (sound) {
    sound.play();
  }
}

/**
 * Stops a tactical sound effect.
 */
export function stopSound(name: string) {
  const sound = sounds[name];
  if (sound) {
    sound.stop();
  }
}
