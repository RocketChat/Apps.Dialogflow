**Perform Handover**
----
  Action to Perform an Handover

* **URL**

    REST API URL can be found on Apps Page <br />
    ![image](https://user-images.githubusercontent.com/34130764/196452238-c90cf520-eacd-41f5-876c-3f03ed08508e.png)
    Sample Url for eg: <br /> `http://localhost:3000/api/apps/public/783d8e4d-b06a-409a-aaf3-b37650dc0a26/incoming`

* **Method:**

  `POST`
  
*  **Input Data Format**

    `JSON`

* **Data Params**

  **Required:**
 
   1. `action` = `handover`  <br/>
 
   2. `sessionId=[string]`
      > Note. Session Id is the same session of Dialogflow. Also note that, session Id is the same as Room Id on Rocket.Chat. [Click here](https://cloud.google.com/dialogflow/es/docs/entities-session) to know more about Dialogflow sessions.

   **Optional:**

    ```
    actionData: {
      `targetDepartment=[string]`
    }
    ```


* **Success Response:**

  * **Code:** 200 <br />
    **Content:** `{ result: "Perform Handover request handled successfully" }`
 
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
      curl "http://localhost:3000/api/apps/public/783d8e4d-b06a-409a-aaf3-b37650dc0a26/incoming" \
        -X POST \
        -d "{\n  \"action\": \"close-chat\",\n  \"sessionId\": \"GeTEX3iLYpByZWSze\",\n  \"actionData\": {\n    \"targetDepartment\": \"SalesDepartment\"\n  }\n}" \
        -H "Content-Type: application/json" \
        -H "content-length: 65"  
    ```
    **HTTP**

  ```HTTP
    POST /api/apps/public/783d8e4d-b06a-409a-aaf3-b37650dc0a26/incoming HTTP/1.1
    Host: localhost:3000
    Content-Type: application/json

    {
      "action": "handover",
      "sessionId": "hmZ9EGL3LFvHSeG2q",
      "actionData": {
        "targetDepartment": "SalesDepartment"
      }
    }
  ```
