**Send Message**
----
  Action to send Message to Visitor. The sender for this message will be the Bot.

* **URL**

    REST API URL can be found on Apps Page <br />
    Sample Url for eg: <br /> `http://localhost:3000/api/apps/public/783d8e4d-b06a-409a-aaf3-b37650dc0a26/incoming`

* **Method:**

  `POST`
  
*  **Input Data Format**

    `JSON`

* **Data Params**

  **Required:**
 
   1. `action` = `send-message`  <br/>
 
   2. `sessionId=[string]`
      > Note. Session Id is the same session of Dialogflow

   3. ```bash
        actionData: {
            `messages=[Array<string | QuickReplies>]`
        }
        ```
      > Note: `messages` is an array of simple string messages and QuickReplies. 

      > Format for quick-replies is almost similar to [this](../QuickReplies.md). Following is the format.
        ```bash
        {
            "text": string,
            "options": [
                string
            ]
        }
        ```

* **Success Response:**

  * **Code:** 200 <br />
    **Content:** `{ result: "Your request was processed successfully" }`
 
* **Error Response:**

  * **Code:** 400 BAD REQUEST <br />
    **Content:** <br/>
    `{
        error: "Error: Session Id not present in request"
    }`

  OR

  * **Code:** 500 Internal Server Error <br />
    **Content:** <br />
    `{ error : "Error occurred while processing perform-handover. Details:- [Error Details]" }`

* **Sample Call:**

    **Curl**
    ```bash
      curl "http://localhost:3000/api/apps/public/21b7d3ba-031b-41d9-8ff2-fbbfa081ae90/incoming" \
        -X POST \
        -d "{\n  \"action\": \"send-message\",\n  \"sessionId\": \"6uppPYfLa3rnDF6Fe\",\n  \"actionData\": {\n    \"messages\": [\n      \"hello\",\n      {\n        \"text\": \"Do you want to continue?\",\n        \"options\": [\n          \"YES\",\n          \"NO\"\n        ]\n      }\n    ]\n  }\n}" \
        -H "Content-Type: application/json" 
    ```
    **HTTP**

  ```HTTP
    POST /api/apps/public/21b7d3ba-031b-41d9-8ff2-fbbfa081ae90/incoming HTTP/1.1
    Host: localhost:3000
    Content-Type: application/json

    {
        "action": "send-message",
        "sessionId": "6uppPYfLa3rnDF6Fe",
        "actionData": {
            "messages": [
                "hello",
                {
                    "text": "Do you want to continue?",
                    "options": [
                        "YES",
                        "NO"
                    ]
                }
            ]
        }
    }
  ```
