import axiosInstance from './axiosConfig';

const cleanParams = (params) => Object.fromEntries(
  Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== '')
);

const storeIdsParam = (storeIds = []) => (
  Array.isArray(storeIds) && storeIds.length ? storeIds.join(',') : undefined
);

export const getFeed = (userId, limit = 12, options = {}) => axiosInstance.get('/api/recommendations/feed', {
  params: cleanParams({
    userId,
    limit,
    seed: options.seed,
    excludeStoreIds: storeIdsParam(options.excludeStoreIds),
  }),
});

export const getRecommendedStores = (userId, limit = 6, options = {}) => axiosInstance.get('/api/recommendations/stores', {
  params: cleanParams({
    userId,
    limit,
    seed: options.seed,
  }),
});

export const getSimilarProducts = (productId, limit = 6) => axiosInstance.get('/api/recommendations/similar', {
  params: cleanParams({ productId, limit }),
});

export const getTrending = (categoryId, limit = 8) => axiosInstance.get('/api/recommendations/trending', {
  params: cleanParams({ categoryId, limit }),
});

export const getForYou = (limit = 10) => axiosInstance.get('/api/recommendations/for-you', {
  params: cleanParams({ limit }),
});
