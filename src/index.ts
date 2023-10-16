import { SUCCESS_MESSAGE } from "./helpers/constants";
import { SlackWebClient } from "./helpers/types";
import { handleSlackMessageEvent } from "./slack/slackEventHandler";
import { postMessageToSlackChannel } from "./slack/slackInteraction";
import { askOpenAI } from "./helpers/openai";
import { fetchSecretFromSSMParameterStore } from "./helpers/secrets";
import { putEbEvents } from "./helpers/events";
import GETTING_STARTED_WITH_SLACK_NOTES from "./helpers/files/gettingStartedWithSlack.json";
const { WebClient } = require("@slack/web-api");

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

exports.xplorersbot = async function (event: Record<string, any>) {
    console.log("EVENT: %s", JSON.stringify(event, null, 2));
    const slackWebClient: SlackWebClient = new WebClient(
        process.env.SLACK_OAUTH_TOKEN ||
            (await fetchSecretFromSSMParameterStore(
                `/slack/oauth/token/${process.env.TF_WORKSPACE}`
            ))
    );

    switch (event.detail.type) {
        case "event_callback":
            const slackEvent = event.detail.event;
            const isMessageDeletedEvent =
                slackEvent?.subtype === "message_deleted";
            const isMessageChangedDeletedEvent =
                slackEvent?.message?.text !== undefined &&
                slackEvent?.previous_message?.text !== undefined &&
                slackEvent.message.text === slackEvent.previous_message.text;

            if (
                slackEvent.bot_id ||
                isMessageDeletedEvent ||
                isMessageChangedDeletedEvent
            ) {
                break;
            }

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

    const slackWebClient: SlackWebClient = new WebClient(
        process.env.SLACK_OAUTH_TOKEN ||
            (await fetchSecretFromSSMParameterStore(
                `/slack/oauth/token/${process.env.TF_WORKSPACE}`
            ))
    );

    postMessageToSlackChannel({
        slackWebClient: slackWebClient,
        slackChannel: process.env.XPLORERS_GENERAL_SLACK_CHANNEL_ID!,
        blocks: GETTING_STARTED_WITH_SLACK_NOTES.blocks,
    });
};
