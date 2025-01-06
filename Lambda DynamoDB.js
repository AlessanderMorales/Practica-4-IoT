import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { PutCommand, DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

export const handler = async (event, context) => {
    const command = new PutCommand({
        TableName: "Incubator_Data_0004",
        Item: {
            timestamp: event.timestamp,
            Thing_Name: event.Thing_Name,
            sn: event.sn,
            Temperature: event.Temperature,
            Humidity: event.Humidity,
            StateFocus: event.StateFocus,
            StateSensor: event.StateSensor,
            StateFan: event.StateFan,
        },
    });

    const response = await docClient.send(command);
    console.log(response);
};
