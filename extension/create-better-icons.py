#!/usr/bin/env python3
"""
Create beautiful TL;DR extension icons with a book design
"""

from PIL import Image, ImageDraw, ImageFont
import os

def create_book_icon(size):
    """Create a stylish book icon"""
    # Create image with transparency
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Scale factors
    padding = size * 0.1
    book_width = size - (padding * 2)
    book_height = book_width * 0.8

    # Calculate positions
    x = padding
    y = (size - book_height) / 2

    # Draw book shadow
    shadow_offset = size * 0.03
    draw.rounded_rectangle(
        [x + shadow_offset, y + shadow_offset, x + book_width + shadow_offset, y + book_height + shadow_offset],
        radius=size * 0.05,
        fill=(0, 0, 0, 60)
    )

    # Draw book cover (purple gradient effect)
    # Main book body
    draw.rounded_rectangle(
        [x, y, x + book_width, y + book_height],
        radius=size * 0.05,
        fill=(124, 58, 237, 255)  # Purple
    )

    # Book spine (darker purple)
    spine_width = book_width * 0.08
    draw.rounded_rectangle(
        [x, y, x + spine_width, y + book_height],
        radius=size * 0.05,
        fill=(109, 40, 217, 255)
    )

    # Pages on the right edge (white)
    page_thickness = size * 0.02
    page_indent = size * 0.03
    for i in range(3):
        page_y = y + page_indent + (i * page_thickness * 2)
        draw.rectangle(
            [x + book_width - page_thickness, page_y, x + book_width, page_y + page_thickness],
            fill=(255, 255, 255, 200)
        )

    # Add "TL;DR" text
    try:
        # Try to use a nice font
        font_size = int(size * 0.22)
        # Try common font locations
        font_paths = [
            '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',
            '/System/Library/Fonts/Helvetica.ttc',
            'C:\\Windows\\Fonts\\arialbd.ttf'
        ]
        font = None
        for font_path in font_paths:
            if os.path.exists(font_path):
                font = ImageFont.truetype(font_path, font_size)
                break
        if font is None:
            font = ImageFont.load_default()
    except:
        font = ImageFont.load_default()

    # Draw text with shadow
    text = "TL;DR"
    text_bbox = draw.textbbox((0, 0), text, font=font)
    text_width = text_bbox[2] - text_bbox[0]
    text_height = text_bbox[3] - text_bbox[1]
    text_x = x + spine_width + (book_width - spine_width - text_width) / 2
    text_y = y + (book_height - text_height) / 2

    # Text shadow
    draw.text((text_x + 1, text_y + 1), text, fill=(0, 0, 0, 100), font=font)
    # Main text
    draw.text((text_x, text_y), text, fill=(255, 255, 255, 255), font=font)

    # Add a subtle highlight
    highlight_height = book_height * 0.3
    for i in range(int(highlight_height)):
        alpha = int((1 - i / highlight_height) * 40)
        draw.line(
            [(x + spine_width, y + i), (x + book_width, y + i)],
            fill=(255, 255, 255, alpha),
            width=1
        )

    return img

def main():
    """Generate all icon sizes"""
    sizes = [16, 48, 128]

    for size in sizes:
        print(f"Creating {size}x{size} icon...")
        icon = create_book_icon(size)
        filename = f"icons/icon{size}.png"
        icon.save(filename, 'PNG')
        print(f"Saved {filename}")

    print("\n✅ All icons created successfully!")
    print("Icons saved to: icons/icon16.png, icons/icon48.png, icons/icon128.png")

if __name__ == "__main__":
    main()
