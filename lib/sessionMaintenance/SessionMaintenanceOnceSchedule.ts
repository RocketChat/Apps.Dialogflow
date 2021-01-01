import { IOnetimeSchedule } from '@rocket.chat/apps-engine/definition/scheduler';

export interface ISessionMaintenanceData {
    sessionId: string;
}

export class SessionMaintenanceOnceSchedule implements IOnetimeSchedule {
    public id: string;
    public when: string;
    public data?: ISessionMaintenanceData;

    constructor(id: string, when: string, data?: ISessionMaintenanceData) {
        this.id = id;
        this.when = when;
        this.data = data;
    }
}
