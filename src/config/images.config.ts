export const imagePaths = {
  favicon: "/favicon.svg",
  logoPlaceholder: "/logo-placeholder.svg"
} as const;

export const communityImages = {
  hero: "/images/community/dhobi-work-black-white.jpeg",
  about: "/images/community/dhobi-work-colour.jpeg",
  inspirationPortrait: "/images/community/heritage-portrait.jpeg",
  educationQuoteOne: "/images/community/education-quote-one.jpeg",
  heritagePainting: "/images/community/heritage-painting.jpeg",
  heritagePhotoOne: "/images/community/heritage-photo-one.jpeg",
  heritageGroup: "/images/community/heritage-group.jpeg",
  heritagePhotoTwo: "/images/community/heritage-photo-two.jpeg",
  mataNatinDhobinDai: "/images/community/Mata_Natin_Dhobin_Dai.png",
  educationQuoteTwo: "/images/community/education-quote-two.jpeg"
} as const;

export type CommunityImageKey = keyof typeof communityImages;
