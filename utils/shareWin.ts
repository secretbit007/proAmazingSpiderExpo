import { Platform, Share } from 'react-native';

export function buildWinShareText(opts: {
  moves: number;
  time: string;
  score: number;
  label: string;
  isDaily: boolean;
}): string {
  const mode = opts.isDaily ? 'Daily Challenge' : opts.label;
  return [
    'I just cleared proAmazingSpider!',
    mode,
    `${opts.moves} moves · ${opts.time} · score ${opts.score}`,
    'Can you beat that?',
  ].join('\n');
}

export async function shareWin(opts: {
  message: string;
  imageUri?: string | null;
}): Promise<void> {
  try {
    const Sharing = await import('expo-sharing');
    if (opts.imageUri && (await Sharing.isAvailableAsync())) {
      await Sharing.shareAsync(opts.imageUri, {
        mimeType: 'image/png',
        dialogTitle: 'Share your win',
      });
      return;
    }
  } catch {
    // Fall through to the system share sheet.
  }

  const payload =
    Platform.OS === 'ios' && opts.imageUri
      ? { message: opts.message, url: opts.imageUri }
      : { message: opts.message };
  await Share.share(payload);
}
