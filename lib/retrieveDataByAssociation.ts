import { IRead } from '@rocket.chat/apps-engine/definition/accessors';
import { RocketChatAssociationRecord } from '@rocket.chat/apps-engine/definition/metadata';

export const retrieveDataByAssociation = async (read: IRead,  assoc: RocketChatAssociationRecord) => {

    const association = await read.getPersistenceReader().readByAssociation(assoc);

    if (association.length > 0) {
        return Object.assign.apply(Object, association);
    }

    return {};

};
