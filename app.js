/**
 *  Server-side: to deploy on GCP App Engine
 *  Batch Firebase writes from PubSub subscription
 */
const express = require('express');

const cron = require('node-cron');
const {v1} = require('@google-cloud/pubsub');

const projectId = "identiq"
const subscriptionName = "projects/identiq/subscriptions/node-cron"

const subClient = new v1.SubscriberClient();

const firebase = require("firebase-admin");
const serviceAccount = require("serviceAccountKey.json");

firebase.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://databaseName.firebaseio.com"
});

const db = admin.database();
const batch = db.batch();

cron.schedule('*/1 * * * * *', async () => {
  console.log('Running every seconds');

  const formattedSubscription = subClient.subscriptionPath(
      projectId,
      subscriptionName
    );

  const request = {
    subscription: formattedSubscription,
    maxMessages: 1000,
  };

  const [response] = await subClient.pull(request);

  const ackIds = [];
  for (const message of response.receivedMessages) {
    console.log(`Received message: ${message.message.data}`);

    const { collection, doc, data } = message.message.data;
    const ref = db.collection(collection).doc(doc);
    batch.set(ref, data);

    ackIds.push(message.ackId);
  }

  await batch.commit();

  if (ackIds.length !== 0) {
    
    const ackRequest = {
      subscription: formattedSubscription,
      ackIds: ackIds,
    };

    await subClient.acknowledge(ackRequest);
  }

  console.log('Done.');
});

const app = express();

app.get('/', (req, res) => {
  res.status(200).send({ping: 'pong'}).end();
});

// Start the server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`App listening on port ${PORT}`);
});