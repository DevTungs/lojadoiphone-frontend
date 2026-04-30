import React, { useEffect, useState } from 'react';
import { X, Copy, Check } from 'lucide-react';
import { formatCurrency } from '../../../utils/formatters';
import styles from './PixPaymentModal.module.css';

interface PixPaymentModalProps {
  isOpen: boolean;
  orderId: number;
  amount: number;
  qrCode: string; // base64 image
  paymentString: string; // PIX string for manual entry
  externalId: string;
  expirationDate: string;
  onClose: () => void;
  onCancel: () => void;
  cancelLabel?: string;
  closeLabel?: string;
}

const PixPaymentModal: React.FC<PixPaymentModalProps> = ({
  isOpen,
  orderId,
  amount,
  qrCode,
  paymentString,
  externalId,
  expirationDate,
  onClose,
  onCancel,
  cancelLabel = 'Fechar por agora',
  closeLabel = 'Continuar vendo o PIX',
}) => {
  const [copied, setCopied] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<string>('');

  const qrCodeSrc = qrCode.startsWith('data:image') ? qrCode : `data:image/png;base64,${qrCode}`;

  useEffect(() => {
    if (!isOpen) return;

    const updateTimer = () => {
      const now = new Date();
      const expiration = new Date(expirationDate);
      const diff = expiration.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeRemaining('Expirado');
        return;
      }

      const minutes = Math.floor(diff / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      setTimeRemaining(`${minutes}m ${seconds}s`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [isOpen, expirationDate]);

  const handleCopyPixCode = () => {
    navigator.clipboard.writeText(paymentString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <>
      <div className={styles.overlay} onClick={onClose} />
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2 className={styles.title}>Pagamento via PIX</h2>
          <button
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Fechar"
          >
            <X size={20} />
          </button>
        </div>

        <div className={styles.content}>
          <div className={styles.orderInfo}>
            <div className={styles.infoRow}>
              <span className={styles.label}>Pedido:</span>
              <span className={styles.value}>#{orderId}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.label}>Valor:</span>
              <span className={styles.valueHighlight}>{formatCurrency(amount)}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.label}>Tempo restante:</span>
              <span className={`${styles.value} ${timeRemaining === 'Expirado' ? styles.expired : ''}`}>
                {timeRemaining}
              </span>
            </div>
          </div>

          <div className={styles.qrContainer}>
            {qrCode && (
              <img
                src={qrCodeSrc}
                alt="QR Code PIX"
                className={styles.qrCode}
              />
            )}
          </div>

          <div className={styles.pixCodeContainer}>
            <label className={styles.pixLabel}>Código PIX (copia e cola):</label>
            <div className={styles.pixCodeBox}>
              <code className={styles.pixCode}>{paymentString}</code>
              <button
                className={styles.copyBtn}
                onClick={handleCopyPixCode}
                title="Copiar código PIX"
              >
                {copied ? (
                  <>
                    <Check size={16} />
                    <span>Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy size={16} />
                    <span>Copiar</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className={styles.instructions}>
            <h3 className={styles.instructionsTitle}>Como pagar:</h3>
            <ol className={styles.instructionsList}>
              <li>Abra seu app de banco</li>
              <li>Escaneie o QR code acima <strong>OU</strong></li>
              <li>Cole o código PIX no campo "copia e cola"</li>
              <li>Confirme o pagamento</li>
              <li>Depois, envie o comprovante pelo WhatsApp na área de pedidos</li>
            </ol>
          </div>

          <div className={styles.externalId}>
            <small>ID externo: {externalId}</small>
          </div>
        </div>

        <div className={styles.footer}>
          <button
            className={styles.cancelBtn}
            onClick={onCancel}
          >
            {cancelLabel}
          </button>
          <button
            className={styles.closeModalBtn}
            onClick={onClose}
          >
            {closeLabel}
          </button>
        </div>
      </div>
    </>
  );
};

export default PixPaymentModal;
