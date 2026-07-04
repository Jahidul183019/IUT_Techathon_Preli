# Hardware Schematic & Circuit Design

## 1. Context & Purpose
As per the hackathon requirements, the physical office consists of 3 rooms (Drawing Room, Work Room 1, and Work Room 2), each equipped with exactly 2 fans and 3 lights, bringing the total to 15 controllable devices. 

To demonstrate the hardware architecture conceptually without overcomplicating the simulation interface, this circuit provides a **representative simulation for a single room (5 devices)** using an ESP32 microcontroller. Because the hardware logic, pin assignments, and software architecture are identical for all three rooms, proving the concept for one room mathematically and electrically validates the entire system. 

The design is fully simulated in Wokwi. Since Wokwi does not natively support high-voltage AC mains components (like 220V ceiling fans or incandescent bulbs), we use standard low-voltage electronic components as stand-ins. **The design makes physical sense** by mirroring the exact logical flow, current constraints, and pin selection rules that a real-world smart office system must follow to operate safely and reliably.

## 2. How to View and Run the Simulation
Judges can interact with the live circuit simulation directly in their browser using Wokwi. The interface allows for real-time manipulation of environmental variables.

1. **Open the Wokwi Project:** [Click here to open the live simulation](https://wokwi.com/projects/468536088941998081)
2. **Start the Simulation:** Click the green "Play" button at the top of the Wokwi interface. The ESP32 will boot and run the firmware.
3. **Interact with Switches (Manual Override):** Click on any of the 5 slide switches to toggle their input states. You will see the corresponding red LEDs turn on and off immediately. This represents a user physically flipping a wall switch, which the ESP32 detects and responds to by triggering the load relay.
4. **Interact with the Sensor (Power Draw):** Click and drag the potentiometer slider left or right. This simulates fluctuating analog power consumption on Fan 1 (e.g., changing the fan speed). The ESP32 continuously reads this varying voltage to calculate simulated wattage.

## 3. Real-World to Simulation Mapping
To understand what the circuit is doing and why, here is exactly how our low-voltage simulated components map to real-world smart office hardware:

| Real-World Component | Wokwi Simulated Component | Purpose in Circuit |
|----------------------|---------------------------|--------------------|
| **Manual Wall Switch** | **Slide Switch** | Allows physical override or toggling of the device state. It sends a digital `HIGH` (3.3V) or `LOW` (0V) signal to the ESP32 to register user intent. |
| **Relay + AC Load (Fan/Light)** | **LED (Blue/Yellow) + 220Ω Resistor** | Acts as a visual indicator showing whether the ESP32 is currently commanding the relay to power the device. Yellow LEDs represent Lights, and Blue LEDs represent Fans. |
| **ACS712 Current Sensor** | **Potentiometer** | Simulates varying analog power draw (wattage) from a heavy appliance like a fan. It outputs an analog voltage between 0V and 3.3V based on the slider position. |

### Real-World Equivalent Circuit Diagram
While our Wokwi simulation uses a simple 3.3V LED to represent a load being turned ON, an actual physical deployment must use a relay module to safely isolate the low-voltage microcontroller from the dangerous 220V AC mains.

```text
  LOW VOLTAGE SIDE                    HIGH VOLTAGE SIDE
  (ESP32, 3.3V logic)                (220V AC mains)
                                     
  ┌──────────┐    ┌──────────────┐    ┌──────────┐
  │  ESP32   │    │ Relay Module │    │  Fan or  │
  │          │    │              │    │  Light   │
  │  GPIO 26 ├───►│ IN1  ┌────┐ │    │          │
  │          │    │      │opto│ │    │   L ──┐  │
  │     3.3V ├───►│ VCC  └──┬─┘ │    │       │  │
  │      GND ├───►│ GND    coil │    │   ┌───┘  │
  │          │    │      ┌──┴─┐ │    │   │      │
  └──────────┘    │      │RELAY├─┼────┤  LOAD   │
                  │      └────┘ │    │   │      │
                  └──────────────┘    │   N ──┘  │
                                     └──────────┘
                  ◄─── isolated ───►
                   (optocoupler)
```

In real life, when `GPIO 26` goes `HIGH`, it powers a tiny LED inside an **optocoupler** on the relay board. The light from this optocoupler hits a phototransistor, which then magnetically closes the physical relay switch, allowing 220V AC to flow to the Fan. Because there is only light passing between the two sides of the optocoupler, the 220V mains can never accidentally surge backward and fry the ESP32 (this is called *galvanic isolation*). 

In our Wokwi simulation, we substitute the entire high-voltage side (Relay + AC Mains + Load) with a direct LED connection to `GPIO 26` for safe, immediate visual validation of the logic.

## 4. Pin Mapping & Technical Details

### Input Pins (Wall Switches & Sensors)
These pins read the current physical state of the environment, continuously scanning for user interaction or sensor fluctuations.

| Component | ESP32 GPIO | Function | Real-World Equivalent |
|-----------|------------|----------|-----------------------|
| **Switch 1** | **GPIO 16** | Digital Input | Wall switch for Light 1 |
| **Switch 2** | **GPIO 17** | Digital Input | Wall switch for Light 2 |
| **Switch 3** | **GPIO 18** | Digital Input | Wall switch for Light 3 |
| **Switch 4** | **GPIO 19** | Digital Input | Wall switch for Fan 1 |
| **Switch 5** | **GPIO 21** | Digital Input | Wall switch for Fan 2 |
| **Potentiometer**| **GPIO 34** | Analog Input (ADC1) | ACS712 measuring Fan 1 current |

*Technical Note on Inputs (Floating Pins):* The switch GPIOs must use internal pull-down resistors (`INPUT_PULLDOWN`) in the software configuration. If a pin is left "floating" (connected to nothing when the switch is OFF), it acts like an antenna and picks up ambient electrical noise, causing random false ON/OFF triggers. When the slide switch is ON (connected to 3.3V), the pin reads a solid `HIGH`. When OFF, the internal pull-down resistor connects the pin weakly to Ground, ensuring it reads a clean, stable `LOW`.

### Output Pins (Simulated Loads)
These pins drive the physical loads. In the simulation, they provide the voltage needed to illuminate the representative LEDs.

| Component | ESP32 GPIO | Function | Real-World Equivalent |
|-----------|------------|----------|-----------------------|
| **LED 1 (Yellow)** | **GPIO 26** | Digital Output | Relay Channel 1 -> Light 1 |
| **LED 2 (Yellow)** | **GPIO 25** | Digital Output | Relay Channel 2 -> Light 2 |
| **LED 3 (Yellow)** | **GPIO 27** | Digital Output | Relay Channel 3 -> Light 3 |
| **LED 4 (Blue)** | **GPIO 33** | Digital Output | Relay Channel 4 -> Fan 1 |
| **LED 5 (Blue)** | **GPIO 32** | Digital Output | Relay Channel 5 -> Fan 2 |

*Technical Note on Outputs (Current Limits):* The LEDs are driven directly by 3.3V logic signals from the ESP32. A **220Ω series resistor** is used for each LED to limit the current draw. Assuming a standard red LED has a forward voltage drop of roughly 2.0V, Ohm's law dictates the current: `I = V/R = (3.3V - 2.0V) / 220Ω ≈ 5.9mA`. The ESP32 has a strict maximum safe sourcing limit of **12mA per GPIO pin**. Drawing 5.9mA proves that this circuit is electrically sound and will not overheat or degrade the microcontroller over time.

### GPIO Selection Rationale
Choosing pins on an ESP32 is not arbitrary; many pins have hidden secondary functions or restrictions that can crash the system if used incorrectly.
- **Outputs (25, 26, 27, 32, 33):** These are safe, general-purpose I/O (GPIO) pins. They have no special restrictions and do not interfere with the ESP32's boot sequence.
- **Inputs (16, 17, 18, 19, 21):** These are standard input pins, chosen because they are completely independent of the ESP32's strapping pins.
- **Analog Input (34):** Pin 34 is part of the **ADC1** (Analog-to-Digital Converter 1) hardware block. This is a critical design choice because the ESP32's Wi-Fi driver heavily utilizes the ADC2 hardware block. If we had used an ADC2 pin, attempting to read the potentiometer while the Wi-Fi was transmitting data to the backend would cause the read to fail or crash. Using ADC1 guarantees reliable, uninterrupted analog reads.
- **Avoided Pins:** Boot strapping pins (GPIO 0, 2, 12, 15) determine the boot mode of the ESP32 (e.g., normal boot vs. firmware flashing mode) upon power-up. If external hardware pulls these high or low during startup, the device may refuse to boot entirely. Internal flash pins (GPIO 6-11) are physically wired to the ESP32's internal memory chip; using them will instantly crash the program. Both sets were strictly avoided in this design to ensure robust, enterprise-grade hardware stability.

## 5. Wiring Diagram Summary

Below is a schematic flow showing how the hardware logic operates inside the simulation. The flow of data is straightforward: user intent (slide switch) enters the ESP32 on the left, the software processes the request, and the corresponding action (LED/Relay) is output on the right.

```text
                      ┌─────────────────────────┐
                      │       ESP32 DevKit      │
                      │                         │
[Slide SW 1 (3.3V)] ──► GPIO 16     GPIO 26 ────┼──► [Yellow LED 1 (Light 1)] ─► 220Ω ──► GND
[Slide SW 2 (3.3V)] ──► GPIO 17     GPIO 25 ────┼──► [Yellow LED 2 (Light 2)] ─► 220Ω ──► GND
[Slide SW 3 (3.3V)] ──► GPIO 18     GPIO 27 ────┼──► [Yellow LED 3 (Light 3)] ─► 220Ω ──► GND
[Slide SW 4 (3.3V)] ──► GPIO 19     GPIO 33 ────┼──► [Blue LED 4 (Fan 1)] ─────► 220Ω ──► GND
[Slide SW 5 (3.3V)] ──► GPIO 21     GPIO 32 ────┼──► [Blue LED 5 (Fan 2)] ─────► 220Ω ──► GND
                      │                         │
[Potentiometer SIG] ──► GPIO 34                 │
                      │                         │
                      └─────────────────────────┘
```
