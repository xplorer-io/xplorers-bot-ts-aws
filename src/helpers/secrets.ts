import { SSM } from "aws-sdk";

export async function fetchSecretFromSSMParameterStore(
    path: string
): Promise<string> {
    const ssm = new SSM();

    try {
        const params = {
            Name: path,
            WithDecryption: true, // Retrieve the parameter with decryption
        };

        const response = await ssm.getParameter(params).promise();
        if (!response || !response.Parameter || !response.Parameter.Value) {
            throw new Error("Parameter not found or empty");
        }

        return response.Parameter.Value;
    } catch (error) {
        throw error;
    }
}


fetchSecretFromSSMParameterStore("/azure/openai/endpoint/prod")
