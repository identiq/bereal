// App Fire base SDK

var addMessage = firebase.functions().httpsCallable('addMessage');
addMessage({ collection: 'any', doc: 'user', data: {} })
  .then((result) => {
    // Read result of the Cloud Function.
    var sanitizedMessage = result.data.text;
  });