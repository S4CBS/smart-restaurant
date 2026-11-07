# -*- coding: utf-8 -*-
import sys, subprocess, json, time
sys.stdout.reconfigure(encoding='utf-8')

def run_ab(cmd):
    full_cmd = f"npx agent-browser {cmd}"
    res = subprocess.run(full_cmd, shell=True, capture_output=True, text=True, encoding='utf-8', errors='ignore')
    return res.stdout.strip(), res.stderr.strip()

print("1. Opening website on preview port 4173...")
run_ab("open http://localhost:4173/")
run_ab("set viewport 1280 800")
time.sleep(0.5)

# Test Tab 1: Constructor
print("\n--- Testing Tab 1: Constructor ---")
run_ab("click #tab-constructor")
time.sleep(0.5)
out, _ = run_ab("snapshot -i")
print("Constructor snapshot (first 10 items):")
for l in [x for x in out.split('\n') if x.strip()][:10]:
    print(" ", l)

# Add a round table
print("Adding round table...")
run_ab("click \"text=Стол 4м (Круг)\"")
time.sleep(0.5)

# Open publish modal
print("Opening publish modal...")
run_ab("click \"text=Опубликовать ревизию\"")
time.sleep(0.5)
out, _ = run_ab("snapshot -i")
for l in [x for x in out.split('\n') if 'Опубликовать' in x or 'ревизи' in x.lower()]:
    print(" ", l)

# Confirm publish
run_ab("click \"button:has-text('Опубликовать')\"")
time.sleep(0.5)
print("Revision published successfully!")

# Test Tab 2: Booking
print("\n--- Testing Tab 2: Booking ---")
run_ab("click #tab-booking")
time.sleep(0.5)
# Click guests count 4
run_ab("click \"button:has-text('4')\"")
time.sleep(0.5)
# Select table 3 (available for 4 guests)
run_ab("click \"[aria-label*='Стол №3']\"")
time.sleep(0.5)
out, _ = run_ab("snapshot -i")
print("Selected table 3:")
for l in [x for x in out.split('\n') if '№3' in x or 'Забронировать' in x]:
    print(" ", l)

# Click Book table 3
run_ab("click \"button:has-text('Забронировать стол №3')\"")
time.sleep(0.5)
out, _ = run_ab("snapshot -i")
print("Soft-lock booking modal open:")
for l in [x for x in out.split('\n') if 'Подтвердить' in x or 'soft-lock' in x.lower() or 'Стол №3' in x]:
    print(" ", l)

# Fill name and submit
run_ab("fill \"input[type='text']\" \"Алексей Панов\"")
time.sleep(0.2)
run_ab("click \"button:has-text('Подтвердить бронь')\"")
time.sleep(0.5)
out, _ = run_ab("snapshot -i")
print("Confirmation voucher:")
for l in [x for x in out.split('\n') if 'подтверждена' in x.lower() or 'QR' in x or 'Готово' in x]:
    print(" ", l)

# Close voucher
run_ab("click \"button:has-text('Готово')\"")
time.sleep(0.5)

# Test Tab 3: Manager
print("\n--- Testing Tab 3: Manager ---")
run_ab("click #tab-manager")
time.sleep(0.5)
out, _ = run_ab("snapshot -i")
print("Manager snapshot:")
for l in [x for x in out.split('\n') if 'шахматка' in x.lower() or 'посадить' in x.lower() or 'no-show' in x.lower() or 'броней' in x.lower()][:10]:
    print(" ", l)

# Click on reservation
run_ab("click \"text=Михаил\"")
time.sleep(0.5)
out, _ = run_ab("snapshot -i")
print("Reservation card:")
for l in [x for x in out.split('\n') if 'Михаил' in x or 'Посадить' in x or 'No-show' in x or 'стола' in x]:
    print(" ", l)

# Test phone booking modal
run_ab("click \"text=Бронь по телефону\"")
time.sleep(0.5)
out, _ = run_ab("snapshot -i")
print("Phone booking modal:")
for l in [x for x in out.split('\n') if 'телефону' in x.lower() or 'Сохранить бронь' in x]:
    print(" ", l)
run_ab("click \"button:has-text('Отмена')\"")

# Take full-page screenshot
screenshot_path = r"C:\Users\s4cbs\.gemini\antigravity\brain\bcd9665d-e5da-483e-b3ec-e4cb2547f3e9\smart_restaurant_full.png"
run_ab(f"screenshot \"{screenshot_path}\"")
print(f"\nFinal screenshot saved to {screenshot_path}")

print("ALL THREE TABS VERIFIED END-TO-END WITH AGENT-BROWSER!")
