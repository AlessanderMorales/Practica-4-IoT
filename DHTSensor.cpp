#include "DHTSensor.h"
DHTSensor::DHTSensor(uint8_t pin, uint8_t type) 
    : pin(pin), dht(pin, type), temperature(0.0), humidity(0.0) {}
void DHTSensor::begin() {
    dht.begin();
}
void DHTSensor::updateReadings() {
    temperature = dht.readTemperature();
    humidity = dht.readHumidity();
}

