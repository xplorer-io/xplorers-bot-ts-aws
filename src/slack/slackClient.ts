import { fetchSecretFromSSMParameterStore } from "../helpers/secrets";
const { WebClient } = require("@slack/web-api");

// Fetch Slack OAuth token from environment or SSM
const getSlackOAuthToken = async () => {
    return (
        process.env.SLACK_OAUTH_TOKEN ||
        (await fetchSecretFromSSMParameterStore(
            `/slack/oauth/token/${process.env.TF_WORKSPACE}`
        ))
    );
};

// Create Slack client
const createSlackClient = async () => {
    const token = await getSlackOAuthToken();
    return new WebClient(token);
};

export { createSlackClient };
