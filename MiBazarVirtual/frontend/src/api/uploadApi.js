import * as ImageManipulator from 'expo-image-manipulator';

import axiosInstance from './axiosConfig';

const MAX_IMAGE_WIDTH = 1280;
const MAX_IMAGE_HEIGHT = 1280;
const JPEG_QUALITY = 0.72;

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

const getResizeAction = (asset) => {
  const width = Number(asset?.width ?? 0);
  const height = Number(asset?.height ?? 0);

  if (!width || !height) {
    return { resize: { width: MAX_IMAGE_WIDTH } };
  }

  if (width <= MAX_IMAGE_WIDTH && height <= MAX_IMAGE_HEIGHT) {
    return null;
  }

  return width >= height
    ? { resize: { width: MAX_IMAGE_WIDTH } }
    : { resize: { height: MAX_IMAGE_HEIGHT } };
};

const optimizeImageAsset = async (asset) => {
  if (!asset?.uri || asset.file) {
    return asset;
  }

  const resizeAction = getResizeAction(asset);
  const actions = resizeAction ? [resizeAction] : [];

  try {
    const optimized = await ImageManipulator.manipulateAsync(
      asset.uri,
      actions,
      {
        compress: JPEG_QUALITY,
        format: ImageManipulator.SaveFormat.JPEG,
      }
    );

    return {
      ...asset,
      uri: optimized.uri,
      fileName: `image-${Date.now()}.jpg`,
      mimeType: 'image/jpeg',
      width: optimized.width,
      height: optimized.height,
    };
  } catch (optimizeError) {
    return asset;
  }
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

  const uploadAsset = await optimizeImageAsset(asset);
  const formData = new FormData();

  if (uploadAsset.file) {
    formData.append('file', uploadAsset.file);
  } else {
    formData.append('file', {
      uri: uploadAsset.uri,
      name: getFileName(uploadAsset),
      type: getMimeType(uploadAsset),
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
