import AsyncStorage from '@react-native-async-storage/async-storage';
import { FormService } from '~/services/formData.service';
import { CreateFormPayload, RNFile } from '~/types';

const QUEUE_STORAGE_KEY = 'offline_form_queue';

// Kuyrukta saklanacak öğenin yapı tanım
interface QueuedForm {
  id: string; 
  formPayload: CreateFormPayload; // Form verisini CreateFormPayload olarak sakla
  photos: RNFile[]; // Fotoğrafları RNFile dizisi olarak sakla
}

/**
  Gönderilemeyen formları fotoğraflarıyla birlikte çevrimdışı kuyruğa ekle
 @param formPayload - CreateFormPayload tipinde form verisi
 @param photos - RNFile fotoğraf dizisi
 */
export const addFormToQueue = async (formPayload: CreateFormPayload, photos: RNFile[]) => {
  try {
    const existingQueue = await getQueue();
    const newQueuedForm: QueuedForm = {
      id: `form_${new Date().getTime()}`, // ID oluştur
      formPayload,
      photos,
    };
    const updatedQueue = [...existingQueue, newQueuedForm];
    await AsyncStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(updatedQueue));
    console.log('Form çevrimdışı kuyruğa eklendi.');
  } catch (error) {
    console.error('Kuyruğa ekleme hatası:', error);
  }
};

/**
 * Cihaz hafızasındaki tüm kuyruğu getirir.
 */
export const getQueue = async (): Promise<QueuedForm[]> => {
  try {
    const queueJson = await AsyncStorage.getItem(QUEUE_STORAGE_KEY);
    return queueJson ? JSON.parse(queueJson) : [];
  } catch (error) {
    console.error('Kuyruk alınırken hata:', error);
    return [];
  }
};

/**
 * İnternet geldiğinde kuyruktaki formları işlemeye başlar
 */
export const processOfflineQueue = async () => {
  const queuedForms = await getQueue();
  if (queuedForms.length === 0) {
    return;
  }

  console.log(`${queuedForms.length} adet form kuyrukta işleniyor...`);

  // Kuyruktaki her bir öğeyi sırayla gönder
  for (const item of queuedForms) {
    try {
      await FormService.submitFormOnline(item.formPayload, item.photos);
      console.log(`Kuyruktaki form başarıyla gönderildi: ${item.id}`);

      const currentQueue = await getQueue();
      const updatedQueue = currentQueue.filter((form) => form.id !== item.id);
      await AsyncStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(updatedQueue));

    } catch (error) {
      console.error(`Kuyruktaki form gönderilemedi: ${item.id}`, error);
    }
  }
};

export const clearQueue = async () => {
  try {
    await AsyncStorage.removeItem(QUEUE_STORAGE_KEY);
    console.log('Çevrimdışı kuyruk temizlendi.');
  } catch (error) {
    console.error('Kuyruk temizleme hatası:', error);
  }
};