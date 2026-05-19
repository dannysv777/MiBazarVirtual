import axiosInstance from './axiosConfig';

const getFileName = (asset) => {
  if (asset.fileName) {
    return asset.fileName;
  }

  const uriName = asset.uri?.split('/').pop();
  return uriName?.includes('.') ? uriName : `product-${Date.now()}.jpg`;
};

const getMimeType = (asset) => {
  if (asset.mimeType) {
    return asset.mimeType;
  }

  const extension = asset.uri?.split('.').pop()?.toLowerCase();
  if (extension === 'png') return 'image/png';
  if (extension === 'webp') return 'image/webp';
  if (extension === 'heic') return 'image/heic';
  return 'image/jpeg';
};

export const uploadImage = async (asset) => {
  const formData = new FormData();

  if (asset.file) {
    formData.append('file', asset.file);
  } else {
    formData.append('file', {
      uri: asset.uri,
      name: getFileName(asset),
      type: getMimeType(asset),
    });
  }

  const response = await axiosInstance.post('/api/upload/image', formData, {
    timeout: 30000,
  });

  return response.data?.data ?? response.data;
};
