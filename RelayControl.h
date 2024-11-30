#ifndef RELAY_CONTROL_H
#define RELAY_CONTROL_H
#include <Arduino.h>

class RelayControl {
private:
  int pin;

public:
  RelayControl(int pin);
  void begin();
  void turnOn();
  void turnOff();
};

#endif