import { Image } from "react-native";

export const IMAGES = {
    hearts: require('../assets/images/heart.png'),
    diamonds: require('../assets/images/diamond.png'),
    clubs: require('../assets/images/club.png'),
    spades: require('../assets/images/spade.png'),
    card_back: require('../assets/images/card-back.jpg'),
    background: require('../assets/images/background.jpg'),
    background_logo: require('../assets/images/background-logo.png')
};

export const preloadImages = (): Promise<void[]> => {
    return Promise.all(
      Object.values(IMAGES).map(
        (image) => new Promise<void>((resolve) => {
          if (image.cache) {
            // Already cached
            resolve();
          } else {
            // For remote images you would use Image.prefetch(url)
            Image.resolveAssetSource(image);
            resolve();
          }
        })
      )
    );
  };