import { SUCCESS_MESSAGE } from "./helpers/constants";
import { SlackWebClient } from "./helpers/types";
import { handleSlackMessageEvent } from "./slack/slackEventHandler";
import { postMessageToSlackChannel } from "./slack/slackInteraction";
import { askOpenAI } from "./helpers/openai";
import { putEbEvents } from "./helpers/events";
import GETTING_STARTED_WITH_SLACK_NOTES from "./helpers/files/gettingStartedWithSlack.json";
import { createSlackClient } from "./slack/slackClient";

exports.eventRouter = async function (event: Record<string, any>) {
    console.log("EVENT: %s", JSON.stringify(event, null, 2));
    // const slackEventBody = JSON.parse(event.body);
    const slackEventBody = event;

    if (slackEventBody.type === "url_verification") {
        return {
            statusCode: 200,
            body: slackEventBody.challenge,
        };
    }

    await putEbEvents([
        {
            Detail: JSON.stringify(slackEventBody),
            DetailType: "XplorersSlackEvent",
            Source: "xplorers.slack",
        },
    ]);

    return {
        statusCode: 200,
        headers: {
            "Access-Control-Allow-Headers": "application/json",
            "Access-Control-Allow-Origin": "https://api.slack.com/robots",
            "Access-Control-Allow-Methods": "POST",
            "Access-Control-Allow-Credentials": true,
        },
        body: SUCCESS_MESSAGE,
    };
};

// Check if event is a message delete or update event
const isIgnoreEvent = (event: Record<string, any>) => {
    return (
        event.bot_id ||
        event?.subtype === "message_deleted" ||
        (event?.message?.text !== undefined &&
            event?.previous_message?.text !== undefined &&
            event.message.text === event.previous_message.text)
    );
};

exports.xplorersbot = async function (event: Record<string, any>) {
    console.log("EVENT: %s", JSON.stringify(event, null, 2));
    const slackWebClient = await createSlackClient();

    switch (event.detail.type) {
        case "event_callback":
            const slackEvent = event.detail.event;
            if (isIgnoreEvent(slackEvent)) return;

            const isChannelOpenAI =
                slackEvent?.channel ===
                process.env.XPLORERS_OPENAI_SLACK_CHANNEL_ID;

            // text could be in slackEvent.text or slackEvent.message.text
            const message = slackEvent?.text ?? slackEvent?.message?.text;
            const ts = slackEvent?.message?.ts ?? slackEvent?.ts;

            const messageStartsWithHeyOpenAI = message
                .toLowerCase()
                .startsWith("hey openai");

            if (!isChannelOpenAI && slackEvent?.type === "message") {
                await handleSlackMessageEvent(slackWebClient, slackEvent);
                break;
            }

            if (isChannelOpenAI && messageStartsWithHeyOpenAI) {
                const openAIResponse = await askOpenAI(message);
                if (openAIResponse) {
                    await postMessageToSlackChannel({
                        slackWebClient: slackWebClient,
                        slackChannel: slackEvent?.channel,
                        threadTs: ts,
                        text: openAIResponse,
                    });
                }
                break;
            }
            break;
    }

    console.log(SUCCESS_MESSAGE);
};

exports.xplorersMonthlyLambda = async function (event: Record<string, any>) {
    console.log("EVENT: %s", JSON.stringify(event, null, 2));

    const slackWebClient: SlackWebClient = await createSlackClient();

    await postMessageToSlackChannel({
        slackWebClient: slackWebClient,
        slackChannel: process.env.XPLORERS_GENERAL_SLACK_CHANNEL_ID!,
        blocks: GETTING_STARTED_WITH_SLACK_NOTES.blocks,
    });
};
