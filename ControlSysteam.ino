#include <WiFiClientSecure.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include <DHT.h>
#include "SensorLDR.h"
#include "RelayControl.h"
#include "WiFiManager.h"
#include "AwsCertificate.h"
#include "Motor.h"

// Pines y configuraciones
#define LIGHT_SENSOR_PIN 18
#define RELAY_PIN 22
#define DHT_PIN 23
#define DHT_TYPE DHT11
#define FAN_PIN1 19 
#define FAN_PIN2 21

DHT dht(DHT_PIN, DHT_TYPE);
const char* WIFI_SSID = "Familia Adriazola";
const char* WIFI_PASS = "449646AL";
const char* MQTT_BROKER = "a1j7buqf58whny-ats.iot.us-east-1.amazonaws.com";
const int MQTT_PORT = 8883;
const char* CLIENT_ID = "Incubator_0004";
const char* UPDATE_TOPIC = "$aws/things/Incubator_0004/shadow/update";
const char* UPDATE_DELTA_TOPIC = "$aws/things/Incubator_0004/shadow/update/delta";

StaticJsonDocument<JSON_OBJECT_SIZE(256)> outputDoc;
StaticJsonDocument<JSON_OBJECT_SIZE(256)> inputDoc;
char outputBuffer[128];
String StateFocus = "off"; 
String StateFan = "off";       
String StateSensor = "light";
WiFiClientSecure wiFiClient;
PubSubClient client(wiFiClient);
WiFiManager wifiManager(WIFI_SSID, WIFI_PASS);
SensorLDR ldr(LIGHT_SENSOR_PIN);
RelayControl relay(RELAY_PIN);
Motor motor(FAN_PIN1,FAN_PIN2);

void setupWiFi() {
  wifiManager.connect();  
}

void reportTemperatureAndHumidity() {
  float Temperature = dht.readTemperature();  
  float Humidity = dht.readHumidity();       

  if (isnan(Temperature) || isnan(Humidity)) {
    Serial.println("Error al leer del sensor DHT");
    return;
  }

  // Preparar el payload para AWS IoT Shadow
  outputDoc["state"]["reported"]["Temperature"] = Temperature;
  outputDoc["state"]["reported"]["Humidity"] = Humidity;
  serializeJson(outputDoc, outputBuffer);
  client.publish(UPDATE_TOPIC, outputBuffer);

  // Mostrar datos en Serial
  Serial.print("Temperatura: ");
  Serial.print(Temperature);
  Serial.println(" °C");
  Serial.print("Humedad: ");
  Serial.print(Humidity);
  Serial.println(" %");
}

void reportFoco() {
  outputDoc["state"]["reported"]["StateFocus"] = StateFocus;
  serializeJson(outputDoc, outputBuffer);
  client.publish(UPDATE_TOPIC, outputBuffer);
}

void reportStateSensor() {
  if (ldr.isDark()) {
    StateSensor = "dark"; 
    Serial.println("Está oscuro en la incubadora");
  } else {
    StateSensor = "light"; 
    Serial.println("Hay luz en la incubadora");
  }
  outputDoc["state"]["reported"]["StateSensor"] = StateSensor;
  serializeJson(outputDoc, outputBuffer);
  client.publish(UPDATE_TOPIC, outputBuffer); 
  Serial.print("Estado de StateSensor reportado: ");
  Serial.println(StateSensor);
}


void reportFan() {
  outputDoc["state"]["reported"]["StateFan"] = StateFan;
  serializeJson(outputDoc, outputBuffer);
  client.publish(UPDATE_TOPIC, outputBuffer);
  Serial.print("Fan State reported: ");
  Serial.println(StateFan);
}


void setBuiltFoco() {
  if (StateFocus == "on") {
    relay.turnOn();
    Serial.println("foco encendido");
  } else {
    relay.turnOff();
    Serial.println("foco apagado");
  }
  reportFoco();
}


void controlFan(bool turnOn) {
  if (turnOn) {
    motor.turnRight();
    StateFan = "on";
    Serial.println("Ventilador encendido");
  } else {
    motor.stop();
    StateFan = "off";
    Serial.println("Ventilador apagado");
  }
  reportFan();
}





// Actualización en la función callback para manejar el ventilador
void callback(char* topic, byte* payload, unsigned int length) {
  String message;
  for (int i = 0; i < length; i++) {
    message += String((char)payload[i]);
  }

  Serial.println("Mensaje desde el tópico " + String(topic) + ": " + message);

  DeserializationError err = deserializeJson(inputDoc, payload);
  if (!err) {
    if (String(topic) == UPDATE_DELTA_TOPIC) {
      if (inputDoc.containsKey("state")) {
        if (inputDoc["state"].containsKey("StateFocus")) {
          String newStateFocus = inputDoc["state"]["StateFocus"].as<String>();
          if (newStateFocus == "off") {
            StateFocus = "off";
            Serial.println("Luz apagada");
            setBuiltFoco();
          } else if (newStateFocus == "on") {
            StateFocus = "on";
            Serial.println("Luz encendida");
            setBuiltFoco();
          }
        }

        if (inputDoc["state"].containsKey("StateFan")) {
          String newStateFan = inputDoc["state"]["StateFan"].as<String>();
          if (newStateFan == "on") {
            controlFan(true);  // Encender el ventilador
          } else if (newStateFan == "off") {
            controlFan(false); // Apagar el ventilador
          }
        }
      } else {
        Serial.println("El mensaje no contiene 'state'.");
      }
    }
  } else {
    Serial.print("Error deserializando JSON: ");
    Serial.println(err.f_str());
  }
}


void setup() {
  Serial.begin(115200);
  dht.begin(); 
  relay.begin();
  ldr.begin();
  setupWiFi();

  wiFiClient.setCACert(AMAZON_ROOT_CA1);
  wiFiClient.setCertificate(CERTIFICATE);
  wiFiClient.setPrivateKey(PRIVATE_KEY);

  client.setServer(MQTT_BROKER, MQTT_PORT);
  client.setCallback(callback);
  StateFocus = "off";
  setBuiltFoco();  
  StateFan = "off";
  controlFan(false);  // Agregado argumento booleano
}

void reconnect() {
  while (!client.connected()) {
    Serial.print("Intentando conexión MQTT...");
    if (client.connect(CLIENT_ID)) {
      Serial.println("Conectado");
      client.subscribe(UPDATE_DELTA_TOPIC);
      Serial.println("Suscrito a " + String(UPDATE_DELTA_TOPIC));
      delay(100);
      reportTemperatureAndHumidity();
      setBuiltFoco();
      reportFan(); 
      controlFan(false);  // Agregado argumento booleano
      
    } else {
      Serial.print("Fallido, rc=");
      Serial.print(client.state());
      Serial.println(" intentando de nuevo en 5 segundos");
      delay(5000);
    }
  }
}

void loop() {
  if (!client.connected()) {
    reconnect();
  }
  client.loop();
  static unsigned long lastReport = 0;
  if (millis() - lastReport >= 10000) {
    lastReport = millis();
    reportTemperatureAndHumidity();
    setBuiltFoco();
    reportStateSensor();
    controlFan(false);  // Agregado argumento booleano
  }
}
