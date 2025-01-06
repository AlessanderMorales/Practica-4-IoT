const Alexa = require('ask-sdk-core');
const AWS = require('aws-sdk');
const IotData = new AWS.IotData({endpoint: 'a1j7buqf58whny-ats.iot.us-east-1.amazonaws.com'});
const lambda = new AWS.Lambda();

const TurnOffParams = {
    thingName: 'Incubator_0004',
    payload: '{"state": {"desired": {"StateFocus": "off"}}}',
};

const TurnOnParams = {
    thingName: 'Incubator_0004',
    payload: '{"state": {"desired": {"StateFocus": "on"}}}',
};

const TurnOnFanParams = {
    thingName: 'Incubator_0004',
    payload: '{"state": {"desired": {"StateFan": "on"}}}',
};

const TurnOffFanParams = {
    thingName: 'Incubator_0004',
    payload: '{"state": {"desired": {"StateFan": "off"}}}',
};



// Parámetros para consultar el shadow de la incubadora
const ShadowParams = {
    thingName: 'Incubator_0004',  // El nombre del dispositivo
};

// Función para obtener el estado del shadow
function getShadowPromise(params) {
    return new Promise((resolve, reject) => {
        IotData.getThingShadow(params, (err, data) => {
            if (err) {
                console.log(err, err.stack);
                reject(`Failed to get thing shadow: ${err.errorMessage}`);
            } else {
                resolve(JSON.parse(data.payload));
            }
        });
    });
}

// Función para obtener la temperatura
async function getTemperature() {
    const params = { thingName: 'Incubator_0004' };
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
    const params = { thingName: 'Incubator_0004' };
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
async function getStateFocus() {
    const params = { thingName: 'Incubator_0004' };
    try {
        const result = await getShadowPromise(params);
        const StateFocus = result.state.reported.StateFocus;  // Accede al estado del foco desde el shadow
        return StateFocus;
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

const TurnOnLightIntendHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'TurnOnLightIntend';
    },
    handle(handlerInput) {
        var speakOutput = "Error";
        IotData.updateThingShadow(TurnOnParams, function(err, data) {
            if (err) console.log(err);
        });
      
        speakOutput = 'Solicitaste encender el Foco!';

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};

const TurnOffLightIntendHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'TurnOffLightIntend';
    },
    handle(handlerInput) {
        var speakOutput = "Error";
        IotData.updateThingShadow(TurnOffParams, function(err, data) {
            if (err) console.log(err);
        });
      
        speakOutput = 'Solicitaste apagar el Foco!';

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};

const TurnOnFanIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'TurnOnFanIntent';
    },
    handle(handlerInput) {
        let speakOutput = 'El ventilador ha sido encendido.';
        IotData.updateThingShadow(TurnOnFanParams, function(err, data) {
            if (err) {
                console.log(err);
            } else {
                speakOutput = 'Error al intentar encender el ventilador.';
            }
        });

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};

const TurnOffFanIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'TurnOffFanIntent';
    },
    handle(handlerInput) {
        let speakOutput = 'El ventilador ha sido apagado.';
        IotData.updateThingShadow(TurnOffFanParams, function(err, data) {
            if (err) {
                console.log(err);
            } else {
                speakOutput = 'Error al intentar apagar el ventilador.';
            }
        });

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
        const StateFocus = await getStateFocus();
        let speakOutput = 'Error al obtener el estado del foco';
        if (StateFocus !== null) {
            if (StateFocus === "on") {
                speakOutput = 'El foco está encendido';
            } else if (StateFocus === "off") {
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
            speakOutput = `La temperatura actual es ${Temperature} grados Celsius.`;
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
            speakOutput = `La humedad actual es ${Humidity}%.`;
        }

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};

// Función para obtener el estado del ventilador
async function getStateFan() {
    const params = { thingName: 'Incubator_0004' };
    try {
        const result = await getShadowPromise(params);
        const StateFan = result.state.reported.StateFan;  // Accede al estado del ventilador desde el shadow
        return StateFan;
    } catch (error) {
        console.log("Error al obtener el estado del ventilador:", error);
        return null;
    }
}

// Nuevo intent handler para obtener el estado del ventilador
const StateFanIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'StateFanIntent';
    },
    async handle(handlerInput) {
        const StateFan = await getStateFan();
        let speakOutput = 'Error al obtener el estado del ventilador';
        if (StateFan !== null) {
            if (StateFan === "on") {
                speakOutput = 'El ventilador está encendido';
            } else if (StateFan === "off") {
                speakOutput = 'El ventilador está apagado';
            } else {
                speakOutput = 'No se pudo determinar el estado del ventilador';
            }
        }

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};



async function getGeneralState() {
    const Temperature = await getTemperature();
    const Humidity = await getHumidity();
    const StateFocus = await getStateFocus();
    
    let generalState = 'No se pudo obtener el estado general de la incubadora.';

    if (Temperature !== null && Humidity !== null && StateFocus !== null) {
        generalState = `El estado actual de la incubadora es el siguiente: 
        Temperatura: ${Temperature} grados Celsius, 
        Humedad: ${Humidity}%, 
        Foco: ${StateFocus === 'on' ? 'encendido' : 'apagado'}.`;
    }

    return generalState;
}


const GeneralStateIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'GeneralStateIntent';
    },
    async handle(handlerInput) {
        const generalState = await getGeneralState();

        return handlerInput.responseBuilder
            .speak(generalState)
            .reprompt(generalState)
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
        console.log(`~~~~ Session ended: ${JSON.stringify(handlerInput.requestEnvelope)}`);
        return handlerInput.responseBuilder.getResponse();
    }
};

const IntentReflectorHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest';
    },
    handle(handlerInput) {
        const intentName = Alexa.getIntentName(handlerInput.requestEnvelope);
        const speakOutput = `Intentó ejecutar ${intentName}`;

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
        console.log(`~~~~ Error handled: ${JSON.stringify(error)}`);

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};

exports.handler = Alexa.SkillBuilders.custom()
    .addRequestHandlers(
        LaunchRequestHandler,
        TurnOnLightIntendHandler,
        TurnOffLightIntendHandler,
        TurnOnFanIntentHandler,
        TurnOffFanIntentHandler,
        StateIntendHandler,
        StateLightIntentHandler,
        GetTemperatureIntentHandler,
        GetHumidityIntentHandler,
        StateFanIntentHandler,
        GeneralStateIntentHandler,
        HelpIntentHandler,
        CancelAndStopIntentHandler,
        FallbackIntentHandler,
        SessionEndedRequestHandler,
        IntentReflectorHandler)
    .addErrorHandlers(ErrorHandler)
    .withCustomUserAgent('sample/hello-world/v1.2')
    .lambda();
