const getOrderItems = (order) => order.items ?? order.orderItems ?? [];

export const analyzeOrderHistory = (orders = []) => {
  const frequency = new Map();

  orders
    .filter((order) => order.status === 'DELIVERED')
    .flatMap(getOrderItems)
    .forEach((item) => {
      const productId = item.productId ?? item.product?.id;
      if (!productId) return;

      const current = frequency.get(productId) ?? {
        productId,
        id: productId,
        name: item.productName ?? item.name ?? item.product?.name ?? 'Producto',
        imageUrl: item.productImageUrl ?? item.imageUrl ?? item.product?.imageUrl ?? null,
        price: Number(item.unitPrice ?? item.price ?? 0),
        unit: item.unit ?? item.product?.unit ?? 'UNIDAD',
        storeId: item.storeId ?? item.product?.storeId ?? item.product?.store?.id,
        storeName: item.storeName ?? item.product?.storeName ?? item.product?.store?.name,
        categoryId: item.categoryId ?? item.product?.categoryId ?? item.product?.category?.id,
        count: 0,
        defaultQuantity: 1,
      };

      current.count += Number(item.quantity ?? 1);
      current.defaultQuantity = Math.max(current.defaultQuantity, Number(item.quantity ?? 1));
      frequency.set(productId, current);
    });

  return [...frequency.values()]
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);
};

export const getRecommendedCategoryIds = (orders = []) => {
  const frequency = new Map();

  orders
    .filter((order) => order.status === 'DELIVERED')
    .flatMap(getOrderItems)
    .forEach((item) => {
      const categoryId = item.categoryId ?? item.product?.categoryId ?? item.product?.category?.id;
      if (!categoryId) return;
      frequency.set(categoryId, (frequency.get(categoryId) ?? 0) + Number(item.quantity ?? 1));
    });

  return [...frequency.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([categoryId]) => categoryId);
};
