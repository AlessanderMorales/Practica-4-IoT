#ifndef MOTOR_H
#define MOTOR_H

#include <Arduino.h>

class Motor {
private:
  int pinIN1; 
  int pinIN2; 

public:
  Motor(int IN1, int IN2);
  void turnRight();
  void stop();
};

#endif