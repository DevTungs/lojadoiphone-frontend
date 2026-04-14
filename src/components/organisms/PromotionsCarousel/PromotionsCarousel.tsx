import { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Promotion } from '../../../types/index';
import { assetUrl } from '../../../utils/assetUrl';
import styles from './PromotionsCarousel.module.css';

interface PromotionsCarouselProps {
  promotions: Promotion[];
}

export default function PromotionsCarousel({ promotions }: PromotionsCarouselProps) {
  const trackRef = useRef<HTMLDivElement>(null);

  if (promotions.length === 0) return null;

  const scroll = (dir: 'left' | 'right') => {
    const track = trackRef.current;
    if (!track) return;
    track.scrollBy({ left: dir === 'left' ? -300 : 300, behavior: 'smooth' });
  };

  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <h2 className={styles.title}>Ofertas da Semana</h2>
        <div className={styles.arrows}>
          <button className={styles.arrow} onClick={() => scroll('left')} aria-label="Anterior">
            <ChevronLeft size={20} strokeWidth={2} />
          </button>
          <button className={styles.arrow} onClick={() => scroll('right')} aria-label="Próximo">
            <ChevronRight size={20} strokeWidth={2} />
          </button>
        </div>
      </div>

      <div className={styles.track} ref={trackRef}>
        {promotions.map((promo) => (
          <div key={promo.id} className={styles.card}>
            <div className={styles.priceTop}>
              {promo.price.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
            </div>
            <div className={styles.imgWrap}>
              {promo.image_url ? (
                <img src={assetUrl(promo.image_url)} alt={promo.title} className={styles.img} />
              ) : (
                <div className={styles.imgPlaceholder} />
              )}
            </div>
            <div className={styles.info}>
              <p className={styles.cardTitle}>{promo.title}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
