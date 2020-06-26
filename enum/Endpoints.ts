export interface IEndpointContent {
    action: EndpointActionNames;
    actionData: ICloseRoomPayload | IPerformHandoverPayload;
}

export interface ICloseRoomPayload {
    sessionId: string;
}

export interface IPerformHandoverPayload {
    sessionId: string;
    targetDepartment?: string;
}

export enum EndpointActionNames {
    CLOSE_CHAT = 'close-chat',
    HANDOVER = 'handover',
}
