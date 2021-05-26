# Dialogflow ES | CX comparison

This document files the re-work done in Apps.Dialogflow in order to fully support the functionality of a CX agent and satisfy the requirements of the [Chatbot Client Replacement](https://github.com/WideChat/Rocket.Chat/projects/3) project.

## Introduction
 ### 1. Dialogflow ES
 * Uses intents and context to control the flow of the conversation. 
 * Needs to use webhooks to send information to the application for calculations.

 ### 2. Dialogflow CX
 * Pages with routes to control the flow. A page is a container that can contain multiple routes, events.
 * Intents have been simplified for reusability. They now only contain their name and relevant training phrases.
 * Each route contains one intent. If a route's intent inside a page is triggered then the route will direct the flow to a different page. ![enter image description here](https://i.imgur.com/KyL46h2.png)
 * Webhooks use is not as necessary. Logic is handled inside the route / event.
 * Routes can be conditional.
 * Session parameters are used to capture and reference values that have been supplied by the end-user during a session.
 * Entity syntax is changed.
 * Multiple flows can be constructed for complex agents.

## Connection & Authentication

 ### 1. Dialogflow ES

 - Dialogflow ES requires an **access token** as the URL parameter of the API call to the server.
 - Dialogflow ES is available GoogleAPIs **v2**.
 
 ***SERVER URL***
``https://dialogflow.googleapis.com/v2/projects/${projectId}/agent/environments/${environment || 'draft'}/users/-/sessions/${sessionId}:detectIntent?access_token=${accessToken}``

### 2. Dialogflow CX

- Dialogflow CX requires an **access token** in the header of the HTTP request.
	***HEADER***
	``{ 'Content-Type':  Headers.CONTENT_TYPE_JSON, 'Accept':  Headers.ACCEPT_JSON, 'Authorization':  'Bearer ' + accessToken }``
- Dialogflow CX is available GoogleAPIs **v3**.
-  The CX agent server URL requires an additional **regionID** and **agentID** both are found in the agent's full name in the [Dialogflow CX console](https://dialogflow.cloud.google.com/cx/projects)  with the following format:
	>projects/PROJECT_ID/locations/***REGION_ID***/agents/***AGENT_ID***
	
	***SERVER URL***
	``https://${regionId}-dialogflow.googleapis.com/v3/projects/${projectId}/locations/${regionId}/agents/${agentId}/sessions/${sessionId}:detectIntent`;``

## Request Structure

 ### 1. Dialogflow ES
| Entity | Content |
|--|--|
| Header  | ``{ 'Content-Type':  Headers.CONTENT_TYPE_JSON, 'Accept':  Headers.ACCEPT_JSON }``|
| Body| ``{ event:  content }`` <br>**or** <br> ``{ text: { languageCode:  LanguageCode, text:  content } }``|

 ### 2. Dialogflow CX
| Entity | Content |
|--|--|
| Header  | ``{ 'Content-Type':  Headers.CONTENT_TYPE_JSON, 'Accept':  Headers.ACCEPT_JSON, 'Authorization':  'Bearer ' + accessToken }`` <br> |
| Body| ``{ event: { event:  content} }`` <br> ``languageCode:  LanguageCode`` <br>**or** <br>``{ text: {  text:  content } }`` <br> ``languageCode:  LanguageCode`` |

## Response Structure

 ### 1. Dialogflow ES
| Parameters | Description |
|--|--|
| fulfillmentMessages  | **Array:** Contains the text message and custom payloads of the agent response |
| isFallback | **Boolean:** Is true when intent is a fallback.|
| intent |**Object:** Triggered intent's name and display name.|
| intentDetectionConfidence |**Float:** Values: 0-1  |
| languageCode | **String:** Returns the language code of the agent's current language.|
| parameters | **Object:** The agent entities relative to the request  |


 ### 2. Dialogflow CX
| Parameters | Description |
|--|--|
| currentPage  | **Object:** The current page of the conversation flow. Contains name and displayName |
| diagnosticInfo | **Object:** Contains objects related to the flow and intent matching. <br> - Triggered Transistion Names <br> - Transistion Targets Chain <br> - Alternative Matched Intents|
| intent |**Object:** Triggered intent's name and display name as well as |
| intentDetectionConfidence |**Float:** Values: 0-1  |
| languageCode | **String:** Returns the language code of the agent's current language.|
| match | **Object:** Contains parameters related to the matched intents. <br> - confidence <br> - intent <br> - matchType <br> - resolvedInput|
| parameters | **Object:** The agent entities relative to the request  |
| responseMessages  | **Array:** Contains the text message, custom payloads of the agent response, successful response metadata, live agent handoff data and conditional response messages|

## Apps.Dialogflow Requirement Alterations

### 1. Fallbacks
Fallbacks are used by Apps.Dialogflow to automatically connect a guest to a live agent after a set amount of wrong inputs. Dialogflow ES allows the creation of fallback intents which return `isFallback = true` in the response object. Dialogflow CX pages / intents cannot be set as fallbacks. 

#### Proposed Solution
Dialogflow CX by default starts with a  `sys.no-match.default` event. The event handler will contain a custom payload ``{
  "isFallback": true
}``. The function parsing CX responses in Apps.Dialogflow will search for a parameter `isFallback` in the payloads array instead of searching the full response object. 

