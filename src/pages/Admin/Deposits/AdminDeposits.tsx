import { useEffect, useState, useCallback } from 'react';
import { RefreshCw, Search, ChevronLeft, ChevronRight, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import AdminLayout from '../../../components/templates/AdminLayout/AdminLayout';
import Button from '../../../components/atoms/Button/Button';
import Spinner from '../../../components/atoms/Spinner/Spinner';
import TableSkeleton from '../../../components/atoms/TableSkeleton/TableSkeleton';
import Toast from '../../../components/atoms/Toast/Toast';
import { useToast } from '../../../hooks/useToast';
import { getDeposits } from '../../../services/api';
import { formatCurrency, formatDate } from '../../../utils/formatters';
import type { TcrDepositsPaginated } from '../../../types/index';
import styles from './AdminDeposits.module.css';

export default function AdminDeposits() {
  const [data, setData] = useState<TcrDepositsPaginated | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  
  // Filtros
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  
  const { toasts, addToast, removeToast } = useToast();

  const fetchDeposits = useCallback(async (currentPage: number, from: string, to: string, isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    
    try {
      let data_inicial: string | undefined;
      let data_final: string | undefined;

      if (from) {
        data_inicial = from; // Formato YYYY-MM-DD
      }
      if (to) {
        data_final = to; // Formato YYYY-MM-DD
      }

      console.log('[Depósitos] Enviando:', { pagina: currentPage, data_inicial, data_final });
      const res = await getDeposits({
        pagina: currentPage,
        por_pagina: 15,
        data_inicial,
        data_final,
        ...(isRefresh ? { _t: Date.now() } : {})
      });
      console.log('[Depósitos] Resposta:', { itens_total: res.data.itens_total, depositos: res.data.depositos?.length });
      
      setData(res.data);
      if (isRefresh) {
        addToast('success', 'Dados atualizados com sucesso!');
      }
    } catch (error) {
      addToast('error', 'Falha ao carregar depósitos.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchDeposits(page, dateFrom, dateTo);
  }, [page, fetchDeposits]); // Intencionalmente não incluindo dateFrom e dateTo para não disparar ao digitar

  const handleApplyFilters = () => {
    if (page === 1) {
      fetchDeposits(1, dateFrom, dateTo);
    } else {
      setPage(1); // O useEffect cuidará do resto
    }
  };

  const handleClearFilters = () => {
    setDateFrom('');
    setDateTo('');
    if (page === 1) {
      fetchDeposits(1, '', '');
    } else {
      setPage(1); // O useEffect cuidará do resto
    }
  };

  const getStatusBadge = (status: string, nome: string) => {
    let colorClass = styles.badgePending;
    let Icon = Clock;

    const s = status.toLowerCase();
    if (s.includes('confirmado') || s.includes('pago') || s.includes('concluido')) {
      colorClass = styles.badgeSuccess;
      Icon = CheckCircle;
    } else if (s.includes('cancelado') || s.includes('falha') || s.includes('expirado')) {
      colorClass = styles.badgeError;
      Icon = AlertCircle;
    }

    return (
      <span className={`${styles.statusBadge} ${colorClass}`}>
        <Icon size={12} className={styles.statusIcon} />
        {nome}
      </span>
    );
  };

  const hasFilters = Boolean(dateFrom || dateTo);

  return (
    <AdminLayout 
      title="Depósitos" 
      subtitle="Histórico de transações recebidas da API de pagamentos."
    >
      <div className={styles.headerActions}>
        <div className={styles.filterBar}>
          <div className={styles.dateFilters}>
            <div className={styles.filterGroup}>
              <label className={styles.dateLabel}>Data Inicial</label>
              <input
                type="date"
                className={styles.dateInput}
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>
            <div className={styles.filterGroup}>
              <label className={styles.dateLabel}>Data Final</label>
              <input
                type="date"
                className={styles.dateInput}
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
            <div className={styles.filterButtons}>
              <button className={styles.searchBtn} onClick={handleApplyFilters}>
                <Search size={15} /> Filtrar
              </button>
              {hasFilters && (
                <button className={styles.clearBtn} onClick={handleClearFilters}>
                  Limpar
                </button>
              )}
            </div>
          </div>
        </div>

        <Button 
          variant="secondary" 
          onClick={() => fetchDeposits(page, dateFrom, dateTo, true)}
          disabled={loading || refreshing}
          className={styles.refreshBtn}
        >
          {refreshing ? <Spinner size="sm" /> : <RefreshCw size={16} />}
          Atualizar
        </Button>
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>#ID</th>
              <th>Pagador / Origem</th>
              <th>Quantia</th>
              <th>Moeda</th>
              <th>Método / Rede</th>
              <th>Status</th>
              <th>Data</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <TableSkeleton columns={7} />
            ) : data?.depositos && data.depositos.length > 0 ? (
              data.depositos.map((deposito) => (
                <tr key={deposito.id}>
                  <td className={styles.idCol}>#{deposito.id}</td>
                  <td>
                    <div className={styles.customerInfo}>
                      <span className={styles.customerName}>
                        {deposito.nome_bb_colaborador || deposito.wallet_address || 'Origem Desconhecida'}
                      </span>
                      <span className={styles.customerEmail}>
                        {deposito.documento_bb_colaborador 
                          ? `Doc: ${deposito.documento_bb_colaborador}` 
                          : (deposito.moeda_is_cripto ? 'Endereço Cripto' : deposito.chave_pix || 'PIX')
                        }
                      </span>
                    </div>
                    <div style={{ marginTop: 4, fontSize: '0.65rem', color: '#8b949e', textTransform: 'uppercase' }}>
                      Recebedor: {deposito.usuario_nome}
                    </div>
                  </td>
                  <td className={styles.amountCol}>
                    {deposito.moeda_sigla === 'BRL' ? formatCurrency(deposito.quantia) : `${deposito.quantia} ${deposito.moeda_sigla}`}
                  </td>
                  <td>
                    <div className={styles.currencyBadge}>
                      {deposito.moeda_logo && (
                        <img src={deposito.moeda_logo} alt={deposito.moeda_nome} className={styles.currencyLogo} />
                      )}
                      <span>{deposito.moeda_nome}</span>
                    </div>
                  </td>
                  <td>
                    <span className={styles.networkBadge}>
                      {deposito.moeda_is_cripto ? deposito.rede_nome : 'PIX'}
                    </span>
                  </td>
                  <td>{getStatusBadge(deposito.status_codigo_referencia, deposito.status_nome)}</td>
                  <td className={styles.dateCol}>{formatDate(deposito.data)}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className={styles.emptyRow}>
                  Nenhum depósito encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {!loading && data && data.paginas_total > 1 && (
        <div className={styles.pagination}>
          <div className={styles.paginationInfo}>
            Mostrando página {data.pagina_atual} de {data.paginas_total} ({data.itens_total} no total)
          </div>
          <div className={styles.paginationControls}>
            <button
              className={styles.pageBtn}
              disabled={page === 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
            >
              <ChevronLeft size={18} />
            </button>
            <span className={styles.pageCurrent}>{page}</span>
            <button
              className={styles.pageBtn}
              disabled={!data.proxima_pagina}
              onClick={() => setPage(p => p + 1)}
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}

      <Toast toasts={toasts} onClose={removeToast} />
    </AdminLayout>
  );
}
