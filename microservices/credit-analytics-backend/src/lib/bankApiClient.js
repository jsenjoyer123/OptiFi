import axios from 'axios';
import { config } from '../config/env.js';

export const bankApiClient = (authToken) => {
  const headers = {
    'Content-Type': 'application/json',
  };

  if (authToken) {
    headers.Authorization = authToken;
  }

  return axios.create({
    baseURL: config.bankApiBaseUrl,
    timeout: config.bankApiTimeoutMs,
    headers,
  });
};

export const handleAxiosError = (error) => {
  if (error.response) {
    return {
      status: error.response.status,
      message: error.response.data?.error || error.message,
      data: error.response.data,
    };
  }
  if (error.request) {
    return {
      status: 503, // Service Unavailable
      message: 'Bank API is unavailable. No response received.',
    };
  }
  return {
    status: 500,
    message: error.message || 'An unexpected error occurred',
  };
};
