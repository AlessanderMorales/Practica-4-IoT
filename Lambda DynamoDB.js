import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { PutCommand, DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

export const handler = async (event, context) => {
    const command = new PutCommand({
        TableName: "Incubator_Data",
        Item: {
            timestamp: event.timestamp,
            Thing_Name: event.Thing_Name,
            sn: event.sn,
            Temperature: event.Temperature,
            Humidity: event.Humidity,
            StateSensor: event.StateSensor,
            State: event.State
        },
    });

    const response = await docClient.send(command);
    console.log(response);
};