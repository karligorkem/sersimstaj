import api from './api';
import { ErrorCodeDto } from '~/types/index'; 

const getErrorCodes = () => {
  return api.get<ErrorCodeDto[]>('/ErrorCodes');
};

const createErrorCode = (errorCode: ErrorCodeDto) => {
  return api.post('/ErrorCodes', errorCode);
};

const updateErrorCode = (errorCode: ErrorCodeDto) => {
  return api.put(`/ErrorCodes/${errorCode.id}`, errorCode);
};

const deleteErrorCode = (id: number) => {
  return api.delete(`/ErrorCodes/${id}`);
};

export const ErrorCodeService = {
  getErrorCodes,
  createErrorCode,
  updateErrorCode,
  deleteErrorCode,
};