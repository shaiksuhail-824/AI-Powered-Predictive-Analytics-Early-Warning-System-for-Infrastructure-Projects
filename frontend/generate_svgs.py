import os

os.makedirs('public/sectors', exist_ok=True)

sectors = [
    ("transport-logistics", "Transport & Logistics", "#f97316"),
    ("energy", "Energy", "#ea580c"),
    ("water-sanitation", "Water & Sanitation", "#c2410c"),
    ("communication", "Communication", "#f97316"),
    ("social-infrastructure", "Social Infrastructure", "#ea580c"),
    ("coal", "Coal", "#c2410c"),
    ("steel", "Steel", "#f97316"),
    ("mining", "Mining", "#ea580c"),
    ("urban-rural-development", "Urban & Rural Development", "#c2410c"),
    ("others", "Others", "#9a3412")
]

svg_template = """<svg xmlns="http://www.w3.org/2000/svg" width="800" height="400" viewBox="0 0 800 400">
  <rect width="800" height="400" fill="{color}" />
  <rect width="800" height="400" fill="url(#grad)" opacity="0.5" />
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:white;stop-opacity:0.2" />
      <stop offset="100%" style="stop-color:black;stop-opacity:0.2" />
    </linearGradient>
  </defs>
  <text x="50%" y="45%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="36" font-weight="bold" fill="white">{name}</text>
  <text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="20" fill="white" opacity="0.8">Placeholder Image</text>
</svg>"""

for id, name, color in sectors:
    with open(f'public/sectors/{id}.svg', 'w') as f:
        f.write(svg_template.format(name=name, color=color))

print("Created 10 SVGs.")
