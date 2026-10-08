"""Catalogue definition. Edit here to add services, packages or design options."""

BLOUSE_MEASUREMENTS = [
    {"key": "bust", "label": "Bust"},
    {"key": "waist", "label": "Waist"},
    {"key": "shoulder", "label": "Shoulder"},
    {"key": "armhole", "label": "Armhole"},
    {"key": "sleeve_length", "label": "Sleeve length"},
    {"key": "blouse_length", "label": "Blouse length"},
]
KURTI_MEASUREMENTS = [
    {"key": "bust", "label": "Bust"},
    {"key": "waist", "label": "Waist"},
    {"key": "hip", "label": "Hip"},
    {"key": "shoulder", "label": "Shoulder"},
    {"key": "sleeve_length", "label": "Sleeve length"},
    {"key": "kurti_length", "label": "Kurti length"},
]
MENS_MEASUREMENTS = [
    {"key": "neck", "label": "Neck"},
    {"key": "chest", "label": "Chest"},
    {"key": "waist", "label": "Waist"},
    {"key": "shoulder", "label": "Shoulder"},
    {"key": "sleeve_length", "label": "Sleeve length"},
    {"key": "length", "label": "Garment length"},
]


def choice(key: str, label: str, options: list[tuple[str, str, int]]) -> dict:
    return {
        "kind": "choice",
        "key": key,
        "label": label,
        "options": [{"key": k, "label": lbl, "price_delta": p} for k, lbl, p in options],
    }


def toggle(key: str, label: str, price: int, default_on: bool = True) -> dict:
    return {"kind": "toggle", "key": key, "label": label, "toggle_price": price, "default_on": default_on}


