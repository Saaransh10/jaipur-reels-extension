import os
import sys
import subprocess

# Ensure PIL (Pillow) is installed
try:
    from PIL import Image, ImageDraw
except ImportError:
    print("Pillow not found. Installing Pillow...")
    subprocess.check_call([sys.executable, "-m", "pip", "install", "pillow", "--break-system-packages"])
    from PIL import Image, ImageDraw

os.makedirs('icons', exist_ok=True)

# Generate a gorgeous Jaipur Pink theme icon
# The theme color is #FF6B8B (a pleasant rose/pink) or #E25B7B representing the Pink City
pink_city_color = (226, 91, 123, 255) # E25B7B in RGBA
white_color = (255, 255, 255, 255)

for size in [16, 48, 128]:
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    margin = max(1, size // 16)
    
    # Draw a rounded rectangle background representing a reel or dashboard screen
    draw.rounded_rectangle(
        [margin, margin, size - margin, size - margin],
        radius=size // 4,
        fill=pink_city_color
    )
    
    # Draw a camera/reel icon or "J" inside
    # J for Jaipur
    font_size = size // 2
    
    # Simple geometry for J inside the icon
    # J shape in pixels relative to size
    # We can write text using a simple fallback font, but writing pure geometric shapes is safer and looks clean across systems
    # Let's draw a beautiful visual representation of a palace dome or a custom J shape
    
    # Let's draw a small crown / palace dome shape or J shape using lines for crisp rendering
    # To be extremely clean, we'll draw a "J" path
    # Draw a 'J' geometrically
    w_unit = size // 8
    h_unit = size // 8
    
    # Horizontal top bar of 'J' (from x=3 to x=6 units, y=2 units)
    # Vertical stem of 'J' (at x=5 units, from y=2 to y=5 units)
    # Hook of 'J' (bottom left curve at x=3 to x=5 units, y=5 to y=6 units)
    # Let's define the points for a filled J path or lines
    
    # Top horizontal line
    draw.line([(3*w_unit, 2*h_unit), (6*w_unit, 2*h_unit)], fill=white_color, width=max(1, size//12))
    # Vertical line
    draw.line([(5*w_unit, 2*h_unit), (5*w_unit, 5*h_unit)], fill=white_color, width=max(1, size//12))
    # Bottom hook curve (approximated with line segments)
    draw.line([(5*w_unit, 5*h_unit), (4*w_unit, 6*h_unit), (3*w_unit, 5*h_unit)], fill=white_color, width=max(1, size//12))

    img.save(f'icons/icon-{size}.png')
    print(f'Created icons/icon-{size}.png ({size}x{size})')

print("All icons successfully generated!")
