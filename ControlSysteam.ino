#include <WiFiClientSecure.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include <DHT.h>
#include "SensorLDR.h"
#include "RelayControl.h"
#include "WiFiManager.h"
#include "AwsCertificate.h"

// Pines y configuraciones
#define LIGHT_SENSOR_PIN 18
#define RELAY_PIN 4
#define DHT_PIN 23
#define DHT_TYPE DHT11

DHT dht(DHT_PIN, DHT_TYPE);
const char* WIFI_SSID = "Familia Adriazola";
const char* WIFI_PASS = "449646AL";
const char* MQTT_BROKER = "a1j7buqf58whny-ats.iot.us-east-1.amazonaws.com";
const int MQTT_PORT = 8883;
const char* CLIENT_ID = "Incubator_0002";
const char* UPDATE_TOPIC = "$aws/things/Incubator_0002/shadow/update";
const char* UPDATE_DELTA_TOPIC = "$aws/things/Incubator_0002/shadow/update/delta";

StaticJsonDocument<JSON_OBJECT_SIZE(64)> outputDoc;
StaticJsonDocument<JSON_OBJECT_SIZE(64)> inputDoc;
char outputBuffer[128];
String State = "off";        
String StateSensor = "on";
WiFiClientSecure wiFiClient;
PubSubClient client(wiFiClient);
WiFiManager wifiManager(WIFI_SSID, WIFI_PASS);
SensorLDR ldr(LIGHT_SENSOR_PIN);
RelayControl relay(RELAY_PIN);

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
  outputDoc["state"]["reported"]["State"] = State;
  serializeJson(outputDoc, outputBuffer);
  client.publish(UPDATE_TOPIC, outputBuffer);
}

void reportStateSensor() {
  outputDoc["state"]["reported"]["StateSensor"] = StateSensor;
  serializeJson(outputDoc, outputBuffer);
  client.publish(UPDATE_TOPIC, outputBuffer); 
  Serial.print("Estado de StateSensor reportado: ");
  Serial.println(StateSensor);
}

void setBuiltFoco() {
  if (StateSensor == "on") {
    if (ldr.isDark()) {  // Llamada corregida al método isDark
      relay.turnOn();
      Serial.println("Hay luz. Rele apagado.");
      State = "off";
      reportFoco();
    } else {
      relay.turnOff();
      Serial.println("Oscuridad detectada. Rele encendido.");
      State = "on";
      reportFoco();
    }
  } else {
    relay.turnOff();
    Serial.println("LDRSensor está apagado. Rele apagado.");
    if (State != "off") {
      State = "off";
      reportFoco(); 
    }
  }
}

void callback(char* topic, byte* payload, unsigned int length) {
  String message;
  for (int i = 0; i < length; i++) {
    message += String((char)payload[i]);
  }

  Serial.println("Mensaje desde el tópico " + String(topic) + ": " + message);

  DeserializationError err = deserializeJson(inputDoc, payload);
  if (!err) {
    if (String(topic) == UPDATE_DELTA_TOPIC) {
      if (inputDoc.containsKey("state") && inputDoc["state"].containsKey("StateSensor")) {
        String newStateSensor = inputDoc["state"]["StateSensor"].as<String>();
        if (newStateSensor == "off") {
          StateSensor = "off";
          Serial.println("Sensor apagado.");
          reportStateSensor();
        } else if (newStateSensor == "on") {
          StateSensor = "on";
          Serial.println("Sensor encendido.");
          reportStateSensor();
        }
      } else {
        Serial.println("El mensaje no contiene 'StateSensor'.");
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
  }
}