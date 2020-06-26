**Close Chat**
----
  Action to Close a Chat Session

* **URL**

    REST API URL can be found on Apps Page <br />
    Sample Url for eg: <br /> `http://localhost:3000/api/apps/public/783d8e4d-b06a-409a-aaf3-b37650dc0a26/perform-action`

* **Method:**

  `POST`
  
*  **Input Data Format**

    `JSON`

* **Data Params**

   **Required:**
 
   1. `action`=`close-chat` <br/>

   2. `sessionId=[string]`
      > Note. Session Id is the same session of Dialogflow

* **Success Response:**

  * **Code:** 200 <br />
    **Content:** `Close chat request handled successfully`
 
* **Error Response:**

  * **Code:** 400 BAD REQUEST <br />
    **Content:** <br/>
    `{
        error: "Error: Session Id not present in request"
    }`
  OR

  * **Code:** 500 Internal Server Error <br />
    **Content:** <br />
    `{ error : "Error!! Invalid Action type" }`

  OR

  * **Code:** 500 Internal Server Error <br />
    **Content:** <br />
    `{ error : "Error occured while processing close-chat. Details:- [Error Details]" }`

* **Sample Call:**

    **Curl**
    ```bash
    curl "http://localhost:3000/api/apps/public/783d8e4d-b06a-409a-aaf3-b37650dc0a26/close-chat" \
    -X POST \
    -d "{\n  \"sessionId\": \"2Sfq8wXw4fYPMf6r4\"\n}" \
    -H "Content-Type: application/json" 
    ```
    **HTTP**

  ```HTTP
    POST /api/apps/public/783d8e4d-b06a-409a-aaf3-b37650dc0a26/close-chat HTTP/1.1
    Host: localhost:3000
    Content-Type: application/json

    {
        "action": "close-chat",
        "sessionId": "2Sfq8wXw4fYPMf6r4"
    }
  ```