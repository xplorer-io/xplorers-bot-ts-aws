import {
    EventBridgeClient,
    PutEventsCommand,
    PutEventsRequestEntry,
} from "@aws-sdk/client-eventbridge";

export const ebClient = new EventBridgeClient();

export const putEbEvents = async (
    cloudwatchEntries: PutEventsRequestEntry[]
) => {
    try {
        await ebClient.send(
            new PutEventsCommand({
                Entries: cloudwatchEntries,
            })
        );
    } catch (err) {
        console.log("An error occurred while pushing the event:", err);
    }
};
