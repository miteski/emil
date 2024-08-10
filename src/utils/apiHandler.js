export async function handleApiError(error) {
  if (error.response && error.response.status === 401) {
    // Token is invalid or expired
    localStorage.removeItem('token'); // Clear the invalid token
    // Redirect to login page
    window.location.href = '/login';
  }
  throw error;
}
