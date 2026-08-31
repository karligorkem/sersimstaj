import api from './api';
import { CreateFormPayload, RNFile, Form } from '~/types/index'; 
import NetInfo from '@react-native-community/netinfo';
import { addFormToQueue } from '~/services/offlineQueue';

// API'den dönen form tipini tanımla
interface ApiFormResponse {
  id: number;
  code: string;
  type: string;
  name: string;
  productError: string;
  quantity: number;
  status: string;
  errorCodeId: number;
  errorCode: {
    id: number;
    code: string;
    description: string;
  };
  lineId: number;
  line: {
    id: number;
    name: string;
  };
  photos: Array<{
    id: number;
    fileName: string;
    filePath: string;
  }>;
  formDate: string;
}

const submitFormOnline = async (form: CreateFormPayload, photos: RNFile[]) => {
  try {
    const formDataPayload = new FormData();

    // Form alanlarını ekle (Photos hariç)
    Object.keys(form).forEach(key => {
      if (key !== 'Photos' && form[key as keyof CreateFormPayload] !== undefined) {
        const value = form[key as keyof CreateFormPayload];
        formDataPayload.append(key, String(value));
      }
    });
    
    // Fotoğrafları ekle - API binary format bekliyor
    photos.forEach((photoFile, index) => {
      formDataPayload.append('Photos', {
        uri: photoFile.uri,
        type: photoFile.type || 'image/jpeg',
        name: photoFile.name || `photo_${index}.jpg`,
      } as any);
    });

    // Farklı endpoint'leri dene
    let response;
    try {
      console.log('POST /Forms deniyor...');
      response = await api.post<ApiFormResponse>('/Forms', formDataPayload);
    } catch (error: any) {
      if (error.response?.status === 404) {
        console.log('POST /Forms 404 aldı, alternatif endpoint\'leri deniyor...');
        try {
          // Alternatif 1: /FormData endpoint'i (FormDataController)
          console.log('POST /FormData deniyor...');
          response = await api.post<ApiFormResponse>('/FormData', formDataPayload);
        } catch (error2: any) {
          if (error2.response?.status === 404) {
            console.log('POST /FormData de 404, /FormDatas deniyor...');
            // Alternatif 2: /FormDatas endpoint'i
            response = await api.post<ApiFormResponse>('/FormDatas', formDataPayload);
          } else {
            throw error2;
          }
        }
      } else {
        throw error;
      }
    }
    return response.data;
  } catch (error) {
    console.error('Form online submission error:', error);
    throw error;
  }
};

const submitForm = async (form: CreateFormPayload, photos: RNFile[]) => {
  try {
    // Form validasyonu
    if (!form.Code || !form.Name || !form.ErrorCodeId) {
      throw new Error('Form verilerinde eksik alanlar bulunuyor.');
    }

    const netState = await NetInfo.fetch();
    const isOnline = netState.isConnected && netState.isInternetReachable;

    if (isOnline) {
      console.log("Çevrimiçi: Form doğrudan gönderiliyor.");
      const result = await submitFormOnline(form, photos);
      return result;
    } else {
      console.log("Çevrimdışı: Form daha sonra gönderilmek üzere kuyruğa alınıyor.");
      await addFormToQueue(form, photos);
      return { success: true, message: 'Form kuyruğa alındı.' };
    }
  } catch (error) {
    console.error('Form submission error:', error);
    throw error;
  }
};

// API'den dönen veriyi client formatına çevir
const transformApiFormToClientForm = (apiForm: ApiFormResponse): Form => {
  return {
    id: apiForm.id.toString(),
    title: apiForm.name, // API'de name var, client'ta title bekleniyor
    status: apiForm.status || 'pending',
    barcode: apiForm.code, // API'de code var, client'ta barcode bekleniyor
    productType: apiForm.type,
    lineNumber: apiForm.line?.name || '',
    errorCode: {
      id: apiForm.errorCode?.id || 0,
      code: apiForm.errorCode?.code || '',
      description: apiForm.errorCode?.description || '',
    },
    note: apiForm.productError, // productError'u note olarak kullan
    photos: apiForm.photos?.map(photo => photo.filePath) || [],
    createdAt: apiForm.formDate || new Date().toISOString(),
  };
};

const getForms = async (): Promise<Form[]> => {
  try {
    const response = await api.get<ApiFormResponse[]>('/Forms');
    // API response'unu client formatına çevir
    return response.data.map(transformApiFormToClientForm);
  } catch (error) {
    console.error('Get forms error:', error);
    throw error;
  }
};

const deleteForm = async (id: number) => {
  try {
    return await api.delete(`/Forms/${id}`);
  } catch (error) {
    console.error('Delete form error:', error);
    throw error;
  }
};

const updateFormStatus = async (id: number, status: string) => {
  try {
    // API string bekliyor, obje değil
    return await api.put(`/Forms/${id}/status`, status, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Update form status error:', error);
    throw error;
  }
};

const clearData = async () => {
  try {
    console.log('Veritabanı temizleniyor...');
    const response = await api.delete('/Forms/clear');
    console.log('Veritabanı başarıyla temizlendi');
    return response;
  } catch (error) {
    console.error('Veritabanı temizleme hatası:', error);
    throw error;
  }
};

export const FormService = {
  submitForm,
  submitFormOnline,
  getForms,
  deleteForm,
  updateFormStatus,
  clearData,
};
