import './MaintenancePage.css';

export default function MaintenancePage() {
  return (
    <div className="maintenance-container">
      <div className="maintenance-content">
        <div className="maintenance-icon">🔧</div>
        <h1 className="maintenance-title">Site em Manutenção</h1>
        <p className="maintenance-subtitle">
          Desculpe! Estamos realizando manutenção no sistema.
        </p>
        <p className="maintenance-description">
          Tentaremos estar de volta em breve. Por favor, tente novamente mais tarde.
        </p>
        <div className="maintenance-contact">
          <p>Horário de manutenção: <strong>Diariamente das 22:00 às 23:00</strong></p>
        </div>
        <button 
          className="maintenance-retry-button"
          onClick={() => window.location.reload()}
        >
          Tentar Novamente
        </button>
      </div>
    </div>
  );
}
