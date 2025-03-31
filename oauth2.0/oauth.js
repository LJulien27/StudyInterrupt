
// load script with web page
window.onload = function() {
  // Oauth2.0 authentication:
  document.querySelector('button').addEventListener('click', function() {
    // retreive token
    chrome.identity.getAuthToken({interactive: true}, function(token) {
      let init = {
        method: 'GET',
        async: true,
        headers: {
          Authorization: 'Bearer ' + token,
          'Content-Type': 'application/json'
        },
        'contentType': 'json'
      };
      fetch(
          'https://people.googleapis.com/v1/contactGroups/all?maxMembers=20', init)
          .then((response) => response.json())
          .then(function(data) {
            console.log(data)
          });
    });
  });
};
