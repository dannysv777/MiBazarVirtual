import AppBadge from '../common/AppBadge';

const statusConfig = {
  PENDING: { variant: 'warning', label: 'Pendiente' },
  PARTIALLY_CONFIRMED: { variant: 'warning', label: 'Parcial' },
  CONFIRMED: { variant: 'info', label: 'Confirmado' },
  READY_FOR_PICKUP: { variant: 'info', label: 'Listo' },
  IN_PROGRESS: { variant: 'warning', label: 'En camino' },
  DELIVERED: { variant: 'success', label: 'Entregado' },
  CANCELLED: { variant: 'gray', label: 'Cancelado' },
};

export default function OrderStatusBadge({ status }) {
  const config = statusConfig[status] ?? { variant: 'primary', label: status ?? 'Pedido' };
  return <AppBadge label={config.label} variant={config.variant} />;
}
