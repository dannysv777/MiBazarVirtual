import AppBadge from '../common/AppBadge';

const statusConfig = {
  PENDING: { variant: 'warning', label: 'Pendiente' },
  CONFIRMED: { variant: 'info', label: 'Confirmado' },
  IN_PROGRESS: { variant: 'warning', label: 'En camino' },
  DELIVERED: { variant: 'success', label: 'Entregado' },
  CANCELLED: { variant: 'gray', label: 'Cancelado' },
};

export default function OrderStatusBadge({ status }) {
  const config = statusConfig[status] ?? { variant: 'primary', label: status ?? 'Pedido' };
  return <AppBadge label={config.label} variant={config.variant} />;
}
