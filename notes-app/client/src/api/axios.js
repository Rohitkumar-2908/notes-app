import axios from 'axios';

// Access token lives in memory only (not localStorage). The refresh token is an httpOnly cookie.
let accessToken = null;
export const setAccessToken = (t) => {
  accessToken = t;
};

const api = axios.create({ baseURL: '/api', withCredentials: true });

api.interceptors.request.use((config) => {
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  return config;
});

let onAuthFailure = () => {};
export const setAuthFailureHandler = (fn) => {
  onAuthFailure = fn;
};

// Only ONE refresh request may be in flight at a time. The server rotates refresh tokens,
// so two parallel refreshes (React StrictMode, several 401s at once) would look like token
// reuse and log the user out. Everyone shares this single promise instead.
let refreshPromise = null;
export function refreshSession() {
  if (!refreshPromise) {
    refreshPromise = axios
      .post('/api/auth/refresh', null, { withCredentials: true })
      .then(({ data }) => {
        setAccessToken(data.accessToken);
        return data;
      })
      .finally(() => {
        setTimeout(() => {
          refreshPromise = null;
        }, 0);
      });
  }
  return refreshPromise;
}

// On 401: refresh once, then retry the original request.
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    const isAuthRoute = original?.url?.startsWith('/auth/');
    if (error.response?.status === 401 && original && !original._retry && !isAuthRoute) {
      original._retry = true;
      try {
        const data = await refreshSession();
        original.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(original);
      } catch (e) {
        setAccessToken(null);
        onAuthFailure();
        return Promise.reject(e);
      }
    }
    return Promise.reject(error);
  }
);

export const errorMessage = (err) => {
  if (err.response?.data?.message) return err.response.data.message;
  if (err.code === 'ERR_NETWORK' || !err.response) {
    return 'Cannot reach the server. Is the backend running (npm run dev in /server)?';
  }
  return err.message || 'Something went wrong';
};

export default api;
