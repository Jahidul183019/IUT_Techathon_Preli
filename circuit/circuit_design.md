# ESP32 Circuit Design — One Room (2 Fans + 3 Lights)

## 1. Pin Mapping Table

### Control Pins (ESP32 → Relay Module)

| GPIO | Relay Channel | Device | Load Type | Mains Rating |
|------|--------------|--------|-----------|--------------|
| **GPIO 16** | CH1 | Fan 1 | AC Ceiling Fan (~75W) | 220V AC |
| **GPIO 17** | CH2 | Fan 2 | AC Ceiling Fan (~75W) | 220V AC |
| **GPIO 18** | CH3 | Light 1 | AC Bulb (~10W LED) | 220V AC |
| **GPIO 19** | CH4 | Light 2 | AC Bulb (~10W LED) | 220V AC |
| **GPIO 21** | CH5 | Light 3 | AC Bulb (~10W LED) | 220V AC |

### Feedback / Sensing Pins

| GPIO | Function | Connected To | Notes |
|------|----------|-------------|-------|
| **GPIO 34** | ADC (input-only) | ACS712 #1 (Fan 1) | Current sense, 0–3.3V analog |
| **GPIO 35** | ADC (input-only) | ACS712 #2 (Fan 2) | Current sense, 0–3.3V analog |
| **GPIO 32** | Digital input | Opto-feedback Light 1 | HIGH = on, LOW = off |
| **GPIO 33** | Digital input | Opto-feedback Light 2 | HIGH = on, LOW = off |
| **GPIO 25** | Digital input | Opto-feedback Light 3 | HIGH = on, LOW = off |

### Why These Specific GPIOs?

| Choice | Reason |
|--------|--------|
| GPIO 16–21 for relay control | Safe general-purpose outputs, no boot conflicts |
| GPIO 34, 35 for ADC | Input-only pins with ADC2 — ideal for analog read (no output needed) |
| GPIO 32, 33, 25 for digital feedback | General-purpose input pins, no strapping-pin conflicts |
| **Avoided**: GPIO 0, 2, 12, 15 | These are **strapping pins** — pulling them HIGH/LOW during boot can brick the ESP32 or enter flash mode |
| **Avoided**: GPIO 6–11 | Connected to internal SPI flash — **never use** |

---

## 2. How the Relay Module Switches Mains Loads

### The Core Idea

```
  LOW VOLTAGE SIDE                    HIGH VOLTAGE SIDE
  (ESP32, 3.3V logic)                (220V AC mains)
                                     
  ┌──────────┐    ┌──────────────┐    ┌──────────┐
  │  ESP32   │    │ Relay Module │    │  Fan or  │
  │          │    │              │    │  Light   │
  │  GPIO 16 ├───►│ IN1  ┌────┐ │    │          │
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

### Step-by-Step Signal Path

```
1.  ESP32 GPIO 16 goes LOW (active-low relay modules are standard)
          │
          ▼
2.  Current flows through the relay module's onboard OPTOCOUPLER LED
    (the optocoupler provides galvanic isolation — mains can never
     reach the ESP32 even if the relay fails)
          │
          ▼
3.  Optocoupler phototransistor turns ON → activates a transistor
    driver (typically an NPN like S8050 or ULN2003 on the module)
          │
          ▼
4.  Transistor energizes the RELAY COIL (5V, ~70mA — the module's
    own 5V supply provides this, NOT the ESP32 GPIO)
          │
          ▼
5.  Relay coil creates a magnetic field → pulls the mechanical
    CONTACT ARM from NC (normally closed) to NO (normally open)
          │
          ▼
6.  The NO terminal is wired in series with the mains LIVE wire
    to the fan/light → circuit completes → device turns ON
```

### Wiring per Device (Mains Side)

```
  AC MAINS         RELAY              LOAD (Fan/Light)
  ┌─────┐     ┌────────────┐         ┌──────┐
  │  L  ├────►│ COM    NO  ├────────►│  L   │
  │     │     │            │         │      │
  │  N  ├─────┼────────────┼────────►│  N   │
  │     │     │     NC     │         │      │
  └─────┘     └────────────┘         └──────┘

  • L (Live) goes INTO the relay's COM (common) terminal
  • Relay's NO (normally open) goes OUT to the device's Live
  • N (Neutral) goes straight through to the device (not switched)
  • NC (normally closed) is left unconnected
