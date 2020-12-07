import { HttpStatusCode, IHttp, IModify, IPersistence, IRead } from '@rocket.chat/apps-engine/definition/accessors';
import { ApiEndpoint, IApiEndpointInfo, IApiRequest, IApiResponse } from '@rocket.chat/apps-engine/definition/api';
import { ILivechatRoom } from '@rocket.chat/apps-engine/definition/livechat';
import { DialogflowRequestType, IDialogflowMessage } from '../enum/Dialogflow';
import { EndpointActionNames, IActionsEndpointContent } from '../enum/Endpoints';
import { Headers, Response } from '../enum/Http';
import { Logs } from '../enum/Logs';
import { Dialogflow } from '../lib/Dialogflow';
import { createHttpResponse } from '../lib/Http';
import { createDialogflowMessage } from '../lib/Message';
import { handlePayloadActions } from '../lib/payloadAction';
import { closeChat, performHandover } from '../lib/Room';

export class IncomingEndpoint extends ApiEndpoint {
    public path = 'incoming';

    public async post(request: IApiRequest,
                      endpoint: IApiEndpointInfo,
                      read: IRead,
                      modify: IModify,
                      http: IHttp,
                      persis: IPersistence): Promise<IApiResponse> {
        this.app.getLogger().info(Logs.ENDPOINT_RECEIVED_REQUEST);

        try {
            await this.processRequest(read, modify, http, request.content);
            return createHttpResponse(HttpStatusCode.OK, { 'Content-Type': Headers.CONTENT_TYPE_JSON }, { result: Response.SUCCESS });
        } catch (error) {
            this.app.getLogger().error(Logs.ENDPOINT_REQUEST_PROCESSING_ERROR, error);
            return createHttpResponse(HttpStatusCode.INTERNAL_SERVER_ERROR, { 'Content-Type': Headers.CONTENT_TYPE_JSON }, { error: error.message });
        }
    }

    private async processRequest(read: IRead, modify: IModify, http: IHttp, endpointContent: IActionsEndpointContent) {

        const { action, sessionId } = endpointContent;
        if (!sessionId) { throw new Error(Logs.INVALID_SESSION_ID); }
        switch (action) {
            case EndpointActionNames.CLOSE_CHAT:
                await closeChat(modify, read, sessionId);
                break;
            case EndpointActionNames.HANDOVER:
                const { actionData: { targetDepartment = '' } = {} } = endpointContent;
                const room = await read.getRoomReader().getById(sessionId) as ILivechatRoom;
                if (!room) { throw new Error(); }
                const { visitor: { token: visitorToken } } = room;
                await performHandover(modify, read, sessionId, visitorToken, targetDepartment);
                break;
            case EndpointActionNames.TRIGGER_EVENT:
                const { actionData: { event = null } = {} } = endpointContent;
                if (!event) { throw new Error(Logs.INVALID_EVENT_DATA); }

                try {
                    const response: IDialogflowMessage = await Dialogflow.sendRequest(http, read, modify, sessionId, event, DialogflowRequestType.EVENT);
                    const livechatRoom = await read.getRoomReader().getById(sessionId) as ILivechatRoom;
                    if (!livechatRoom) { throw new Error(); }
                    const { visitor: { token: vToken } } = livechatRoom;
                    await createDialogflowMessage(sessionId, read, modify, response);
                    this.app.getLogger().log(response)
                    handlePayloadActions(read, modify, sessionId, vToken, response);
                } catch (error) {
                    this.app.getLogger().error(`${Logs.DIALOGFLOW_REST_API_ERROR} ${error.message}`);
                    throw new Error(`${Logs.DIALOGFLOW_REST_API_ERROR} ${error.message}`);
                }
                break;
            case EndpointActionNames.SEND_MESSAGE:
                const { actionData: { messages = null } = {} } = endpointContent;
                if (!messages) { throw new Error(Logs.INVALID_MESSAGES); }
                await createDialogflowMessage(sessionId, read, modify, { messages, isFallback: false });
                break;
            default:
                throw new Error(Logs.INVALID_ENDPOINT_ACTION);
        }
    }
}
