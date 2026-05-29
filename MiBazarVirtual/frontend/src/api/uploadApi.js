import axiosInstance from './axiosConfig';

const getFileName = (asset) => {
  if (asset.fileName) {
    return asset.fileName;
  }

  const uriName = asset.uri?.split('/').pop();
  return uriName?.includes('.') ? uriName : `image-${Date.now()}.jpg`;
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
  if (!asset?.uri && !asset?.file) {
    throw {
      response: {
        data: {
          message: 'Selecciona una imagen valida para subir.',
        },
      },
    };
  }

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

  try {
    const response = await axiosInstance.post('/api/upload/image', formData, {
      timeout: 60000,
      headers: {
        Accept: 'application/json',
      },
    });

    return response.data?.data ?? response.data;
  } catch (error) {
    if (!error.response) {
      throw {
        ...error,
        response: {
          data: {
            message: 'No pudimos subir la imagen. Revisa tu conexión o intenta con una foto más pequeña.',
          },
        },
      };
    }

    throw error;
  }
};