```

> [!CAUTION]
> In Wokwi simulation, you won't actually wire 220V. Use LEDs or simulated loads to represent fans/lights. The relay click and GPIO state changes are what matter for the demo.

---

## 3. Sensing State Feedback

### Option A: GPIO Readback (Simple — For Lights)

Since **you** control the relay, you already know the intended state. But to confirm the relay actually actuated (and detect relay failure), use an **optocoupler-based feedback circuit**:

```
  MAINS SIDE (after relay)           ESP32 SIDE
  ┌──────────────────┐              ┌──────────┐
  │                  │              │          │
  │  Load Live ──┬───┤              │          │
  │              │   │              │          │
  │           ┌──┴──┐│              │          │
  │           │Resis││  ┌────────┐  │          │
  │           │220kΩ││  │  Opto  │  │          │
  │           └──┬──┘│  │ PC817  │  │          │
  │              │   ├──►│A    C├──►│ GPIO 32  │
  │              │   │  │       │  │  (INPUT)  │
  │  Load Neut ──┘   ├──►│K    E├──►│ GND      │
  │                  │  └────────┘  │          │
  └──────────────────┘     ▲        │  + 10kΩ  │
                           │        │ pull-up   │
                     galvanic       └──────────┘
                     isolation
```

- When the load is ON → AC current flows through the 220kΩ resistor → optocoupler LED glows → phototransistor pulls GPIO 32 LOW
- When OFF → no current → GPIO 32 reads HIGH (via pull-up)
- **Result**: `digitalRead(GPIO_32) == LOW` means "Light is ON"

### Option B: Current Sensing via ACS712 (For Fans — Measures Power Draw)

The ACS712 is a **Hall-effect current sensor** that outputs an analog voltage proportional to current:

```
  ┌─────────────────────────────────────────────┐
  │  ACS712-05B Module                           │
  │                                              │
  │  IP+ ◄── Live wire IN (from relay NO)        │
  │  IP- ──► Live wire OUT (to fan)              │
  │                                              │
  │  VCC ◄── 5V (from relay module's 5V supply)  │
  │  GND ◄── Common GND with ESP32               │
  │  OUT ──► ESP32 GPIO 34 (ADC input)           │
  │                                              │
  │  Output: 2.5V at 0A (quiescent)              │
  │          ±185mV per Amp                       │
  └─────────────────────────────────────────────┘
```

**Reading current in code:**

```cpp
// On ESP32 (Arduino framework)
float readCurrent(int pin) {
    int raw = analogRead(pin);               // 0–4095 (12-bit ADC)
    float voltage = (raw / 4095.0) * 3.3;    // Convert to volts
    float current = (voltage - 2.5) / 0.185; // ACS712-05B: 185mV/A
    return abs(current);                      // AC is bidirectional
}

// Fan drawing ~0.35A → voltage ≈ 2.5 + (0.35 × 0.185) ≈ 2.565V
// Fan off → voltage ≈ 2.5V (quiescent)
```

> [!TIP]
> **For Wokwi**: The ACS712 isn't natively available. Simulate it with a **potentiometer** on the ADC pin — turn it to represent different current draws. Explain in your demo video that it represents the ACS712 output.

### Summary: Which Sensing Method Where?

| Device | Sensing Method | Why |
|--------|---------------|-----|
| Lights 1–3 | GPIO readback (optocoupler) | Binary on/off is sufficient, cheap |
| Fans 1–2 | ACS712 current sensor | Also reveals **power draw** and **speed** (useful for usage stats) |

---

## 4. Electrical Reasoning

### Why GPIOs Can't Drive Fans/Lights Directly

| Parameter | ESP32 GPIO | Ceiling Fan | LED Bulb |
|-----------|-----------|-------------|----------|
| Voltage | 3.3V DC | **220V AC** | **220V AC** |
| Max current | **12mA** per pin | ~340mA (75W) | ~45mA (10W) |
| Total GPIO budget | **40mA** across all pins | — | — |

> [!WARNING]
> **Connecting a GPIO directly to a 220V load will instantly destroy the ESP32 and create a lethal shock hazard.** The relay provides complete electrical isolation between the logic side (3.3V) and the mains side (220V).

### Relay Selection: Why a 10A 250VAC Relay Module

| Spec | Value | Reason |
|------|-------|--------|
| **Contact rating** | 10A @ 250VAC | Ceiling fans draw ~0.35A, LED bulbs ~0.05A. 10A gives **28× headroom** for inrush current (motors spike 5–8× at startup) |
| **Coil voltage** | 5V DC | Standard relay module supply. The module's onboard transistor drives the coil — ESP32 GPIO only drives the optocoupler LED (~1–2mA) |
| **Isolation** | Optocoupler (e.g., PC817) | Provides **galvanic isolation** — even if the relay's mains-side contact welds shut, no mains voltage can reach the ESP32 |
| **Channels** | 8-channel module | One module covers all 5 devices with 3 spare channels for future expansion |
| **Flyback diode** | Built into module | Suppresses voltage spike when relay coil de-energizes — protects the driving transistor |

### Why 5V Relay Modules With 3.3V ESP32?

The ESP32 outputs **3.3V logic**, but most relay modules expect **5V trigger signals**. This is handled by the module design:

```
ESP32 GPIO (3.3V) ──► Optocoupler LED (forward voltage ~1.2V)
                      ↓
                      Works fine at 3.3V — LED only needs ~1.2V and ~1mA
                      ↓
                      Optocoupler output drives the relay's 5V transistor
                      (the module's own VCC supplies the 5V power)
```

> [!NOTE]
> Most common relay modules (the blue ones with "SRD-05VDC" relays) work with 3.3V trigger just fine because the optocoupler LED has a low forward voltage. If you find one that doesn't trigger reliably, add a **level shifter** or use a module explicitly rated for 3.3V logic input.

### ACS712 Rating Choice

| Model | Range | Sensitivity | Best For |
|-------|-------|-------------|----------|
| ACS712-05B | ±5A | 185 mV/A | ✅ Our fans (0.35A) — best resolution |
| ACS712-20A | ±20A | 100 mV/A | Overkill, lower resolution |
| ACS712-30A | ±30A | 66 mV/A | High-power loads only |

The **05B variant** gives the best resolution for small loads. A 0.35A fan produces a 65mV deviation from the 2.5V quiescent voltage — easily readable by the ESP32's 12-bit ADC.

---

## Complete Wiring Summary (One Room)

```
                    ┌─────────────────────────┐
                    │       ESP32 DevKit       │
                    │                          │
                    │  GPIO16 ──► Relay CH1 ───┼──► Fan 1 (220V AC)
                    │  GPIO17 ──► Relay CH2 ───┼──► Fan 2 (220V AC)
                    │  GPIO18 ──► Relay CH3 ───┼──► Light 1 (220V AC)
                    │  GPIO19 ──► Relay CH4 ───┼──► Light 2 (220V AC)
                    │  GPIO21 ──► Relay CH5 ───┼──► Light 3 (220V AC)
                    │                          │
                    │  GPIO34 ◄── ACS712 #1 ◄──┼── Fan 1 current
                    │  GPIO35 ◄── ACS712 #2 ◄──┼── Fan 2 current
                    │  GPIO32 ◄── Opto #1   ◄──┼── Light 1 state
                    │  GPIO33 ◄── Opto #2   ◄──┼── Light 2 state
                    │  GPIO25 ◄── Opto #3   ◄──┼── Light 3 state
                    │                          │
                    │  3.3V ──► Relay VCC (logic trigger power)
                    │  GND  ──► Common GND     │
                    │                          │
                    │  (Relay module also needs │
                    │   separate 5V for coils   │
                    │   from USB or external    │
                    │   5V supply — JD-VCC)     │
                    └─────────────────────────┘
```

---

## Wokwi-Specific Notes

Since Wokwi doesn't have mains simulation:

| Real Component | Wokwi Substitute | How to Demo |
|---------------|-------------------|-------------|
| Ceiling Fan (220V) | **LED + label** "Fan" | LED ON = fan running |
| LED Bulb (220V) | **LED** (different color) | Direct visual feedback |
| 8-ch Relay Module | **Relay component** (built-in) | Shows click animation |
| ACS712 | **Potentiometer** on ADC pin | Turn to simulate current draw |
| Optocoupler feedback | **Button/switch** on input pin | Press = device confirmed ON |
| 220V AC Mains | Not simulated | Explain verbally in demo |

---

## Demo Video Talking Points

1. **"The ESP32 GPIO outputs 3.3V at only 12mA — it can't power a 220V fan drawing 340mA. We use a relay as an electrically isolated switch."**

2. **"The relay module has an optocoupler, so even if the high-voltage side fails, mains can never reach the ESP32. This is galvanic isolation."**

3. **"For fans, we use an ACS712 Hall-effect sensor to measure actual current draw — this tells us not just on/off, but how much power the fan is consuming. For lights, a simple optocoupler readback confirms the relay actuated."**

4. **"We chose GPIO 16–21 for relay outputs because they're safe — they don't conflict with boot strapping pins (GPIO 0, 2, 12, 15) which could prevent the ESP32 from booting."**

5. **"The 10A relay rating gives us 28× headroom over the fan's steady-state current, which is critical because motors draw 5–8× surge current at startup."**
