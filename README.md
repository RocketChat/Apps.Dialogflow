# Apps.Dialogflow
Integration between Rocket.Chat and the Dialogflow Chatbot platform

### Installation steps:

 1. Clone this repo and Change Directory: </br>
 `git clone https://github.com/RocketChat/Apps.Dialogflow.git && cd Apps.Dialogflow/`

 2. Install the required packages from `package.json`: </br>
	 `npm install`

 3. Deploy Rocket.Chat app: </br>
    `rc-apps deploy --url http://localhost:3000 --username user_username --password user_password`
    Where:
    - `http://localhost:3000` is your local server URL (if you are running in another port, change the 3000 to the appropriate port)
    - `user_username` is the username of your admin user.
    - `user_password` is the password of your admin user.

    For more info refer [this](https://rocket.chat/docs/developer-guides/developing-apps/getting-started/) guide

### How to get Google Credential File or Private key file

In order to connect to Dialogflow, this app requires a following credentials from Dialogflow.

    1. Project Id
    2. Client email
    3. Private Key

You can find all these credentials in a JSON file, which u can get from [here](https://cloud.google.com/dialogflow/docs/quick/setup#sa-create). Under `Create a service account and download the private key file` section there, you will find detailed instruction about how to get the JSON file. After obtaining this JSON file, you can proceed to the next section.


### Rocket.Chat Apps Setup

1. First go ahead n create a Bot User. Login as administrator, then goto `Setting > Users`. There create a new Bot User. This new user should have these 2 roles.</br>
    1. bot
    2. livechat-agent

2. Then configure the app to automatically assign a livechat-visitor to this bot. To do so, goto `Setting > Livechat > Routing` or `Setting > Omnichannel > Routing`. There enable `Assign new conversations to bot agent` Setting.

3. The app needs some configurations to work, so to setup the app Go to `Setting > Apps > Dialogflow`. There, fill all the necessary fields in `SETTINGS` and click SAVE. Note all fields are required.

    Some of the fields in `SETTING` include
    1. Bot Username (required)
        - This should contain the same bot username which we created above in Step 1
    2. Project Id (required)
        - This corresponds to `project_id` property of the Google Credentials File obtained from `Rocket.Chat Apps Setup` section above
    3. Client Email (required)
        - This corresponds to `client_email` property of the Google Credentials File obtained from `Rocket.Chat Apps Setup` section above
    4. Private Key (required)
        - This corresponds to `private_key` property of the Google Credentials File obtained from `Rocket.Chat Apps Setup` section above.
        - Kindly note that this value will be very long. So please take extra care while copy/paste.
    5. Fallback Responses Limit (optional)
        - The app will automatically trigger handover if consecutive `fallback` intents are triggered `N` no of times. This setting defines this value `N`.
        - Eg. Suppose the bot is not able to answer visitor's consecutive 3 answers, and this setting threshold is `3`. In such case, the app will trigger an handover to an online agent on its own.
        - To Deactivate this feature, simply set the value to `0`.
    6. Target Department for Handover (optional)
        - Enter the department name where you want the visitor to be transferred upon handover.
    7. Handover Message (optional)
        - The Bot will send this message to Visitor upon handover
    8. Service Unavailable Message (optional)
        - The Bot will send this message to Visitor if service is unavailable like suppose if no agents are online.
    9. Close Chat Message (optional)
        - This message will be sent automatically when a chat is closed
    10. Hide Quick Replies (required)
        - If enabled, then all quick-replies will hide when a visitor clicks on any one of them

4. (Optional Step) Lastly you can test your Dialogflow Connection by viewing App Logs. To view the logs, goto App Page (`Setting > Apps > Dialogflow`). There click on menu item (3 vertical dots icon) and then select `View Logs`. There select the **most recent** `onSettingUpdated` title. If you see `------------------ Google Credentials validation Success ----------------` message, then it means your setup is fine. If you don't see this message, then recheck your Dialogflow credentials.

### Dialogflow's API

The app provides API to trigger specific actions. The URL for the API can be found on the Apps Page(`Setting > Apps > Dialogflow`). Currently the app provides 2 APIs.

1. Incoming API/Endpoint

    This endpoint can be used to trigger specific actions. The list of supported actions include
    1. **Close Chat**<br/>
        To close a chat
        - REST API Documentation for this endpoint can be found [here](./docs/api-endpoints/close-chat.md)
    2. **Handover**<br/>
        To perform a handover
        - REST API Documentation for this endpoint can be found [here](./docs/api-endpoints/perform-handover.md)
    3. **Trigger Event**<br/>
        To trigger an event on Dialogflow
        - REST API Documentation for this endpoint can be found [here](./docs/api-endpoints/trigger-event.md)
    4. **Send-Message**<br/>
        To send a message as a bot to Visitor
        - REST API Documentation for this endpoint can be found [here](./docs/api-endpoints/send-message.md)
2. Fulfillment API/Endpoint

    The fulfillment endpoint will enable the app to handle asynchronous messages. More information on it [here](./docs/api-endpoints/fulfillment-endpoint.md)



### Adding Quick Replies support to your Dialogflow Bot

- To add quick Replies you can make use of `Custom-Payload` for Responses on Dialogflow Console. ( `Under any Intent > Responses > Add Responses > Custom Payload` )
- A box labelled `Custom Payload` will appear. There enter the `Quick Replies` you want following the format [here](./docs/QuickReplies.md)
