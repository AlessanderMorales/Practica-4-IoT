#ifndef DHTSENSOR_H
#define DHTSENSOR_H

#include <DHT.h>

class DHTSensor {
private:
    uint8_t pin;
    DHT dht;
    float temperature;
    float humidity;

public:
    // Constructor
    DHTSensor(uint8_t pin, uint8_t type);

    // Métodos
    void begin();
    void updateReadings(); 
};

#endif // DHTSENSOR_H
