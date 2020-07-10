**Fulfillment Endpoint**
----
  The fulfillment endpoint will enable the app to handle asynchronous messages. Asynchronous messages will allow a bot to send a message proactively.

  ### How is it different from the synchronous message

  In the synchronous message, a bot will only answer to user's query. Eg if the user asks `What is the customer care number?` then the Bot will respond `The customer care number is XXXX`.

  On the contrary, in asynchronous message, a bot will take the initiative to ask user what they what. Eg. A bot will proactively reach out to a new user and ask them `Hello, How can I help you today?`

  ### How can you send asynchronous messages in Dialogflow

  To send asynchronous messages you can make use of [`custom-event`](https://cloud.google.com/dialogflow/docs/events-custom) in Dialogflow. The overall working will look something like this

  #### Working:-

  1. A new event gets triggered using [`custom-event`](https://cloud.google.com/dialogflow/docs/events-custom). 

  2. An intent is matched based on triggered event. This intent should have a `fulfillment` enabled which will send a request to our `Rocket.Chat's Dialogflow App` (or the fulfillment server can forward this request to the app).
  3.  The app will catch this `fulfillment`, parse the message and sessionId from the request and display it to the user.

* **URL**

    REST API URL can be found on Apps Page <br />
    Sample Url for eg: <br /> `http://localhost:3000/api/apps/public/783d8e4d-b06a-409a-aaf3-b37650dc0a26/fulfillment`

* **Method:**

  `POST`
  
*  **Input Data Format**

    The data format is the same as Dialogflow's webhook request defined [here](https://cloud.google.com/dialogflow/docs/reference/rpc/google.cloud.dialogflow.v2#webhookrequest)
