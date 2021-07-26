# Set Up For Dialogflow CX Agent <img src="https://gstatic.com/dialogflow-console/common/assets/ccai-icon-family/dialogflow-cx-512-color.png" width="75" />

## Section I: Setting up project

### Set up for users with no existing google cloud project 

- Go to the [Dialogflow CX platform](https://dialogflow.cloud.google.com/cx/projects) and create a new project. <br>

<img src="https://i.imgur.com/7TNUxl0.png" width="75%" />

- Generate a key with the services credentials from `Service Accounts -> Actions -> Manage keys -> Add Key -> Create new key` with JSON key type <br> 

<img src="https://i.imgur.com/HuwAbZp.png" width="75%"/>

- Create a Billing Account with a specificied payment method on your Google platform in `Billing -> Manage Billing Accounts -> Create Account`. Setup up a billing profile and activate billing.

- From your Google Cloud Platform dashboard enable the Dialogflow API from `APIs & Services -> ENABLE APIS AND SERVICES`, search for **Dialogflow Api**, select it and click enable.<br>

<img src="https://i.imgur.com/Sv6I1x3.png" width="75%"/>

### Set up for users with existing google cloud project 

- Create a Billing Account with a specificied payment method on your Google platform in `Billing -> Manage Billing Accounts -> Create Account`. Setup up a billing profile and activate billing.
- From your Google Cloud Platform dashboard enable the Dialogflow API from `APIs & Services -> ENABLE APIS AND SERVICES`, search for **Dialogflow Api**, select it and click enable.

<hr>

## Section II: Create Agent

- From the [Dialogflow CX platform](https://dialogflow.cloud.google.com/cx/projects) select the project and create a new agent.

<hr>

## Section III: Setting up Apps.Dialogflow


- Set agent version to **CX**. <br> <img src="https://i.imgur.com/f5dhWIp.png" weight="600"/>
- From the [Dialogflow CX platform](https://dialogflow.cloud.google.com/cx/projects) select the project and from your agent list press <button>⋮</button> and select **Copy Name**.
- The agent name has the following format: <br> 
<b>projects/PROJECT_ID/locations/<mark style="color: red">REGION_ID</mark>/agents/<mark style="color: red">AGENT_ID</mark></b>
- Paste **AGENT_ID** to **Dialogflow Agent ID** and **REDION ID** to **Dialogflow Region**. <br>
<img src="https://i.imgur.com/TCAkRQs.png" width="75%"/>

<hr>

## Section IV: Additional Settings

- Dialogflow CX does not support fallback Intents. You can create a list of comma-separated event names in **Fallback Events** that will be treated as fallback events by the app.


