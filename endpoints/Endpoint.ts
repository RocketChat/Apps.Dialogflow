import { HttpStatusCode, IHttp, IModify, IPersistence, IRead } from '@rocket.chat/apps-engine/definition/accessors';
import { ApiEndpoint, IApiEndpointInfo, IApiRequest, IApiResponse } from '@rocket.chat/apps-engine/definition/api';
import { EndpointActionNames, ICloseRoomPayload, IEndpointContent, IPerformHandoverPayload } from '../enum/Endpoints';
import { Persistence } from '../lib/persistence';
import { RocketChat } from '../lib/RocketChat';

export class Endpoint extends ApiEndpoint {
    public path = 'endpoint';

    public async post(request: IApiRequest,
                      endpoint: IApiEndpointInfo,
                      read: IRead,
                      modify: IModify,
                      http: IHttp,
                      persis: IPersistence): Promise<IApiResponse> {
        this.app.getLogger().info('Endpoint recieved an request');

        const { action, actionData } = request.content as IEndpointContent;
        if (!action) { return this.sendResponse(HttpStatusCode.BAD_REQUEST, { error: 'Error! Type of action not specified in payload' }); }
        if (!actionData) { return this.sendResponse(HttpStatusCode.BAD_REQUEST, { error: 'Error! actionData field not specified in payload' }); }

        try {
            await this.processRequest(read, modify, persis, { action, actionData });
            this.app.getLogger().info('Endpoint successfully processed the request');
            return this.sendResponse(HttpStatusCode.OK, { result: 'Success' });
        } catch (error) {
            this.app.getLogger().error('Error occured while processing the request. Details:- ', error);
            return this.sendResponse(HttpStatusCode.INTERNAL_SERVER_ERROR, { error: error.message });
        }
    }

    private async processRequest(read: IRead, modify: IModify, persis: IPersistence, endpointContent: IEndpointContent) {
        switch (endpointContent.action) {
            case EndpointActionNames.CLOSE_CHAT:

                if (!this.isCloseRoomPayload(endpointContent.actionData)) { throw new Error('Error! actionData property not valid'); }

                const roomId = endpointContent.actionData.sessionId;       // Session Id from Dialogflow will be the same as Room id

                await RocketChat.closeChat(modify, read, roomId);
                break;
            case EndpointActionNames.PERFORM_HANDOVER:
                if (!this.isPerformHandoverPayload(endpointContent.actionData)) { throw new Error('Error! actionData property not valid'); }

                const visitorToken: string = (await Persistence.getConnectedVisitorToken(
                                                                    read.getPersistenceReader(),
                                                                    endpointContent.actionData.sessionId)) as string;
                if (!visitorToken) { throw new Error('Error: No Token found for sessionId. Session Id must be invalid'); }

                await RocketChat.performHandover(modify, read, endpointContent.actionData.sessionId, visitorToken, endpointContent.actionData.targetDepartment);
                break;
            default:
                throw new Error('Error!! Invalid Action type');
        }
    }

    private isCloseRoomPayload(payload: ICloseRoomPayload | IPerformHandoverPayload): payload is ICloseRoomPayload {
        return ( payload as ICloseRoomPayload).sessionId !== undefined;
    }

    private isPerformHandoverPayload(payload: ICloseRoomPayload | IPerformHandoverPayload): payload is IPerformHandoverPayload {
        return ( payload as IPerformHandoverPayload).sessionId !== undefined;
    }

    private sendResponse(status: HttpStatusCode, payload: object): IApiResponse {
        return {
            status,
            headers: {
                'Content-Type': 'application/json',
            },
            content: {
                ...payload,
            },
        };
    }

}
