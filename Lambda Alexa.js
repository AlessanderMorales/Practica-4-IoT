const Alexa = require('ask-sdk-core');
const AWS = require('aws-sdk');
const IotData = new AWS.IotData({endpoint: 'a1j7buqf58whny-ats.iot.us-east-1.amazonaws.com'});
const lambda = new AWS.Lambda();

const TurnOffParams = {
    thingName: 'Incubator_0002',
    payload: '{"state": {"desired": {"StateSensor": "off"}}}',
};

const TurnOnParams = {
    thingName: 'Incubator_0002',
    payload: '{"state": {"desired": {"StateSensor": "on"}}}',
};

// Parámetros para consultar el shadow de la incubadora
const ShadowParams = {
    thingName: 'Incubator_0002',  // El nombre del dispositivo
};

// Función para obtener el estado del shadow
function getShadowPromise(params) {
    return new Promise((resolve, reject) => {
        IotData.getThingShadow(params, (err, data) => {
            if (err) {
                console.log(err, err.stack);
                reject('Failed to get thing shadow ${err.errorMessage}');
            } else {
                resolve(JSON.parse(data.payload));
            }
        });
    });
}

// Función para obtener la temperatura
async function getTemperature() {
    const params = { thingName: 'Incubator_0002' };
    try {
        const result = await getShadowPromise(params);
        const Temperature = result.state.reported.Temperature;  // Accede a la temperatura desde el shadow
        return Temperature;
    } catch (error) {
        console.log("Error al obtener la temperatura:", error);
        return null;
    }
}

// Función para obtener la humedad
async function getHumidity() {
    const params = { thingName: 'Incubator_0002' };
    try {
        const result = await getShadowPromise(params);
        const Humidity = result.state.reported.Humidity;  // Accede a la humedad desde el shadow
        return Humidity;
    } catch (error) {
        console.log("Error al obtener la humedad:", error);
        return null;
    }
}

// Función para obtener el estado del foco
async function getState() {
    const params = { thingName: 'Incubator_0002' };
    try {
        const result = await getShadowPromise(params);
        const State = result.state.reported.State;  // Accede al estado del foco desde el shadow
        return State;
    } catch (error) {
        console.log("Error al obtener el estado del foco:", error);
        return null;
    }
}

const LaunchRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'LaunchRequest';
    },
    handle(handlerInput) {
        const speakOutput = 'Bienvenido a tu incubadora inteligente. Puedes encenderla, apagarla o consultar el estado del sensor de luz, foco, temperatura y humedad. ¿Qué deseas hacer?';

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};

const TurnOnSensorIntendHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'TurnOnSensorIntend';
    },
    handle(handlerInput) {
        var speakOutput = "Error";
        IotData.updateThingShadow(TurnOnParams, function(err, data) {
            if (err) console.log(err);
        });
      
        speakOutput = 'Solicitaste encender el sensor!';

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};

const TurnOffSensorIntendHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'TurnOffSensorIntend';
    },
    handle(handlerInput) {
        var speakOutput = "Error";
        IotData.updateThingShadow(TurnOffParams, function(err, data) {
            if (err) console.log(err);
        });
      
        speakOutput = 'Solicitaste apagar el sensor!';

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};

const StateIntendHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'StateIntend';
    },
    async handle(handlerInput) {
        var StateSensor = 'unknown';
        await getShadowPromise(ShadowParams).then((result) => StateSensor = result.state.reported.StateSensor);
        console.log(StateSensor);

        var speakOutput = 'Error';
        if (StateSensor == "off") {
            speakOutput = 'El sensor está apagado';
        } else if (StateSensor == "on") {
            speakOutput = 'El sensor está encendido';
        } else {
            speakOutput = 'No se pudo consultar el estado del sensor, por favor intente más tarde';
        }

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};

const StateLightIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'StateLightIntent';
    },
    async handle(handlerInput) {
        const State = await getState();
        let speakOutput = 'Error al obtener el estado del foco';
        if (State !== null) {
            if (State === "on") {
                speakOutput = 'El foco está encendido';
            } else if (State === "off") {
                speakOutput = 'El foco está apagado';
            } else {
                speakOutput = 'No se pudo determinar el estado del foco';
            }
        }

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};

const GetTemperatureIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'GetTemperatureIntent';
    },
    async handle(handlerInput) {
        const Temperature = await getTemperature();
        let speakOutput = 'Error al obtener la temperatura';
        if (Temperature !== null) {
            speakOutput = La temperatura actual es ${Temperature} grados Celsius.;
        }

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};

const GetHumidityIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'GetHumidityIntent';
    },
    async handle(handlerInput) {
        const Humidity = await getHumidity();
        let speakOutput = 'Error al obtener la humedad';
        if (Humidity !== null) {
            speakOutput = La humedad actual es ${Humidity}%.;
        }

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};

const HelpIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.HelpIntent';
    },
    handle(handlerInput) {
        const speakOutput = 'Tienes las opciones de encender, apagar y consultar el estado. También puedes obtener la temperatura y la humedad.';

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};

const CancelAndStopIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && (Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.CancelIntent'
                || Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.StopIntent');
    },
    handle(handlerInput) {
        const speakOutput = 'Hasta pronto!';

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .getResponse();
    }
};

const FallbackIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.FallbackIntent';
    },
    handle(handlerInput) {
        const speakOutput = 'Lo siento, no entendí, intenta de nuevo.';

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};

const SessionEndedRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'SessionEndedRequest';
    },
    handle(handlerInput) {
        console.log(~~~~ Session ended: ${JSON.stringify(handlerInput.requestEnvelope)});
        return handlerInput.responseBuilder.getResponse();
    }
};

const IntentReflectorHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest';
    },
    handle(handlerInput) {
        const intentName = Alexa.getIntentName(handlerInput.requestEnvelope);
        const speakOutput = Intentó ejecutar ${intentName};

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .getResponse();
    }
};

const ErrorHandler = {
    canHandle() {
        return true;
    },
    handle(handlerInput, error) {
        const speakOutput = 'Disculpa, hubo un error. Intenta de nuevo.';
        console.log(~~~~ Error handled: ${JSON.stringify(error)});

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};

exports.handler = Alexa.SkillBuilders.custom()
    .addRequestHandlers(
        LaunchRequestHandler,
        TurnOnSensorIntendHandler,
        TurnOffSensorIntendHandler,
        StateIntendHandler,
        StateLightIntentHandler,
        GetTemperatureIntentHandler,
        GetHumidityIntentHandler,
        HelpIntentHandler,
        CancelAndStopIntentHandler,
        FallbackIntentHandler,
        SessionEndedRequestHandler,
        IntentReflectorHandler)
    .addErrorHandlers(ErrorHandler)
    .withCustomUserAgent('sample/hello-world/v1.2')
    .lambda();