CATALOG: list[dict] = [
    {
        "slug": "blouse-stitching",
        "name": "Blouse Stitching",
        "category": "Blouse",
        "promo_title": "Designer Blouse",
        "is_popular": True,
        "description": "Made-to-measure blouses with the neckline, sleeves and back you choose.",
        "measurement_fields": BLOUSE_MEASUREMENTS,
        "packages": [
            ("basic", "Basic", "Simple Neck Designs", 499),
            ("designer", "Designer", "Princess / Sweetheart / Designer Patterns", 799),
        ],
        "groups": [
            choice(
                "sleeve_type",
                "Sleeve Type",
                [
                    ("elbow", "Elbow Sleeve", 0),
                    ("short", "Short Sleeve", 0),
                    ("cap", "Cap Sleeve", 0),
                    ("three_quarter", "Three-Quarter Sleeve", 50),
                    ("puff", "Puff Sleeve", 120),
                    ("sleeveless", "Sleeveless", 0),
                ],
            ),
            choice(
                "front_neck",
                "Front Neck",
                [
                    ("sweetheart", "Sweetheart Neck", 100),
                    ("round", "Round Neck", 0),
                    ("v", "V Neck", 0),
                    ("square", "Square Neck", 50),
                    ("boat", "Boat Neck", 80),
                    ("high", "High Neck", 120),
                ],
            ),
            choice(
                "back_neck",
                "Back Neck",
                [
                    ("deep_dori", "Deep Back with Dori", 150),
                    ("round", "Round Back", 0),
                    ("u", "U Back", 0),
                    ("v", "V Back", 0),
                    ("keyhole", "Keyhole Back", 80),
                    ("window", "Window Back", 120),
                ],
            ),
            choice(
                "cut_type",
                "Cut Type",
                [
                    ("princess", "Princess Cut", 150),
                    ("katori", "Katori Cut", 100),
                    ("regular", "Regular Cut", 0),
                ],
            ),
            toggle("lining", "Lining", 100),
            toggle("piping", "Piping", 50),
            toggle("padding", "Padding", 80),
        ],
    },
    {
        "slug": "kurti-kurta",
        "name": "Kurti / Kurta",
        "category": "Kurti/Kurta",
        "promo_title": "Kurti Stitching",
        "is_popular": True,
        "description": "Everyday and festive kurtis tailored to your fit and style.",
        "measurement_fields": KURTI_MEASUREMENTS,
        "packages": [
            ("basic", "Basic", "Straight cut with simple neckline", 699),
            ("designer", "Designer", "Anarkali / A-line / panelled patterns", 1099),
        ],
        "groups": [
            choice(
                "neck_style",
                "Neck Style",
                [
                    ("round", "Round Neck", 0),
                    ("v", "V Neck", 0),
                    ("mandarin", "Mandarin Collar", 80),
                    ("boat", "Boat Neck", 50),
                ],
            ),
            choice(
                "sleeve_type",
                "Sleeve Type",
                [
                    ("full", "Full Sleeve", 50),
                    ("three_quarter", "Three-Quarter Sleeve", 0),
                    ("short", "Short Sleeve", 0),
                    ("sleeveless", "Sleeveless", 0),
                ],
            ),
            choice(
                "length",
                "Length",
                [
                    ("hip", "Hip Length", 0),
                    ("knee", "Knee Length", 0),
                    ("calf", "Calf Length", 100),
                ],
            ),
            choice(
                "slit",
                "Slit",
                [
                    ("side", "Side Slits", 0),
                    ("front", "Front Slit", 0),
                    ("none", "No Slit", 0),
                ],
            ),
            toggle("lining", "Lining", 150, default_on=False),
            toggle("piping", "Piping", 50, default_on=False),
        ],
    },
    {
        "slug": "mens-wear",
        "name": "Men's Wear",
        "category": "Men's Wear",
        "promo_title": None,
        "is_popular": False,
        "description": "Shirts, kurtas and trousers stitched to your measurements.",
        "measurement_fields": MENS_MEASUREMENTS,
        "packages": [
            ("shirt", "Shirt", "Formal or casual shirt", 599),
            ("kurta", "Kurta", "Classic straight kurta", 799),
            ("trousers", "Trousers", "Flat-front or pleated trousers", 649),
        ],
        "groups": [
            choice(
                "collar",
                "Collar",
                [
                    ("regular", "Regular Collar", 0),
                    ("button_down", "Button-down Collar", 0),
                    ("mandarin", "Mandarin Collar", 50),
                    ("cutaway", "Cutaway Collar", 50),
                ],
            ),
            choice(
                "fit",
                "Fit",
                [
                    ("slim", "Slim Fit", 0),
                    ("regular", "Regular Fit", 0),
                    ("relaxed", "Relaxed Fit", 0),
                ],
            ),
            choice(
                "cuff",
                "Cuff",
                [
                    ("single", "Single Cuff", 0),
                    ("double", "French Cuff", 80),
                    ("none", "No Cuff (half sleeve)", 0),
                ],
            ),
            toggle("pocket", "Chest Pocket", 0, default_on=True),
        ],
    },
    {
        "slug": "saree-services",
        "name": "Saree Services",
        "category": "Saree Services",
        "promo_title": None,
        "is_popular": False,
        "description": "Fall & pico, pre-pleating and tassel work for your sarees.",
        "measurement_fields": [],
        "packages": [
            ("fall_pico", "Fall & Pico", "Fall stitching with pico edging", 149),
            ("pre_pleat", "Pre-pleating", "Ready-to-wear pleats, ironed and pinned", 299),
            ("tassels", "Tassels / Kuchu", "Hand-made tassels on the pallu", 249),
        ],
        "groups": [
            choice(
                "finish",
                "Finish",
                [
                    ("machine", "Machine Finish", 0),
                    ("hand", "Hand Finish", 100),
                ],
            ),
        ],
    },
    {
        "slug": "alterations",
        "name": "Alterations",
        "category": "Alterations",
        "promo_title": "Alterations",
        "is_popular": True,
        "description": "Fitting fixes, hemming and resizing for clothes you already own.",
        "measurement_fields": [],
        "packages": [
            ("fitting", "Fitting Adjustment", "Take in or let out at seams", 49),
            ("hem", "Length / Hem", "Shorten or lengthen hems and sleeves", 99),
            ("resize", "Resize", "Full resize of a garment", 199),
        ],
        "groups": [
            choice(
                "garment",
                "Garment Type",
                [
                    ("blouse", "Blouse", 0),
                    ("kurti", "Kurti / Kurta", 0),
                    ("pants", "Pants / Trousers", 0),
                    ("shirt", "Shirt", 0),
                    ("dress", "Dress / Gown", 50),
                    ("other", "Other", 0),
                ],
            ),
        ],
    },
]

EXECUTIVES = [
    ("Ravi Kumar", "9876500011", "Chennai – South"),
    ("Sangeetha M", "9876500012", "Chennai – West"),
    ("Arun Prakash", "9876500013", "Coimbatore"),
]
