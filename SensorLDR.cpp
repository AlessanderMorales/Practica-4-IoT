#include "SensorLDR.h"

SensorLDR::SensorLDR(int pin) : pin(pin) {}

void SensorLDR::begin() {
  pinMode(pin, INPUT);
}

bool SensorLDR::isDark() {
  return digitalRead(pin) == LOW;
}