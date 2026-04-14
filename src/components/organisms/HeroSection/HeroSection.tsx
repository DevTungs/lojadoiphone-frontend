import { useRef, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import Button from '../../atoms/Button/Button';
import type { Promotion } from '../../../types/index';
import { assetUrl } from '../../../utils/assetUrl';
import styles from './HeroSection.module.css';

interface HeroSectionProps {
  logoUrl?: string;
  storeName?: string;
  promotions?: Promotion[];
}

const ITEMS = [
  { src: '/hero-ip17promax-official.png', alt: 'iPhone 17 Pro Max',        label: 'iPhone 17 Pro Max'        },
  { src: '/hero-ip17-official.png',       alt: 'iPhone 17',                label: 'iPhone 17'                },
  { src: '/hero-ip16promax.png',          alt: 'iPhone 16 Pro Max',        label: 'iPhone 16 Pro Max'        },
  { src: '/hero-ip16.png',               alt: 'iPhone 16',                label: 'iPhone 16'                },
  { src: '/hero-ip17promax-silver.png',   alt: 'iPhone 17 Pro Max Silver', label: 'iPhone 17 Pro Max Silver' },
  { src: '/hero-watch.png',              alt: 'Apple Watch',              label: 'Apple Watch', isWatch: true },
];

export default function HeroSection({ logoUrl, storeName, promotions = [] }: HeroSectionProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef   = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(() => {
    const section = sectionRef.current;
    const stage   = stageRef.current;
    if (!section) return;

    const onMove = (e: MouseEvent) => {
      const r = section.getBoundingClientRect();
      if (stage) {
        const tx = ((e.clientY - r.top  - r.height / 2) / r.height) * 6;
        const ty = ((e.clientX - r.left - r.width  / 2) / r.width ) * -6;
        stage.style.transform =
          `perspective(1200px) rotateX(${tx}deg) rotateY(${ty}deg)`;
      }
    };
    const onLeave = () => {
      if (stage)
        stage.style.transform = 'perspective(1200px) rotateX(0deg) rotateY(0deg)';
    };

    section.addEventListener('mousemove', onMove);
    section.addEventListener('mouseleave', onLeave);
    return () => {
      section.removeEventListener('mousemove', onMove);
      section.removeEventListener('mouseleave', onLeave);
    };
  }, []);

  const getPos = (i: number): 'center' | 'left' | 'right' | 'hidden' => {
    const len  = ITEMS.length;
    const diff = ((i - activeIdx) + len) % len;
    if (diff === 0)       return 'center';
    if (diff === 1)       return 'right';
    if (diff === len - 1) return 'left';
    return 'hidden';
  };

  return (
    <section ref={sectionRef} className={styles.hero} aria-label="Destaque">
      <div className={styles.bgGrid} />

      <div className={styles.inner}>

        {/* ── ESQUERDA ── */}
        <div className={styles.left}>
          <div className={styles.logoWrap}>
            {logoUrl
              ? <img src={assetUrl(logoUrl)} alt={storeName ?? 'Logo'} className={styles.logoImg} />
              : <span className={styles.logoText}>{storeName ?? 'Loja do iPhone'}</span>
            }
          </div>

          <h1 className={styles.headline}>
            Os melhores iPhones<br />
            com os{' '}
            <span className={styles.accent}>melhores preços.</span>
          </h1>

          <p className={styles.sub}>Qualidade premium garantida.</p>

          <Button
            variant="primary"
            size="lg"
            onClick={() => navigate('/produtos')}
            rightIcon={<ChevronRight size={18} strokeWidth={2.5} />}
          >
            Compre Aqui
          </Button>
        </div>

        {/* ── DIREITA ── */}
        <div
          ref={stageRef}
          className={`${styles.stage} ${promotions.length > 0 ? styles.stagePromotion : ''}`}
        >
          <div className={styles.glow} />
          <div className={styles.glowCyan} />

          {promotions.length > 0 ? (
            <>
              {promotions.map((promo, i) => {
                const pos = getPos(i);
                return promo.image_url ? (
                  <img
                    key={promo.id}
                    src={assetUrl(promo.image_url)}
                    alt={promo.title}
                    className={[
                      styles.phoneItem,
                      styles[`pos${pos.charAt(0).toUpperCase()}${pos.slice(1)}`],
                    ].join(' ')}
                    onClick={() => pos !== 'center' && setActiveIdx(i)}
                    draggable={false}
                  />
                ) : null;
              })}

              {/* Título + preço — topo do stage */}
              <div className={styles.promoTop}>
                <span className={styles.promoOfertaLabel}>Oferta do dia</span>
                   <span className={styles.carouselPrice}>
                  {promotions[activeIdx]?.price.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                </span>
              </div>

              {/* rodapé do stage */}
              <div className={styles.carousel}>
                 <span className={styles.promoItemTitle}>{promotions[activeIdx]?.title}</span>
            
                <div className={styles.carouselDots}>
                  {promotions.map((_, i) => (
                    <button
                      key={i}
                      className={[styles.dot, i === activeIdx ? styles.dotActive : ''].join(' ')}
                      onClick={() => setActiveIdx(i)}
                      aria-label={promotions[i].title}
                    />
                  ))}
                </div>
              </div>
            </>
          ) : (
            <>
              {ITEMS.map((item, i) => {
                const pos = getPos(i);
                return (
                  <img
                    key={item.src}
                    src={item.src}
                    alt={item.alt}
                    className={[
                      styles.phoneItem,
                      styles[`pos${pos.charAt(0).toUpperCase()}${pos.slice(1)}`],
                      item.isWatch ? styles.watchItem : '',
                    ].join(' ')}
                    onClick={() => pos !== 'center' && setActiveIdx(i)}
                    draggable={false}
                  />
                );
              })}

              <div className={styles.carousel}>
                <span className={styles.carouselLabel}>
                  {ITEMS[activeIdx].label}
                </span>
                <div className={styles.carouselDots}>
                  {ITEMS.map((_, i) => (
                    <button
                      key={i}
                      className={[styles.dot, i === activeIdx ? styles.dotActive : ''].join(' ')}
                      onClick={() => setActiveIdx(i)}
                      aria-label={ITEMS[i].label}
                    />
                  ))}
                </div>
              </div>
            </>
          )}

          <div className={styles.floor} />
        </div>

      </div>
    </section>
  );
}
