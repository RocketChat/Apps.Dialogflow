**Perform Handover**
----
  Endpoint to Perform an Handover

* **URL**

    REST API URL can be found on Apps Page <br />
    Sample Url for eg: <br /> `http://localhost:3000/api/apps/public/783d8e4d-b06a-409a-aaf3-b37650dc0a26/perform-handover`

* **Method:**

  `POST`
  
*  **Input Data Format**

    `JSON`

* **Data Params**

   **Required:**
 
   `sessionId=[string]`
   > Note. Session Id is the same session of Dialogflow

   **Optional:**

   `targetDepartmentName=[string]`


* **Success Response:**

  * **Code:** 200 <br />
    **Content:** `{ result: "Perform Handover request handled successfully" }`
 
* **Error Response:**

  * **Code:** 400 BAD REQUEST <br />
    **Content:** <br/>
    `{
        result: "Error: Session Id not present in request"
    }`

  OR

  * **Code:** 500 Internal Server Error <br />
    **Content:** <br />
    `{ result : "Error occured while processing perform-handover. Details:- [Error Details]" }`

* **Sample Call:**

    **Curl**
    ```bash
    curl "http://localhost:3000/api/apps/public/783d8e4d-b06a-409a-aaf3-b37650dc0a26/perform-handover" \
    -X POST \
    -d "{\n  \"sessionId\": \"2Sfq8wXw4fYPMf6r4\",\n  \"targetDepartmentName\": \"SalesDepartment\"\n}" \
    -H "Content-Type: application/json" 
    ```
    **HTTP**

  ```HTTP
    POST /api/apps/public/783d8e4d-b06a-409a-aaf3-b37650dc0a26/perform-handover HTTP/1.1
    Host: localhost:3000
    Content-Type: application/json

    {
        "sessionId": "2Sfq8wXw4fYPMf6r4",
        "targetDepartmentName": "SalesDepartment"
    }
  ```
