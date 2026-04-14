import { Shield, MapPin, MessageCircle } from 'lucide-react';
import FeatureCard from '../../molecules/FeatureCard/FeatureCard';
import styles from './FeaturesSection.module.css';

export default function FeaturesSection() {
  return (
    <section className={styles.section} aria-labelledby="features-title">
      <div className={styles.wrapper}>
        <div className={styles.header}>
          <h2 id="features-title" className={styles.title}>
            Por que nos escolher?
          </h2>
          <p className={styles.subtitle}>
            Qualidade, agilidade e suporte em cada etapa da sua compra.
          </p>
        </div>
        <div className={styles.grid}>
          <FeatureCard
            icon={<Shield size={28} strokeWidth={1.75} />}
            title="100% Autêntico"
            text="Apenas produtos originais. Qualidade Apple garantida em cada item."
          />
          <FeatureCard
            icon={<MapPin size={28} strokeWidth={1.75} />}
            title="Retirada na loja"
            text="Sem entrega disponível. Retire seu produto diretamente em nossa loja."
          />
          <FeatureCard
            icon={<MessageCircle size={28} strokeWidth={1.75} />}
            title="Pagamento via WhatsApp"
            text="Finalize sua compra diretamente pelo WhatsApp de forma rápida e segura."
          />
        </div>
      </div>
    </section>
  );
}
