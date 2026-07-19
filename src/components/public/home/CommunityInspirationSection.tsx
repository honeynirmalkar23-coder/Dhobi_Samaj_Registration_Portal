import { communityImages } from "../../../config/images.config";
import { useLanguage } from "../../../features/language/LanguageContext";

const cardAssets = [
  {
    image: communityImages.inspirationPortrait,
    width: 606,
    height: 622
  },
  {
    image: communityImages.heritagePainting,
    width: 529,
    height: 650
  }
] as const;

export function CommunityInspirationSection() {
  const { copy } = useLanguage();

  return (
    <section className="bg-cream-50 py-12 sm:py-14">
      <div className="page-shell">
        <div className="max-w-3xl">
          <h2 className="text-2xl font-bold text-maroon-900 sm:text-3xl">
            {copy.home.inspiration.title}
          </h2>
          <p className="mt-3 text-base leading-8 text-brown-700">
            {copy.home.inspiration.description}
          </p>
        </div>
        <div className="mt-8 grid gap-5 lg:grid-cols-2">
          {copy.home.inspiration.cards.map((card, index) => {
            const asset = cardAssets[index] ?? cardAssets[0];

            return (
            <article
              className="grid overflow-hidden rounded-lg border border-maroon-700/10 bg-white shadow-subtle sm:grid-cols-[14rem_minmax(0,1fr)]"
              key={card.title}
            >
              <div className="bg-cream-100">
                <img
                  alt={card.alt}
                  className="aspect-[4/3] h-full w-full object-cover sm:aspect-auto"
                  decoding="async"
                  height={asset.height}
                  loading="lazy"
                  src={asset.image}
                  width={asset.width}
                />
              </div>
              <div className="p-5">
                <h3 className="text-xl font-bold text-maroon-900">{card.title}</h3>
                <p className="mt-3 text-sm leading-7 text-brown-700">{card.description}</p>
              </div>
            </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
