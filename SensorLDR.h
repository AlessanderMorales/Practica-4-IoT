#ifndef SENSOR_LDR_H
#define SENSOR_LDR_H

#include <Arduino.h>

class SensorLDR {
private:
  int pin;

public:
  SensorLDR(int pin);
  void begin();
  bool isDark();
};

#endif