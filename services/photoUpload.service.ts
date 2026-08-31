import api from './api';
import { PhotoUploadPayload, PhotoUploadResponse } from '~/types/index';

/**
 * 
 * @param payload 
 */
const uploadPhotos = async (payload: PhotoUploadPayload): Promise<PhotoUploadResponse> => {
  try {
    console.log(' Fotoğraf yükleme başlatılıyor...');
    const response = await api.post<PhotoUploadResponse>('/PhotoUpload', payload);
    console.log(' Fotoğraf yükleme başarılı');
    return response.data;
  } catch (error) {
    console.error(' Fotoğraf yükleme hatası:', error);
    throw error;
  }
};

/**
 * Tüm fotoğraf klasörlerini getirir
 */
const getAllPhotoFolders = async () => {
  try {
    console.log(' Fotoğraf klasörleri getiriliyor...');
    const response = await api.get('/PhotoUpload/folders');
    console.log(' Fotoğraf klasörleri başarıyla getirildi');
    return response.data;
  } catch (error) {
    console.error(' Fotoğraf klasörleri getirme hatası:', error);
    throw error;
  }
};

export const PhotoUploadService = {
  uploadPhotos,
  getAllPhotoFolders,
};
