(function () {
  const params = new URLSearchParams(window.location.search);
  const apiFromQuery = params.get('api');
  const apiFromStorage = window.localStorage.getItem('apiUrl');

  const apiUrl = apiFromQuery || apiFromStorage || '/api';

  if (apiFromQuery) {
    window.localStorage.setItem('apiUrl', apiFromQuery);
  }

  window.__API_URL__ = apiUrl;
})();
