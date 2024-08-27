import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_HOST || 'https://api.registrar.gov.lk',
});

export const fetchCategories = async () => {
  const response = await api.get('/api/organization/list-categories');
  return response.data;
};

export const fetchDistricts = async () => {
  const response = await api.get('/api/organization/list-districts');
  return response.data;
};

export const fetchProvinces = async () => {
  const response = await api.get('/api/organization/list-provinces');
  return response.data;
};

export const fetchOrganizations = async (params: { search: string; category: string; district: string; province: string }) => {
  const response = await api.get('/api/organization/list-organizations', { params });
  return response.data;
};
