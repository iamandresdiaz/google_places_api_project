function request({
    method = 'GET',
    url,
    callback
  }) {
    const request = new XMLHttpRequest();
    request.onreadystatechange = onStateChange;
    request.open(method, url);
    request.setRequestHeader('accept', 'application/json');
    request.send();
  
    function onStateChange() {
      if (request.readyState < 4) {
        return;
      }
  
      if (request.status < 200 || request.status >= 300) {
        callback('Request error');
        return;
      }
      callback(null,JSON.parse(request.responseText));
    };
  }
  export default request;