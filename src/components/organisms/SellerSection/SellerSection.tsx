import styles from './SellerSection.module.css';

const SELLERS = [
  {
    name: 'Paulo',
    img: '/seller-paulo.webp',
    href: 'https://wa.me/595992799148',
  },
  {
    name: 'Rayza',
    img: '/seller-rayza.webp',
    href: 'https://wa.me/595987355072',
  },
];

export default function SellerSection() {
  return (
    <section className={styles.section} aria-label="Fale com nossos vendedores">
      <div className={styles.heading}>
        <h2 className={styles.title}>Fale com nosso time</h2>
        <p className={styles.sub}>Atendimento direto pelo WhatsApp, sem complicação.</p>
      </div>

      <div className={styles.grid}>
        {SELLERS.map((seller) => (
          <a
            key={seller.name}
            href={seller.href}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.card}
            aria-label={`Falar com ${seller.name} pelo WhatsApp`}
          >
            <img src={seller.img} alt={seller.name} className={styles.img} />
          </a>
        ))}
      </div>
    </section>
  );
}
