import { MapPin, MessageCircle, Shield } from 'lucide-react';
import InfoCard from '../../molecules/InfoCard/InfoCard';
import styles from './InfoBar.module.css';

export default function InfoBar() {
  return (
    <section className={styles.section} aria-label="Informações da loja">
      <div className={styles.wrapper}>
        <div className={styles.grid}>
          <InfoCard
            icon={<MapPin size={22} strokeWidth={1.75} />}
            title="Retirada na loja"
            subtitle="Sem entrega disponível"
          />
          <InfoCard
            icon={<MessageCircle size={22} strokeWidth={1.75} />}
            title="Pagamento via WhatsApp"
            subtitle="Finalize sua compra diretamente pelo WhatsApp"
          />
          <InfoCard
            icon={<Shield size={22} strokeWidth={1.75} />}
            title="100% Autêntico"
            subtitle="Apenas produtos originais"
          />
        </div>
      </div>
    </section>
  );
}
