#include "RelayControl.h"

RelayControl::RelayControl(int pin) : pin(pin) {}

void RelayControl::begin() {
  pinMode(pin, OUTPUT);
  digitalWrite(pin, LOW);
}

void RelayControl::turnOn() {
  digitalWrite(pin, LOW);
}

void RelayControl::turnOff() {
  digitalWrite(pin, HIGH);
}