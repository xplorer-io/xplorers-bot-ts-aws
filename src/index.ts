import { SUCCESS_MESSAGE } from "./helpers/constants";
import { SlackWebClient } from "./helpers/types";
import { handleSlackMessageEvent } from "./slack/slackEventHandler";
import { postMessageToSlack } from "./slack/slackInteraction";
import { askOpenAI } from "./helpers/openai";
import { readSecretFromSecretsManager } from "./helpers/secrets";
import { putEbEvents } from "./helpers/events";
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
            (await readSecretFromSecretsManager(
                `slack-oauth-token-${process.env.TF_WORKSPACE}`
            ))
    );

    switch (event.detail.type) {
        case "event_callback":
            const slackEvent = event.detail.event;

            if (slackEvent.bot_id) {
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
                    await postMessageToSlack(
                        slackWebClient,
                        openAIResponse,
                        slackEvent?.channel,
                        ts
                    );
                }
                break;
            }
            break;
    }

    console.log(SUCCESS_MESSAGE);
};
