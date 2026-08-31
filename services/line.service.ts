import api from './api';
import { LineDto } from '~/types/index'; 

const getLines = () => {
  return api.get<LineDto[]>('/Line');
};

const createLine = (lineData: LineDto) => {
  return api.post('/Line', lineData);
};

const updateLine = (lineData: LineDto) => {
  return api.put(`/Line/${lineData.id}`, lineData);
};

const deleteLine = (id: number) => {
  return api.delete(`/Line/${id}`);
};

export const LineService = {
  getLines,
  createLine,
  updateLine,
  deleteLine,
};