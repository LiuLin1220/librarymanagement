import axios from 'axios'

const configuredBaseUrl =
  process.env.VUE_APP_API_BASE_URL || 'http://localhost:3001/api'

const http = axios.create({
  baseURL: configuredBaseUrl.replace(/\/+$/, ''),
  timeout: 10000,
  headers: {
    Accept: 'application/json'
  }
})

export function getApiErrorMessage(error, fallbackMessage) {
  const response = error && error.response
  const apiError = response && response.data && response.data.error
  if (apiError && apiError.message) {
    return apiError.message
  }
  if (error && error.code === 'ECONNABORTED') {
    return '请求超时，请确认后端服务是否正常'
  }
  return fallbackMessage
}

export default http
