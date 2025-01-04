#include "Motor.h"

Motor::Motor(int IN1, int IN2) {
  pinIN1 = IN1;
  pinIN2 = IN2;
  pinMode(pinIN1, OUTPUT);
  pinMode(pinIN2, OUTPUT);
  stop();
}


void Motor::turnRight() {
  digitalWrite(pinIN1, HIGH);
  digitalWrite(pinIN2, LOW);
}


void Motor::stop() {
  digitalWrite(pinIN1, LOW);
  digitalWrite(pinIN2, LOW);
}
